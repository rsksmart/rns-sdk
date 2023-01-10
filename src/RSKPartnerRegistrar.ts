import { Signer, Contract, BigNumber, utils, constants, providers } from 'ethers'
import { hashLabel } from './hash'
import { generateSecret } from './random'

const rskOwnerInterface = [
  'function available(uint256 tokenId) public view returns(bool)',
  'function ownerOf(uint256 tokenId) public view returns (address)'
]

const partnerRegistrarInterface = [
  'function register(string calldata name, address nameOwner, bytes32 secret, uint256 duration, address addr, address partner) external',
  'function price(string calldata name, uint256 expires, uint256 duration, address partner) external view returns (uint256)',
  'function makeCommitment(bytes32 label, address nameOwner, bytes32 secret) external pure returns (bytes32)',
  'function canReveal(bytes32 commitment) external view returns (bool)',
  'function commit(bytes32 commitment, address partner) external'
]

const erc677Interface = [
  'function transferAndCall(address to, uint256 value, bytes memory data) external returns (bool)'
]

export class RSKPartnerRegistrar {
  private readonly rskOwner: Contract
  private readonly partnerRegistrar: Contract
  private readonly rifToken: Contract

  constructor (
    private readonly partnerRegistrarAddress: string,
    private readonly partnerAddress: string,
    private readonly rskOwnerAddress: string,
    private readonly rifTokenAddress: string,
    private readonly signer?: Signer,
    private readonly provider: string = 'http://localhost:8545') {
    const jsonRpcProvider = new providers.JsonRpcProvider(provider)
    this.rskOwner = new Contract(rskOwnerAddress, rskOwnerInterface, jsonRpcProvider)
    this.partnerRegistrar = new Contract(partnerRegistrarAddress, partnerRegistrarInterface, jsonRpcProvider)
    this.rifToken = new Contract(rifTokenAddress, erc677Interface, jsonRpcProvider)
  }

  getPartnerRegistrar (): Contract {
    return this.partnerRegistrar
  }

  getRskOwner (): Contract {
    return this.rskOwner
  }

  getRifToken (): Contract {
    return this.rifToken
  }

  getProvider (): string {
    return this.provider
  }

  getSigner (signer?: Signer): Signer {
    if (signer) return signer
    if (!this.signer) {
      throw new Error('Signer is not defined')
    }
    return this.signer
  }

  available (label: string): Promise<boolean> {
    return this.rskOwner.available(hashLabel(label))
  }

  ownerOf (label: string): Promise<string> {
    return this.rskOwner.ownerOf(hashLabel(label))
  }

  price (label: string, duration: BigNumber): Promise<BigNumber> {
    return this.partnerRegistrar.price(label, constants.Zero, duration, this.partnerAddress)
  }

  async commit (label: string, owner: string): Promise<{ secret: string, hash: string }> {
    const secret = generateSecret()
    const hash = await this.partnerRegistrar.makeCommitment(hashLabel(label), owner, secret)
    const makeCommitmentTransaction = await this.partnerRegistrar.commit(hash)
    await makeCommitmentTransaction.wait()

    return {
      secret,
      hash
    }
  }

  async canReveal (hash: string): Promise<boolean> {
    return this.partnerRegistrar.canReveal(hash)
  }

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

  async commitAndRegister (label: string, owner: string, secret: string, duration: BigNumber, amount: BigNumber, addr?: string, signer?: Signer): Promise<boolean> {
    const { hash } = await this.commit(label, owner)

    let canReveal = false

    const infiniteIterator = function * () {
      while (true) {
        yield
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of infiniteIterator) { // keep checking until canReveal is true
      if (canReveal) {
        break
      }

      canReveal = await this.canReveal(hash)
    }

    const _signer = this.getSigner(signer)

    return this.register(label, owner, secret, duration, amount, addr, _signer)
  }
}
