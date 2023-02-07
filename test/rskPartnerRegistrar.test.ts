import { PartnerRegistrar, AddrResolver } from '../src'
import {
  deployPartnerRegistrar,
  rpcUrl, timeTravel,
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

function getPartnerRegistrar (partnerAccountAddress: string, partnerRegistrarContract: Contract, partnerRenewerContract: Contract, rskOwnerContract: Contract, rifTokenContract: Contract, owner: Signer): PartnerRegistrar {
  return new PartnerRegistrar(partnerAccountAddress, partnerRegistrarContract.address, partnerRenewerContract.address, rskOwnerContract.address, rifTokenContract.address, owner)
}

describe('partner registrar', () => {
  test('constructor', async () => {
    const {
      partnerRegistrarContract,
      partnerRenewerContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract,
      rnsOwner: owner
    } = await deployPartnerRegistrar()

    const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)
    expect(partnerRegistrar.signer).toEqual(owner)
    expect(partnerRegistrar.rskOwner.address).toEqual(rskOwnerContract.address)
    expect(partnerRegistrar.rifToken.address).toEqual(rifTokenContract.address)
    expect(partnerRegistrar.partnerRegistrar.address).toEqual(partnerRegistrarContract.address)
    expect(partnerRegistrar.partnerRenewer.address).toEqual(partnerRenewerContract.address)
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
    const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

    const duration = BigNumber.from(2)
    const name = 'cheta'
    expect((await partnerRegistrar.price(name, duration)).toString()).toStrictEqual('4000000000000000000')
  })

  test('available', async () => {
    const {
      partnerRegistrarContract,
      partnerRenewerContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract,
      rnsOwner: owner
    } = await deployPartnerRegistrar()
    const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

    const name = 'cheta'
    expect((await partnerRegistrar.available(name))).toBe(true)
  })

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
    const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

    const name = 'cheta'

    await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

    expect((await partnerRegistrar.ownerOf(name))).toEqual(rnsOwnerAddress)
  }, 3000000)

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
      const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

      const name = 'cheta'

      expect((await partnerRegistrar.available(name))).toEqual(true)
      await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

      expect((await partnerRegistrar.available(name))).toEqual(false)
    }, 3000000)

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
      const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

      const name = 'cheta'

      expect((await partnerRegistrar.available(name))).toEqual(true)
      await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

      expect((await partnerRegistrar.available(name))).toEqual(false)
    }, 3000000)

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
      const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

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
        const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

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

        await partnerRegistrar.register(name, rnsOwnerAddress, secret, duration, amount, rnsOwnerAddress)

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
        const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

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
      const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

      const name = 'cheta'
      const duration = BigNumber.from(2)

      const {
        hash
      } = await partnerRegistrar.commit(name, rnsOwnerAddress, duration, rnsOwnerAddress)

      expect(await partnerRegistrar.canReveal(hash)).toBe(false)

      await timeTravel(provider, defaultMinCommitmentAge)

      expect(await partnerRegistrar.canReveal(hash)).toBe(true)
    }, 3000000)

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
        const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

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
        const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

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
      const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

      const name = 'cheta'
      await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress)

      expect(await partnerRegistrar.renew(name, BigNumber.from(2), toWei('4'))).toBe(true)
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
        partnerConfigurationContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 1
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

      const name = 'cheta'

      const mainTx = await partnerRegistrar.estimateGas('commit', name, rnsOwnerAddress, BigNumber.from(1), rnsOwnerAddress)
      
      const tx = mainTx.toNumber();
      expect(tx).toBeGreaterThan(0)
    }, 3000000)

    test('should estimate gas for renew', async () => {
      const {
        partnerRegistrarContract,
        partnerRenewerContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        partnerConfigurationContract,
        rnsOwnerAddress,
        rnsOwner: owner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 0
        }
      )
      const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

      const name = 'cheta'

      await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress, partnerConfigurationContract)

      const mainTx = await partnerRegistrar.estimateGas('renew', name, BigNumber.from(1), toWei('4'))
      
      const tx = mainTx.toNumber();
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
      const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

      const name = 'cheta'

      const secret = generateSecret()

      const mainTx = await partnerRegistrar.estimateGas('register', name, rnsOwnerAddress, secret, BigNumber.from(1), toWei('4'), rnsOwnerAddress)
      
      const tx = mainTx.toNumber();
      expect(tx).toBeGreaterThan(0)
    })

    test('should estimate gas for commitAndRegister', async () => {
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
      const partnerRegistrar = getPartnerRegistrar(partnerAccountAddress, partnerRegistrarContract, partnerRenewerContract, rskOwnerContract, rifTokenContract, owner)

      const name = 'cheta'

      const mainTx = await partnerRegistrar.estimateGas('commitAndRegister', name, rnsOwnerAddress, BigNumber.from(1), toWei('4'), rnsOwnerAddress)
      
      const tx = mainTx.toNumber();
      expect(tx).toBeGreaterThan(0)
    })
  })
})
