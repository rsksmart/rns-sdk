import { hash as namehash } from '@ensdomains/eth-ens-namehash'
import { keccak_256 as sha3 } from 'js-sha3'

export const hashDomain = (domain: string) => namehash(domain)
export const hashLabel = (label: string) => '0x' + sha3(label)
