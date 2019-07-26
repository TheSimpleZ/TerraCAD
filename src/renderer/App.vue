<template lang="pug">
  v-app(
    dark
  )
    v-navigation-drawer(
      clipped
      fixed
      app
    )
      node-props

    v-content
      v-container(
        fill-height
        fluid
      )
        v-graph
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VGraph from './components/VGraph.vue'
import NodeProps from './components/NodeProps.vue'
import { vxm } from './store'

@Component({
  components: {
    VGraph,
    NodeProps,
  },
})
export default class App extends Vue {
  drawer = false

  async mounted() {
    await vxm.graph.importTerraformFolder(
      '/home/zrean/Documents/TerraCAD/infra',
    )
  }
}
</script>

<style>
html {
  overflow-y: auto;
}
</style>

