<template>
  <div class="site">
    <h1>{{websiteHost}}</h1>
    <h2>{{siteData.websiteUrl}}</h2>
    <div class="center">
      <SegmentedControl v-model="show" :options="options" />
    </div>
    <div class="imageCompare" v-if="siteData.images">
      <div v-if="show === 'disabled'">
        <img :src="`/compare_results/${siteData.id}/${siteData.images.screenshotDisabled}`">
      </div>
      <div v-else-if="show === 'enabled'">
        <img :src="`/compare_results/${siteData.id}/${siteData.images.screenshotEnabled}`">
      </div>
      <div v-else>
        <img :src="`/compare_results/${siteData.id}/${siteData.images.screenshotDiff}`">
      </div>
    </div>
  </div>
</template>

<script>
import { getSiteData } from '@/data'
import SegmentedControl from '@/components/segmented-control'

export default {
  name: 'Site',
  components: {
    SegmentedControl,
  },
  data() {
    return {
      siteData: {},
      show: 'difference',
      options: [
        { label: 'HOM Disabled', value: 'disabled' },
        { label: 'Difference', value: 'difference' },
        { label: 'HOM Enabled', value: 'enabled' },
      ],
    }
  },
  async mounted() {
    this.siteData = await getSiteData(this.$route.params.id)
  },
  computed: {
    websiteHost() {
      return new URL(`https://${this.siteData.websiteUrl}`).hostname
    },
  },
}
</script>

<style lang="stylus" scoped>
@import "~@/assets/styles/palette.styl"

.site
  > h1
    font-size 3rem
    font-weight 700
    text-transform lowercase
    text-align center
    margin-bottom .5rem
  > h2
    font-size 1.5rem
    font-weight 700
    text-transform lowercase
    text-align center
    margin-bottom 1rem
    color $hom-grey3

div.center
  text-align center
  margin 2rem 0 1rem 0

.imageCompare
  margin 1rem auto
  text-align center
  > div
    height 75vh
    min-height 50rem
    display inline-block
    background url('~@/assets/hom-gradient.svg') center no-repeat
    background-color $hom-grey1
    border-radius .5rem
    overflow hidden
    border $hom-green1 solid .25rem
    img
      display block
      height 100%
</style>
