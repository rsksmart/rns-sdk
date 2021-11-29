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

  private domainHash = (domain: string) => namehash(domain)
  private labelHash = (label: string) => '0x' + sha3(label)

  private async getResolverContract (domainHash: string) {
    const resolverAddress = await this.rnsRegistry.resolver(domainHash)
    return new Contract(resolverAddress, AddrResolverData.abi).connect(this.signer)
  }

  setSubnodeOwner (domain: string, label: string, owner: string) {
    const domainHash = this.domainHash(domain)
    const labelHash = this.labelHash(label)

    return this.rnsRegistry.setSubnodeOwner(domainHash, labelHash, owner)
  }

  async setAddr (domain: string, addr: string) {
    const domainHash = this.domainHash(domain)
    const resolverContract = await this.getResolverContract(domainHash)

    return resolverContract.setAddr(domainHash, addr)
  }

  async addr (domain: string) {
    const domainHash = this.domainHash(domain)
    const resolverContract = await this.getResolverContract(domainHash)

    return resolverContract.addr(domainHash)
  }
}
