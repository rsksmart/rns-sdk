import { RNS } from '../src/RNS'
import { hashDomain } from '../src/helpers'
import { deployRNSFactory, sendAndWait } from './util'
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

  test('set taringa.rsk owner', async () => {
    const { taringaOwner, rnsRegistryContract } = await deployRNS()

    const rns = new RNS(rnsRegistryContract.address, taringaOwner)
    const tx = await rns.setOwner(TEST_TARINGA_DOMAIN, TEST_ADDRESS)
    await tx.wait()

    const owner = await rnsRegistryContract.owner(hashDomain(TEST_TARINGA_DOMAIN))
    expect(owner).toEqual(TEST_ADDRESS)
  })

  test('get taringa.rsk owner', async () => {
    const { taringaOwner, rnsRegistryContract } = await deployRNS()
    await sendAndWait(rnsRegistryContract.setOwner(hashDomain(TEST_TARINGA_DOMAIN), TEST_ADDRESS))

    const rns = new RNS(rnsRegistryContract.address, taringaOwner)
    const owner = await rns.getOwner(TEST_TARINGA_DOMAIN)

    expect(owner).toEqual(TEST_ADDRESS)
  }, 300000)

  test('set resolver', async () => {
    const { taringaOwner, rnsRegistryContract } = await deployRNS()

    const rns = new RNS(rnsRegistryContract.address, taringaOwner)
    const tx = await rns.setResolver(TEST_TARINGA_DOMAIN, TEST_ADDRESS)
    await tx.wait()

    const actualResolver = await rnsRegistryContract.resolver(hashDomain(TEST_TARINGA_DOMAIN))
    expect(actualResolver).toEqual(TEST_ADDRESS)
  })

  test('get resolver', async () => {
    const { taringaOwner, rnsRegistryContract } = await deployRNS()
    await sendAndWait(rnsRegistryContract.setResolver(hashDomain(TEST_TARINGA_DOMAIN), TEST_ADDRESS))

    const rns = new RNS(rnsRegistryContract.address, taringaOwner)
    const actualResolver = await rns.getResolver(TEST_TARINGA_DOMAIN)

    expect(actualResolver).toEqual(TEST_ADDRESS)
  })
})
