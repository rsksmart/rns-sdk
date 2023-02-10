import { Signer, Contract, ContractTransaction } from 'ethers'
import { hashDomain } from './helpers'

const rnsRegistryAbi = [
  'function resolver(bytes32 node) public view returns (address)',
  'function setResolver(bytes32 node, address resolverAddress) public'
]

const addrResolverAbi = [
  'function addr(bytes32 node) public view returns (address)',
  'function setAddr(bytes32 node, address addr) public'
]

export class AddrResolver {
  rnsRegistry: Contract
  signer: Signer

  constructor (rnsRegistryAddress: string, signer: Signer) {
    this.rnsRegistry = new Contract(rnsRegistryAddress, rnsRegistryAbi).connect(signer)
    this.signer = signer
  }

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
