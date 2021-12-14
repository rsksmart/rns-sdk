import { BigNumber } from 'ethers'

// @ts-ignore
import { deployRskRegistrar, rskLabel } from './util'
import { RSKRegistrar } from '../src/RSKRegistrar'
import { hashDomain } from '../src/hash'

describe('rsk registrar', () => {
  test('e2e', async () => {
    const { provider, rnsRegistryContract, addrResolverContract, rskOwnerContract, fifsAddrRegistrarContract, rifTokenContract, testAccount } = await deployRskRegistrar()

    const rskRegistrar = new RSKRegistrar(rskOwnerContract.address, fifsAddrRegistrarContract.address, rifTokenContract.address, testAccount)

    const label = 'lucachaco'
    const owner = await testAccount.getAddress()
    const duration = BigNumber.from('1')

    expect(await rskRegistrar.available(label)).toBeTruthy()

    const price = await rskRegistrar.price(label, duration)

    const { makeCommitmentTransaction, secret, canReveal } = await rskRegistrar.commitToRegister(label, owner)

    await makeCommitmentTransaction.wait()

    await provider.send('evm_increaseTime', [1001])
    await provider.send('evm_mine', [])

    const registerTx = await rskRegistrar.register(
      label,
      owner,
      secret,
      duration,
      price
    )

    const receipt = await registerTx.wait()

    expect(await rskRegistrar.ownerOf(label)).toEqual(owner)
    expect(await rnsRegistryContract.owner(hashDomain(`${label}.${rskLabel}`))).toEqual(owner)
    expect(await rnsRegistryContract.resolver(hashDomain(`${label}.${rskLabel}`))).toEqual(addrResolverContract.address)
    expect(await addrResolverContract.addr(hashDomain(`${label}.${rskLabel}`))).toEqual(owner)
  })
})
