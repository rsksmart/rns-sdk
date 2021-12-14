import { Signer, Contract, ContractTransaction } from 'ethers'
import { hashDomain, hashLabel } from './hash'
import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json'

const addrResolverAbi = [
  'function addr(bytes32 node) public view returns (address)',
  'function setAddr(bytes32 node, address addr) public'
]

export class RNS {
  rnsRegistry: Contract
  signer: Signer

  constructor (rnsRegistryAddress: string, signer: Signer) {
    this.rnsRegistry = new Contract(rnsRegistryAddress, RNSRegistryData.abi).connect(signer)
    this.signer = signer
  }

  // domain
  setOwner (domain: string, owner: string): Promise<ContractTransaction> {
    const domainHash = hashDomain(domain)
    return this.rnsRegistry.setOwner(domainHash, owner)
  }

  getOwner (domain: string): Promise<string> {
    const domainHash = hashDomain(domain)
    return this.rnsRegistry.owner(domainHash)
  }

  setResolver (domain: string, resolver: string): Promise<ContractTransaction> {
    const domainHash = hashDomain(domain)
    return this.rnsRegistry.setResolver(domainHash, resolver)
  }

  getResolver (domain: string): Promise<string> {
    const domainHash = hashDomain(domain)
    return this.rnsRegistry.resolver(domainHash)
  }

  // subdomains
  setSubdomainOwner (domain: string, label: string, owner: string): Promise<ContractTransaction> {
    const domainHash = hashDomain(domain)
    const labelHash = hashLabel(label)

    return this.rnsRegistry.setSubnodeOwner(domainHash, labelHash, owner)
  }

  // resolver
  private async getAddrResolverContract (domainHash: string): Promise<Contract> {
    const resolverAddress = await this.rnsRegistry.resolver(domainHash)
    return new Contract(resolverAddress, addrResolverAbi).connect(this.signer)
  }

  async setAddr (domain: string, addr: string): Promise<ContractTransaction> {
    const domainHash = hashDomain(domain)
    const resolverContract = await this.getAddrResolverContract(domainHash)

    return resolverContract.setAddr(domainHash, addr)
  }

  async addr (domain: string): Promise<string> {
    const domainHash = hashDomain(domain)
    const resolverContract = await this.getAddrResolverContract(domainHash)

    return resolverContract.addr(domainHash)
  }
}
