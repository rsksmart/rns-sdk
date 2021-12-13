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
  test('commit to register', async () => {
    const { rnsOwner, rifToken, rskOwner, fifsAddrRegistrar } = await deployRskRegistrar()

    const rskRegistrar = new RSKRegistrar(rskOwner.address, fifsAddrRegistrar.address, rifToken.address, rnsOwner)
    console.log(fifsAddrRegistrar.address)
    console.log(rifToken.address)
    const salt = generateSecret('test')
    const { hash, contractTransaction } = await rskRegistrar.commitToRegister('luca.rsk', await rnsOwner.getAddress(), salt)
    console.log({ hash })
    console.log({ salt })
    const commitToRegisterReceipt = await contractTransaction.wait()
    console.log({ commitToRegisterReceipt })
    /* const available = await rskRegistrar.available('luca2.rsk')
    console.log({ available }) */
    /* const canRevealResponse = await rskRegistrar.canReveal(hash)
    console.log({ canRevealResponse }) */
    /* const registerTx = await rskRegistrar.register('luca.rsk', await rnsOwner.getAddress(), salt)
    const registerReceipt = registerTx.wait()
    console.log({ registerReceipt }) */
  })
})
