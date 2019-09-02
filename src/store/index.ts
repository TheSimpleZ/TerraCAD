import Vuex from 'vuex'
// @ts-ignore
import syncMutations from './syncMutations'
import persistState from './persistState'
import { TerraGraphStore } from './graph'

export const store = new Vuex.Store({
  state: {},
  plugins: [syncMutations, persistState],
  strict: process.env.NODE_ENV !== 'production',
})

export const vxm = {
  graph: new TerraGraphStore({}, { store, name: 'graph' }),
}
