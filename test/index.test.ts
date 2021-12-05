import { RNS, hashDomain } from '../src'
import { deployRNSFactory, sendAndWait, rskLabel } from './util'
import { TEST_TARINGA_LABEL, TEST_SUBDOMAIN_LABEL, TEST_TARINGA_DOMAIN, TEST_TARINGA_SUBDOMAIN, TEST_ADDRESS, TEST_ROOT_NODE, TEST_RESOLVER } from './testCase'
import { hash as namehash } from '@ensdomains/eth-ens-namehash'

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

  test('set registry owner', async () => {
    const { rnsOwner, rnsRegistryContract } = await deployRNS()
    const rns = new RNS(rnsRegistryContract.address, rnsOwner)
    await rns.setOwner(rskLabel, TEST_ADDRESS)
    const owner = await rnsRegistryContract.owner(hashDomain(rskLabel))
    expect(owner).toEqual(TEST_ADDRESS)
  })

  test('get registry owner', async () => {
    const { rnsOwner, rnsRegistryContract } = await deployRNS()
    const rnsOwnerRegistryContract = rnsRegistryContract.connect(rnsOwner)
    await rnsOwnerRegistryContract.setOwner(namehash(rskLabel), TEST_ADDRESS)
    const rns = new RNS(rnsRegistryContract.address, rnsOwner)
    const owner = await rns.getOwner(rskLabel)
    expect(owner).toEqual(TEST_ADDRESS)
  })

  test('set resolver', async () => {
    const { rnsOwner, rnsRegistryContract } = await deployRNS()
    const rns = new RNS(rnsRegistryContract.address, rnsOwner)
    const rnsOwnerRegistryContract = rnsRegistryContract.connect(rnsOwner)

    await rns.setResolver(TEST_ROOT_NODE, TEST_RESOLVER)
    const actualResolver = await rnsOwnerRegistryContract.resolver(TEST_ROOT_NODE)
    expect(actualResolver).toEqual(TEST_RESOLVER)
  })

  test('get resolver', async () => {
    const { rnsOwner, rnsRegistryContract } = await deployRNS()
    const rns = new RNS(rnsRegistryContract.address, rnsOwner)
    const rnsOwnerRegistryContract = rnsRegistryContract.connect(rnsOwner)

    await rnsOwnerRegistryContract.setResolver(TEST_ROOT_NODE, TEST_RESOLVER)
    const actualResolver = await rns.getResolver(TEST_ROOT_NODE)
    expect(actualResolver).toEqual(TEST_RESOLVER)
  })
})
