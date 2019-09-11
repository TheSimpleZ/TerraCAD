import Vuex from 'vuex'
// @ts-ignore
import syncMutations from './syncMutations'
import persistState from './persistState'
import { TerraGraphStore } from './graph'

export const store = new Vuex.Store({
  state: {},
  plugins: [syncMutations],
  strict: process.env.NODE_ENV !== 'production',
})

export const vxm = {
  graph: new TerraGraphStore({}, { store, name: 'graph' }),
}

persistState(store)
