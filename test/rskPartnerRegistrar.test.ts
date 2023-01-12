import { PartnerRegistrar, AddrResolver } from '../src'
import {
  deployPartnerRegistrar,
  rpcUrl, timeTravel,
  toWei
} from './util'
import { BigNumber, Contract, providers } from 'ethers'
import { generateSecret } from '../src/random'

function commitAndRegister (partnerRegistrar: PartnerRegistrar, name: string, rnsOwnerAddress: string, partnerConfigurationContract: Contract, rnsOwner: providers.JsonRpcSigner) {
  const commitAndRegistrarPromise = partnerRegistrar.commitAndRegister(name, rnsOwnerAddress, BigNumber.from(2), toWei('4'), partnerConfigurationContract.address, rnsOwnerAddress, rnsOwner)
  setTimeout(async () => {
    await timeTravel(new providers.JsonRpcProvider(rpcUrl), 20)
  }, 500)
  return commitAndRegistrarPromise
}

describe('partner registrar', () => {
  test('constructor', async () => {
    const {
      partnerRegistrarContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract,
      rnsOwner: owner
    } = await deployPartnerRegistrar()

    let partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl, owner)
    expect(await partnerRegistrar.getSigner().getAddress()).toEqual(await owner.getAddress())
    expect(partnerRegistrar.getPartnerRegistrar().address).toEqual(partnerRegistrarContract.address)
    expect(partnerRegistrar.getRskOwner().address).toEqual(rskOwnerContract.address)
    expect(partnerRegistrar.getRifToken().address).toEqual(rifTokenContract.address)
    expect(partnerRegistrar.getProvider().connection.url).toEqual(rpcUrl)

    partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)
    try {
      partnerRegistrar.getSigner()
    } catch (error) {
      expect(error.message).toBe('Signer is not defined')
    }
    expect(partnerRegistrar.getPartnerRegistrar().address).toEqual(partnerRegistrarContract.address)

    partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)
    expect(await partnerRegistrar.getSigner(owner).getAddress()).toEqual(await owner.getAddress())

    partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)
    expect(partnerRegistrar.getProvider().connection.url).toEqual(rpcUrl)
  })

  test('price', async () => {
    const {
      partnerRegistrarContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract
    } = await deployPartnerRegistrar()
    const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

    const duration = BigNumber.from(2)
    const name = 'cheta'
    expect((await partnerRegistrar.price(name, duration)).toString()).toStrictEqual('4000000000000000000')
  })

  test('available', async () => {
    const {
      partnerRegistrarContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract
    } = await deployPartnerRegistrar()
    const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

    const name = 'cheta'
    expect((await partnerRegistrar.available(name))).toBe(true)
  })

  test('ownerOf', async () => {
    const {
      partnerRegistrarContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract,
      partnerConfigurationContract,
      rnsOwnerAddress,
      rnsOwner
    } = await deployPartnerRegistrar({
      defaultMinCommitmentAge: 5
    })
    const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

    const name = 'cheta'

    await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress, partnerConfigurationContract, rnsOwner)

    expect((await partnerRegistrar.ownerOf(name))).toEqual(rnsOwnerAddress)
  }, 3000000)

  describe('commitAndRegister', () => {
    test('should commit and register', async () => {
      const {
        partnerRegistrarContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        partnerConfigurationContract,
        rnsOwnerAddress,
        rnsOwner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 5
        }
      )
      const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

      const name = 'cheta'

      expect((await partnerRegistrar.available(name))).toEqual(true)
      await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress, partnerConfigurationContract, rnsOwner)

      expect((await partnerRegistrar.available(name))).toEqual(false)
    }, 3000000)
    test('should commit and register when min commitment age is not greater than 0', async () => {
      const {
        partnerRegistrarContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        partnerConfigurationContract,
        rnsOwnerAddress,
        rnsOwner
      } = await deployPartnerRegistrar(

      )
      const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

      const name = 'cheta'

      expect((await partnerRegistrar.available(name))).toEqual(true)
      await commitAndRegister(partnerRegistrar, name, rnsOwnerAddress, partnerConfigurationContract, rnsOwner)

      expect((await partnerRegistrar.available(name))).toEqual(false)
    }, 3000000)
    test('should throw a cannot reveal error when time not moved', async () => {
      const {
        partnerRegistrarContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        partnerConfigurationContract,
        rnsOwnerAddress,
        rnsOwner
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge: 5
        }
      )
      const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

      const name = 'cheta'

      expect((await partnerRegistrar.available(name))).toEqual(true)

      try {
        await partnerRegistrar.commitAndRegister(name, rnsOwnerAddress, BigNumber.from(2), toWei('4'), partnerConfigurationContract.address, rnsOwnerAddress, rnsOwner)
      } catch (e) {
        expect(e.message).toBe('Cannot register because the commitment cannot be revealed')
      }
    }, 3000000)
  })

  describe('register', () => {
    test('should register a domain', async () => {
      const defaultMinCommitmentAge = 5

      const {
        partnerRegistrarContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner,
        provider
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge
        }
      )
      const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

      const name = 'cheta'
      const duration = BigNumber.from(2)
      const amount = toWei('4')

      expect((await partnerRegistrar.available(name))).toEqual(true)

      const {
        secret,
        hash
      } = await partnerRegistrar.commit(name, rnsOwnerAddress, duration, rnsOwner, rnsOwnerAddress)

      await timeTravel(provider, defaultMinCommitmentAge)

      expect(await partnerRegistrar.canReveal(hash)).toBe(true)

      await partnerRegistrar.register(name, rnsOwnerAddress, secret, duration, amount, rnsOwnerAddress, rnsOwner)

      expect((await partnerRegistrar.available(name))).toEqual(false)
    }, 3000000)
    test('should register a domain if the address to resolve is not passed', async () => {
      const defaultMinCommitmentAge = 0

      const {
        partnerRegistrarContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner,
        rnsRegistryContract
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge
        }
      )
      const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

      const name = 'cheta'
      const duration = BigNumber.from(2)
      const amount = toWei('4')

      expect(await partnerRegistrar.available(name)).toEqual(true)

      const secret = generateSecret()

      await partnerRegistrar.register(name, rnsOwnerAddress, secret, duration, amount, undefined, rnsOwner)

      const addrResolver = new AddrResolver(rnsRegistryContract.address, rnsOwner)

      expect((await partnerRegistrar.available(name))).toEqual(false)
      expect((await addrResolver.addr(name + '.rsk'))).toEqual(rnsOwnerAddress)
    }, 3000000)
  })

  test('canReveal', async () => {
    const defaultMinCommitmentAge = 5

    const {
      partnerRegistrarContract,
      partnerAccountAddress,
      rskOwnerContract,
      rifTokenContract,
      rnsOwnerAddress,
      rnsOwner,
      provider
    } = await deployPartnerRegistrar(
      {
        defaultMinCommitmentAge
      }
    )
    const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

    const name = 'cheta'
    const duration = BigNumber.from(2)

    const {
      hash
    } = await partnerRegistrar.commit(name, rnsOwnerAddress, duration, rnsOwner, rnsOwnerAddress)

    expect(await partnerRegistrar.canReveal(hash)).toBe(false)

    await timeTravel(provider, defaultMinCommitmentAge)

    expect(await partnerRegistrar.canReveal(hash)).toBe(true)
  }, 3000000)

  describe('commit', () => {
    test('should commit successfully', async () => {
      const defaultMinCommitmentAge = 5

      const {
        partnerRegistrarContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner,
        provider
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge
        }
      )
      const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

      const name = 'cheta'
      const duration = BigNumber.from(2)

      const {
        hash
      } = await partnerRegistrar.commit(name, rnsOwnerAddress, duration, rnsOwner, rnsOwnerAddress)

      expect(await partnerRegistrar.canReveal(hash)).toBe(false)

      await timeTravel(provider, defaultMinCommitmentAge)

      expect(await partnerRegistrar.canReveal(hash)).toBe(true)
    }, 3000000)
    test('should commit successfully if addr is not provided', async () => {
      const defaultMinCommitmentAge = 5

      const {
        partnerRegistrarContract,
        partnerAccountAddress,
        rskOwnerContract,
        rifTokenContract,
        rnsOwnerAddress,
        rnsOwner,
        provider
      } = await deployPartnerRegistrar(
        {
          defaultMinCommitmentAge
        }
      )
      const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

      const name = 'cheta'
      const duration = BigNumber.from(2)

      const {
        hash
      } = await partnerRegistrar.commit(name, rnsOwnerAddress, duration, rnsOwner)

      expect(await partnerRegistrar.canReveal(hash)).toBe(false)

      await timeTravel(provider, defaultMinCommitmentAge)

      expect(await partnerRegistrar.canReveal(hash)).toBe(true)
    }, 3000000)
  })
})
