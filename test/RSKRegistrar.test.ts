import { Wallet, providers } from 'ethers'

import { RSKRegistrar } from '../src/RSKRegistrar'

const addresses = {
  rns: '0x7d284aaac6e925aad802a53c0c69efe3764597b8',
  registrar: '0x3d1a11c623bd21375f2b69f4eec814f4ceeb1d8d',
  reverseRegistrar: '0xc1cb803d5169e0a9894bf0f8dcdf83090999842a',
  publicResolver: '0x1e7ae43e3503efb886104ace36051ea72b301cdf',
  nameResolver: '0x8587385ad60038bB181aFfDF687c4D1B80C4787e',
  multiChainResolver: '0x404308f2a2eec2cdc3cb53d7d295af11c903414e',
  rif: '0x19f64674d8a5b4e652319f5e239efd3bc969a1fe',
  fifsRegistrar: '0x36ffda909f941950a552011f2c50569fda14a169',
  fifsAddrRegistrar: '0x90734bd6bf96250a7b262e2bc34284b0d47c1e8d',
  rskOwner: '0xca0a477e19bac7e0e172ccfd2e3c28a7200bdb71',
  renewer: '0xe48ad1d5fbf61394b5a7d81ab2f36736a046657b',
  stringResolver: '0xc980a15304b70a6a00ce8fd376e8ce78e15c5dd8',
  definitiveResolver: '0x25c289cccfff700c6a38722f4913924fe504de0e'
}

/* const generateSecret = (strSalt:string) => {
  // return `0x${strSalt.padEnd(64, '0')}`
  return '0xd684e2e08b1f363176cb14405d8c1eefb7788c002ba583f1a838130956635ac8'
} */

describe('RSKRegistrar SDK', () => {
  test('test on', async () => {
    const privateKey = 'c8e13a0e09736fe5d6e2a39113ba5c395b3747db1ea7abc0390a98a6dc8a00fc'

    // Connect a wallet to mainnet

    const url = 'https://public-node.testnet.rsk.co'
    const provider = new providers.JsonRpcProvider(url)

    const signer = new Wallet(privateKey, provider)
    const balance = await signer.getBalance()
    console.log({ balance })

    const rskRegistrar = new RSKRegistrar('test', addresses.fifsAddrRegistrar, signer)
    console.log(rskRegistrar)
    // await rskRegistrar.commitToRegister('luca.rsk', signer.address, generateSecret('test'))
    /* console.log({ response }) */
  })
})
