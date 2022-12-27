import { Signer, Contract, BigNumber } from 'ethers'

const partnerConfigurationAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'minLength',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'maxLength',
        type: 'uint256'
      },
      {
        internalType: 'bool',
        name: 'isUnicodeSupported',
        type: 'bool'
      },
      {
        internalType: 'uint256',
        name: 'minDuration',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'maxDuration',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'feePercentage',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'discount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'minCommitmentAge',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256'
      },
      {
        internalType: 'string',
        name: 'reason',
        type: 'string'
      }
    ],
    name: 'InvalidDuration',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'length',
        type: 'uint256'
      },
      {
        internalType: 'string',
        name: 'reason',
        type: 'string'
      }
    ],
    name: 'InvalidLength',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string'
      },
      {
        internalType: 'string',
        name: 'reason',
        type: 'string'
      }
    ],
    name: 'InvalidName',
    type: 'error'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    inputs: [],
    name: 'getDiscount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getFeePercentage',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMaxDuration',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMaxLength',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMinCommitmentAge',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMinDuration',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMinLength',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256'
      }
    ],
    name: 'getPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getUnicodeSupport',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'discount',
        type: 'uint256'
      }
    ],
    name: 'setDiscount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'feePercentage',
        type: 'uint256'
      }
    ],
    name: 'setFeePercentage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'maxDuration',
        type: 'uint256'
      }
    ],
    name: 'setMaxDuration',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'maxLength',
        type: 'uint256'
      }
    ],
    name: 'setMaxLength',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'minCommitmentAge',
        type: 'uint256'
      }
    ],
    name: 'setMinCommitmentAge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'minDuration',
        type: 'uint256'
      }
    ],
    name: 'setMinDuration',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'minLength',
        type: 'uint256'
      }
    ],
    name: 'setMinLength',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: 'flag',
        type: 'bool'
      }
    ],
    name: 'setUnicodeSupport',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string'
      },
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256'
      }
    ],
    name: 'validateName',
    outputs: [],
    stateMutability: 'view',
    type: 'function'
  }
]

export class PartnerConfiguration {
  partnerConfiguration: Contract
  signer?: Signer

  constructor (partnerConfigurationAddress: string, signer?: Signer) {
    this.partnerConfiguration = new Contract(partnerConfigurationAddress, partnerConfigurationAbi)
    this.signer = signer
  }

  getMinLength (): Promise<BigNumber> {
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

  async setMinCommitmentAge (minCommitmentAge: number, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMinCommitmentAge(minCommitmentAge))
  }

  async setFeePercentage (feePercentage: number, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setFeePercentage(feePercentage)).wait()
  }

  async setMinDuration (minDuration: BigNumber, signer?: Signer): Promise<void> {
    const _signer = this.getSigner(signer)
    await (await this.partnerConfiguration.connect(_signer).setMinDuration(minDuration)).wait()
  }

  setSigner (signer: Signer): void {
    this.signer = signer
  }

  private getSigner (signer?: Signer): Signer {
    const _signer = signer || this.signer

    if (!_signer) {
      throw new Error('Signer is not defined')
    }

    return _signer
  }
}
