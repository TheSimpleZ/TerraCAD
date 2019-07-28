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
        v-graph
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VGraph from './components/VGraph.vue'
import PropCard from './components/PropCard.vue'
import { vxm } from './store'

@Component({
  components: {
    VGraph,
    PropCard,
  },
})
export default class App extends Vue {
  drawer = false

  async mounted() {
    await vxm.graph.importTerraformFolder('~/Documents/TerraCAD/infra')
  }
}
</script>

<style>
html {
  overflow-y: auto;
}
</style>

