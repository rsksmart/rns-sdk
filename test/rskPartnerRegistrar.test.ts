import { PartnerRegistrar } from '../src'
import {
  deployPartnerRegistrar,
  rpcUrl,
  toWei
} from './util'
import { BigNumber } from 'ethers'

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
    expect(partnerRegistrar.getProvider()).toEqual(rpcUrl)

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
    expect(partnerRegistrar.getProvider()).toEqual(rpcUrl)
  })

  test('price', async () => {
    const { partnerRegistrarContract, partnerAccountAddress, rskOwnerContract, rifTokenContract } = await deployPartnerRegistrar()
    const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

    const duration = BigNumber.from(2)
    const name = 'cheta'
    expect((await partnerRegistrar.price(name, duration)).toString()).toStrictEqual('4000000000000000000')
  })

  test('available', async () => {
    const { partnerRegistrarContract, partnerAccountAddress, rskOwnerContract, rifTokenContract } = await deployPartnerRegistrar()
    const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

    const name = 'cheta'
    expect((await partnerRegistrar.available(name))).toBe(true)
  })

  test('ownerOf', async () => {
    const { partnerRegistrarContract, partnerAccountAddress, rskOwnerContract, rifTokenContract, partnerConfigurationContract, rnsOwnerAddress, rnsOwner } = await deployPartnerRegistrar()
    const partnerRegistrar = new PartnerRegistrar(partnerRegistrarContract.address, partnerAccountAddress, rskOwnerContract.address, rifTokenContract.address, rpcUrl)

    const name = 'cheta'
    await partnerRegistrar.commitAndRegister(name, rnsOwnerAddress, BigNumber.from(2), toWei('4'), partnerConfigurationContract.address, rnsOwnerAddress, rnsOwner)
    expect((await partnerRegistrar.ownerOf(name))).toEqual(rnsOwnerAddress)
  }, 3000000)
})
