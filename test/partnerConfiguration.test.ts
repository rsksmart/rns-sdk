import { PartnerConfiguration } from '../src'
import {
  DEFAULT_DISCOUNT,
  DEFAULT_FEE_PERCENTAGE,
  DEFAULT_IS_UNICODE_SUPPORTED, DEFAULT_MAX_DURATION,
  DEFAULT_MAX_LENGTH, DEFAULT_MIN_COMMITMENT_AGE, DEFAULT_MIN_DURATION,
  DEFAULT_MIN_LENGTH,
  deployPartnerConfiguration,
  rpcUrl
} from './util'
import { BigNumber } from 'ethers'

describe('partner configuration', () => {
  test('constructor', async () => {
    const {
      partnerConfigurationContract,
      owner
    } = await deployPartnerConfiguration()

    let partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)
    expect(await partnerConfiguration.getSigner().getAddress()).toEqual(await owner.getAddress())
    expect(await partnerConfiguration.getPartnerConfiguration().address).toEqual(await partnerConfigurationContract.address)

    partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
    try {
      partnerConfiguration.getSigner()
    } catch (error) {
      expect(error.message).toBe('Signer is not defined')
    }
    expect(await partnerConfiguration.getPartnerConfiguration().address).toEqual(await partnerConfigurationContract.address)

    partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
    expect(await partnerConfiguration.getSigner(owner).getAddress()).toEqual(await owner.getAddress())

    partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
    expect(partnerConfiguration.getProvider()).toEqual(rpcUrl)
  })

  test('get min length', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

    expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH)
  })

  test('get max length', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

    expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH)
  })

  test('get unicode support', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

    expect(await partnerConfiguration.getUnicodeSupport()).toBe(DEFAULT_IS_UNICODE_SUPPORTED)
  })

  test('get min duration', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

    expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION)
  })

  test('get max duration', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

    expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION)
  })

  test('get min commitment age', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

    expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE)
  })

  test('get fee percentage', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

    expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE)
  })

  test('get discount', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

    expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT)
  })

  test('get price', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

    const expires = BigNumber.from(1)
    const duration = BigNumber.from(2)
    const name = 'cheta'
    expect((await partnerConfiguration.getPrice(name, expires, duration)).toString()).toStrictEqual('4000000000000000000')
  })

  test('validate name', async () => {
    const { partnerConfigurationContract } = await deployPartnerConfiguration()
    const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

    const duration = BigNumber.from(2)
    const name = 'cheta'

    try {
      await partnerConfiguration.validateName(name, duration)
    } catch (error) {
      expect(error.message).toContain('Invalid name')
    }
  })

  describe('set discount', () => {
    it('should set the discount with signer in constructor', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)

      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT)
      await partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1))
      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT + 1)
    })

    it('should set the discount with signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT)
      await partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1), owner)
      expect((await partnerConfiguration.getDiscount()).toNumber()).toEqual(DEFAULT_DISCOUNT + 1)
    })

    it('should throw an error if the signer is not set', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

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
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
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
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, signer)

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
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setDiscount(BigNumber.from(DEFAULT_DISCOUNT + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })
  })
  describe('set min length', () => {
    it('should set the min length with signer in constructor', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)

      expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH)
      await partnerConfiguration.setMinLength(BigNumber.from(DEFAULT_MIN_LENGTH + 1))
      expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH + 1)
    })

    it('should set the min length with signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH)
      await partnerConfiguration.setMinLength(BigNumber.from(DEFAULT_MIN_LENGTH + 1), owner)
      expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH + 1)
    })

    it('should throw an error if the signer is not set', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      try {
        await partnerConfiguration.setMinLength(BigNumber.from(DEFAULT_MIN_LENGTH + 1), owner)
      } catch (error) {
        expect(error.toString()).toMatch('Signer is not defined')
      }
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        partnerConfigurationContract,
        provider
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setMinLength(BigNumber.from(DEFAULT_MIN_LENGTH + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })

    it('should set the min length with correct signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner,
        provider
      } = await deployPartnerConfiguration()

      const signer = provider.getSigner(1)
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, signer)

      expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH)
      await partnerConfiguration.setMinLength(BigNumber.from(DEFAULT_MIN_LENGTH + 1), owner)
      expect((await partnerConfiguration.getMinLength()).toNumber()).toEqual(DEFAULT_MIN_LENGTH + 1)
    })

    it('should throw an error if the owner is set in the constructor but the wrong signer is passed to the method', async () => {
      const {
        partnerConfigurationContract,
        provider,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setMinLength(BigNumber.from(DEFAULT_MIN_LENGTH + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })
  })
  describe('set max duration', () => {
    it('should set the max duration with signer in constructor', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)

      expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION)
      await partnerConfiguration.setMaxDuration(BigNumber.from(DEFAULT_MAX_DURATION + 1))
      expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION + 1)
    })

    it('should set the max duration with signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION)
      await partnerConfiguration.setMaxDuration(BigNumber.from(DEFAULT_MAX_DURATION + 1), owner)
      expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION + 1)
    })

    it('should throw an error if the signer is not set', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      try {
        await partnerConfiguration.setMaxDuration(BigNumber.from(DEFAULT_MAX_DURATION + 1), owner)
      } catch (error) {
        expect(error.toString()).toMatch('Signer is not defined')
      }
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        partnerConfigurationContract,
        provider
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setMaxDuration(BigNumber.from(DEFAULT_MAX_DURATION + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })

    it('should set the max duration with correct signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner,
        provider
      } = await deployPartnerConfiguration()

      const signer = provider.getSigner(1)
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, signer)

      expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION)
      await partnerConfiguration.setMaxDuration(BigNumber.from(DEFAULT_MAX_DURATION + 1), owner)
      expect((await partnerConfiguration.getMaxDuration()).toNumber()).toEqual(DEFAULT_MAX_DURATION + 1)
    })

    it('should throw an error if the owner is set in the constructor but the wrong signer is passed to the method', async () => {
      const {
        partnerConfigurationContract,
        provider,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setMaxDuration(BigNumber.from(DEFAULT_MAX_DURATION + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })
  })
  describe('set max length', () => {
    it('should set the max length with signer in constructor', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)

      expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH)
      await partnerConfiguration.setMaxLength(BigNumber.from(DEFAULT_MAX_LENGTH + 1))
      expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH + 1)
    })

    it('should set the max length with signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH)
      await partnerConfiguration.setMaxLength(BigNumber.from(DEFAULT_MAX_LENGTH + 1), owner)
      expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH + 1)
    })

    it('should throw an error if the signer is not set', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      try {
        await partnerConfiguration.setMaxLength(BigNumber.from(DEFAULT_MAX_LENGTH + 1), owner)
      } catch (error) {
        expect(error.toString()).toMatch('Signer is not defined')
      }
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        partnerConfigurationContract,
        provider
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setMaxLength(BigNumber.from(DEFAULT_MAX_LENGTH + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })

    it('should set the max length with correct signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner,
        provider
      } = await deployPartnerConfiguration()

      const signer = provider.getSigner(1)
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, signer)

      expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH)
      await partnerConfiguration.setMaxLength(BigNumber.from(DEFAULT_MAX_LENGTH + 1), owner)
      expect((await partnerConfiguration.getMaxLength()).toNumber()).toEqual(DEFAULT_MAX_LENGTH + 1)
    })

    it('should throw an error if the owner is set in the constructor but the wrong signer is passed to the method', async () => {
      const {
        partnerConfigurationContract,
        provider,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setMaxLength(BigNumber.from(DEFAULT_MAX_LENGTH + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })
  })
  describe('set min commitment age', () => {
    it('should set the min commitment age with signer in constructor', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)

      expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE)
      await partnerConfiguration.setMinCommitmentAge(BigNumber.from(DEFAULT_MIN_COMMITMENT_AGE + 1))
      expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE + 1)
    })

    it('should set the min commitment age with signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE)
      await partnerConfiguration.setMinCommitmentAge(BigNumber.from(DEFAULT_MIN_COMMITMENT_AGE + 1), owner)
      expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE + 1)
    })

    it('should throw an error if the signer is not set', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      try {
        await partnerConfiguration.setMinCommitmentAge(BigNumber.from(DEFAULT_MIN_COMMITMENT_AGE + 1), owner)
      } catch (error) {
        expect(error.toString()).toMatch('Signer is not defined')
      }
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        partnerConfigurationContract,
        provider
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setMinCommitmentAge(BigNumber.from(DEFAULT_MIN_COMMITMENT_AGE + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })

    it('should set the min commitment age with correct signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner,
        provider
      } = await deployPartnerConfiguration()

      const signer = provider.getSigner(1)
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, signer)

      expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE)
      await partnerConfiguration.setMinCommitmentAge(BigNumber.from(DEFAULT_MIN_COMMITMENT_AGE + 1), owner)
      expect((await partnerConfiguration.getMinCommitmentAge()).toNumber()).toEqual(DEFAULT_MIN_COMMITMENT_AGE + 1)
    })

    it('should throw an error if the owner is set in the constructor but the wrong signer is passed to the method', async () => {
      const {
        partnerConfigurationContract,
        provider,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setMinCommitmentAge(BigNumber.from(DEFAULT_MIN_COMMITMENT_AGE + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })
  })
  describe('set fee percentage', () => {
    it('should set the fee percentage with signer in constructor', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)

      expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE)
      await partnerConfiguration.setFeePercentage(BigNumber.from(DEFAULT_FEE_PERCENTAGE + 1))
      expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE + 1)
    })

    it('should set the fee percentage with signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE)
      await partnerConfiguration.setFeePercentage(BigNumber.from(DEFAULT_FEE_PERCENTAGE + 1), owner)
      expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE + 1)
    })

    it('should throw an error if the signer is not set', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      try {
        await partnerConfiguration.setFeePercentage(BigNumber.from(DEFAULT_FEE_PERCENTAGE + 1), owner)
      } catch (error) {
        expect(error.toString()).toMatch('Signer is not defined')
      }
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        partnerConfigurationContract,
        provider
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setFeePercentage(BigNumber.from(DEFAULT_FEE_PERCENTAGE + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })

    it('should set the fee percentage with correct signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner,
        provider
      } = await deployPartnerConfiguration()

      const signer = provider.getSigner(1)
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, signer)

      expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE)
      await partnerConfiguration.setFeePercentage(BigNumber.from(DEFAULT_FEE_PERCENTAGE + 1), owner)
      expect((await partnerConfiguration.getFeePercentage()).toNumber()).toEqual(DEFAULT_FEE_PERCENTAGE + 1)
    })

    it('should throw an error if the owner is set in the constructor but the wrong signer is passed to the method', async () => {
      const {
        partnerConfigurationContract,
        provider,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setFeePercentage(BigNumber.from(DEFAULT_FEE_PERCENTAGE + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })
  })
  describe('set min duration', () => {
    it('should set the min duration with signer in constructor', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)

      expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION)
      await partnerConfiguration.setMinDuration(BigNumber.from(DEFAULT_MIN_DURATION + 1))
      expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION + 1)
    })

    it('should set the min duration with signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION)
      await partnerConfiguration.setMinDuration(BigNumber.from(DEFAULT_MIN_DURATION + 1), owner)
      expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION + 1)
    })

    it('should throw an error if the signer is not set', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      try {
        await partnerConfiguration.setMinDuration(BigNumber.from(DEFAULT_MIN_DURATION + 1), owner)
      } catch (error) {
        expect(error.toString()).toMatch('Signer is not defined')
      }
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        partnerConfigurationContract,
        provider
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setMinDuration(BigNumber.from(DEFAULT_MIN_DURATION + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })

    it('should set the min duration with correct signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner,
        provider
      } = await deployPartnerConfiguration()

      const signer = provider.getSigner(1)
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, signer)

      expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION)
      await partnerConfiguration.setMinDuration(BigNumber.from(DEFAULT_MIN_DURATION + 1), owner)
      expect((await partnerConfiguration.getMinDuration()).toNumber()).toEqual(DEFAULT_MIN_DURATION + 1)
    })

    it('should throw an error if the owner is set in the constructor but the wrong signer is passed to the method', async () => {
      const {
        partnerConfigurationContract,
        provider,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setMinDuration(BigNumber.from(DEFAULT_MIN_DURATION + 1), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })
  })
  describe('set unicode support', () => {
    it('should set the unicode support with signer in constructor', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)

      expect((await partnerConfiguration.getUnicodeSupport())).toEqual(DEFAULT_IS_UNICODE_SUPPORTED)
      await partnerConfiguration.setUnicodeSupport((!DEFAULT_IS_UNICODE_SUPPORTED))
      expect((await partnerConfiguration.getUnicodeSupport())).toEqual(!DEFAULT_IS_UNICODE_SUPPORTED)
    })

    it('should set the unicode support with signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      expect((await partnerConfiguration.getUnicodeSupport())).toEqual(DEFAULT_IS_UNICODE_SUPPORTED)
      await partnerConfiguration.setUnicodeSupport((!DEFAULT_IS_UNICODE_SUPPORTED), owner)
      expect((await partnerConfiguration.getUnicodeSupport())).toEqual(!DEFAULT_IS_UNICODE_SUPPORTED)
    })

    it('should throw an error if the signer is not set', async () => {
      const {
        partnerConfigurationContract,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)

      try {
        await partnerConfiguration.setUnicodeSupport((!DEFAULT_IS_UNICODE_SUPPORTED), owner)
      } catch (error) {
        expect(error.toString()).toMatch('Signer is not defined')
      }
    })

    it('should throw an error if the signer is not the owner', async () => {
      const {
        partnerConfigurationContract,
        provider
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setUnicodeSupport((!DEFAULT_IS_UNICODE_SUPPORTED), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })

    it('should set the unicode support with correct signer in method', async () => {
      const {
        partnerConfigurationContract,
        owner,
        provider
      } = await deployPartnerConfiguration()

      const signer = provider.getSigner(1)
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, signer)

      expect((await partnerConfiguration.getUnicodeSupport())).toEqual(DEFAULT_IS_UNICODE_SUPPORTED)
      await partnerConfiguration.setUnicodeSupport((!DEFAULT_IS_UNICODE_SUPPORTED), owner)
      expect((await partnerConfiguration.getUnicodeSupport())).toEqual(!DEFAULT_IS_UNICODE_SUPPORTED)
    })

    it('should throw an error if the owner is set in the constructor but the wrong signer is passed to the method', async () => {
      const {
        partnerConfigurationContract,
        provider,
        owner
      } = await deployPartnerConfiguration()
      const partnerConfiguration = new PartnerConfiguration(partnerConfigurationContract.address, rpcUrl, owner)
      const signer = provider.getSigner(1)
      try {
        await partnerConfiguration.setUnicodeSupport((!DEFAULT_IS_UNICODE_SUPPORTED), signer)
      } catch (error) {
        expect(error.toString()).toContain('Ownable: caller is not the owner')
      }
    })
  })
})
