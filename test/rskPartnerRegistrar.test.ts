import { PartnerRegistrar, AddrResolver, RNS } from '../src'
import {
  deployPartnerRegistrar,
  deployRIFContract,
  deployRNSRegistryAndResolver,
  rpcUrl,
  sendAndWait,
  timeTravel,
  toWei
} from './util'
import { BigNumber, Contract, providers, Signer } from 'ethers'
import { generateSecret } from '../src/random'

function commitAndRegister (partnerRegistrar: PartnerRegistrar, name: string, rnsOwnerAddress: string) {
  const commitAndRegistrarPromise = partnerRegistrar.commitAndRegister(name, rnsOwnerAddress, BigNumber.from(2), toWei('4'), rnsOwnerAddress)
  setTimeout(async () => {
    await timeTravel(new providers.JsonRpcProvider(rpcUrl), 20)
  }, 500)
  return commitAndRegistrarPromise
}

function getPartnerRegistrar (partnerRegistrarContract: Contract, partnerRenewerContract: Contract, rskOwnerContract: Contract, rifTokenContract: Contract, owner: Signer, partnerAccountAddress?: string): PartnerRegistrar {
  const networkAddresses = {
    rskOwnerAddress: rskOwnerContract.address,
    rifTokenAddress: rifTokenContract.address,
    partnerRegistrarAddress: partnerRegistrarContract.address,
    partnerRenewerAddress: partnerRenewerContract.address,
    partnerAddress: partnerAccountAddress
  }
  return new PartnerRegistrar(owner, 'localhost', networkAddresses);
}

describe('partner registrar', () => {
  
  describe('constructor', () => {
    test('should successfully initialize the registrar class', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwner: owner
      } = await deployPartnerRegistrar()
  
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)
      expect(partnerRegistrar.signer).toEqual(owner)
      expect(partnerRegistrar.rskOwner.address).toEqual(rskOwnerContract.address)
      expect(partnerRegistrar.rifToken.address).toEqual(rifTokenContract?.address)
      expect(partnerRegistrar.partnerRegistrar.address).toEqual(partnerRegistrarContract.address)
      expect(partnerRegistrar.partnerRenewer.address).toEqual(partnerRenewerContract.address)
    }, 300000)

    test('Should throw an error when the network is localhost but no network addresses are parsed', async () => {
      const {
        rnsOwner: owner
      } = await deployPartnerRegistrar()

      expect(() => {
        new PartnerRegistrar(owner, 'localhost')
      }).toThrow('Network addresses must be provided for localhost network')
    })
  })

  test('price', async () => {
    const {
      partnerRegistrarContract,
      partnerRenewerContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract,
      rnsOwner: owner
    } = await deployPartnerRegistrar()
    const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

    const duration = BigNumber.from(2)
    const name = 'cheta'
    expect((await partnerRegistrar.price(name, duration)).toString()).toStrictEqual('4000000000000000000')
  }, 30000)

  test('available', async () => {
    const {
      partnerRegistrarContract,
      partnerRenewerContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract,
      rnsOwner: owner
    } = await deployPartnerRegistrar()
    const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

    const name = 'cheta'
    expect((await partnerRegistrar.available(name))).toBe(true)
  }, 30000)

  test('ownerOf', async () => {
    const {
      partnerRegistrarContract,
      partnerRenewerContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract,
      rnsOwnerAddress,
      rnsOwner: owner
    } = await deployPartnerRegistrar({
      defaultMinCommitmentAge: 5
    })
    const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

    const name = 'cheta'

    await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

    expect((await partnerRegistrar.ownerOf(name))).toEqual(rnsOwnerAddress)
  }, 300000)
  test('transfer', async () => {
    const {
      partnerRegistrarContract,
      partnerRenewerContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract,
      rnsOwnerAddress,
      rnsOwner: owner,
      provider
    } = await deployPartnerRegistrar({
      defaultMinCommitmentAge: 5
    })
    const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

    const name = 'cheta'

    await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

    expect((await partnerRegistrar.ownerOf(name))).toEqual(rnsOwnerAddress)

    const newOwner = provider.getSigner(4)

    const txhash = await partnerRegistrar.transfer(name, await newOwner.getAddress())

    expect(txhash).toBeDefined()

    expect((await partnerRegistrar.ownerOf(name))).toEqual(await newOwner.getAddress())
  }, 300000)
  test('reclaim', async () => {
    const {
      partnerRegistrarContract,
      partnerRenewerContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract,
      rnsOwnerAddress,
      rnsOwner: owner,
      provider,
      rnsRegistryContract
    } = await deployPartnerRegistrar({
      defaultMinCommitmentAge: 5
    })
    let partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

    const rns = new RNS(rnsRegistryContract.address, owner)

    const name = 'cheta'

    await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

    expect((await partnerRegistrar.ownerOf(name))).toEqual(rnsOwnerAddress)
    expect((await rns.getOwner(name + '.rsk'))).toEqual(rnsOwnerAddress)

    const newOwner = provider.getSigner(4)

    await partnerRegistrar.transfer(name, await newOwner.getAddress())

    expect((await partnerRegistrar.ownerOf(name))).toEqual(await newOwner.getAddress())
    expect((await rns.getOwner(name + '.rsk'))).toEqual(rnsOwnerAddress)

    partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, newOwner, partnerAccountAddress)

    const txhash = await partnerRegistrar.reclaim(name)

    expect(txhash).toBeDefined()

    expect((await rns.getOwner(name + '.rsk'))).toEqual(await newOwner.getAddress())
  }, 300000)

  describe('commitAndRegister', () => {
    test('should commit and register', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 5
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'

      expect((await partnerRegistrar.available(name))).toEqual(true)
      const { commitHash, commitSecret, registerTxHash } = await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

      expect(commitHash).toBeDefined()

      expect(commitSecret).toBeDefined()

      expect(registerTxHash).toBeDefined()

      expect((await partnerRegistrar.available(name))).toEqual(false)
    }, 300000)

    test('should commit and register when min commitment age is not greater than 0', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar()
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'

      expect((await partnerRegistrar.available(name))).toEqual(true)
      await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

      expect((await partnerRegistrar.available(name))).toEqual(false)
    }, 300000)

    test('should throw a cannot reveal error when time not moved', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 5
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'

      expect(await partnerRegistrar.available(name)).toEqual(true)

      await expect(partnerRegistrar.commitAndRegister(name, rnsOwnerAddress, BigNumber.from(2), toWei('4'), rnsOwnerAddress))
        .rejects
        .toThrow('Cannot register because the commitment cannot be revealed')
    }, 300000)

    describe('register', () => {
      test('should register a domain', async () => {
        const defaultMinCommitmentAge = 5

        const {
          partnerRegistrarContract,
          partnerRenewerContract,
          partnerAccountAddress,
          rskOwnerContract,
          rifTokenContract,
          rnsOwnerAddress,
          rnsOwner: owner,
          provider
        } = await deployPartnerRegistrar(
          {
            defaultMinCommitmentAge
          }
        )
        const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

        const name = 'cheta'
        const duration = BigNumber.from(2)
        const amount = toWei('4')

        expect((await partnerRegistrar.available(name))).toEqual(true)

        const {
          secret,
          hash
        } = await partnerRegistrar.commit(name, rnsOwnerAddress, duration, rnsOwnerAddress)

        await timeTravel(provider, defaultMinCommitmentAge)

        expect(await partnerRegistrar.canReveal(hash)).toBe(true)

        const txHash = await partnerRegistrar.register(name, rnsOwnerAddress, secret, duration, amount, rnsOwnerAddress)

        expect(txHash).toBeDefined()

        expect((await partnerRegistrar.available(name))).toEqual(false)
      }, 3000000)

      test('should register a domain if the address to resolve is not passed', async () => {
        const defaultMinCommitmentAge = 0

        const {
          partnerRegistrarContract,
          partnerRenewerContract,
          partnerAccountAddress,
          rskOwnerContract,
          rifTokenContract,
          rnsOwnerAddress,
          rnsOwner: owner,
          rnsRegistryContract
        } = await deployPartnerRegistrar(
          {
            defaultMinCommitmentAge
          }
        )
        const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

        const name = 'cheta'
        const duration = BigNumber.from(2)
        const amount = toWei('4')

        expect(await partnerRegistrar.available(name)).toEqual(true)

        const secret = generateSecret()

        await partnerRegistrar.register(name, rnsOwnerAddress, secret, duration, amount, undefined)

        const addrResolver = new AddrResolver(rnsRegistryContract.address, owner)

        expect((await partnerRegistrar.available(name))).toEqual(false)
        expect((await addrResolver.addr(name + '.rsk'))).toEqual(rnsOwnerAddress)
      }, 3000000)
    })

    test('canReveal', async () => {
      const defaultMinCommitmentAge = 5

      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner,
        provider
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'
      const duration = BigNumber.from(2)

      const {
        hash
      } = await partnerRegistrar.commit(name, rnsOwnerAddress, duration, rnsOwnerAddress)

      expect(await partnerRegistrar.canReveal(hash)).toBe(false)

      await timeTravel(provider, defaultMinCommitmentAge)

      expect(await partnerRegistrar.canReveal(hash)).toBe(true)
    }, 300000)

    describe('commit', () => {
      test('should commit successfully', async () => {
        const defaultMinCommitmentAge = 5

        const {
          partnerRegistrarContract,
          partnerRenewerContract,
          partnerAccountAddress,
          rskOwnerContract,
          rifTokenContract,
          rnsOwnerAddress,
          rnsOwner: owner,
          provider
        } = await deployPartnerRegistrar(
          {
            defaultMinCommitmentAge
          }
        )
        const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

        const name = 'cheta'
        const duration = BigNumber.from(2)

        const {
          hash
        } = await partnerRegistrar.commit(name, rnsOwnerAddress, duration, rnsOwnerAddress)

        expect(await partnerRegistrar.canReveal(hash)).toBe(false)

        await timeTravel(provider, defaultMinCommitmentAge)

        expect(await partnerRegistrar.canReveal(hash)).toBe(true)
      }, 3000000)
      test('should commit successfully if addr is not provided', async () => {
        const defaultMinCommitmentAge = 5

        const {
          partnerRegistrarContract,
          partnerRenewerContract,
          partnerAccountAddress,
          rskOwnerContract,
          rifTokenContract,
          rnsOwnerAddress,
          rnsOwner: owner,
          provider
        } = await deployPartnerRegistrar(
          {
            defaultMinCommitmentAge
          }
        )
        const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

        const name = 'cheta'
        const duration = BigNumber.from(2)

        const {
          hash
        } = await partnerRegistrar.commit(name, rnsOwnerAddress, duration)

        expect(await partnerRegistrar.canReveal(hash)).toBe(false)

        await timeTravel(provider, defaultMinCommitmentAge)

        expect(await partnerRegistrar.canReveal(hash)).toBe(true)
      }, 3000000)
    })
  })

  describe('renew', () => {
    test('should renew', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 5
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'
      await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

      expect(await partnerRegistrar.renew(name, BigNumber.from(2), toWei('4'))).toBeDefined()
    }, 3000000)
  })

  describe('estimate gas', () => {
    test('should estimate gas for commit', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 1
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'

      const mainTx = await partnerRegistrar.estimateGas('commit', name, rnsOwnerAddress, BigNumber.from(1), rnsOwnerAddress)

      const tx = mainTx.toNumber()
      expect(tx).toBeGreaterThan(0)
    }, 300000)

    test('should estimate gas for renew', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 0
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'

      await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

      const mainTx = await partnerRegistrar.estimateGas('renew', name, BigNumber.from(1), toWei('4'))

      const tx = mainTx.toNumber()
      expect(tx).toBeGreaterThan(0)
    })

    test('should estimate gas for register', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 0
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'

      const secret = generateSecret()

      const mainTx = await partnerRegistrar.estimateGas('register', name, rnsOwnerAddress, secret, BigNumber.from(1), toWei('4'), rnsOwnerAddress)

      const tx = mainTx.toNumber()
      expect(tx).toBeGreaterThan(0)
    })

    test('should estimate gas for commitAndRegister when commitment is required', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 1
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'

      const mainTx = await partnerRegistrar.estimateGas('commitAndRegister', name, rnsOwnerAddress, BigNumber.from(1), toWei('4'), rnsOwnerAddress)

      const tx = mainTx.toNumber()
      expect(tx).toBeGreaterThan(0)
    })

    test('should estimate gas for commitAndRegister when commitment is not required', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 0
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'

      const mainTx = await partnerRegistrar.estimateGas('commitAndRegister', name, rnsOwnerAddress, BigNumber.from(1), toWei('4'), rnsOwnerAddress)

      const tx = mainTx.toNumber()
      expect(tx).toBeGreaterThan(0)
    })

    test('should estimate gas for transfer', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner: owner,
        provider
      } = await deployPartnerRegistrar({
        defaultMinCommitmentAge: 5
      })

      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)

      const name = 'cheta'

      await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

      expect((await partnerRegistrar.ownerOf(name))).toEqual(rnsOwnerAddress)

      const newOwner = provider.getSigner(4)

      const mainTx = await partnerRegistrar.estimateGas('transfer', name, await newOwner.getAddress())

      const tx = mainTx.toNumber()
      expect(tx).toBeGreaterThan(0)
    }, 300000)

    test(' Should throw an error when an invalid operation name is called on estimate gas', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwner: owner
      } = await deployPartnerRegistrar({
        defaultMinCommitmentAge: 5
      })

      const partnerRegistrar = getPartnerRegistrar(partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner, partnerAccountAddress)
      expect(() => {
        // @ts-expect-error: the argument 'invalidOperation' is not a valid accepted operation name, however
        // the function needs to be tested that it correctly throws an error when it is invoked with an
        // invalid operation name.
        partnerRegistrar.estimateGas('invalidOperation')
      }).toThrow('Invalid operation name')
    }, 30000)
  })

  describe('Multiple registrars', () => {
    test('should allow to different registrar to be resolved by the same resolver and registry', async () => {
      const minCommitmentAge = 5
      const {
        provider,
        rnsOwner,
        rnsRegistryContract,
        addrResolverContract
      } = await deployRNSRegistryAndResolver()

      const rifTokenContract = await deployRIFContract(rnsOwner)

      const {
        partnerRegistrarContract: rskPartnerRegistrarContract,
        partnerRenewerContract: rskPartnerRenewerContract,
        rskOwnerContract
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: minCommitmentAge,
          deployedRifContract: rifTokenContract,
          deployedRnsRegistryContract: rnsRegistryContract,
          deployedAddrResolverContract: addrResolverContract
        }
      )

      const {
        partnerRegistrarContract: sovrynPartnerRegistrarContract,
        partnerRenewerContract: sovrynPartnerRenewerContract,
        rskOwnerContract: sovrynOwnerContract
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: minCommitmentAge,
          deployedRifContract: rifTokenContract,
          deployedRnsRegistryContract: rnsRegistryContract,
          deployedAddrResolverContract: addrResolverContract,
          label: 'sovryn'
        }
      )

      const alice = provider.getSigner(1)
      const bob = provider.getSigner(2)
      const partner = provider.getSigner(3)
      const aliceAddress = await alice.getAddress()
      const bobAddress = await bob.getAddress()
      const partnerAddress = await partner.getAddress()

      await sendAndWait(rifTokenContract.transfer(aliceAddress, toWei('10')))
      await sendAndWait(rifTokenContract.transfer(bobAddress, toWei('10')))

      const duration = BigNumber.from(2)
      const domainName = 'cheta'

      // Creating sdk Partner Registrar instances
      const rskPartnerRegistrar = getPartnerRegistrar(
        rskPartnerRegistrarContract,
        rskPartnerRenewerContract,
        rskOwnerContract,
        rifTokenContract,
        alice,
        partnerAddress,
      )
      const sovrynPartnerRegistrar = getPartnerRegistrar(
        sovrynPartnerRegistrarContract,
        sovrynPartnerRenewerContract,
        sovrynOwnerContract,
        rifTokenContract,
        bob,
        partnerAddress,
      )

      // Calculating the price to register 'cheta.rsk' and 'cheta.sovryn'
      const rskPrice = await rskPartnerRegistrar.price(domainName, duration)
      const sovrynPrice = await sovrynPartnerRegistrar.price(domainName, duration)

      // Approving alice and bob the price to register 'cheta.rsk' and 'cheta.sovryn' respectively
      await (
        await rifTokenContract.connect(alice).approve(rskPartnerRegistrarContract.address, rskPrice)
      ).wait()
      await (
        await rifTokenContract.connect(bob).approve(rskPartnerRegistrarContract.address, sovrynPrice)
      ).wait()

      // Commiting and registering 'cheta.rsk'
      const {
        secret: rskSecret,
        hash: rskHash
      } = await rskPartnerRegistrar.commit(domainName, aliceAddress, duration, aliceAddress)
      await timeTravel(provider, minCommitmentAge)
      expect(await rskPartnerRegistrar.canReveal(rskHash)).toBe(true)

      await rskPartnerRegistrar.register(
        domainName,
        aliceAddress,
        rskSecret,
        duration,
        rskPrice,
        aliceAddress
      )

      // Commiting and registering 'cheta.sovryn'
      const {
        secret: sovrynSecret,
        hash: sovrynHash
      } = await sovrynPartnerRegistrar.commit(domainName, bobAddress, duration, bobAddress)

      await timeTravel(provider, minCommitmentAge)
      expect(await sovrynPartnerRegistrar.canReveal(sovrynHash)).toBe(true)

      await sovrynPartnerRegistrar.register(
        domainName,
        bobAddress,
        sovrynSecret,
        duration,
        sovrynPrice,
        bobAddress
      )

      // Creating sdk Resolver instance
      const addrResolver = new AddrResolver(rnsRegistryContract.address, rpcUrl)

      // Resolving addresses for 'cheta.rsk' and 'cheta.sovryn'
      const expectedAliceAddress = await addrResolver.addr(domainName + '.rsk')
      const expectedBobAddress = await addrResolver.addr(domainName + '.sovryn')

      expect(expectedAliceAddress).toEqual(aliceAddress)
      expect(expectedBobAddress).toEqual(bobAddress)
    }, 300000)
  })
})
