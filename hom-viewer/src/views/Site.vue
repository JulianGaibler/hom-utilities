<template>
  <div class="site">
    <h1>{{websiteHost}}</h1>
    <h2>{{siteData.websiteUrl}}</h2>
    <section class="visualCompare">
      <div class="sideBySide" v-if="siteData.images">
        <div>
          <img v-if="siteData.images.thumbnailDisabled" :src="`/compare_results/${siteData.id}/${siteData.images.thumbnailDisabled}`">
        </div>
        <div>
          <img v-if="siteData.images.thumbnailEnabled" :src="`/compare_results/${siteData.id}/${siteData.images.thumbnailEnabled}`">
        </div>
      </div>
      <router-link :to="{ name: 'Visual', params: { id: siteData.id }}" v-if="siteData.images.thumbnailDisabled && siteData.images.thumbnailEnabled">Compare Screenshots</router-link>
    </section>

    <section>
      <div class="miniStats" v-if="siteData.stats">
        <div class="stat">
          <h2>{{siteData.netStats.overallRequests}}</h2>
          <h3>Overall Requests</h3>
        </div>
        <div class="stat">
          <h2>{{formatPercentage(siteData.stats.visualDiff)}}</h2>
          <h3>Visual Diff</h3>
        </div>
        <div class="stat">
          <h2>{{formatPercentage(siteData.stats.requestDiff)}}</h2>
          <h3>Request Diff</h3>
        </div>
      </div>

      <div class="miniStats" v-if="siteData.stats">
        <div class="stat">
          <h2>{{siteData.netStats.requestsOnlyDisabled}}</h2>
          <h3>Requested only without HOM</h3>
        </div>
        <div class="stat">
          <h2>{{siteData.netStats.requestsOnlyEnabled}}</h2>
          <h3>Requested only with HOM</h3>
        </div>
        <div class="stat">
          <h2>{{siteData.netStats.requestsBoth}}</h2>
          <h3>Requested Both</h3>
        </div>
      </div>

      <div class="miniStats" v-if="siteData.stats">
        <div class="stat">
          <h2>{{siteData.netStats.requestsIgnored}}</h2>
          <h3>Ignored Requests</h3>
        </div>
        <div class="stat">
          <h2>{{siteData.netStats.upgradedWithHom}}</h2>
          <h3>Upgraded with HOM</h3>
        </div>
        <div class="stat">
          <h2>{{siteData.netStats.upgradedWithHomAndFailed}}</h2>
          <h3>Failed with HOM</h3>
        </div>
      </div>
    </section>

    <section>
      <table>
        <tr>
          <th>URL</th>
          <th class="medium">Type</th>
          <th class="medium">HOM Disabled</th>
          <th class="medium">HOM Enabled</th>
        </tr>
        <tr v-for="event in sortedEvents" :key="event.id" :class="{ ignored: event.ignored }">
          <td><div class="ellipsis">{{event.url}}</div></td>
          <td>{{event.type}}</td>
          <td><RequestResultChip :requestResult="event.homDisabled" /></td>
          <td><RequestResultChip :requestResult="event.homEnabled" /></td>
        </tr>
      </table>
    </section>
  </div>
</template>

<script>
import { getSiteData } from '@/data'

import RequestResultChip from '@/components/request-result-chip'

export default {
  name: 'Site',
  components: {
    RequestResultChip,
  },
  data() {
    return {
      siteData: {},
    }
  },
  async mounted() {
    this.siteData = await getSiteData(this.$route.params.id)
  },
  methods: {
    formatPercentage(number) {
      if (isNaN(number) || number === null) {
        return '-/-'
      }
      return Number.parseFloat(number).toFixed(2) + ' %'
    },
  },
  computed: {
    websiteHost() {
      return new URL(`https://${this.siteData.websiteUrl}`).hostname
    },
    sortedEvents() {
      if (!this.siteData.eventResults) return []
      return this.siteData.eventResults.slice().sort((a, b) => {
        if (a.ignored && !b.ignored) return 1
        if (!a.ignored && b.ignored) return -1
        if (a.whenRequested === 'both') return -1
        if (a.whenRequested === 'homDisabled') return 1
        if (a.whenRequested === 'homEnabled' && b.whenRequested === 'homDisabled') return -1
        if (a.whenRequested === 'homEnabled' && b.whenRequested === 'both') return 1
        return 0
      })
    },
  },
}
</script>

<style lang="stylus" scoped>
@import "~@/assets/styles/palette.styl"

.site
  padding-top 3rem
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
    margin-bottom 3rem
    color $hom-grey3

.visualCompare
  text-align center
  .sideBySide
    display grid
    grid-gap 1rem
    grid-template-columns 1fr 1fr
    width 80%
    margin 0 auto
    > div
      background url('~@/assets/hom-gradient.svg') center no-repeat
      background-color $hom-grey1
      border-radius .5rem
      overflow hidden
      border $hom-green1 solid .25rem
      img
        display block
        width 100%
  > a
    display inline-block
    color white
    text-decoration none
    padding .5rem 1rem
    margin-bottom -2rem
    transform translateY(-1rem)
    font-weight 500
    background $hom-gradient1
    border-radius 5rem
    font-size 1rem
    border none

tr.ignored
  opacity .5

.ellipsis
  display inline-block
  text-overflow ellipsis
  white-space nowrap
  overflow hidden
  max-width 100%
</style>
