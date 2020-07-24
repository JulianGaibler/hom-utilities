<template>
  <div class="home">
    <section class="overview-boxes">

      <div class="stats">
        <div class="stat" v-for="data in indexData.stats" :key="data.name">
          <h2>{{data.value}}</h2>
          <h3>{{data.name}}</h3>
          <p>{{data.description}}</p>
        </div>
      </div>
    </section>
    <section>
      <table>
        <tr>
          <th>Website URL</th>
          <th>HOM Disabled</th>
          <th>HOM Enabled</th>
          <th>Visual Diff.</th>
          <th>Request Diff.</th>
        </tr>
        <tr v-for="result in indexData.results" :key="result.id">
          <td><router-link :to="{ name: 'Site', params: { id: result.id }}">{{result.websiteUrl}}</router-link></td>
          <td><LoadResultChip :loadResult="result.stats.loadedDisabled"/></td>
          <td><LoadResultChip :loadResult="result.stats.loadedEnabled"/></td>
          <td class="digits">{{ formatPercentage(result.stats.visualDiff) }}</td>
          <td class="digits">{{ formatPercentage(result.stats.requestDiff) }}</td>
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
    formatPercentage(number) {
      if (isNaN(number) || number === null) {
        return '-/-'
      }
      return Number.parseFloat(number).toFixed(2).padStart(5, '0') + ' %'
    },
  },
}
</script>

<style lang="stylus" scoped>
@import "~@/assets/styles/palette.styl"

td > a
  color inherit

</style>
