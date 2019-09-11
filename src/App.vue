<template lang="pug">
  v-app(
    dark
  )
    v-content
      v-container(
        fill-height
        fluid
      )
        welcome-dialog
        terra-graph(
          :input-nodes="stateTree"
        )
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TerraGraph from './components/TerraGraph.vue'
import WelcomeDialog from './components/WelcomDialog.vue'
import { vxm } from './store'
import { remote } from 'electron'

@Component({
  components: {
    TerraGraph,
    WelcomeDialog,
  },
})
export default class App extends Vue {
  get stateTree() {
    return vxm.graph.getTree
  }

  // async mounted() {
  //   await vxm.graph.importTerraformFolder(
  //     remote.app.getPath('home') + '/Documents/TerraCAD/infra',
  //   )
  // }
}
</script>

<style lang="stylus">
html {
  overflow-y: auto;
  height: 100vh;
}

::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}

::-webkit-scrollbar-corner {
  opacity: 0;
}

::-webkit-scrollbar-track {
  border-radius: 10px;

  &:hover {
    background-color: #06060660;
  }
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background-color: #060606;
}
</style>

