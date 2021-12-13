import { RSKRegistrar } from '../src/RSKRegistrar'

// @ts-ignore
import { deployRskRegistrar } from './util'
import { providers } from 'ethers'

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
    const { rnsOwner, rskOwner, rifToken, fifsAddrRegistrar } = await deployRskRegistrar()

    const rskRegistrar = new RSKRegistrar(rskOwner.address, fifsAddrRegistrar.address, rifToken.address, rnsOwner)
    console.log('fifsAddrRegistrar.address: ', fifsAddrRegistrar.address)
    console.log('rifToken.address: ', rifToken.address)
    const salt = generateSecret('test')
    const { hash, contractTransaction } = await rskRegistrar.commitToRegister('lucachaco', await rnsOwner.getAddress(), salt)
    console.log({ hash })
    console.log({ salt })
    const commitToRegisterReceipt = await contractTransaction.wait()
    console.log({ commitToRegisterReceipt })
    /*    const available = await rskRegistrar.available('new-domain.rsk')
    console.log({ available }) */
    await advanceTime()
    const canRevealResponse = await rskRegistrar.canReveal(hash)
    expect(canRevealResponse).toEqual(true)
    console.log({ canRevealResponse })
    const registerTx = await rskRegistrar.register('lucachaco', await rnsOwner.getAddress(), salt)
    const registerReceipt = registerTx.wait()
    console.log({ registerReceipt })
  })
})

const advanceTime = async () => {
  const rpcUrl = 'http://localhost:8545'
  const provider = new providers.JsonRpcProvider(rpcUrl)
  const evmIncreaseTime = await provider.send('evm_increaseTime', [1000])
  console.log(evmIncreaseTime)
  const evmMine = await provider.send('evm_mine', [])
  console.log(evmMine)
}
