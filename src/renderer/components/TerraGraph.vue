<template>
  <v-container fill-height fluid>
    <v-graph />
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
// @ts-ignore
import VGraph from './VGraph'
import { vxm } from '../store'

@Component({
  components: { VGraph },
})
export default class TerraGraph extends Vue {
  async mounted() {
    await vxm.graph.importTerraformFolder(
      '/home/zrean/Documents/TerraCAD/infra',
    )
  }
}
</script>

