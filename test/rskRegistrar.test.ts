import { RSKRegistrar } from '../src/RSKRegistrar'

// @ts-ignore
import { deployRskRegistrar } from './util'

describe('rsk registrar', () => {
  test('dummy', async () => {
    const res = await deployRskRegistrar()
    console.log(Object.keys(res))
  })
})
const generateSecret = (strSalt:string) => {
  // return `0x${strSalt.padEnd(64, '0')}`
  return '0xd684e2e08b1f363176cb14405d8c1eefb7788c002ba583f1a838130956635ac8'
}
describe('RSKRegistrar SDK', () => {
  test('test on', async () => {
    const { rnsOwner, rifToken, rskOwner, fifsAddrRegistrar } = await deployRskRegistrar()
    console.log({ rifToken })
    console.log({ rskOwner })
    const rskRegistrar = new RSKRegistrar('test', fifsAddrRegistrar.address, rnsOwner)
    const commitToRegisterTx = await rskRegistrar.commitToRegister('luca.rsk', await rnsOwner.getAddress(), generateSecret('test'))
    console.log({ commitToRegisterTx })
    const commitToRegisterReceipt = await commitToRegisterTx.wait()
    console.log({ commitToRegisterReceipt })
  })
})
