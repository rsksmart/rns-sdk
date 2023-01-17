import { PartnerConfiguration } from '../src'
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
    const {
      partnerConfigurationContract,
      owner
    } = await deployPartnerConfiguration()

    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)
    expect(await partnerConfiguration.signer).toBe(owner)
    expect(await partnerConfiguration.partnerConfiguration.address).toEqual(await partnerConfigurationContract.address)
  })

  test('get min length', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

    expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH)
  })

  test('get max length', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

    expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH)
  })

  test('get unicode support', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

    expect(await partnerConfiguration.getUnicodeSupport()).toBe(DEFAULT_IS_UNICODE_SUPPORTED)
  })

  test('get min duration', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

    expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION)
  })

  test('get max duration', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

    expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION)
  })

  test('get min commitment age', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

    expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE)
  })

  test('get fee percentage', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

    expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE)
  })

  test('get discount', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

    expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT)
  })

  test('get price', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

    const expires = BigNumber.from(1)
    const duration = BigNumber.from(2)
    const name = 'cheta'
    expect((await partnerConfiguration.getPrice(name, expires, duration)).toString()).toStrictEqual('4000000000000000000')
  })

  test('validate name', async () => {
    const { partnerConfigurationContract, owner } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

    const duration = BigNumber.from(2)

    let name = 'c'
    await expect(partnerConfiguration.validateName(name, duration)).rejects.toThrow()

    name = 'cheta'
    await expect(partnerConfiguration.validateName(name, duration)).resolves.toBe(undefined)
  })

  describe('set discount', () => {
    it('should set the discount', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT)
      await partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1))
      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT + 1)
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        partnerConfigurationContract,
        provider
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, provider.getSigner(1))

      await expect(partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1))).rejects.toThrow()
    })
  })

  describe('set min length', () => {
    it('should set the min length', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

      expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH)
      await partnerConfiguration.setMinLength(BigNumber.from(DEFAULT_MIN_LENGTH + 1))
      expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH + 1)
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        provider,
        partnerConfigurationContract
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, provider.getSigner(1))

      await expect(partnerConfiguration.setMinLength(BigNumber.from(DEFAULT_MIN_LENGTH + 1))).rejects.toThrow()
    })
  })

  describe('set max duration', () => {
    it('should set the max duration', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

      expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION)
      await partnerConfiguration.setMaxDuration(BigNumber.from(DEFAULT_MAX_DURATION + 1))
      expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION + 1)
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        provider,
        partnerConfigurationContract
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, provider.getSigner(1))

      await expect(partnerConfiguration.setMaxDuration(BigNumber.from(DEFAULT_MAX_DURATION + 1))).rejects.toThrow()
    })
  })

  describe('set max length', () => {
    it('should set the max length', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

      expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH)
      await partnerConfiguration.setMaxLength(BigNumber.from(DEFAULT_MAX_LENGTH + 1))
      expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH + 1)
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        provider,
        partnerConfigurationContract
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, provider.getSigner(1))

      await expect(partnerConfiguration.setMaxLength(BigNumber.from(DEFAULT_MAX_LENGTH + 1))).rejects.toThrow()
    })
  })

  describe('set min commitment age', () => {
    it('should set the min commitment age', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

      expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE)
      await partnerConfiguration.setMinCommitmentAge(BigNumber.from(DEFAULT_MIN_COMMITMENT_AGE + 1))
      expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE + 1)
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        provider,
        partnerConfigurationContract
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, provider.getSigner(1))

      await expect(partnerConfiguration.setMinCommitmentAge(BigNumber.from(DEFAULT_MIN_COMMITMENT_AGE + 1))).rejects.toThrow()
    })
  })

  describe('set fee percentage', () => {
    it('should set the fee percentage', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

      expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE)
      await partnerConfiguration.setFeePercentage(BigNumber.from(DEFAULT_FEE_PERCENTAGE + 1))
      expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE + 1)
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        provider,
        partnerConfigurationContract
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, provider.getSigner(1))

      await expect(partnerConfiguration.setFeePercentage(BigNumber.from(DEFAULT_FEE_PERCENTAGE + 1))).rejects.toThrow()
    })
  })

  describe('set min duration', () => {
    it('should set the min duration', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

      expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION)
      await partnerConfiguration.setMinDuration(BigNumber.from(DEFAULT_MIN_DURATION + 1))
      expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION + 1)
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        provider,
        partnerConfigurationContract
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, provider.getSigner(1))

      await expect(partnerConfiguration.setMinDuration(BigNumber.from(DEFAULT_MIN_DURATION + 1))).rejects.toThrow()
    })
  })

  describe('set unicode support', () => {
    it('should set the unicode support', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, owner)

      expect((await partnerConfiguration.getUnicodeSupport())).toEqual(DEFAULT_IS_UNICODE_SUPPORTED)
      await partnerConfiguration.setUnicodeSupport((!DEFAULT_IS_UNICODE_SUPPORTED))
      expect((await partnerConfiguration.getUnicodeSupport())).toEqual(!DEFAULT_IS_UNICODE_SUPPORTED)
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        provider,
        partnerConfigurationContract
      } = await deployPartnerConfiguration()

      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, provider.getSigner(1))

      await expect(partnerConfiguration.setUnicodeSupport((!DEFAULT_IS_UNICODE_SUPPORTED))).rejects.toThrow()
    })
  })
})
