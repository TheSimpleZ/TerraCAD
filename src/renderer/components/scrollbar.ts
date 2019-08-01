import Vue, { DirectiveOptions } from 'vue'
import { DirectiveBinding } from 'vue/types/options'

class Scrollbar implements DirectiveOptions {
  bind(el: HTMLElement, binding: DirectiveBinding) {
    console.log(binding.value)
  }
}

Vue.directive('scrollbar', new Scrollbar())
