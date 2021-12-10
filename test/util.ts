import { providers, ContractFactory, constants, ContractTransaction, BigNumber } from 'ethers'

import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json'
import RNSResolverData from '@rsksmart/rns-resolver/AddrResolverData.json'
import ERC677Data from '@rsksmart/erc677/ERC677Data.json'

import RSKOwnerData from './rskregistrar/rskOwner.json'
import NamePriceData from './rskregistrar/namePrice.json'
import BytesUtilsData from './rskregistrar/bytesUtils.json'
import FIFSAddrRegistrarData from './rskregistrar/fifsAddrRegistrar.json'

import { hashDomain, hashLabel } from '../src'


export const sendAndWait = (txPromise: Promise<ContractTransaction>) => txPromise.then(tx => tx.wait())

const rskLabel = 'rsk'

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

export const deployRskRegistrar = async () => {
  const { rnsOwner, rnsOwnerAddress, rnsRegistryContract } = await deployRNSRegistryAndResolver()

  const rifTokenFactory = new ContractFactory(ERC677Data.abi, ERC677Data.bytecode, rnsOwner)
  const rifToken = await rifTokenFactory.deploy(
    rnsOwnerAddress,
    BigNumber.from('1000').mul(BigNumber.from('10').pow(BigNumber.from('10'))),
    'Testing RIF',
    'RIF',
    BigNumber.from('18')
  )
  await rifToken.deployTransaction.wait()

  const rskOwnerFactory = new ContractFactory(RSKOwnerData.abi, RSKOwnerData.bytecode, rnsOwner)
  const rskOwner = await rskOwnerFactory.deploy(constants.AddressZero, rnsRegistryContract.address, hashDomain(rskLabel))
  await rskOwner.deployTransaction.wait()

  const namePriceFactory = new ContractFactory(NamePriceData.abi, NamePriceData.bytecode, rnsOwner)
  const namePrice = await namePriceFactory.deploy()
  await namePrice.deployTransaction.wait()

  const bytesUtilsFactory = new ContractFactory(BytesUtilsData.abi, BytesUtilsData.bytecode, rnsOwner)
  const bytesUtils = await bytesUtilsFactory.deploy()
  await bytesUtils.deployTransaction.wait()

  const fifsAddrRegistrarFactory = new ContractFactory(FIFSAddrRegistrarData.abi, FIFSAddrRegistrarData.bytecode.replace(/__BytesUtils____________________________/g, bytesUtils.address.slice(2).toLowerCase()), rnsOwner)
  const fifsAddrRegistrar = await fifsAddrRegistrarFactory.deploy(
    rifToken.address,
    rskOwner.address,
    rnsOwnerAddress,
    namePrice.address,
    rnsRegistryContract.address,
    hashDomain('rsk'))
  await fifsAddrRegistrar.deployTransaction.wait()

  
  await sendAndWait(rskOwner.addRegistrar(fifsAddrRegistrar.address))

  return { rnsOwner, rifToken, rskOwner, fifsAddrRegistrar }
}