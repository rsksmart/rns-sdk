import { Signer, Contract } from 'ethers'
import { hash as namehash } from '@ensdomains/eth-ens-namehash'
import { keccak_256 as sha3 } from 'js-sha3'
import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json'
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json'

export class RNS {
  rnsRegistry: Contract
  signer: Signer

  constructor (rnsRegistryAddress: string, rnsResolverAddress: string, signer: Signer) {
    this.rnsRegistry = new Contract(rnsRegistryAddress, RNSRegistryData.abi).connect(signer)
    this.signer = signer
  }

  async getResolverContract (domain:string) {
    const resolverAddress = await this.rnsRegistry.resolver(domain)
    return new Contract(resolverAddress, AddrResolverData.abi).connect(this.signer)
  }

  setSubnodeOwner (domain: string, label: string, owner: string) {
    const domainNamehash = namehash(domain)
    const labelHash = '0x' + sha3(label)

    return this.rnsRegistry.setSubnodeOwner(domainNamehash, labelHash, owner)
  }

  async setAddr (domain: string, address: string) {
    const resolverContract = await this.getResolverContract(namehash(domain))
    return resolverContract.setAddr(namehash(domain), address)
  }

  async addr (label: string) {
    const resolverContract = await this.getResolverContract(namehash(label))
    return resolverContract.addr(namehash(label))
  }
}
