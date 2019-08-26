<template lang="pug">
  v-dialog(
    v-model="dialog"
    width="50vh"
  )
    v-card
      v-card-title.title Welcome to TerraCAD
      v-card-text This software can be used to visualize the structure of a terraform project. 
        | To open a new project, press File -> Open folder and choose your terraform project
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          color="primary"
          text
          @click="dialog = false"
        ) Ok

</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class WelcomeDialog extends Vue {
  dialog = true
}
</script>
