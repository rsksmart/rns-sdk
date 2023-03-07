import { Contract, ContractTransaction, providers, Signer } from 'ethers'
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
  signerOrProvider: Signer | providers.Provider

  constructor (rnsRegistryAddress: string, signerOrNode: Signer | string) {
    let signerOrProvider: Signer | providers.Provider

    if (typeof signerOrNode === 'string') {
      signerOrProvider = new providers.JsonRpcProvider(signerOrNode)
    } else {
      signerOrProvider = signerOrNode
    }

    this.rnsRegistry = new Contract(rnsRegistryAddress, rnsRegistryAbi).connect(signerOrProvider)

    this.signerOrProvider = signerOrProvider
  }

  private async getAddrResolverContract (domainHash: string): Promise<Contract> {
    const resolverAddress = await this.rnsRegistry.resolver(domainHash)
    return new Contract(resolverAddress, addrResolverAbi).connect(this.signerOrProvider)
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
