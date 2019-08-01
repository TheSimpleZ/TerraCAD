<template lang="pug">
  v-app(
    dark
  )
    v-content
      v-container(
        fill-height
        fluid
      )
        prop-card
        terra-graph(
          :input-nodes="stateTree"
        )
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TerraGraph from './components/TerraGraph.vue'
import PropCard from './components/PropCard.vue'
import { vxm } from '../store'
import { remote } from 'electron'
import ScrollBar from 'vue-class-directives'
import Scrollbar from 'vue-class-directives'

@Component({
  components: {
    TerraGraph,
    PropCard,
  },
})
export default class App extends Vue {
  drawer = false

  get stateTree() {
    return vxm.graph.tree
  }

  async mounted() {
    console.log(Scrollbar.name)
    await vxm.graph.importTerraformFolder(
      remote.app.getPath('home') + '/Documents/TerraCAD/infra',
    )
  }
}
</script>

<style>
html {
  overflow-y: auto;
}
</style>

