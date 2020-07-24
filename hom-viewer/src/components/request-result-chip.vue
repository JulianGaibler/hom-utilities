<template>
  <div class="chip">
    <LockSecure v-if="info.icon === 0" />
    <LockSecureHom v-else-if="info.icon === 1" />
    <LockInsecure v-else-if="info.icon === 2" />
    <Failed v-else-if="info.icon === 3" />
    <Blocked v-else-if="info.icon === 4" />
    <Unknown v-else-if="info.icon === 5" />
    {{info.text}}
  </div>
</template>

<script>
import LockSecure from '@/assets/icons/lock-secure.svg?inline'
import LockSecureHom from '@/assets/icons/lock-secure-hom.svg?inline'
import LockInsecure from '@/assets/icons/lock-insecure.svg?inline'
import Failed from '@/assets/icons/failed.svg?inline'
import Blocked from '@/assets/icons/blocked.svg?inline'
import Unknown from '@/assets/icons/unknown.svg?inline'

export default {
  name: 'RequestResultChip',
  components: {
    LockSecure, LockSecureHom, LockInsecure, Failed, Blocked, Unknown,
  },
  props: {
    requestResult: Object,
  },
  computed: {
    info() {
      let icon = 0
      let text = ''
      if (this.requestResult === null) icon = 6
      else if (this.requestResult.loaded) {
        if (this.requestResult.loaded.securityState === 'secure' && this.requestResult.homUpgraded) icon = 1
        else if (this.requestResult.loaded.securityState === 'secure') icon = 0
        else if (this.requestResult.loaded.securityState === 'xhr') icon = 5
        else icon = 2
        if (this.requestResult.loaded.status) text = `${this.requestResult.loaded.status} ${this.requestResult.loaded.statusText}`
      } else {
        if (this.requestResult.failed.blocked) {
          icon = 4
          text = this.requestResult.failed.blockedReason
        }
        else icon = 3
      }
      return { icon, text }
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="stylus" scoped>

</style>
