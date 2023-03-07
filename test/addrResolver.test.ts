import { hashDomain, AddrResolver } from '../src'
import { deployRNSFactory, rpcUrl, sendAndWait } from './util'
import { TEST_TARINGA_LABEL, TEST_SUBDOMAIN_LABEL, TEST_TARINGA_SUBDOMAIN, TEST_ADDRESS } from './testCase'

const deployRNS = deployRNSFactory(TEST_TARINGA_LABEL, TEST_SUBDOMAIN_LABEL)

describe('addr resolver', () => {
  test('set addr for taringa.rsk', async () => {
    const { taringaOwner, rnsRegistryContract, addrResolverContract, registerSubdomain } = await deployRNS()
    await registerSubdomain()

    const addrResolver = new AddrResolver(rnsRegistryContract.address, taringaOwner)

    const tx = await addrResolver.setAddr(TEST_TARINGA_SUBDOMAIN, TEST_ADDRESS)
    await tx.wait()

    expect(await addrResolverContract.addr(hashDomain(TEST_TARINGA_SUBDOMAIN))).toEqual(TEST_ADDRESS)
  })

  test('addr for taringa.rsk', async () => {
    const { taringaOwner, rnsRegistryContract, addrResolverContract, registerSubdomain } = await deployRNS()
    await registerSubdomain()
    await sendAndWait(addrResolverContract.setAddr(hashDomain(TEST_TARINGA_SUBDOMAIN), TEST_ADDRESS))

    const addrResolver = new AddrResolver(rnsRegistryContract.address, taringaOwner)

    const addressResolved = await addrResolver.addr(TEST_TARINGA_SUBDOMAIN)

    expect(addressResolved).toEqual(TEST_ADDRESS)
  })

  test('resolve addr for taringa.rsk with node address', async () => {
    const { rnsRegistryContract, addrResolverContract, registerSubdomain } = await deployRNS()
    await registerSubdomain()
    await sendAndWait(addrResolverContract.setAddr(hashDomain(TEST_TARINGA_SUBDOMAIN), TEST_ADDRESS))

    const addrResolver = new AddrResolver(rnsRegistryContract.address, rpcUrl)

    const addressResolved = await addrResolver.addr(TEST_TARINGA_SUBDOMAIN)

    expect(addressResolved).toEqual(TEST_ADDRESS)
  })
})
