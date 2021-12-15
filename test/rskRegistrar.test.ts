import { BigNumber, utils } from 'ethers'

import { deployRskRegistrar, registerDomain } from './util'
import { RSKRegistrar } from '../src/RSKRegistrar'
import { hashLabel } from '../src/hash'
import { generateSecret } from '../src/random'

describe('rsk registrar', () => {
  test('constructor', async () => {
    const { rskOwnerContract, fifsAddrRegistrarContract, rifTokenContract, testAccount } = await deployRskRegistrar()

    const rskRegistrar = new RSKRegistrar(rskOwnerContract.address, fifsAddrRegistrarContract.address, rifTokenContract.address, testAccount)
    expect(rskRegistrar.rskOwner.address).toEqual(rskOwnerContract.address)
    expect(rskRegistrar.fifsAddrRegistrar.address).toEqual(fifsAddrRegistrarContract.address)
    expect(rskRegistrar.rifToken.address).toEqual(rifTokenContract.address)
  })

  test('available', async () => {
    const label = 'available_domain'
    const { provider, rskOwnerContract, fifsAddrRegistrarContract, rifTokenContract, testAccount } = await deployRskRegistrar()

    const rskRegistrar = new RSKRegistrar(rskOwnerContract.address, fifsAddrRegistrarContract.address, rifTokenContract.address, testAccount)
    const available = await rskRegistrar.available(label)
    expect(available).toEqual(true)
    await registerDomain(label, provider, rskOwnerContract, fifsAddrRegistrarContract, rifTokenContract, testAccount)
    const availabilityAfterRegistration = await rskRegistrar.available(label)
    expect(availabilityAfterRegistration).toEqual(false)
  })

  test('price', async () => {
    const label = 'domain-to-check-price'
    const { rskOwnerContract, fifsAddrRegistrarContract, rifTokenContract, testAccount } = await deployRskRegistrar()
    const rskRegistrar = new RSKRegistrar(rskOwnerContract.address, fifsAddrRegistrarContract.address, rifTokenContract.address, testAccount)
    const duration = BigNumber.from('2')
    const price = await rskRegistrar.price(label, duration)
    expect(utils.formatUnits(price, 18)).toEqual('4.0')// 2 rif per year
  })

  test('commitToRegister and canReveal', async () => {
    const label = 'domain-to-test-commitment'
    const { provider, rskOwnerContract, fifsAddrRegistrarContract, rifTokenContract, testAccount } = await deployRskRegistrar()
    const rskRegistrar = new RSKRegistrar(rskOwnerContract.address, fifsAddrRegistrarContract.address, rifTokenContract.address, testAccount)
    const owner = await testAccount.getAddress()

    const { makeCommitmentTransaction, secret, canReveal } = await rskRegistrar.commitToRegister(label, owner)
    const makeCommitmentTransactionReceipt = await makeCommitmentTransaction.wait()

    expect(makeCommitmentTransactionReceipt.status).toEqual(1)

    const hash = await fifsAddrRegistrarContract.makeCommitment(hashLabel(label), owner, secret)
    expect(await fifsAddrRegistrarContract.canReveal(hash)).toEqual(false)
    expect(await canReveal()).toEqual(false)

    await provider.send('evm_increaseTime', [1001])
    await provider.send('evm_mine', [])
    expect(await fifsAddrRegistrarContract.canReveal(hash)).toEqual(true)
    expect(await canReveal()).toEqual(true)
  })
  test('register', async () => {
    const label = 'domain-to-test-registration'
    const { provider, rskOwnerContract, fifsAddrRegistrarContract, rifTokenContract, testAccount } = await deployRskRegistrar()
    const rskRegistrar = new RSKRegistrar(rskOwnerContract.address, fifsAddrRegistrarContract.address, rifTokenContract.address, testAccount)
    const owner = await testAccount.getAddress()
    const secret = generateSecret()
    const hash = await fifsAddrRegistrarContract.makeCommitment(hashLabel(label), owner, secret)
    const makeCommitmentTransactionTx = await fifsAddrRegistrarContract.commit(hash)
    await makeCommitmentTransactionTx.wait()

    await provider.send('evm_increaseTime', [1001])
    await provider.send('evm_mine', [])

    const duration = BigNumber.from('1')
    const price = await rskRegistrar.price(label, duration)
    const registerTx = await rskRegistrar.register(
      label,
      owner,
      secret,
      duration,
      price
    )

    const registerReceipt = await registerTx.wait()
    expect(registerReceipt.status).toEqual(1)
    const domainOwner = await rskOwnerContract.ownerOf(hashLabel(label))
    expect(domainOwner).toEqual(owner)
  })

  test('ownerOf', async () => {
    const { provider, rskOwnerContract, fifsAddrRegistrarContract, rifTokenContract, testAccount } = await deployRskRegistrar()
    const rskRegistrar = new RSKRegistrar(rskOwnerContract.address, fifsAddrRegistrarContract.address, rifTokenContract.address, testAccount)
    const label = 'domain-to-test-ownerOf'
    await registerDomain(label, provider, rskOwnerContract, fifsAddrRegistrarContract, rifTokenContract, testAccount)
    expect(await rskRegistrar.ownerOf(label)).toEqual(await testAccount.getAddress())
  })
})
