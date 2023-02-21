<p align="middle">
  <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>@rsksmart/rns-sdk</code></h3>
<p align="middle">
  RNS SDK
</p>
<p align="middle">
  <a href="https://github.com/rsksmart/rns-sdk/actions/workflows/ci.yml" alt="ci">
    <img src="https://github.com/rsksmart/rns-sdk/actions/workflows/ci.yml/badge.svg" alt="ci" />
  </a>
  <a href="https://github.com/rsksmart/rns-sdk/actions/workflows/publish.yml" alt="ci">
    <img src="https://github.com/rsksmart/rns-sdk/actions/workflows/publish.yml/badge.svg" alt="ci" />
  </a>
  <br />
  <a href="https://lgtm.com/projects/g/rsksmart/rns-sdk/context:javascript">
    <img src="https://img.shields.io/lgtm/grade/javascript/github/rsksmart/rns-sdk" />
  </a>
  <a href='https://coveralls.io/github/rsksmart/rns-sdk'>
    <img src='https://coveralls.io/repos/github/rsksmart/rns-sdk/badge.svg' alt='Coverage Status' />
  </a>
  <a href="https://badge.fury.io/js/%40rsksmart%2Frns-sdk">
    <img src="https://badge.fury.io/js/%40rsksmart%2Frns-sdk.svg" alt="npm" />
  </a>
</p>

## Features

- .rsk domains:
  - availability and prices
  - registrations

- Manage domains:
  - Set subdomain owner
  - Get/set domain owner
  - Get/set domain resolver

- Manage resolution:
  - Get/set `addr` resolution

## Usage

The library supports the following modules:
- .rsk domains registrations using `RSKRegistrar`
- .rsk domain registrations using the new partner registrar contracts `PartnerRegistrar`
- RNS domains admin using `RNS`
- Domain address resolution using `AddrResolver`
- Information on a partner configuration using `PartnerConfiguration`

You will need to use this addresses to initialize the library:

| Contract name | RSK Mainnet | RSK Testnet |
| - | - | - |
| RNS Registry (`rsnRegistryAddress`) | [`0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5`](https://explorer.rsk.co/address/0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5) | [`0x7d284aaac6e925aad802a53c0c69efe3764597b8`](https://explorer.testnet.rsk.co/address/0x7d284aaac6e925aad802a53c0c69efe3764597b8) |
| RIF Token ERC-677 ERC-20 (`rifTokenAddress`) | [`0x2acc95758f8b5f583470ba265eb685a8f45fc9d5`](https://explorer.rsk.co/address/0x2acc95758f8b5f583470ba265eb685a8f45fc9d5) | [`0x19f64674d8a5b4e652319f5e239efd3bc969a1fe`](https://explorer.testnet.rsk.co/address/0x19f64674d8a5b4e652319f5e239efd3bc969a1fe) |
| ERC-721 .rsk domains token (`rskOwnerAddress`) | [`0x45d3e4fb311982a06ba52359d44cb4f5980e0ef1`](https://explorer.rsk.co/address/0x45d3e4fb311982a06ba52359d44cb4f5980e0ef1) | [`0xca0a477e19bac7e0e172ccfd2e3c28a7200bdb71`](https://explorer.testnet.rsk.co/address/0xca0a477e19bac7e0e172ccfd2e3c28a7200bdb71) |
| .rsk domains registrar (`fifsAddrRegistrarAddress`) | [`0xd9c79ced86ecf49f5e4a973594634c83197c35ab`](https://explorer.rsk.co/address/0xd9c79ced86ecf49f5e4a973594634c83197c35ab) | [`0x90734bd6bf96250a7b262e2bc34284b0d47c1e8d`](https://explorer.testnet.rsk.co/address/0x90734bd6bf96250a7b262e2bc34284b0d47c1e8d) |
| .rsk domains partner registrar (`partnerRegistrarContractAddress`) | - | [`0x8104d97f6d82a7d3afbf45f72118fad51f190c42`](https://explorer.testnet.rsk.co/address/0x8104d97f6d82a7d3afbf45f72118fad51f190c42) |
| .rsk domains partner registrar (`partnerRegistrarContractAddress`) | - | [`0x8104d97f6d82a7d3afbf45f72118fad51f190c42`](https://explorer.testnet.rsk.co/address/0x8104d97f6d82a7d3afbf45f72118fad51f190c42) |

> See also RNS Resolver library [`@rsksmart/rns-resolver.js`](https://github.com/rsksmart/rns-resolver.js) to resolve domains following the standard protocol

### .rsk domain registrations

RNS validates and normalizes names in the following way:

1. **Validation:** RNS validates that a name is a valid domain name by checking that it conforms to the following rules:

  - The name contains only letters (a-z), digits (0-9), and hyphens (-).
  - The name starts and ends with a letter or digit.

2. **Normalization:** RNS normalizes a name by converting it to its canonical form, which includes:

  - Converting all letters to lowercase.
  - Expanding Punycode-encoded internationalized domain names (IDNs) to their Unicode representation.

#### 1. Using the RSKRegistrar
You can register .rsk domains paying with RIF Tokens. First, create the instance of `RSKRegistrar`

```typescript
import { Signer } from 'ethers'
import { RSKRegistrar } from '@rsksmart/rns-sdk'

let signer: Signer
const rskRegistrar = new RSKRegistrar(rskOwnerAddress, fifsAddrRegistrarAddress, rifTokenAddress, signer)
```

Query price and availability

```typescript
const label = 'taringa'

const available = await rskRegistrar.available(label)

const duration = BigNumber.from('1')

const price = await rskRegistrar.price(label, duration)
```

Register the domain

```typescript
const { makeCommitmentTransaction, secret, canReveal } = await rskRegistrar.commitToRegister(label, testAccountAddress)

await makeCommitmentTransaction.wait()

// you need to wait at least for one minute, you can build
// your own polling strategy checking canReveal to ensure
// it is the correct time to submit the register tx
const commitmentReady = await canReveal()

if (!commitmentReady) throw

const registerTx = await rskRegistrar.register(
  label,
  testAccountAddress,
  secret,
  duration,
  price
)

await registerTx.wait()
```

#### 2. Using the PartnerRegistrar

You can use the PartnerRegistrar to register domains using the partner registrar contracts. First, create the instance of `PartnerRegistrar`.
> The PartnerRegistrar supports one click register even where commitment is required.

```typescript
import { Signer } from 'ethers'
import { PartnerRegistrar } from '@rsksmart/rns-sdk'

let signer: Signer
const partnerRegistrar = new PartnerRegistrar(partnerAccountAddress, partnerRegistrarContractAddress, partnerRenewerContractAddress, rskOwnerContractAddress, rifTokenContractAddress, signer);
```

- Query price and availability

```typescript
const label = 'taringa'

const available = await partnerRegistrar.available(label)

const duration = BigNumber.from('1')

const price = await partnerRegistrar.price(label, duration)
```

- Register the domain

```typescript
const label = 'taringa'
const duration = BigNumber.from('1')
const ownerAddress = '0x...' //address of the owner of the domain

const price = await partnerRegistrar.price(label, duration)

await partnerRegistrar.commitAndRegister(label, ownerAddress, duration, price)
```


- Transfer the domain

```typescript
const label = 'taringa'
const toAddress = '0x...' //address to transfer the domain ownership to

await partnerRegistrar.transfer(label, toAddress)
```

- Renew the domain

```typescript
const label = 'taringa'
const duration = BigNumber.from('1')

const price = await partnerRegistrar.price(label, duration)

await partnerRegistrar.renew(label, duration, price)
```

### Domain management

Create `RNS` instance

```typescript
import { Signer } from 'ethers'
import { RNS } from '@rsksmart/rns-sdk'

let signer: Signer
const rns = new RNS(registryAddress, signer)
```

#### Owner

Get and set the controller of a domain you own

```typescript
const domain = 'user1.taringa.rsk'
const newController = '0xb774...d771'

const tx = await rns.setOwner(domain, newController)
await tx.wait()

const controller = await rns.owner(domain)
```

#### Resolver

Get and set the resolver of a domain you own

```typescript
const domain = 'user1.taringa.rsk'
const resolverAddr = '0xb774...d771'

const tx = await rns.setResolver(domain, resolverAddr)
await tx.wait()

const controller = await rns.resolver(domain)
```

#### Subdomains

Set the owner of a subdomain of a domain you own

```typescript
const domain = 'taringa.rsk'
const subdomainLabel = 'user1'
const ownerAddress = '0x8c0f...1264'

const tx = await rns.setSubdmoainOwner(domain, subdomainLabel, ownerAddress)
await tx.wait()
```

### Address resolution

Create `AddrResolver` instance

```typescript
import { Signer } from 'ethers'
import { AddrResolver } from '@rsksmart/rns-sdk'

let signer: Signer
const addrResolver = new AddrResolver(registryAddress, signer)
```

Get and set the address of a domain or subdomain you own

```typescript
const domain = 'user1.taringa.rsk'
const addr = '0xb774...d771'

const tx = await addrResolver.setAddr(domain, ownerAddress)
await tx.wait()

const addr = await addrResolver.addr(domain)
```
## Troubleshooting
1. Browser
> The library uses a dependency that requires Buffer to be available globally. If you are using in a browser environment, you need to the following:

- Install the dependency:
`npm install -D buffer`

- Add the following to your webpack config:
```javascript
const webpackConfig = {
    resolve: {
        fallback: {
            buffer: require.resolve('buffer/'),
        },
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
};
```

OR

```javascript
window.Buffer = window.Buffer || require('buffer/').Buffer;
```

2. React Native
> You can use the `rn-nodeify` package

```
rn-nodeify --install buffer -hack --yarn && patch-package
```

### Partner Configuration
We have also provided a class for interacting with the partner configuration contract
    
```typescript
import { Signer } from 'ethers'
import { PartnerConfiguration } from '@rsksmart/rns-sdk'
  
let signer: Signer
const partnerConfigurationAddress = '0x...' //address of the partner configuration contract

const partnerConfiguration = new PartnerConfiguration(partnerConfigurationAddress, signer)
```

Available operations:
- getMinLength
```typescript
    const minLength = await partnerConfiguration.getMinLength()
```
- getMaxLength
```typescript
    const maxLength = await partnerConfiguration.getMaxLength()
```
- getMinDuration
```typescript
    const minDuration = await partnerConfiguration.getMinDuration()
```
- getMaxDuration
```typescript
    const maxDuration = await partnerConfiguration.getMaxDuration()
```
- getMinCommitmentAge
> This is the minimum time that needs to pass before a commitment can be revealed
```typescript
    const minCommitmentAge = await partnerConfiguration.getMinCommitmentAge()
```
- getFeePercentage
> This is the percentage of the domain price that will be charged as a fee
```typescript
    const feePercentage = await partnerConfiguration.getFeePercentage()
```
- getDiscount
> This is the percentage of the domain price that will be discounted for the partner
```typescript
    const discount = await partnerConfiguration.getDiscount()
```
- getPrice
```typescript
    const price = await partnerConfiguration.getPrice(label, duration)
```
- validateName
> This function will resolve if the name is valid
```typescript
    const valid = await partnerConfiguration.validateName(label, duration)
```

### List of Partners and addresses
Coming soon

## Run for development

Install dependencies:

```
npm i
```

### Run unit tests

```
npm test
```

Coverage report with:

```
npm run test:coverage
```

### Run linter

```
npm run lint
```

Auto-fix:

```
npm run lint:fix
```

### Build for production

```
npm run build
```

### Branching model

- `main` has latest release. Merge into `main` will deploy to npm. Do merge commits.
- `develop` has latest approved PR. PRs need to pass `ci` and `scan`. Do squash & merge.
- Use branches pointing to `develop` to add new PRs.
- Do external PRs against latest commit in `develop`.
