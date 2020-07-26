<template>
  <div class="chip good" v-if="loadResult === 'loaded'">
    <GoodIcon /> Successful
  </div>
  <div class="chip bad" v-else-if="loadResult === 'failedWithHomError'">
    <BadIcon /> HOM Err Page
  </div>
  <div class="chip bad" v-else-if="loadResult === 'errorCode'">
    <BadIcon /> Err Code
  </div>
  <div class="chip bad-hom" v-else>
    <BadIcon /> Failed
  </div>
</template>

<script>
import BadIcon from '@/assets/icons/close.svg?inline'
import GoodIcon from '@/assets/icons/done.svg?inline'

export default {
  name: 'LoadResultChip',
  components: {
    GoodIcon, BadIcon,
  },
  props: {
    loadResult: String,
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="stylus" scoped>
.chip
  border-radius 4rem
  display inline-flex
  align-items center
  background rgba(0,0,0,0.05)
  padding 0.25rem 0.75rem 0.25rem 0.25rem
  text-transform uppercase
  font-size 0.8rem
  font-weight 500
  svg
    height 1.2rem
  &.good
    background-color rgba(41, 202, 164, 0.5)
  &.bad
    background-color rgba(254, 191, 90, 0.5)
  &.bad-hom
    background-color rgba(254, 90, 100, 0.5)
</style>
