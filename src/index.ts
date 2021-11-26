import { Signer, Contract } from 'ethers'
import { hash as namehash } from '@ensdomains/eth-ens-namehash'
import { keccak_256 as sha3 } from 'js-sha3'
import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json'
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json'

export class RNS {
  rnsRegistry: Contract
  rnsResolver: Contract

  constructor (rnsRegistryAddress: string, rnsResolverAddress: string, signer: Signer) {
    this.rnsRegistry = new Contract(rnsRegistryAddress, RNSRegistryData.abi).connect(signer)
    this.rnsResolver = new Contract(rnsResolverAddress, AddrResolverData.abi).connect(signer)
  }

  setSubnodeOwner (domain: string, label: string, owner: string) {
    const domainNamehash = namehash(domain)
    const labelHash = '0x' + sha3(label)

    return this.rnsRegistry.setSubnodeOwner(domainNamehash, labelHash, owner)
  }

  setAddr (label: string, address: string) {
    return this.rnsResolver.setAddr(namehash(label), address)
  }

  addr (label: string) {
    return this.rnsResolver.addr(namehash(label))
  }
}
