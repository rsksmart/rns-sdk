import { RNS, hashDomain } from '../src'

import { deployRNSFactory, deployRegistrarFactory, sendAndWait } from './util'
import { TEST_TARINGA_LABEL, TEST_SUBDOMAIN_LABEL, TEST_TARINGA_DOMAIN, TEST_TARINGA_SUBDOMAIN, TEST_ADDRESS } from './testCase'

const deployRNS = deployRNSFactory(TEST_TARINGA_LABEL, TEST_SUBDOMAIN_LABEL)

describe('RNS SDK', () => {
  test('set subdomain owner for user1.taringa.rsk', async () => {
    const { taringaOwner, rnsRegistryContract } = await deployRNS()

    const rns = new RNS(rnsRegistryContract.address, taringaOwner)

    const tx = await rns.setSubdomainOwner(TEST_TARINGA_DOMAIN, TEST_SUBDOMAIN_LABEL, TEST_ADDRESS)
    await tx.wait()

    expect(await rnsRegistryContract.owner(hashDomain(TEST_TARINGA_SUBDOMAIN))).toEqual(TEST_ADDRESS)
  })

  test('set addr for taringa.rsk', async () => {
    const { taringaOwner, rnsRegistryContract, addrResolverContract, registerSubdomain } = await deployRNS()
    await registerSubdomain(TEST_SUBDOMAIN_LABEL)

    const rns = new RNS(rnsRegistryContract.address, taringaOwner)

    const tx = await rns.setAddr(TEST_TARINGA_SUBDOMAIN, TEST_ADDRESS)
    await tx.wait()

    expect(await addrResolverContract.addr(hashDomain(TEST_TARINGA_SUBDOMAIN))).toEqual(TEST_ADDRESS)
  })

  test('addr for taringa.rsk', async () => {
    const { taringaOwner, rnsRegistryContract, addrResolverContract, registerSubdomain } = await deployRNS()
    await registerSubdomain(TEST_SUBDOMAIN_LABEL)
    await sendAndWait(addrResolverContract.setAddr(hashDomain(TEST_TARINGA_SUBDOMAIN), TEST_ADDRESS))

    const rns = new RNS(rnsRegistryContract.address, taringaOwner)

    const addressResolved = await rns.addr(TEST_TARINGA_SUBDOMAIN)

    expect(addressResolved).toEqual(TEST_ADDRESS)
  })

  test('registrar', async () => {
    // await deployRegistrarFactory()
    console.log('Testing registrar')
  })
})
