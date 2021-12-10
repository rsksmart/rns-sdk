import { deployRskRegistrar } from "./util"

describe('rsk registrar', () => {
  test('dummy', async () => {
    const res = await deployRskRegistrar()
    console.log(Object.keys(res))
  })
})
