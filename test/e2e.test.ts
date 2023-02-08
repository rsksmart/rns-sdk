import { BigNumber } from 'ethers'
import RNSResolver from '@rsksmart/rns-resolver.js'
import 'isomorphic-fetch'

import { RNS, AddrResolver, RSKRegistrar } from '../src'
import { rpcUrl, deployRskRegistrar, sendAndWait } from './util'
import { TEST_ADDRESS } from './testCase'

test('e2e', async () => {
  const { provider, testAccount, rnsRegistryContract, rskOwnerContract, fifsAddrRegistrarContract, rifTokenContract } = await deployRskRegistrar()
  const testAccountAddress = await testAccount.getAddress()

  const rskRegistrar = new RSKRegistrar(rskOwnerContract.address, fifsAddrRegistrarContract.address, rifTokenContract.address, testAccount)
  const rns = new RNS(rnsRegistryContract.address, testAccount)
  const addrResolver = new AddrResolver(rnsRegistryContract.address, testAccount)

  const label = 'lucachaco'

  expect(await rskRegistrar.available(label)).toBeTruthy()

  const duration = BigNumber.from('1')

  const price = await rskRegistrar.price(label, duration)

  const { makeCommitmentTransaction, secret, canReveal } = await rskRegistrar.commitToRegister(label, testAccountAddress)

  await makeCommitmentTransaction.wait()

  await provider.send('evm_increaseTime', [1001])
  await provider.send('evm_mine', [])

  const commitmentReady = await canReveal()
  expect(commitmentReady).toEqual(true)

  const registerTx = await rskRegistrar.register(
    label,
    testAccountAddress,
    secret,
    duration,
    price
  )

  await registerTx.wait()

  await sendAndWait(rns.setSubdomainOwner('lucachaco.rsk', 'user1', testAccountAddress))
  await sendAndWait(addrResolver.setAddr('user1.lucachaco.rsk', TEST_ADDRESS))

  const rnsResolver = new RNSResolver({
    registryAddress: rnsRegistryContract.address,
    rpcUrl,
    addrEncoder: (buff: Buffer) => '0x' + buff.toString('hex'),
    defaultCoinType: 30
  })

  const addr = await rnsResolver.addr('user1.lucachaco.rsk')
  expect(addr).toEqual(TEST_ADDRESS.toLowerCase())
}, 300000)
