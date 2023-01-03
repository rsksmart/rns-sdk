import { Signer, Contract, BigNumber, providers } from 'ethers'

const partnerConfigurationInterface = [
  'function getMinLength() external view returns (uint256)',
  'function getMaxLength() external view returns (uint256)',
  'function getUnicodeSupport() external view returns (bool)',
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
  'function setUnicodeSupport(bool flag) external',
  'function setMaxLength(uint256 maxLength) external',
  'function setMinDuration(uint256 minDuration) external',
  'function setMinLength(uint256 minLength) external',
  'function validateName(string memory name, uint256 duration) external view'
]

export class PartnerConfiguration {
  private readonly partnerConfiguration: Contract

  constructor (private readonly partnerConfigurationAddress: string, private readonly signer?: Signer, private readonly provider: string = 'http://localhost:8545') {
    this.partnerConfiguration = new Contract(partnerConfigurationAddress, partnerConfigurationInterface, new providers.JsonRpcProvider(provider))
    this.signer = signer
  }

  /**
   * Returns a contract instance of the Partner Configuration
   */
  getPartnerConfiguration (): Contract { return this.partnerConfiguration }
  /**
   * Returns the provider
   */
  getProvider (): string { return this.provider }

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
   * returns support for unicode domains
   */
  getUnicodeSupport (): Promise<boolean> {
    return this.partnerConfiguration.getUnicodeSupport()
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
  validateName (name: string, duration: BigNumber): Promise<void> {
    return this.partnerConfiguration.validateName(name, duration)
  }

  /**
   * sets the discount assigned to the partner for each domain name registered
   *
   * @param discount the discount assigned to the partner for each domain name registered
   * @param signer the signer for the transaction
   */
  async setDiscount (discount: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setDiscount(discount)).wait()
  }

  /**
   * sets the maximum duration allowed for a domain name
   *
   * @param maxDuration the maximum duration allowed for a domain name in days
   * @param signer the signer for the transaction
   */
  async setMaxDuration (maxDuration: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMaxDuration(maxDuration)).wait()
  }

  /**
   * sets the minimum length allowed for a domain name
   *
   * @param minLength the minimum length allowed for a domain name
   * @param signer the signer for the transaction
   */
  async setMinLength (minLength: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMinLength(minLength)).wait()
  }

  /**
   * sets the maximum length allowed for a domain name
   *
   * @param maxLength the maximum length allowed for a domain name
   * @param signer the signer for the transaction
   */
  async setMaxLength (maxLength: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMaxLength(maxLength)).wait()
  }

  /**
   * sets support for unicode domains
   *
   * @param flag true if unicode domains are supported, false otherwise
   * @param signer the signer for the transaction
   */
  async setUnicodeSupport (flag: boolean, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setUnicodeSupport(flag)).wait()
  }

  /**
   * sets the minimum commitment age allowed for a domain name
   *
   * @param minCommitmentAge the minimum commitment age allowed for a domain name in seconds
   * @param signer the signer for the transaction
   */
  async setMinCommitmentAge (minCommitmentAge: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMinCommitmentAge(minCommitmentAge))
  }

  /**
   * sets the fee percentage assigned to the partner for each domain name registered
   *
   * @param feePercentage the new fee percentage
   * @param signer the signer for the transaction
   */
  async setFeePercentage (feePercentage: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setFeePercentage(feePercentage)).wait()
  }

  /**
   * sets the minimum duration allowed for a domain name
   *
   * @param minDuration the minimum duration allowed for a domain name in days
   * @param signer the signer for the transaction
   */
  async setMinDuration (minDuration: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMinDuration(minDuration)).wait()
  }

  /**
   * returns the signer
   *
   * @param signer the signer for the transaction
   */
  getSigner (signer?: Signer): Signer {
    const _signer = signer || this.signer

    if (!_signer) {
      throw new Error('Signer is not defined')
    }

    return _signer
  }
}
