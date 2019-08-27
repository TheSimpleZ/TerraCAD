<template lang="pug">
  v-app(
    dark
  )
    v-content
      v-container(
        fill-height
        fluid
      )
        p Hello There!!!!
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class App extends Vue {}
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

