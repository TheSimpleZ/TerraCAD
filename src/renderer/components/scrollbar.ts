import Vue, { DirectiveOptions } from 'vue'

// Register a global custom directive called `v-focus`
Vue.directive('scrollbar', {
  // When the bound element is inserted into the DOM...
  inserted(el) {
    // Focus the element
    el.focus()
  },
})

function Module(cons: () => any): any {
  console.log(cons.name)
}

class Scrollbar implements DirectiveOptions {
  inserted() {
    return 0
  }
}
