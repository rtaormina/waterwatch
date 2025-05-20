import { computed, ref } from 'vue'

const presets = ref([
  { name: "Last hour", filters: { /* … */ } },
  { name: "Today",     filters: { /* … */ } },
  // …
])
const keyword = ref("")
