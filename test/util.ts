import {
  providers,
  ContractFactory,
  constants,
  ContractTransaction,
  BigNumber,
  utils,
  Contract,
  Signer,
  ContractReceipt
} from 'ethers'

import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json'
import RNSResolverData from '@rsksmart/rns-resolver/AddrResolverData.json'
import ERC677Data from '@rsksmart/erc677/ERC677Data.json'

import TokenRegistrarData from './rskregistrar/tokenRegistrar.json'
import RSKOwnerData from './rskregistrar/rskOwner.json'
import NamePriceData from './rskregistrar/namePrice.json'
import BytesUtilsData from './rskregistrar/bytesUtils.json'
import StringUtilsData from './rskregistrar/stringUtils.json'
import FIFSAddrRegistrarData from './rskregistrar/fifsAddrRegistrar.json'
import PartnerConfigurationData from './rskregistrar/partnerConfiguration.json'
import PartnerRegistrarData from './rskregistrar/partnerRegistrar.json'
import PartnerRenewerData from './rskregistrar/partnerRenewer.json'
import AccessControlData from './rskregistrar/accessControl.json'
import PartnerManagerData from './rskregistrar/partnerManager.json'
import FeeManagerData from './rskregistrar/feeManager.json'

import { hashDomain, hashLabel, RSKRegistrar, validateAndNormalizeLabel } from '../src'
import { generateSecret } from '../src/random'

export const sendAndWait = (txPromise: Promise<ContractTransaction>): Promise<ContractReceipt> => txPromise.then(tx => tx.wait())

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

  return {
    provider,
    rnsOwner,
    rnsOwnerAddress,
    rnsRegistryContract,
    addrResolverContract
  }
}

export const deployRNSFactory = (domainLabel: string, subdomainLabel: string): ()=> Promise<{
  taringaOwner: Signer,
  rnsRegistryContract: Contract,
  addrResolverContract: Contract,
  registerSubdomain: ()=> Promise<void>
}> => async () => {
  // connect to test network
  const {
    provider,
    rnsOwnerAddress,
    rnsRegistryContract,
    addrResolverContract
  } = await deployRNSRegistryAndResolver()

  const taringaOwner = provider.getSigner(1)

  const taringaOwnerAddress = await taringaOwner.getAddress()

  // register taringa.rsk for taringaOwner
  await sendAndWait(rnsRegistryContract.setSubnodeOwner(constants.HashZero, hashLabel(rskLabel), rnsOwnerAddress))
  await sendAndWait(rnsRegistryContract.setSubnodeOwner(hashDomain(rskLabel), hashLabel(domainLabel), taringaOwnerAddress))

  // registers a given subdomain of taringa.rsk for taringaOwner
  const taringaRnsRegistryContract = rnsRegistryContract.connect(taringaOwner)

  const registerSubdomain = async () => {
    await sendAndWait(taringaRnsRegistryContract.setSubnodeOwner(hashDomain(`${domainLabel}.${rskLabel}`), hashLabel(subdomainLabel), taringaOwnerAddress))
  }

  return {
    taringaOwner,
    rnsRegistryContract: taringaRnsRegistryContract,
    addrResolverContract: addrResolverContract.connect(taringaOwner),
    registerSubdomain
  }
}

export const toWei = (value: string): BigNumber => BigNumber.from(value).mul(BigNumber.from('10').pow(BigNumber.from('18')))

export const deployAccessControl = async (rnsOwner: Signer): Promise<Contract> => {
  const accessControlFactory = new ContractFactory(AccessControlData.abi, AccessControlData.bytecode, rnsOwner)
  const accessControlContract = await accessControlFactory.deploy()
  await accessControlContract.deployTransaction.wait()

  return accessControlContract
}

export const deployRskRegistrar = async (): Promise<{
  provider: providers.JsonRpcProvider,
  rnsRegistryContract: Contract,
  addrResolverContract: Contract,
  rskOwnerContract: Contract,
  rifTokenContract: Contract,
  fifsAddrRegistrarContract: Contract,
  testAccount: Signer
}> => {
  const {
    provider,
    rnsOwner,
    rnsOwnerAddress,
    rnsRegistryContract,
    addrResolverContract
  } = await deployRNSRegistryAndResolver()

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

  return {
    provider,
    rnsRegistryContract,
    addrResolverContract,
    rskOwnerContract,
    rifTokenContract,
    fifsAddrRegistrarContract,
    testAccount
  }
}

export const registerDomain = async (label: string, provider: providers.JsonRpcProvider, rskOwnerContract: Contract, fifsAddrRegistrarContract: Contract, rifTokenContract: Contract, testAccount: Signer): Promise<void> => {
  label = validateAndNormalizeLabel(label)

  const owner = await testAccount.getAddress()
  const rskRegistrar = new RSKRegistrar(rskOwnerContract.address, fifsAddrRegistrarContract.address, rifTokenContract.address, testAccount)
  const secret = generateSecret()
  const hash = await fifsAddrRegistrarContract.makeCommitment(hashLabel(label), owner, secret)
  const makeCommitmentTransactionTx = await fifsAddrRegistrarContract.commit(hash)
  await makeCommitmentTransactionTx.wait()

  await provider.send('evm_increaseTime', [1001])
  await provider.send('evm_mine', [])

  const duration = BigNumber.from('1')
  const price = await rskRegistrar.price(label, duration)

  const _signature = '0x5f7b99d5'
  const _owner = owner.slice(2).toLowerCase()
  const _secret = secret.slice(2)
  const _duration = utils.hexZeroPad(duration.toHexString(), 32).slice(2)
  const _addr = _owner
  const _name = Buffer.from(utils.toUtf8Bytes(label)).toString('hex')

  const data = `${_signature}${_owner}${_secret}${_duration}${_addr}${_name}`

  const tx = await rifTokenContract.transferAndCall(fifsAddrRegistrarContract.address, price, data)
  await tx.wait()
}

export const DEFAULT_MIN_LENGTH = 3
export const DEFAULT_MAX_LENGTH = 7
export const DEFAULT_MIN_DURATION = 1
export const DEFAULT_MAX_DURATION = 2
export const DEFAULT_MIN_COMMITMENT_AGE = 0
export const DEFAULT_DISCOUNT = 4
export const DEFAULT_FEE_PERCENTAGE = 5
export const deployPartnerConfiguration = async ({
  defaultMinCommitmentAge = DEFAULT_MIN_COMMITMENT_AGE,
  accessControlContract,
  owner
}: {
    defaultMinCommitmentAge?: number,
  accessControlContract?: Contract,
  owner?: providers.JsonRpcSigner
} = {}): Promise<{
  provider: providers.JsonRpcProvider, owner: providers.JsonRpcSigner, partnerConfigurationFactory: ContractFactory, partnerConfigurationContract: Contract,
  accessControlContract: Contract,
}> => {
  const provider = new providers.JsonRpcProvider(rpcUrl)
  const _owner = owner ?? provider.getSigner(0)

  if (!accessControlContract) {
    accessControlContract = await deployAccessControl(_owner)
  }

  const partnerConfigurationFactory = new ContractFactory(PartnerConfigurationData.abi, PartnerConfigurationData.bytecode, _owner)
  const partnerConfigurationContract = await partnerConfigurationFactory.deploy(
    accessControlContract.address,
    DEFAULT_MIN_LENGTH,
    DEFAULT_MAX_LENGTH,
    DEFAULT_MIN_DURATION,
    DEFAULT_MAX_DURATION,
    DEFAULT_FEE_PERCENTAGE,
    DEFAULT_DISCOUNT,
    defaultMinCommitmentAge
  )
  await partnerConfigurationContract.deployTransaction.wait()

  return {
    provider,
    owner: _owner,
    partnerConfigurationFactory,
    partnerConfigurationContract,
    accessControlContract
  }
}
export const deployPartnerRegistrar = async (
  {
    defaultMinCommitmentAge = DEFAULT_MIN_COMMITMENT_AGE
  }: {
    defaultMinCommitmentAge?: number
  } = {}
): Promise<{
  provider: providers.JsonRpcProvider,
  partnerAccount: providers.JsonRpcSigner,
  rnsRegistryContract: Contract,
  rifTokenContract: Contract,
  addrResolverContract: Contract,
  partnerRegistrarContract: Contract,
  partnerRenewerContract: Contract,
  partnerManagerContract: Contract,
  rskOwnerContract: Contract,
  feeManagerContract: Contract,
  partnerConfigurationContract: Contract,
  partnerAccountAddress: string,
  rnsOwnerAddress: string,
  rnsOwner: providers.JsonRpcSigner,
}> => {
  const {
    provider,
    rnsOwner,
    rnsOwnerAddress,
    rnsRegistryContract,
    addrResolverContract
  } = await deployRNSRegistryAndResolver()

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

  const bytesUtilsFactory = new ContractFactory(BytesUtilsData.abi, BytesUtilsData.bytecode, rnsOwner)
  const bytesUtilsContract = await bytesUtilsFactory.deploy()
  await bytesUtilsContract.deployTransaction.wait()

  const stringUtilsFactory = new ContractFactory(StringUtilsData.abi, StringUtilsData.bytecode, rnsOwner)
  const stringUtilsContract = await stringUtilsFactory.deploy()
  await stringUtilsContract.deployTransaction.wait()

  const accessControlContract = await deployAccessControl(rnsOwner)

  const partnerManagerFactory = new ContractFactory(PartnerManagerData.abi, PartnerManagerData.bytecode, rnsOwner)
  const partnerManagerContract = await partnerManagerFactory.deploy(
    accessControlContract.address
  )
  await partnerManagerContract.deployTransaction.wait()

  const partnerRegistrarFactory = new ContractFactory(PartnerRegistrarData.abi,
    PartnerRegistrarData
      .bytecode
      .replace(/__BytesUtils____________________________/g, bytesUtilsContract.address.slice(2).toLowerCase()) // linking
      .replace(/__StringUtils____________________________/g, stringUtilsContract.address.slice(2).toLowerCase()), // linking
    rnsOwner)

  const partnerRenewerFactory = new ContractFactory(PartnerRenewerData.abi,
    PartnerRenewerData
      .bytecode
      .replace(/__BytesUtils____________________________/g, bytesUtilsContract.address.slice(2).toLowerCase()), // linking
    rnsOwner)

  const partnerRegistrarContract = await partnerRegistrarFactory.deploy(
    accessControlContract.address,
    rskOwnerContract.address,
    rifTokenContract.address,
    partnerManagerContract.address,
    rnsRegistryContract.address,
    hashDomain(rskLabel))
  await partnerRegistrarContract.deployTransaction.wait()

  const partnerRenewerContract = await partnerRenewerFactory.deploy(
    accessControlContract.address,
    rskOwnerContract.address,
    rifTokenContract.address,
    partnerManagerContract.address)
  await partnerRenewerContract.deployTransaction.wait()

  const feeManagerFactory = new ContractFactory(FeeManagerData.abi, FeeManagerData.bytecode, rnsOwner)
  const feeManagerContract = await feeManagerFactory.deploy(
    rifTokenContract.address,
    partnerRegistrarContract.address,
    partnerRenewerContract.address,
    partnerManagerContract.address,
    rnsOwnerAddress
  )
  await feeManagerContract.deployTransaction.wait()

  const { partnerConfigurationContract } = await deployPartnerConfiguration({
    defaultMinCommitmentAge,
    accessControlContract,
    owner: rnsOwner
  })

  const partnerAccount = provider.getSigner(3)
  const partnerAccountAddress = await partnerAccount.getAddress()

  await sendAndWait(partnerRegistrarContract.setFeeManager(feeManagerContract.address))
  await sendAndWait(partnerRenewerContract.setFeeManager(feeManagerContract.address))
  await sendAndWait(partnerManagerContract.addPartner(partnerAccountAddress, partnerConfigurationContract.address))
  await sendAndWait(rifTokenContract.transfer(rnsOwnerAddress, toWei('10')))
  await sendAndWait(rskOwnerContract.addRegistrar(partnerRegistrarContract.address))
  await sendAndWait(rskOwnerContract.addRenewer(partnerRenewerContract.address))
  await sendAndWait(rnsRegistryContract.setSubnodeOwner(constants.HashZero, hashLabel(rskLabel), rskOwnerContract.address))

  return {
    provider,
    rnsRegistryContract,
    addrResolverContract,
    rskOwnerContract,
    rifTokenContract,
    partnerRegistrarContract,
    partnerRenewerContract,
    partnerManagerContract,
    partnerAccount,
    partnerAccountAddress,
    feeManagerContract,
    rnsOwner,
    rnsOwnerAddress,
    partnerConfigurationContract
  }
}

const send = (provider: providers.JsonRpcProvider, method: string, params: number[] = []) =>
  provider.send(method, params)
export const timeTravel = async (provider: providers.JsonRpcProvider, seconds: number): Promise<void> => {
  await send(provider, 'evm_increaseTime', [seconds])
  await send(provider, 'evm_mine')
}
