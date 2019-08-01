<template lang="pug">
  v-card.card(
    v-if="propsString"
    max-width="344"
    elevation=20
    )
    v-card-title.title
      | {{selectedNode.data.name}}
    v-card-text.body-1
      div.code-wrapper
        pre(
          v-highlightjs="propsString"
        )
          code.JSON
  
</template>


<script lang="ts">
import { Component, Prop, Vue, Watch, Ref } from 'vue-property-decorator'

import { vxm } from '../../store'
import '../../../node_modules/highlight.js/styles/an-old-hope.css'
import { HierarchyNode } from 'd3-hierarchy'
import { NodeData } from '../../store/graph'

@Component({
  name: 'PropCard',
})
// @vuese
// Card that displays the properties of the currently selected node
export default class PropCard extends Vue {
  // Currently selected node
  @Prop() selectedNode!: HierarchyNode<NodeData>

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
.card {
}

.body-1 {
}

.code-wrapper {
  max-height: 70vh;
  overflow: scroll;
}

code {
  display: inline-block;
}
</style>
