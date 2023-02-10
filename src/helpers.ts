import { hash as namehash, normalize } from '@ensdomains/eth-ens-namehash'
import { keccak_256 as sha3 } from 'js-sha3'

export const hashDomain = (domain: string): string => namehash(domain)
export const hashLabel = (label: string): string => '0x' + sha3(label)

export const normalizeName = (name: string): string => normalize(name)

export const validateAndNormalizeLabel = (label: string): string => {
  const normalizedLabel = normalizeName(label)

  if (normalizedLabel.includes('.')) {
    throw new Error('Label cannot contain a dot')
  }

  if (normalizedLabel === '') {
    throw new Error('Label cannot be empty')
  }

  return normalizedLabel
}
