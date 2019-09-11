import { Store } from 'vuex'
import ElectronStore from 'electron-store'
import { stringify, parse } from 'flatted'
// @ts-ignore
import Resurrect from './resurrect.js'
import _ from 'lodash'

const STORAGE_NAME = 'vuex'
const STORAGE_KEY = 'state'
const STORAGE_TEST_KEY = 'test'

export default function persistState<T>(store: Store<T>) {
  if (process.type === 'renderer') {
    return
  }
  const necromancer = new Resurrect()

  const eStore = new ElectronStore<T>({
    name: STORAGE_NAME,
    serialize: v => necromancer.stringify(v),
    deserialize: v => necromancer.resurrect(v),
  })

  const initialState = eStore.get(STORAGE_KEY)
  if (initialState) {
    const restoreModule = {
      mutations: {
        changeState(s: T, state: any) {
          store.replaceState(_.merge(s, state))
        },
      },
    }

    // store.registerModule('restoreModule', restoreModule)
    // store.commit('changeState', initialState)
    // store.unregisterModule('restoreModule')

    store.replaceState(_.merge(store.state, initialState))
  }

  store.subscribe((m, s) => {
    eStore.set(STORAGE_KEY, _.cloneDeep(s))
  })
}
