import { Signer, Contract, BigNumber } from 'ethers'

const partnerConfigurationInterface = [
  'function getMinLength() external view returns (uint256)',
  'function getMaxLength() external view returns (uint256)',
  'function getMinDuration() external view returns (uint256)',
  'function getMaxDuration() external view returns (uint256)',
  'function getFeePercentage() external view returns (uint256)',
  'function getDiscount() external view returns (uint256)',
  'function getMinCommitmentAge() external view returns (uint256)',
  'function getPrice(string memory name, uint256 expires, uint256 duration) external view returns (uint256)',
  'function setMinCommitmentAge(uint256 minCommitmentAge) external',
  'function setDiscount(uint256 discount) external',
  'function setFeePercentage(uint256 feePercentage) external',
  'function setMaxDuration(uint256 maxDuration) external',
  'function setMaxLength(uint256 maxLength) external',
  'function setMinDuration(uint256 minDuration) external',
  'function setMinLength(uint256 minLength) external',
  'function validateName(string memory name, uint256 duration) external view'
]

export class PartnerConfiguration {
  readonly partnerConfiguration: Contract
  readonly signer: Signer

  constructor (private readonly partnerConfigurationAddress: string, signer: Signer) {
    this.partnerConfiguration = new Contract(partnerConfigurationAddress, partnerConfigurationInterface, signer)
    this.signer = signer
  }

  /**
   * returns the minimum length allowed for a domain name
   */
  getMinLength (): Promise<BigNumber> {
    return this.partnerConfiguration.getMinLength()
  }

  /**
   * returns the maximum length allowed for a domain name
   */
  getMaxLength (): Promise<BigNumber> {
    return this.partnerConfiguration.getMaxLength()
  }

  /**
   * returns the minimum duration allowed for a domain name
   */
  getMinDuration (): Promise<BigNumber> {
    return this.partnerConfiguration.getMinDuration()
  }

  /**
   * returns the maximum duration allowed for a domain name
   */
  getMaxDuration (): Promise<BigNumber> {
    return this.partnerConfiguration.getMaxDuration()
  }

  /**
   * returns the minimum commitment age allowed for a domain name
   */
  getMinCommitmentAge (): Promise<BigNumber> {
    return this.partnerConfiguration.getMinCommitmentAge()
  }

  /**
   * returns the fee percentage assigned to the partner for each domain name registered
   */
  getFeePercentage (): Promise<BigNumber> {
    return this.partnerConfiguration.getFeePercentage()
  }

  /**
   * returns the discount assigned to the partner for each domain name registered
   */
  getDiscount (): Promise<BigNumber> {
    return this.partnerConfiguration.getDiscount()
  }

  /**
   * returns the price of a domain name
   *
   * @param name the domain name
   * @param expires the number of years to expire
   * @param duration the duration for the registration
   */
  getPrice (name: string, expires: BigNumber, duration: BigNumber): Promise<BigNumber> {
    return this.partnerConfiguration.getPrice(name, expires, duration)
  }

  /**
   * checks if the name is valid and throws an error if not
   *
   * @param name the domain name
   * @param duration the duration for the registration
   */
  async validateName (name: string, duration: BigNumber): Promise<void> {
    await this.partnerConfiguration.validateName(name, duration)
  }

  /**
   * sets the discount assigned to the partner for each domain name registered
   *
   * @param discount the discount assigned to the partner for each domain name registered
   */
  async setDiscount (discount: BigNumber): Promise<void> {
    await (await this.partnerConfiguration.connect(this.signer).setDiscount(discount)).wait()
  }

  /**
   * sets the maximum duration allowed for a domain name
   *
   * @param maxDuration the maximum duration allowed for a domain name in days
   */
  async setMaxDuration (maxDuration: BigNumber): Promise<void> {
    await (await this.partnerConfiguration.connect(this.signer).setMaxDuration(maxDuration)).wait()
  }

  /**
   * sets the minimum length allowed for a domain name
   *
   * @param minLength the minimum length allowed for a domain name
   */
  async setMinLength (minLength: BigNumber): Promise<void> {
    await (await this.partnerConfiguration.connect(this.signer).setMinLength(minLength)).wait()
  }

  /**
   * sets the maximum length allowed for a domain name
   *
   * @param maxLength the maximum length allowed for a domain name
   */
  async setMaxLength (maxLength: BigNumber): Promise<void> {
    await (await this.partnerConfiguration.connect(this.signer).setMaxLength(maxLength)).wait()
  }

  /**
   * sets the minimum commitment age allowed for a domain name
   *
   * @param minCommitmentAge the minimum commitment age allowed for a domain name in seconds
   */
  async setMinCommitmentAge (minCommitmentAge: BigNumber): Promise<void> {
    await (await this.partnerConfiguration.connect(this.signer).setMinCommitmentAge(minCommitmentAge))
  }

  /**
   * sets the fee percentage assigned to the partner for each domain name registered
   *
   * @param feePercentage the new fee percentage
   */
  async setFeePercentage (feePercentage: BigNumber): Promise<void> {
    await (await this.partnerConfiguration.connect(this.signer).setFeePercentage(feePercentage)).wait()
  }

  /**
   * sets the minimum duration allowed for a domain name
   *
   * @param minDuration the minimum duration allowed for a domain name in days
   */
  async setMinDuration (minDuration: BigNumber): Promise<void> {
    await (await this.partnerConfiguration.connect(this.signer).setMinDuration(minDuration)).wait()
  }
}
