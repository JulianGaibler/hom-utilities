<template>
  <header>
    <router-link to="/"><HomLogoGlyph /></router-link>
  </header>
</template>

<script>
import HomLogoGlyph from '@/assets/hom-logo-glyph.svg?inline'

export default {
  name: 'HelloWorld',
  components: {
    HomLogoGlyph,
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="stylus" scoped>
@import "~@/assets/styles/palette.styl"

header
  display flex
  padding .5rem
</style>
