<template lang="pug">
  v-card(
    v-if="selectedNode"
    max-width="344"
    class="mx-auto"
    elevation=20
    )
    v-card-title.title
      | {{selectedNode.data.name}}
    v-card-text.body-1
      | I'm card text
  
</template>


<script lang="ts">
import { Component, Prop, Vue, Watch, Ref } from 'vue-property-decorator'

import { vxm } from '../store'

@Component
export default class PropCard extends Vue {
  get selectedNode() {
    return vxm.graph.selectedNode
  }
}
</script>

<style lang="stylus" scoped>
.v-card {
  position: absolute;
}
</style>
