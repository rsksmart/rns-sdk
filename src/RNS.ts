import { Signer, Contract, ContractTransaction } from 'ethers'
import { hashDomain, hashLabel } from './hash'

const rnsRegistryAbi = [
  'function owner(bytes32 node) public view returns (address)',
  'function resolver(bytes32 node) public view returns (address)',
  'function setOwner(bytes32 node, address ownerAddress) public',
  'function setSubnodeOwner(bytes32 node, bytes32 label, address ownerAddress) public',
  'function setResolver(bytes32 node, address resolverAddress) public'
]

export class RNS {
  rnsRegistry: Contract
  signer: Signer

  constructor (rnsRegistryAddress: string, signer: Signer) {
    this.rnsRegistry = new Contract(rnsRegistryAddress, rnsRegistryAbi).connect(signer)
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
}
