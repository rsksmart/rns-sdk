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

  constructor (private readonly partnerConfigurationAddress: string, private readonly provider: string, private readonly signer?: Signer) {
    this.partnerConfiguration = new Contract(partnerConfigurationAddress, partnerConfigurationInterface, new providers.JsonRpcProvider(provider))
    this.signer = signer
  }

  getPartnerConfiguration (): Contract { return this.partnerConfiguration }
  getProvider (): string { return this.provider }

  async getMinLength (): Promise<BigNumber> {
    return this.partnerConfiguration.getMinLength()
  }

  getMaxLength (): Promise<BigNumber> {
    return this.partnerConfiguration.getMaxLength()
  }

  getUnicodeSupport (): Promise<boolean> {
    return this.partnerConfiguration.getUnicodeSupport()
  }

  getMinDuration (): Promise<BigNumber> {
    return this.partnerConfiguration.getMinDuration()
  }

  getMaxDuration (): Promise<BigNumber> {
    return this.partnerConfiguration.getMaxDuration()
  }

  getMinCommitmentAge (): Promise<BigNumber> {
    return this.partnerConfiguration.getMinCommitmentAge()
  }

  getFeePercentage (): Promise<BigNumber> {
    return this.partnerConfiguration.getFeePercentage()
  }

  getDiscount (): Promise<BigNumber> {
    return this.partnerConfiguration.getDiscount()
  }

  getPrice (name: string, expires: BigNumber, duration: BigNumber): Promise<BigNumber> {
    return this.partnerConfiguration.getPrice(name, expires, duration)
  }

  validateName (name: string, duration: BigNumber): Promise<void> {
    return this.partnerConfiguration.validateName(name, duration)
  }

  async setDiscount (discount: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setDiscount(discount)).wait()
  }

  async setMaxDuration (maxDuration: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMaxDuration(maxDuration)).wait()
  }

  async setMinLength (minLength: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMinLength(minLength)).wait()
  }

  async setMaxLength (maxLength: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMaxLength(maxLength)).wait()
  }

  async setUnicodeSupport (unicodeSupport: boolean, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setUnicodeSupport(unicodeSupport)).wait()
  }

  async setMinCommitmentAge (minCommitmentAge: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMinCommitmentAge(minCommitmentAge))
  }

  async setFeePercentage (feePercentage: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setFeePercentage(feePercentage)).wait()
  }

  async setMinDuration (minDuration: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMinDuration(minDuration)).wait()
  }

  getSigner (signer?: Signer): Signer {
    const _signer = signer || this.signer

    if (!_signer) {
      throw new Error('Signer is not defined')
    }

    return _signer
  }
}
