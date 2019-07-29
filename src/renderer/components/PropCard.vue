<template lang="pug">
  v-card.card(
    v-if="propsString"
    max-width="344"
    class="mx-auto"
    elevation=20
    )
    v-card-title.title
      | {{selectedNode.data.name}}
    v-card-text.body-1
      pre(
        v-highlightjs="propsString"
      )
        code.JSON
  
</template>


<script lang="ts">
import { Component, Prop, Vue, Watch, Ref } from 'vue-property-decorator'

import { vxm } from '../../store'

@Component({
  name: 'PropCard',
})
// @vuese
// Card that displays the properties of the currently selected node
export default class PropCard extends Vue {
  // Currently selected node
  get selectedNode() {
    return vxm.graph.selectedNode
  }

  // Pretty-print the props of the selected node
  get propsString() {
    if (this.selectedNode && this.selectedNode.data.props) {
      return JSON.stringify(this.selectedNode.data.props, undefined, 2).replace(
        /\"([^(\")"]+)\":/g,
        '$1:',
      )
    }
  }
}
</script>

<style lang="stylus" scoped>
@import url('../../../node_modules/highlight.js/styles/an-old-hope.css');

.card {
  position: absolute !important;
}

.body-1 {
  overflow-x: auto;
}
</style>
