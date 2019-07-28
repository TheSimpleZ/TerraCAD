/* This is the main entrypoint for the renderer process. Do not change the filename */

import Vue from 'vue'
import './plugins/vuetify'
import './plugins/vuex'
import './plugins/highlighterjs'
import 'reflect-metadata'
import App from './renderer/App.vue'

Vue.config.productionTip = false
Vue.config.devtools = process.env.NODE_ENV === 'development'

new Vue({
  render: h => h(App),
}).$mount('#app')
