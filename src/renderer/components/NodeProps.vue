<template lang="pug">
v-container(
        fill-height
        fluid
      )
  v-layout(
    fill-height
    column
  )
    v-flex(
      v-if="props"
    )
      template(
        v-for = "(value, key) in props"
      )
        v-text-field(
          v-if = "isPrimitive(value)"
          outlined
          :label="key"
          v-bind:key = "key"
          v-model="selectedNode.props[key]"
        )
        

</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { vxm } from '../store'
import { Node } from '../store/graph'

@Component
export default class NodeProps extends Vue {
  props?: object = {}

  get selectedNode(): Node | undefined {
    return vxm.graph.selectedNode
  }

  @Watch('selectedNode')
  getProps(newSelection: Node) {
    this.props = newSelection.props
  }

  @Watch('props')
  setProps(newProps: object) {
    if (this.selectedNode) {
      vxm.graph.updateProps(this.selectedNode, newProps)
    }
  }

  isPrimitive(test: any) {
    return test !== Object(test)
  }
}
</script>

<style>
</style>

