import { Signer, Contract } from 'ethers'
import { hash as namehash } from '@ensdomains/eth-ens-namehash'
import { keccak_256 as sha3 } from 'js-sha3'
import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json'

export class RNS {
  rnsRegistry: Contract

  constructor (rnsRegistryAddress: string, signer: Signer) {
    this.rnsRegistry = new Contract(rnsRegistryAddress, RNSRegistryData.abi).connect(signer)
  }

  setSubnodeOwner (domain: string, label: string, owner: string) {
    const domainNamehash = namehash(domain)
    const labelHash = '0x' + sha3(label)

    return this.rnsRegistry.setSubnodeOwner(domainNamehash, labelHash, owner)
  }
}
