<template>
  <div class="home">
    <section class="overview-boxes">

      <div class="stats">
        <div class="stat" v-for="data in indexData.stats" :key="data.name">
          <h2>{{data.type === 'percentage' ? getPercent(data.value[0], data.value[1]) : data.value}}</h2>
          <h3>{{data.name}}</h3>
          <p v-if="data.type === 'percentage'">{{data.value[0]}} / {{data.value[1]}}</p>
          <p>{{data.description}}</p>
        </div>
      </div>
    </section>
    <section>
      <table>
        <tr>
          <th>Website URL</th>
          <th class="medium">HOM Disabled</th>
          <th class="medium">HOM Enabled</th>
          <th class="small">Upgraded subres.</th>
          <th class="small">Visual Diff.</th>
          <th class="small">Failed with HOM</th>
          <th class="small">Failed upgrades</th>
        </tr>
        <tr v-for="result in sortedEvents" :key="result.id">
          <td><router-link :to="{ name: 'Site', params: { id: result.id }}">{{result.websiteUrl}}</router-link></td>
          <td><LoadResultChip :loadResult="result.stats.loadedDisabled"/></td>
          <td><LoadResultChip :loadResult="result.stats.loadedEnabled"/></td>
          <td class="digits">{{ result.netStats.upgradedWithHom }}</td>
          <td class="digits">{{ formatPercentage(result.stats.visualDiff) }}</td>
          <td class="digits">{{ formatPercentage(result.stats.requestDiff) }}</td>
          <td class="digits">{{ formatPercentage(result.stats.upgradeDiff) }}</td>
        </tr>
      </table>
    </section>
  </div>
</template>

<script>
// @ is an alias to /src
import { getIndexData } from '@/data'

import LoadResultChip from '@/components/load-result-chip'

export default {
  name: 'Overview',
  components: {
    LoadResultChip,
  },
  data() {
    return {
      indexData: {},
    }
  },
  async mounted() {
    this.indexData = await getIndexData()
  },
  methods: {
    getPercent(a, b) {
      return this.formatPercentage(this.round((a / b) * 100))
    },
    round(num) {
      return Math.round((num + Number.EPSILON) * 100) / 100
    },
    formatPercentage(number) {
      if (isNaN(number) || number === null) {
        return '-/-'
      }
      return Number.parseFloat(number).toFixed(2).padStart(5, '0') + ' %'
    },
  },
  computed: {
    sortedEvents() {
      if (!this.indexData.results) return []
      return this.indexData.results.slice().sort((a, b) => {

        if (a.stats.loadedDisabled === 'loaded' && b.stats.loadedDisabled !== 'loaded') return -1
        if (a.stats.loadedDisabled !== 'loaded' && b.stats.loadedDisabled === 'loaded') return 1


        let aval = (a.stats.upgradeDiff || 0)
        let bval = (b.stats.upgradeDiff || 0)
        if (aval > bval) return -1
        if (aval < bval) return 1

        if (a.netStats.upgradedWithHom > b.netStats.upgradedWithHom) return -1
        if (b.netStats.upgradedWithHom > a.netStats.upgradedWithHom) return 1

        aval = a.stats.visualDiff || 0
        bval = b.stats.visualDiff || 0
        if (aval > bval) return -1
        if (aval < bval) return 1

        return 0
      })
    },
  },
}
</script>

<style lang="stylus" scoped>
@import "~@/assets/styles/palette.styl"

td > a
  color inherit

</style>
