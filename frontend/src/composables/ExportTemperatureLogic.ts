import { computed, reactive } from 'vue'

export const temp = reactive<{ from: string; to: string; unit: string }>({
  from: "",
  to: "",
  unit: "C",
});

export const tempRangeValid = computed(() => {
  const f = parseFloat(temp.from)
  const t = parseFloat(temp.to)
  return isNaN(f) || isNaN(t) || (t >= f)
})
