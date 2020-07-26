<template>
  <div id="app">
    <Header/>
    <keep-alive include="Overview">
      <router-view class="main-view"/>
    </keep-alive>
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

<style lang="stylus" scoped>

.main-view
  position relative
  padding-top .1rem
  &:before
    display block
    content ''
    position absolute
    left 0
    right 0
    top 0
    height 40rem
    background linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, #FFFFFF 100%), linear-gradient(90deg, #C8C8C8 0.0%, #DDDDDD 100%)
    z-index -1

</style>
