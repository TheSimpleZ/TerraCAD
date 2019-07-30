<template lang="pug">
  v-card.card(
    v-if="propsString"
    max-width="344"
    class="mx-auto"
    elevation=20
    )
    v-card-title.title
      | {{selectedNode.data.name}}
    v-card-text.body-1(
      v-bar
    )
      div
        pre(
          v-highlightjs="propsString"
        )
          code.JSON
  
</template>


<script lang="ts">
import { Component, Prop, Vue, Watch, Ref } from 'vue-property-decorator'

import { vxm } from '../../store'
// import '../../../node_modules/highlight.js/styles/an-old-hope.css'

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
.card {
  position: absolute !important;
}

.body-1 {
  overflow-x: auto;
}

.vb > .vb-dragger {
  z-index: 5;
  width: 12px;
  right: 0;
}

.vb > .vb-dragger > .vb-dragger-styler {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-transform: rotate3d(0, 0, 0, 0);
  transform: rotate3d(0, 0, 0, 0);
  -webkit-transition: background-color 100ms ease-out, margin 100ms ease-out, height 100ms ease-out;
  transition: background-color 100ms ease-out, margin 100ms ease-out, height 100ms ease-out;
  background-color: rgba(48, 121, 244, 0.1);
  margin: 5px 5px 5px 0;
  border-radius: 20px;
  height: calc(100% - 10px);
  display: block;
}

.vb.vb-scrolling-phantom > .vb-dragger > .vb-dragger-styler {
  background-color: rgba(48, 121, 244, 0.3);
}

.vb > .vb-dragger:hover > .vb-dragger-styler {
  background-color: rgba(48, 121, 244, 0.5);
  margin: 0px;
  height: 100%;
}

.vb.vb-dragging > .vb-dragger > .vb-dragger-styler {
  background-color: rgba(48, 121, 244, 0.5);
  margin: 0px;
  height: 100%;
}

.vb.vb-dragging-phantom > .vb-dragger > .vb-dragger-styler {
  background-color: rgba(48, 121, 244, 0.5);
}
</style>
