import { PartnerConfiguration } from '../src/PartnerConfiguration'
import {
  DEFAULT_DISCOUNT,
  DEFAULT_FEE_PERCENTAGE,
  DEFAULT_IS_UNICODE_SUPPORTED, DEFAULT_MAX_DURATION,
  DEFAULT_MAX_LENGTH, DEFAULT_MIN_COMMITMENT_AGE, DEFAULT_MIN_DURATION,
  DEFAULT_MIN_LENGTH,
  deployPartnerConfiguration
} from './util'
import { BigNumber } from 'ethers'

describe('partner configuration', () => {
  test('constructor', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()

    let partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)
    expect(await partnerConfiguration.getSigner().getAddress()).toEqual(await owner.getAddress())
    expect(await partnerConfiguration.getPartnerConfiguration().address).toEqual(await partnerConfigurationContract.address)

    partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)
    try { partnerConfiguration.getSigner() } catch (error) {
      expect(error.message).toBe('Signer is not defined')
    }
    expect(await partnerConfiguration.getPartnerConfiguration().address).toEqual(await partnerConfigurationContract.address)

    partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)
    expect(await partnerConfiguration.getSigner(owner).getAddress()).toEqual(await owner.getAddress())
  })

  test('get min length', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

    expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH)
  })

  test('get max length', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

    expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH)
  })

  test('get unicode support', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

    expect(await partnerConfiguration.getUnicodeSupport()).toBe(DEFAULT_IS_UNICODE_SUPPORTED)
  })

  test('get min duration', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

    expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION)
  })

  test('get max duration', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

    expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION)
  })

  test('get min commitment age', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

    expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE)
  })

  test('get fee percentage', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

    expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE)
  })

  test('get discount', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

    expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT)
  })

  test('get price', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

    const expires = BigNumber.from(1)
    const duration = BigNumber.from(2)
    const name = 'cheta'
    expect((await partnerConfiguration.getPrice(name, expires, duration)).toString()).toStrictEqual('4000000000000000000')
  })

  describe('set discount', () => {
    it('should set the discount with signer in constructor', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT)
      await partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1))
      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT + 1)
    })

    it('should set the discount with signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT)
      await partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1), owner)
      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT + 1)
    })

    it('should throw an error if the signer is not set', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)

      try {
        await partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1), owner)
      } catch (error) {
        expect(error.toString()).toMatch('Signer is not defined')
      }
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        partnerConfigurationContract,
        provider
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })

    it('should set the discount with correct signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner,
        provider
      } = await deployPartnerConfiguration()

      const signer = provider.getSigner(1)
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, signer)

      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT)
      await partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1), owner)
      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT + 1)
    })

    it('should throw an error if the owner is set in the constructor but the wrong signer is passed to the method', async () => {
      const {
        partnerConfigurationContract,
        provider,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })
  })
})
