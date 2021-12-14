import { Signer, Contract, ContractTransaction, BigNumber, utils, constants } from 'ethers'
import { hashLabel } from './hash'

import FIFSAddrRegistrarData from './rskregistrar/fifsAddrRegistrar.json'
import RSKOwnerData from './rskregistrar/rskOwner.json'
import ERC677Data from '@rsksmart/erc677/ERC677Data.json'

export class RSKRegistrar {
    rskOwner: Contract
    fifsAddrRegistrar: Contract
    rifToken: Contract
    signer: Signer

    constructor (rskOwnerAddress: string, fifsAddrRegistrarAddress:string, rifTokenAddress:string, signer: Signer) {
      this.rskOwner = new Contract(rskOwnerAddress, RSKOwnerData.abi).connect(signer)
      this.fifsAddrRegistrar = new Contract(fifsAddrRegistrarAddress, FIFSAddrRegistrarData.abi).connect(signer)
      this.rifToken = new Contract(rifTokenAddress, ERC677Data.abi).connect(signer)
      this.signer = signer
    }

    available (label: string): Promise<string> {
      return this.rskOwner.available(hashLabel(label))
    }

    ownerOf (label: string): Promise<string> {
      return this.rskOwner.ownerOf(hashLabel(label))
    }

    price (label: string, duration: BigNumber): Promise<BigNumber> {
      return this.fifsAddrRegistrar.price(label, constants.Zero, duration)
    }

    async commitToRegister (label: string, owner: string): Promise<{ secret: string, makeCommitmentTransaction:ContractTransaction, canReveal: () => Promise<boolean> }> {
      const secret = utils.hexZeroPad('0x' + Buffer.from(utils.randomBytes(32)).toString('hex'), 32)
      const hash = await this.fifsAddrRegistrar.makeCommitment(hashLabel(label), owner, secret)
      const makeCommitmentTransaction = await this.fifsAddrRegistrar.commit(hash)

      return { secret, makeCommitmentTransaction, canReveal: () => this.fifsAddrRegistrar.canReveal(hash) }
    }

    async register (label: string, owner: string, secret: string, duration: BigNumber, amount: BigNumber, addr?: string): Promise<ContractTransaction> {
      /* Encoding:
        | signature  |  4 bytes      - offset  0
        | owner      | 20 bytes      - offset  4
        | secret     | 32 bytes      - offest 24
        | duration   | 32 bytes      - offset 56
        | addr       | 20 bytes      - offset 88
        | name       | variable size - offset 108
      */

      const _signature = '0x5f7b99d5'
      const _owner = owner.slice(2).toLowerCase()
      const _secret = secret.slice(2)
      const _duration = utils.hexZeroPad(duration.toHexString(), 32).slice(2)
      const _addr = addr ? addr.slice(2).toLowerCase() : _owner
      const _name = Buffer.from(utils.toUtf8Bytes(label)).toString('hex')

      const data = `${_signature}${_owner}${_secret}${_duration}${_addr}${_name}`

      return this.rifToken.transferAndCall(this.fifsAddrRegistrar.address, amount, data)
    }
}
