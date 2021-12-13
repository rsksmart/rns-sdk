import { Signer, Contract, ContractTransaction } from 'ethers'
import { hashLabel } from './RNS'
import Utils from 'web3-utils'

import FIFSAddrRegistrarData from './rskregistrar/fifsAddrRegistrar.json'
import RSKOwnerData from './rskregistrar/rskOwner.json'
import ERC677Data from '@rsksmart/erc677/ERC677Data.json'

const utf8ToHexString = (string:string) => {
  return string ? Utils.asciiToHex(string).slice(2) : ''
}
const numberToUint32 = (number:number) => {
  const hexDuration = Utils.numberToHex(number)
  let duration = ''
  for (let i = 0; i < 66 - hexDuration.length; i += 1) {
    duration += '0'
  }
  duration += hexDuration.slice(2)
  return duration
}

const getAddrRegisterData = (name:string, owner:string, secret:string, duration:any, addr:string) => {
  // 0x + 8 bytes
  const dataSignature = '0x5f7b99d5'

  // 20 bytes
  const dataOwner = owner.toLowerCase().slice(2)

  // 32 bytes
  let dataSecret = secret.slice(2)
  const padding = 64 - dataSecret.length
  for (let i = 0; i < padding; i += 1) {
    dataSecret += '0'
  }

  // 32 bytes
  const dataDuration = numberToUint32(duration)

  // variable length
  const dataName = utf8ToHexString(name)

  // 20 bytes
  const dataAddr = addr.toLowerCase().slice(2)

  return `${dataSignature}${dataOwner}${dataSecret}${dataDuration}${dataAddr}${dataName}`
}
export class RSKRegistrar {
    rskOwner: Contract
    fifsAddrRegistrar: Contract
    rifToken: Contract
    signer: Signer

    constructor (rskOwnerAddress: string, fifsAddrRegistrarAddress:string, rifTokenAddress:string, signer: Signer) {
      this.rskOwner = new Contract(rskOwnerAddress, RSKOwnerData.abi).connect(signer)
      this.fifsAddrRegistrar = new Contract(fifsAddrRegistrarAddress, FIFSAddrRegistrarData.abi).connect(signer)
      this.rifToken = new Contract(fifsAddrRegistrarAddress, ERC677Data.abi).connect(signer)
      this.signer = signer
      const addr = this.fifsAddrRegistrar.address
      console.log({ addr })
    }

    async commitToRegister (domain:string, address:string, secret:string): Promise<{hash: string, contractTransaction:ContractTransaction}> {
      const hash = await this.fifsAddrRegistrar.makeCommitment(hashLabel(domain), address, secret)
      return {
        hash,
        contractTransaction: await this.fifsAddrRegistrar.commit(hash)
      }
    }

    async canReveal (hash:string): Promise<string> {
      return this.fifsAddrRegistrar.canReveal(hash)
    }

    async register (domain:string, currentAddress:string, salt:string): Promise<ContractTransaction> {
      const data = getAddrRegisterData(domain, currentAddress, salt, Utils.toBN(1), currentAddress)
      const rifCost = 2
      const weiValue = rifCost * (10 ** 18)
      const fifsAddrRegistrarAddress = this.fifsAddrRegistrar.address
      return this.rifToken.transferAndCall(fifsAddrRegistrarAddress, weiValue.toString(), data)
    }

    async available (domain:string): Promise<string> {
      return this.rskOwner.available(hashLabel(domain))
    }
}
