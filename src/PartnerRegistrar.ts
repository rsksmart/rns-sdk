import { Signer, Contract, BigNumber, utils, constants, providers } from 'ethers'
import { hashLabel } from './hash'
import { generateSecret } from './random'
import { PartnerConfiguration } from './PartnerConfiguration'

const rskOwnerInterface = [
  'function available(uint256 tokenId) public view returns(bool)',
  'function ownerOf(uint256 tokenId) public view returns (address)'
]

const partnerRegistrarInterface = [
  'function register(string calldata name, address nameOwner, bytes32 secret, uint256 duration, address addr, address partner) external',
  'function price(string calldata name, uint256 expires, uint256 duration, address partner) external view returns (uint256)',
  'function makeCommitment(bytes32 label, address nameOwner, bytes32 secret, uint256 duration, address addr) external pure returns (bytes32)',
  'function canReveal(bytes32 commitment) external view returns (bool)',
  'function commit(bytes32 commitment, address partner) external'
]

const erc677Interface = [
  'function transferAndCall(address to, uint256 value, bytes memory data) external returns (bool)'
]

export class PartnerRegistrar {
  private readonly rskOwner: Contract
  private readonly partnerRegistrar: Contract
  private readonly rifToken: Contract
  private readonly jsonRpcProvider: providers.JsonRpcProvider

  constructor (
    partnerRegistrarAddress: string,
    private readonly partnerAddress: string,
    rskOwnerAddress: string,
    rifTokenAddress: string,
    provider: string,
    private readonly signer?: Signer
  ) {
    this.jsonRpcProvider = new providers.JsonRpcProvider(provider)
    this.rskOwner = new Contract(rskOwnerAddress, rskOwnerInterface, this.jsonRpcProvider)
    this.partnerRegistrar = new Contract(partnerRegistrarAddress, partnerRegistrarInterface, this.jsonRpcProvider)
    this.rifToken = new Contract(rifTokenAddress, erc677Interface, this.jsonRpcProvider)
  }

  /**
   * Returns the Partner Registrar contract instance
   */
  getPartnerRegistrar (): Contract {
    return this.partnerRegistrar
  }

  /**
   * Returns the RSK Owner contract instance
   */
  getRskOwner (): Contract {
    return this.rskOwner
  }

  /**
   * Returns the RIF token contract instance
   */
  getRifToken (): Contract {
    return this.rifToken
  }

  /**
   * Returns the provider
   */
  getProvider (): providers.JsonRpcProvider {
    return this.jsonRpcProvider
  }

  /**
   * Returns the signer
   * @param signer will just return the signer if provided, otherwise will return the (signer) of the class
   */
  getSigner (signer?: Signer): Signer {
    if (signer) return signer
    if (!this.signer) {
      throw new Error('Signer is not defined')
    }
    return this.signer
  }

  /**
   * Checks availability of an RNS name
   * @param label the name to register
   */
  available (label: string): Promise<boolean> {
    return this.rskOwner.available(hashLabel(label))
  }

  /**
   * Returns the owner of an RNS name
   * @param label the name to register
   */
  ownerOf (label: string): Promise<string> {
    return this.rskOwner.ownerOf(hashLabel(label))
  }

  /**
   * Returns the price of an RNS name
   * @param label the name to register
   * @param duration the duration to register the name
   */
  price (label: string, duration: BigNumber): Promise<BigNumber> {
    return this.partnerRegistrar.price(label, constants.Zero, duration, this.partnerAddress)
  }

  /**
   * Make a commitment
   * @param label the name to register
   * @param owner the owner of the name
   * @param duration the duration to register the name
   * @param signer the signer for the transaction
   * @param addr the address to set for the name resolution
   */
  async commit (label: string, owner: string, duration: BigNumber, signer?: Signer, addr?: string): Promise<{ secret: string, hash: string }> {
    const _signer = this.getSigner(signer)
    const secret = generateSecret()
    const hash = await this.partnerRegistrar.makeCommitment(hashLabel(label), owner, secret, duration, addr ?? owner)
    const makeCommitmentTransaction = await this.partnerRegistrar.connect(_signer).commit(hash, this.partnerAddress)
    await makeCommitmentTransaction.wait()

    return {
      secret,
      hash
    }
  }

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
   * @param signer the signer for the transaction
   */
  async register (label: string, owner: string, secret: string, duration: BigNumber, amount: BigNumber, addr?: string, signer?: Signer): Promise<boolean> {
    /* Encoding:
      | signature  |  4 bytes      - offset  0
      | owner      | 20 bytes      - offset  4
      | secret     | 32 bytes      - offset 24
      | duration   | 32 bytes      - offset 56
      | addr       | 20 bytes      - offset 88¸
      | partner   | 20 bytes      - offset 108
      | name       | variable size - offset 128
  */

    const _signature = '0x646c3681' // sha3("register(string,address,bytes32,uint,address,address)")
    const _owner = owner.slice(2).toLowerCase()
    const _secret = secret.slice(2)
    const _duration = utils.hexZeroPad(duration.toHexString(), 32).slice(2)
    const _addr = addr ? addr.slice(2).toLowerCase() : _owner
    const _partner = this.partnerAddress.slice(2).toLowerCase()
    const _name = Buffer.from(utils.toUtf8Bytes(label)).toString('hex')

    const data = `${_signature}${_owner}${_secret}${_duration}${_addr}${_partner}${_name}`

    const _signer = this.getSigner(signer)

    const transaction = await this.rifToken.connect(_signer).transferAndCall(this.partnerRegistrar.address, amount, data)

    return transaction.wait()
  }

  /**
   * Commit and register a domain
   * @param label the name to register
   * @param owner the owner of the name
   * @param duration the duration to register the name
   * @param amount the amount for the name registration
   * @param partnerConfigurationAddress the address of the partner configuration contract
   * @param addr the address to set for the name resolution
   * @param signer the signer for the transaction
   */
  async commitAndRegister (label: string, owner: string, duration: BigNumber, amount: BigNumber, partnerConfigurationAddress: string, addr?: string, signer?: Signer): Promise<boolean> {
    const REVEAL_TIMEOUT_BUFFER = 30 * 1000 // 30 seconds (time to mine a block in RSK)

    const _signer = this.getSigner(signer)

    let secret: string | undefined

    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationAddress, this.jsonRpcProvider.connection.url)

    const minCommitmentAge = await partnerConfiguration.getMinCommitmentAge()

    // run commitment if commitment is required
    if (!minCommitmentAge.gt(0)) {
      secret = generateSecret()
    } else {
      const commitResult = await this.commit(label, owner, duration, _signer, addr)

      secret = commitResult.secret
      const hash = commitResult.hash

      const canReveal = await (new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const canReveal = await this.canReveal(hash)

            resolve(canReveal)
          } catch (error) {
            reject(error)
          }
        }, minCommitmentAge.toNumber() * 1000 + REVEAL_TIMEOUT_BUFFER)
      }))

      if (!canReveal) {
        throw new Error('Cannot register because the commitment cannot be revealed')
      }
    }

    return this.register(label, owner, secret, duration, amount, addr, _signer)
  }
}
