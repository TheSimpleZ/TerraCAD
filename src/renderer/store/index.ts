import Vuex from 'vuex'

// @ts-ignore
import { createPersistedState, createSharedMutations } from 'vuex-electron'
import { graph, GraphStore } from './graph'

export const store = new Vuex.Store({
    state: {},
    modules: {
        graph,
    },
    plugins: [createPersistedState(), createSharedMutations()],
    strict: process.env.NODE_ENV !== 'production',
})

export const vxm = {
    graph: GraphStore.CreateProxy(store, GraphStore) as GraphStore,
}
