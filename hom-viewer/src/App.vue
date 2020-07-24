<template>
  <div id="app">
    <Header/>
    <router-view/>
  </div>
</template>

<script>
import Header from '@/components/header'

export default {
  name: 'HelloWorld',
  components: {
    Header,
  },
}
</script>

<style>

</style>
