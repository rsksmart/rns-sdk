import { utils } from 'ethers'

export const generateSecret = (): string => utils.hexZeroPad('0x' + Buffer.from(utils.randomBytes(32)).toString('hex'), 32)
