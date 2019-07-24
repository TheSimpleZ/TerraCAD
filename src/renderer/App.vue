<template>
  <v-app dark>
    <v-navigation-drawer clipped fixed v-model="drawer" app>
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
    <v-toolbar app fixed clipped-left>
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title>TerraCAD</v-toolbar-title>
    </v-toolbar>

    <v-content>
      <TerraGraph />
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TerraGraph from "./components/TerraGraph.vue";

@Component({
  components: {
    TerraGraph
  }
})
export default class App extends Vue {
  drawer = false;
}
</script>

<style>
html {
  overflow-y: auto;
}
</style>

