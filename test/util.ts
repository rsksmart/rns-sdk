import { providers, ContractFactory, constants, ContractTransaction, BigNumber } from 'ethers'

import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json'
import RNSResolverData from '@rsksmart/rns-resolver/AddrResolverData.json'
import ERC677Data from '@rsksmart/erc677/ERC677Data.json'

import TokenRegistrarData from '../src/rskregistrar/tokenRegistrar.json'
import RSKOwnerData from '../src/rskregistrar/rskOwner.json'
import NamePriceData from '../src/rskregistrar/namePrice.json'
import BytesUtilsData from '../src/rskregistrar/bytesUtils.json'
import FIFSAddrRegistrarData from '../src/rskregistrar/fifsAddrRegistrar.json'

import { hashDomain, hashLabel } from '../src/hash'

export const sendAndWait = (txPromise: Promise<ContractTransaction>) => txPromise.then(tx => tx.wait())

export const rskLabel = 'rsk'

export const rpcUrl = 'http://localhost:8545'

const deployRNSRegistryAndResolver = async () => {
  const provider = new providers.JsonRpcProvider(rpcUrl)

  const rnsOwner = provider.getSigner(0)

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

  const rnsOwnerAddress = await rnsOwner.getAddress()

  return { provider, rnsOwner, rnsOwnerAddress, rnsRegistryContract, addrResolverContract }
}

export const deployRNSFactory = (domainLabel: string, subdomainLabel: string) => async () => {
  // connect to test network
  const { provider, rnsOwnerAddress, rnsRegistryContract, addrResolverContract } = await deployRNSRegistryAndResolver()

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

export const toWei = (value: string) => BigNumber.from(value).mul(BigNumber.from('10').pow(BigNumber.from('18')))

export const deployRskRegistrar = async () => {
  const { provider, rnsOwner, rnsOwnerAddress, rnsRegistryContract, addrResolverContract } = await deployRNSRegistryAndResolver()

  const rifTokenFactory = new ContractFactory(ERC677Data.abi, ERC677Data.bytecode, rnsOwner)
  const rifTokenContract = await rifTokenFactory.deploy(
    rnsOwnerAddress,
    toWei('1000'),
    'Testing RIF',
    'RIF',
    BigNumber.from('18')
  )
  await rifTokenContract.deployTransaction.wait()

  const tokenRegistrarFactory = new ContractFactory(TokenRegistrarData.abi, TokenRegistrarData.bytecode, rnsOwner)
  const tokenRegistrarContract = await tokenRegistrarFactory.deploy(rnsRegistryContract.address, hashDomain(rskLabel), rifTokenContract.address)
  await tokenRegistrarContract.deployTransaction.wait()

  const rskOwnerFactory = new ContractFactory(RSKOwnerData.abi, RSKOwnerData.bytecode, rnsOwner)
  const rskOwnerContract = await rskOwnerFactory.deploy(tokenRegistrarContract.address, rnsRegistryContract.address, hashDomain(rskLabel))
  await rskOwnerContract.deployTransaction.wait()

  const namePriceFactory = new ContractFactory(NamePriceData.abi, NamePriceData.bytecode, rnsOwner)
  const namePriceContract = await namePriceFactory.deploy()
  await namePriceContract.deployTransaction.wait()

  const bytesUtilsFactory = new ContractFactory(BytesUtilsData.abi, BytesUtilsData.bytecode, rnsOwner)
  const bytesUtilsContract = await bytesUtilsFactory.deploy()
  await bytesUtilsContract.deployTransaction.wait()

  const fifsAddrRegistrarFactory = new ContractFactory(
    FIFSAddrRegistrarData.abi,
    FIFSAddrRegistrarData.bytecode.replace(/__BytesUtils____________________________/g, bytesUtilsContract.address.slice(2).toLowerCase()), // linking
    rnsOwner
  )
  const fifsAddrRegistrarContract = await fifsAddrRegistrarFactory.deploy(
    rifTokenContract.address,
    rskOwnerContract.address,
    rnsOwnerAddress,
    namePriceContract.address,
    rnsRegistryContract.address,
    hashDomain(rskLabel))
  await fifsAddrRegistrarContract.deployTransaction.wait()

  await sendAndWait(rskOwnerContract.addRegistrar(fifsAddrRegistrarContract.address))
  await sendAndWait(rnsRegistryContract.setSubnodeOwner(constants.HashZero, hashLabel(rskLabel), rskOwnerContract.address))

  const testAccount = provider.getSigner(1)

  await sendAndWait(rifTokenContract.transfer(await testAccount.getAddress(), toWei('100')))

  return { provider, rnsRegistryContract, addrResolverContract, rskOwnerContract, rifTokenContract, fifsAddrRegistrarContract, testAccount }
}
