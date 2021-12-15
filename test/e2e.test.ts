import RNSResolver from '@rsksmart/rns-resolver.js'
import 'isomorphic-fetch'

import { RNS } from '../src/RNS'
import { rpcUrl, deployRNSFactory, sendAndWait } from './util'
import { TEST_ADDRESS } from './testCase'

const deployRNS = deployRNSFactory('taringa', 'user1')

test('e2e', async () => {
  const { taringaOwner, rnsRegistryContract } = await deployRNS()
  const taringaOwnerAddress = await taringaOwner.getAddress()

  const rnsSDK = new RNS(rnsRegistryContract.address, taringaOwner)
  const rnsResolver = new RNSResolver({
    registryAddress: rnsRegistryContract.address,
    rpcUrl,
    addrEncoder: (buff: Buffer) => '0x' + buff.toString('hex'),
    defaultCoinType: 30
  })

  await sendAndWait(rnsSDK.setSubdomainOwner('taringa.rsk', 'user1', taringaOwnerAddress))
  await sendAndWait(rnsSDK.setAddr('user1.taringa.rsk', TEST_ADDRESS))

  const addr = await rnsResolver.addr('user1.taringa.rsk')
  expect(addr).toEqual(TEST_ADDRESS.toLowerCase())
})
