import { providers, ContractFactory, constants, ContractTransaction } from 'ethers'
import { hash as namehash } from '@ensdomains/eth-ens-namehash'
import { keccak_256 as sha3 } from 'js-sha3'
import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json'
import RNSResolverData from '@rsksmart/rns-resolver/AddrResolverData.json'

import { RNS } from '../src'

const testAddress = '0x0000000000111111111122222222223333333333'

const deployRNS = async () => {
  // connect to test network
  const provider = new providers.JsonRpcProvider('http://localhost:8545')
  const signer = provider.getSigner()

  // deploy rns registry
  const rnsRegistryFactory = new ContractFactory(RNSRegistryData.abi, RNSRegistryData.bytecode, signer)
  const rnsRegistryContract = await rnsRegistryFactory.deploy()
  await rnsRegistryContract.deployTransaction.wait()

  // deploy rns resolver
  const addrResolverFactory = new ContractFactory(RNSResolverData.abi, RNSResolverData.bytecode, signer)
  const addrResolverContract = await addrResolverFactory.deploy(rnsRegistryContract.address)
  await addrResolverContract.deployTransaction.wait()

  await rnsRegistryContract.setResolver(constants.HashZero, addrResolverContract.address).then((tx: ContractTransaction) => tx.wait())

  return { signer, rnsRegistryContract, addrResolverContract }
}

describe('RNS SDK', () => {
  test('set subnode owner for user1.taringa.rsk', async () => {
    const { signer, rnsRegistryContract, addrResolverContract } = await deployRNS()

    // delegate taringa.rsk to test account
    const address = await signer.getAddress()
    await rnsRegistryContract.setSubnodeOwner(constants.HashZero, '0x' + sha3('rsk'), address).then((tx: ContractTransaction) => tx.wait())
    await rnsRegistryContract.setSubnodeOwner(namehash('rsk'), '0x' + sha3('taringa'), address).then((tx: ContractTransaction) => tx.wait())

    const rns = new RNS(rnsRegistryContract.address, addrResolverContract.address, signer)

    const domain = 'taringa.rsk'
    const label = 'user1'

    const tx = await rns.setSubnodeOwner(domain, label, testAddress)
    await tx.wait()

    expect(await rnsRegistryContract.owner(namehash(`${label}.${domain}`))).toEqual(testAddress)
  })

  test('set addr for user1.taringa.rsk', async () => {
    const { signer, rnsRegistryContract, addrResolverContract } = await deployRNS()

    // delegate taringa.rsk to test account
    const address = await signer.getAddress()
    await rnsRegistryContract.setSubnodeOwner(constants.HashZero, '0x' + sha3('rsk'), address).then((tx: ContractTransaction) => tx.wait())
    await rnsRegistryContract.setSubnodeOwner(namehash('rsk'), '0x' + sha3('taringa'), address).then((tx: ContractTransaction) => tx.wait())
    await rnsRegistryContract.setSubnodeOwner(namehash('taringa.rsk'), '0x' + sha3('user1'), address).then((tx: ContractTransaction) => tx.wait())
    const rns = new RNS(rnsRegistryContract.address, addrResolverContract.address, signer)
    const domain = 'taringa.rsk'
    const label = 'user1'

    const tx = await rns.setSubnodeOwner(domain, label, testAddress)
    await tx.wait()

    const unsetResolverAddress = await rns.addr('taringa.rsk')
    expect(unsetResolverAddress).toEqual(constants.AddressZero)

    const setAddressTx = await rns.setAddr('taringa.rsk', address)
    setAddressTx.wait()

    const addressResolved = await rns.addr('taringa.rsk')
    expect(addressResolved).toEqual(address)
  })
})
