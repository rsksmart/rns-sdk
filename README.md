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

Initialize the library

```typescript
import { Signer } from 'ethers'

let signer: Signer
const rns = new RNS(registryAddress, signer)
```

Registry address:
- Testnet: `0x7d284aaac6e925aad802a53c0c69efe3764597b8`
- Mainnet: `0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5`

### Subdomains

Set the owner of a subdomain of a domain you own

```typescript
const domain = 'taringa.rsk'
const subdomainLabel = 'user1'
const ownerAddress = '0x8c0f...1264'

const tx = await rns.setSubdmoainOwner(domain, subdomainLabel, ownerAddress)
await tx.wait()
```

### Resolver

Get and set the address of a domain or subdomain you own

```typescript
const domain = 'user1.taringa.rsk'
const addr = '0xb774...d771'

const tx = await rns.setAddr(domain, ownerAddress)
await tx.wait()

const addr = await rns.addr(domain)
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
