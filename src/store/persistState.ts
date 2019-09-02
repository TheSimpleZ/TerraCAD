import { Store } from 'vuex'
import ElectronStore from 'electron-store'
import { stringify, parse } from 'flatted'

const STORAGE_NAME = 'vuex'
const STORAGE_KEY = 'state'
const STORAGE_TEST_KEY = 'test'

export default function persistState<T>(store: Store<T>) {
  const eStore = new ElectronStore<T>({
    name: STORAGE_NAME,
    serialize: v => stringify(v),
    deserialize: parse,
  })

  const initialState = eStore.get(STORAGE_KEY)
  if (initialState) {
    store.replaceState(initialState)
  }

  store.subscribe((m, s) => {
    eStore.set(STORAGE_KEY, s)
  })
}
