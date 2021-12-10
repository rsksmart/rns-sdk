import { providers, ContractFactory, constants, ContractTransaction } from 'ethers'

import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json'
import RNSResolverData from '@rsksmart/rns-resolver/AddrResolverData.json'
import { hashDomain, hashLabel } from '../src'
// @ts-ignore
import { contractData as rskOwnerContractData } from './rskOwnerContractData'
// @ts-ignore
import { contractData as namePriceContractData } from './namePriceContractData'
// @ts-ignore
import { contractData as fifsAddrRegistrarContractData } from './fifsAddrRegistrarContractData'
export const sendAndWait = (txPromise: Promise<ContractTransaction>) => txPromise.then(tx => tx.wait())

const rskLabel = 'rsk'

export const rpcUrl = 'http://localhost:8545'

export const deployRNSFactory = (domainLabel: string, subdomainLabel: string) => async () => {
  // connect to test network
  const provider = new providers.JsonRpcProvider(rpcUrl)

  const rnsOwner = provider.getSigner(0)

  const rnsOwnerAddress = await rnsOwner.getAddress()

  // deploy rns registry
  const rnsRegistryFactory = new ContractFactory(RNSRegistryData.abi, RNSRegistryData.bytecode, rnsOwner)
  const rnsRegistryContract = await rnsRegistryFactory.deploy()
  await rnsRegistryContract.deployTransaction.wait()

  // deploy rns resolver
  const addrResolverFactory = new ContractFactory(RNSResolverData.abi, RNSResolverData.bytecode, rnsOwner)
  const addrResolverContract = await addrResolverFactory.deploy(rnsRegistryContract.address)
  await addrResolverContract.deployTransaction.wait()

  // set default resolver
  await sendAndWait(rnsRegistryContract.setResolver(constants.HashZero, addrResolverContract.address))

  const taringaOwner = provider.getSigner(1)

  const taringaOwnerAddress = await taringaOwner.getAddress()

  // register taringa.rsk for taringaOwner
  await sendAndWait(rnsRegistryContract.setSubnodeOwner(constants.HashZero, hashLabel(rskLabel), rnsOwnerAddress))
  await sendAndWait(rnsRegistryContract.setSubnodeOwner(hashDomain(rskLabel), hashLabel(domainLabel), taringaOwnerAddress))

  // registers a given subdomain of taringa.rsk for taringaOwner
  const taringaRnsRegistryContract = rnsRegistryContract.connect(taringaOwner)

  const registerSubdomain = async (label: string) => {
    await sendAndWait(taringaRnsRegistryContract.setSubnodeOwner(hashDomain(`${domainLabel}.${rskLabel}`), hashLabel(subdomainLabel), taringaOwnerAddress))
  }

  return {
    taringaOwner,
    rnsRegistryContract: taringaRnsRegistryContract,
    addrResolverContract: addrResolverContract.connect(taringaOwner),
    registerSubdomain
  }
}

export const deployRegistrarFactory = async () => {
  // connect to test network
  const provider = new providers.JsonRpcProvider(rpcUrl)
  const rnsOwner = provider.getSigner(0)
  // const rnsOwnerAddress = await rnsOwner.getAddress()
  // deploy rns registry
  const rnsRegistryFactory = new ContractFactory(RNSRegistryData.abi, RNSRegistryData.bytecode, rnsOwner)
  const rnsRegistryContract = await rnsRegistryFactory.deploy()
  await rnsRegistryContract.deployTransaction.wait()
  // deploy RSKOwner
  const rskOwnerFactory = new ContractFactory(rskOwnerContractData.abi, rskOwnerContractData.bytecode, rnsOwner)
  const rskOwnerContract = await rskOwnerFactory.deploy(constants.AddressZero, rnsRegistryContract.address, hashDomain('rsk'))
  await rskOwnerContract.deployTransaction.wait()
  console.log('rskOwnerContract: ', rskOwnerContract.address)
  // deploy Name Price
  const namePriceFactory = new ContractFactory(namePriceContractData.abi, namePriceContractData.bytecode, rnsOwner)
  const namePriceContract = await namePriceFactory.deploy()
  await namePriceContract.deployTransaction.wait()
  console.log('namePriceContract: ', namePriceContract.address)
  // deploy FIFS Address Registrar
  /* const fifsAddressRegistrarFactory = new ContractFactory(fifsAddrRegistrarContractData.abi, fifsAddrRegistrarContractData.bytecode, rnsOwner)
  const fifsAddressRegistrarContract = await fifsAddressRegistrarFactory.deploy()
  await fifsAddressRegistrarContract.deployTransaction.wait()

  console.log('fifsAddressRegistrarContract: ', fifsAddressRegistrarContract.address) */

  return {

  }
}
