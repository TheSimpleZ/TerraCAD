/* This is the main entry point for the renderer process. Do not change the filename */

import Vue from 'vue'
import 'reflect-metadata'

Vue.config.productionTip = false
Vue.config.devtools = process.env.NODE_ENV === 'development'

new Vue({
  render: h => h('div', 'Welcome to the second page!'),
}).$mount('#app')
