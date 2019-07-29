import Vuex from 'vuex'
// @ts-ignore
import createSharedMutations from './sharedMutations.js.js'
import { TerraGraphStore } from './graph'

export const store = new Vuex.Store({
  state: {},
  plugins: [createSharedMutations()],
  strict: process.env.NODE_ENV !== 'production',
})

export const vxm = {
  graph: new TerraGraphStore({ store, name: 'terraGraph' }),
}
