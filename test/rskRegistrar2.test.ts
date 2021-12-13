import { RSKRegistrar } from '../src/RSKRegistrar'
import { providers } from 'ethers'

describe('RSKRegistrar SDK', () => {
  test.skip('commit to register', async () => {
    const rpcUrl = 'http://localhost:8545'
    const provider = new providers.JsonRpcProvider(rpcUrl)
    const rnsOwner = provider.getSigner(0)
    const rskRegistrar = new RSKRegistrar('test', '0x2CC82154387BB0eC5A3ff00eA70EaE3D1cbbcD30', '0xB8884c6181B119c504111340E765133265864625', rnsOwner)
    const hash = '0x195d2bd28ce19b2d6b9e786dd0fcca7f74a8c29215da914055d999bcb53ea107'
    const canRevealResponse = await rskRegistrar.canReveal(hash)
    const salt = '0xd684e2e08b1f363176cb14405d8c1eefb7788c002ba583f1a838130956635ac8'
    console.log({ canRevealResponse })
    console.log({ rskRegistrar })
    const registerTx = await rskRegistrar.register('luca.rsk', await rnsOwner.getAddress(), salt)
    const registerReceipt = registerTx.wait()
    console.log({ registerReceipt })
  })
  /* test.only('commit to register', async () => {
    const rpcUrl = 'http://localhost:8545'
    const provider = new providers.JsonRpcProvider(rpcUrl)
    const rnsOwner = provider.getSigner(0)
    const rskRegistrar = new RSKRegistrar('test', '0xED3fEb6a379E07f1AB9009D3155437593643AF89', '0xe3ee6Ec5d4925D814d3CAAf74E121b3A2cC9312a', rnsOwner)
    const hash = '0x711d8d7a7eb8ed076a5f8e8f249bed66acf680c3fd95dd1ae3b62804b9e343ee'
    const canRevealResponse = await rskRegistrar.canReveal(hash)
    // const salt = '0xd684e2e08b1f363176cb14405d8c1eefb7788c002ba583f1a838130956635ac8'
    console.log({ canRevealResponse })
    console.log({ rskRegistrar })
  }) */
})
