<template>
  <v-app dark>
    <v-navigation-drawer clipped fixed app>
      <v-list dense>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>settings</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Settings</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>

    <v-content>
      <v-container fill-height fluid>
        <v-graph />
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VGraph from './components/VGraph.vue'
import { vxm } from './store'

@Component({
  components: {
    VGraph,
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

