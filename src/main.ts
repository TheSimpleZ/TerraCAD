/* This is the main entrypoint for the renderer process. Do not change the filename */

import Vue from 'vue'
import './plugins/vuetify'
import './plugins/vuex'
import 'reflect-metadata'
// @ts-ignore
import VueHighlightJS from 'vue-highlightjs'
import App from './renderer/App.vue'

Vue.config.productionTip = false
Vue.config.devtools = process.env.NODE_ENV === 'development'

Vue.use(VueHighlightJS)

new Vue({
  render: h => h(App),
}).$mount('#app')
