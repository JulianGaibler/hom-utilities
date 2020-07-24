<template>
  <div class="control">
    <button
      @click="updateInput(option.value)"
      v-for="option in options"
      :key="option.value"
      :class="{ selected: option.value === value }">{{option.label}}</button>
  </div>
</template>

<script>

export default {
  name: 'SegmentedControl',
  props: {
    options: Array,
    value: String,
  },
  methods: {
    updateInput: function(value) {
      this.$emit('input', value)
    },
  },
}
</script>

<style lang="stylus" scoped>
@import "~@/assets/styles/palette.styl"
.control
  display inline-block
  padding .2rem
  background #F0F0F0
  border-radius .6rem
  button
    font-size .9rem
    font-weight 500
    border none
    padding .3rem .4rem
    border-radius .5rem
    &:not(:first-child):not(:last-child)
      margin 0 .5rem
    &.selected
      background white
      box-shadow 0px 0px .3rem rgba(0, 0, 0, 0.2)
</style>
