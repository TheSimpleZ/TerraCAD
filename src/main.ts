/* This is the main entry point for the renderer process. Do not change the filename */

import Vue from 'vue'
import './plugins/vuetify'
import './plugins/vuex'
import './plugins/highlighterjs'
import './plugins/vuebar'
import 'reflect-metadata'
import './renderer/components/scrollbar'
import App from './renderer/App.vue'

Vue.config.productionTip = false
Vue.config.devtools = process.env.NODE_ENV === 'development'

new Vue({
  render: h => h(App),
}).$mount('#app')
