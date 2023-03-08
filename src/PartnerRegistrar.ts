import { BigNumber, constants, Contract, ethers, Signer, utils } from 'ethers'
import { hashLabel, sendAndWaitForTransaction, validateAndNormalizeLabel } from './helpers'
import { generateSecret } from './random'
import { PartnerConfiguration } from './PartnerConfiguration'

const rskOwnerInterface = [
  'function available(uint256 tokenId) public view returns(bool)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function safeTransferFrom(address from, address to, uint256 tokenId) public'
]

const partnerRegistrarInterface = [
  'function register(string calldata name, address nameOwner, bytes32 secret, uint256 duration, address addr, address partner) external',
  'function price(string calldata name, uint256 expires, uint256 duration, address partner) external view returns (uint256)',
  'function makeCommitment(bytes32 label, address nameOwner, bytes32 secret, uint256 duration, address addr) external pure returns (bytes32)',
  'function canReveal(bytes32 commitment) external view returns (bool)',
  'function commit(bytes32 commitment, address partner) external',
  'function getPartnerManager() external view returns (address)'
]

const partnerManagerInterface = [
  'function getPartnerConfiguration(address partner) external view returns (address)'
]

const partnerRenewerInterface = [
  'function renew(string calldata name, uint256 duration, address partner) external'
]

const erc677Interface = [
  'function transferAndCall(address to, uint256 value, bytes memory data) external returns (bool)'
]

interface OperationResult<T> {
  estimateGas: ()=> Promise<BigNumber>;
  execute: ()=> Promise<T>
}

type CommitFunction = (label: string, owner: string, duration: BigNumber, addr?: string)=> OperationResult<{ secret: string; hash: string }>
type RegisterFunction = (label: string, owner: string, secret: string, duration: BigNumber, amount: BigNumber, addr?: string)=> OperationResult<boolean>
type RenewFunction = (label: string, duration: BigNumber, amount: BigNumber)=> OperationResult<boolean>
type CommitAndRegisterFunction = (label: string, owner: string, duration: BigNumber, amount: BigNumber, partnerConfigurationAddress: string, addr?: string)=> OperationResult<boolean>
type TransferFunction = (label: string, to: string)=>OperationResult<void>

type CommitArgs = Parameters<CommitFunction>
type RegisterArgs = Parameters<RegisterFunction>
type RenewArgs = Parameters<RenewFunction>
type CommitAndRegisterArgs = Parameters<CommitAndRegisterFunction>
type TransferArgs = Parameters<TransferFunction>

type AcceptedOperationNames = 'commit' | 'register' | 'renew' | 'commitAndRegister' | 'transfer'

type AcceptedArgs<T extends AcceptedOperationNames> = T extends 'commit' ? CommitArgs :
  T extends 'register' ? RegisterArgs :
    T extends 'renew' ? RenewArgs :
      T extends 'commitAndRegister' ? CommitAndRegisterArgs :
        T extends 'transfer' ? TransferArgs : never;

const REGISTER_SIGNATURE = '0x646c3681'

const RENEW_SIGNATURE = '0x8d7016ca'

export class PartnerRegistrar {
  rskOwner: Contract
  partnerRegistrar: Contract
  partnerRenewer: Contract
  rifToken: Contract
  signer: Signer

  constructor (
    private readonly partnerAddress: string,
    partnerRegistrarAddress: string,
    partnerRenewerAddress: string,
    rskOwnerAddress: string,
    rifTokenAddress: string,
    signer: Signer
  ) {
    this.rskOwner = new Contract(rskOwnerAddress, rskOwnerInterface, signer)
    this.partnerRegistrar = new Contract(partnerRegistrarAddress, partnerRegistrarInterface, signer)
    this.partnerRenewer = new Contract(partnerRenewerAddress, partnerRenewerInterface, signer)
    this.rifToken = new Contract(rifTokenAddress, erc677Interface, signer)
    this.signer = signer
  }

  /**
   * Transfers the ownership of an RNS name to another address
   * @param label the registered name
   * @param to the address to transfer the name to
   */
   transfer (label: string, to: string): Promise<void> {
    return this.transferOp(label, to).execute();
  }

  private transferOp(label: string, to: string): OperationResult<void> {
    label = validateAndNormalizeLabel(label)
    const signerAddress = this.signer.getAddress()
    
    return {
      execute: async () => {
        await signerAddress
        await sendAndWaitForTransaction(this.rskOwner.safeTransferFrom(signerAddress, to, hashLabel(label)))
      },
      estimateGas: async () => {
        await signerAddress
        return this.rskOwner.estimateGas.safeTransferFrom(signerAddress, to, hashLabel(label))
      }
    }
  }

  /**
   * Checks availability of an RNS name
   * @param label the name to register
   */
  available (label: string): Promise<boolean> {
    label = validateAndNormalizeLabel(label)

    return this.rskOwner.available(hashLabel(label))
  }

  /**
   * Returns the owner of an RNS name
   * @param label the name to register
   */
  ownerOf (label: string): Promise<string> {
    label = validateAndNormalizeLabel(label)

    return this.rskOwner.ownerOf(hashLabel(label))
  }

  /**
   * Returns the price of an RNS name
   * @param label the name to register
   * @param duration the duration to register the name
   */
  price (label: string, duration: BigNumber): Promise<BigNumber> {
    label = validateAndNormalizeLabel(label)

    return this.partnerRegistrar.price(label, constants.Zero, duration, this.partnerAddress)
  }

  private commitOp (label: string, owner: string, duration: BigNumber, addr?: string): OperationResult<{ secret: string; hash: string }> {
    label = validateAndNormalizeLabel(label)

    const secret = generateSecret()
    const hash = this.makeCommitment(label, owner, secret, duration, addr)
    const params = [hash, this.partnerAddress]

    return {
      execute: async () => {
        await sendAndWaitForTransaction(this.partnerRegistrar.commit(...params))

        return {
          secret,
          hash
        }
      },
      estimateGas: () => {
        return this.partnerRegistrar.estimateGas.commit(...params)
      }
    }
  }

  /**
   * @typedef CommitmentResult
   * @property secret - The secret used to create the commitment
   * @property hash - The resulting commitment hash
   */
  /**
   * Make a commitment
   * @param label the name to register
   * @param owner the owner of the name
   * @param duration the duration to register the name
   * @param addr the address to set for the name resolution
   * @returns {CommitmentResult} the result of the commitment
   */
  commit (label: string, owner: string, duration: BigNumber, addr?: string): Promise<{ secret: string; hash: string }> {
    return this.commitOp(label, owner, duration, addr).execute()
  }

  /**
   * Estimate gas cost for an operation
   * @param operationName the operation to estimate gas for
   * @param args the arguments for the operation
   * @returns the estimated gas cost for the operation
   */
  estimateGas<T extends AcceptedOperationNames> (operationName: T, ...args: AcceptedArgs<T>): Promise<BigNumber> {
    switch (operationName) {
      case 'commit':
        return this.commitOp(args[0], args[1] as string, args[2] as BigNumber, args[3] as string).estimateGas()

      case 'register':
        return this.registerOp(args[0], args[1] as string, args[2] as string, args[3] as BigNumber, args[4] as BigNumber, args[5] as string).estimateGas()

      case 'renew':
        return this.renewOp(args[0], args[1] as BigNumber, args[2] as BigNumber).estimateGas()

      case 'commitAndRegister':
        return this.commitAndRegisterOp(args[0], args[1] as string, args[2] as BigNumber, args[3] as BigNumber, args[4] as string).estimateGas()
      
      case 'transfer':
        return this.transferOp(args[0] as string, args[1] as string).estimateGas()
      default:
        throw new Error('Invalid operation name')
    }
  }

  private makeCommitment (label: string, owner: string, secret: string, duration: BigNumber, addr: string | undefined): string {
    return ethers.utils.solidityKeccak256(['bytes32', 'address', 'bytes32', 'uint256', 'address'], [hashLabel(label), owner, secret, duration, addr ?? owner])
  }

  /**
   * Reveals if the name is ready to be registered by calling register function.
   * @param hash the commitment hash
   */
  async canReveal (hash: string): Promise<boolean> {
    return this.partnerRegistrar.canReveal(hash)
  }

  /**
   * Register a domain
   * @param label the name to register
   * @param owner the owner of the name
   * @param secret the commitment secret
   * @param duration the duration to register the name
   * @param amount the amount for the name registration
   * @param addr the address to set for the name resolution
   */
  private registerOp (label: string, owner: string, secret: string, duration: BigNumber, amount: BigNumber, addr?: string): OperationResult<boolean> {
    label = validateAndNormalizeLabel(label)

    /* Encoding:
      | signature  |  4 bytes      - offset  0
      | owner      | 20 bytes      - offset  4
      | secret     | 32 bytes      - offset 24
      | duration   | 32 bytes      - offset 56
      | addr       | 20 bytes      - offset 88¸
      | partner   | 20 bytes      - offset 108
      | name       | variable size - offset 128
  */

    const _signature = REGISTER_SIGNATURE // sha3("register(string,address,bytes32,uint,address,address)")
    const _owner = owner.slice(2).toLowerCase()
    const _secret = secret.slice(2)
    const _duration = utils.hexZeroPad(duration.toHexString(), 32).slice(2)
    const _addr = addr ? addr.slice(2).toLowerCase() : _owner
    const _partner = this.partnerAddress.slice(2).toLowerCase()
    const _name = Buffer.from(utils.toUtf8Bytes(label)).toString('hex')

    const data = `${_signature}${_owner}${_secret}${_duration}${_addr}${_partner}${_name}`

    return {
      execute: async () => {
        await sendAndWaitForTransaction(this.rifToken.transferAndCall(this.partnerRegistrar.address, amount, data))
        return true
      },
      estimateGas: () => {
        return this.rifToken.estimateGas.transferAndCall(this.partnerRegistrar.address, amount, data)
      }
    }
  }

  register (label: string, owner: string, secret: string, duration: BigNumber, amount: BigNumber, addr?: string): Promise<boolean> {
    return this.registerOp(label, owner, secret, duration, amount, addr).execute()
  }

  /**
   * Renew an already purchased domain
   * @param label the name to be renewed
   * @param duration the duration to renew the name
   * @param amount the amount for the name renewal
   */
  renew (label: string, duration: BigNumber, amount: BigNumber): Promise<boolean> {
    return this.renewOp(label, duration, amount).execute()
  }

  renewOp (label: string, duration: BigNumber, amount: BigNumber): OperationResult<boolean> {
    label = validateAndNormalizeLabel(label)

    /* Encoding:
      | signature  |  4 bytes      - offset  0
      | duration   | 32 bytes      - offset 4
      | partner    | 20 bytes      - offset 36
      | name       | variable size - offset 56
  */

    const _signature = RENEW_SIGNATURE // sha3("renew(string,uint,address)")
    const _duration = utils.hexZeroPad(duration.toHexString(), 32).slice(2)
    const _partner = this.partnerAddress.slice(2).toLowerCase()
    const _name = Buffer.from(utils.toUtf8Bytes(label)).toString('hex')

    const data = `${_signature}${_duration}${_partner}${_name}`

    return {
      execute: async () => {
        await sendAndWaitForTransaction(this.rifToken.transferAndCall(this.partnerRenewer.address, amount, data))
        return true
      },
      estimateGas: () => {
        return this.rifToken.estimateGas.transferAndCall(this.partnerRenewer.address, amount, data)
      }
    }
  }

  /**
   * Commit and register a domain
   * @param label the name to register
   * @param owner the owner of the name
   * @param duration the duration to register the name
   * @param amount the amount for the name registration
   * @param addr the address to set for the name resolution
   */
  private commitAndRegisterOp (label: string, owner: string, duration: BigNumber, amount: BigNumber, addr?: string): OperationResult<boolean> {
    const REVEAL_TIMEOUT_BUFFER = 30 * 1000 // 30 seconds (time to mine a block in RSK)

    let secret: string | undefined

    return {
      execute: async () => {
        const partnerManager = await this.getPartnerManagerContract()
        const partnerConfiguration = await this.getPartnerConfiguration(partnerManager)

        const minCommitmentAge = await partnerConfiguration.getMinCommitmentAge()

        // run commitment if commitment is required
        if (!minCommitmentAge.gt(0)) {
          secret = generateSecret()
        } else {
          const commitResult = await this.commit(label, owner, duration, addr)

          secret = commitResult.secret
          const hash = commitResult.hash

          const canReveal = await new Promise((resolve) => {
            setTimeout(async () => {
              resolve(await this.canReveal(hash))
            }, minCommitmentAge.toNumber() * 1000 + REVEAL_TIMEOUT_BUFFER)
          })

          if (!canReveal) {
            throw new Error('Cannot register because the commitment cannot be revealed')
          }
        }
        return this.registerOp(label, owner, secret, duration, amount, addr).execute()
      },
      estimateGas: async () => {
        let estimateCommit: BigNumber = BigNumber.from(0)
        const partnerManager = await this.getPartnerManagerContract()
        const partnerConfiguration = await this.getPartnerConfiguration(partnerManager)
        const minCommitmentAge = await partnerConfiguration.getMinCommitmentAge()

        // run commitment if commitment is required
        if (!minCommitmentAge.gt(0)) {
          secret = generateSecret()
        } else {
          estimateCommit = await this.commitOp(label, owner, duration, addr).estimateGas()
          const commitResult = await this.commit(label, owner, duration, addr)
          secret = commitResult.secret
        }

        const estimateRegister = await this.registerOp(label, owner, secret, duration, amount, addr).estimateGas()
        return estimateCommit.add(estimateRegister)
      }
    }
  }

  private async getPartnerConfiguration (partnerManager: Contract): Promise<PartnerConfiguration> {
    const partnerConfigurationAddress = await partnerManager.getPartnerConfiguration(this.partnerAddress)
    return new PartnerConfiguration(partnerConfigurationAddress, this.signer)
  }

  private async getPartnerManagerContract (): Promise<Contract> {
    const partnerManagerAddress = await this.partnerRegistrar.getPartnerManager()
    return new Contract(partnerManagerAddress, partnerManagerInterface, this.signer)
  }

  /**
   * Register a domain
   * @param label the name to register
   * @param owner the owner of the name
   * @param duration the duration to register the name
   * @param amount the amount for the name registration
   * @param addr the address to set for the name resolution
   */
  commitAndRegister (label: string, owner: string, duration: BigNumber, amount: BigNumber, addr?: string): Promise<boolean> {
    return this.commitAndRegisterOp(label, owner, duration, amount, addr).execute()
  }
}
