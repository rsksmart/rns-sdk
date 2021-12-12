import {Signer, Contract, ContractTransaction} from 'ethers'
import { keccak_256 as sha3 } from 'js-sha3'
import FIFSAddrRegistrarData from './rskregistrar/fifsAddrRegistrar.json'

export const hashLabel = (label: string) => '0x' + sha3(label)

export class RSKRegistrar {
    // rskOwner: Contract
    fifsAddrRegistrar: Contract
    signer: Signer

    constructor (rskOwnerAddress: string, fifsAddrRegistrarAddress:string, signer: Signer) {
      // this.rskOwner = new Contract(rskOwnerAddress, RNSRegistryData.abi).connect(signer)
      this.fifsAddrRegistrar = new Contract(fifsAddrRegistrarAddress, FIFSAddrRegistrarData.abi).connect(signer)
      this.signer = signer
      const addr = this.fifsAddrRegistrar.address
      console.log({ addr })
    }

    async commitToRegister (domain:string, address:string, secret:string): Promise<ContractTransaction> {
      const hash = await this.fifsAddrRegistrar.makeCommitment(`0x${sha3(domain)}`, address, secret)
      return this.fifsAddrRegistrar.commit(hash)
    }
}