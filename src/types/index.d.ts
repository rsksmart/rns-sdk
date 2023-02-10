declare module '@ensdomains/eth-ens-namehash' {
  export function hash(node: string): string
  export function normalize(name: string): string
}
