import { providers, ContractFactory, constants, ContractTransaction } from 'ethers'
import { hash as namehash } from '@ensdomains/eth-ens-namehash'
import { keccak_256 } from 'js-sha3'
import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json'

import { RNS } from '../src'

const testAddress = '0x0000000000111111111122222222223333333333'

describe('RNS SDK', () => {
  test('set subnode owner for user1.taringa.rsk', async () => {
    // connect to test network
    const provider = new providers.JsonRpcProvider('http://localhost:8545')
    const signer = provider.getSigner()

    // deploy rns registry
    const rnsRegistryFactory = new ContractFactory(RNSRegistryData.abi, RNSRegistryData.bytecode, signer)
    const rnsRegistryContract = await rnsRegistryFactory.deploy()
    await rnsRegistryContract.deployTransaction.wait()

    // delegate taringa.rsk to test account
    const address = await signer.getAddress()
    await rnsRegistryContract.setSubnodeOwner(constants.HashZero, '0x' + keccak_256('rsk'), address).then((tx: ContractTransaction) => tx.wait())
    await rnsRegistryContract.setSubnodeOwner(namehash('rsk'), '0x' + keccak_256('taringa'), address).then((tx: ContractTransaction) => tx.wait())

    const rns = new RNS(rnsRegistryContract.address, signer)

    const domain = 'taringa.rsk'
    const label = 'user1'

    const tx = await rns.setSubnodeOwner(domain, label, testAddress)
    await tx.wait()

    expect(await rnsRegistryContract.owner(namehash(`${label}.${domain}`))).toEqual(testAddress)
  })
})
