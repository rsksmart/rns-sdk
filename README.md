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
  <!--<a href="https://developers.rsk.co/rif/templates/">
    <img src="https://img.shields.io/badge/-docs-brightgreen" alt="docs" />
  </a>-->
  <a href="https://lgtm.com/projects/g/rsksmart/rns-sdk/context:javascript">
    <img src="https://img.shields.io/lgtm/grade/javascript/github/rsksmart/rns-sdk" />
  </a>
  <a href='https://coveralls.io/github/rsksmart/rns-sdk?branch=main'>
    <img src='https://coveralls.io/repos/github/rsksmart/rns-sdk/badge.svg?branch=main' alt='Coverage Status' />
  </a>
  <!--<a href="https://hits.seeyoufarm.com">
    <img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Frsksmart%2Frif-web-sdk-template&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false"/>
  </a>-->
  <a href="https://badge.fury.io/js/%40rsksmart%2Frns-sdk">
    <img src="https://badge.fury.io/js/%40rsksmart%2Frns-sdk.svg" alt="npm" />
  </a>
</p>

## Features

- Manage domains:
  - Set subdomain owner

- Manage resolver:
  - Set and get `addr`

## Usage

The library supports 2 modules:
- .rsk domains registrations
- RNS domains admin
- Domain address resolution

You will need to use this addresses to initialize the library:

| Contract name | RSK Mainnet | RSK Testnet |
| - | - | - |
| RNS Registry (`rsnRegistryAddress`) | [`0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5`](https://explorer.rsk.co/address/0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5) | [`0x7d284aaac6e925aad802a53c0c69efe3764597b8`](https://explorer.testnet.rsk.co/address/0x7d284aaac6e925aad802a53c0c69efe3764597b8) |
| RIF Token ERC-677 ERC-20 (`rifTokenAddress`) | [`0x2acc95758f8b5f583470ba265eb685a8f45fc9d5`](https://explorer.rsk.co/address/0x2acc95758f8b5f583470ba265eb685a8f45fc9d5) | [`0x19f64674d8a5b4e652319f5e239efd3bc969a1fe`](https://explorer.testnet.rsk.co/address/0x19f64674d8a5b4e652319f5e239efd3bc969a1fe) |
| ERC-721 .rsk domains token (`rskOwnerAddress`) | [`0x45d3e4fb311982a06ba52359d44cb4f5980e0ef1`](https://explorer.rsk.co/address/0x45d3e4fb311982a06ba52359d44cb4f5980e0ef1) | [`0xca0a477e19bac7e0e172ccfd2e3c28a7200bdb71`](https://explorer.testnet.rsk.co/address/0xca0a477e19bac7e0e172ccfd2e3c28a7200bdb71) |
| .rsk domains registrar (`fifsAddrRegistrarAddress`) | [`0xd9c79ced86ecf49f5e4a973594634c83197c35ab`](https://explorer.rsk.co/address/0xd9c79ced86ecf49f5e4a973594634c83197c35ab) | [`0x90734bd6bf96250a7b262e2bc34284b0d47c1e8d`](https://explorer.testnet.rsk.co/address/0x90734bd6bf96250a7b262e2bc34284b0d47c1e8d) |

> See also RNS Resolver library [`@rsksmart/rns-resolver.js`](https://github.com/rsksmart/rns-resolver.js) to resolve domains following the standard protocol

### .rsk domain registrations

You can register .rsk domains paying with RIF Tokens. First, create the instance of `RSKRegistrar`

```typescript
import { Signer } from 'ethers'
import { RSKRegistrar } from '@rsksmart/rns-sdk'

let signer: Signer
const rns = new RNS(registryAddress, signer)
const rskRegistrar = new RSKRegistrar(rskOwnerAddress, fifsAddrRegistrarAddress, rifTokenAddress, testAccount)
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
