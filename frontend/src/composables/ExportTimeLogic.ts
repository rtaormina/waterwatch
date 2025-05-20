import { computed, ref, reactive } from "vue";

export const dateRange = reactive({ from: "", to: "" });

export const dateRangeValid = computed(() => {
  if (!dateRange.from || !dateRange.to) return true;
  console.log("dateRange", dateRange);
  return new Date(dateRange.to) >= new Date(dateRange.from);
});

type TimeSlot = { from: string; to: string };
export const times = ref<TimeSlot[]>([]);

export function slotValid(slot: TimeSlot) {
  if (!slot.from || !slot.to) return true;
  return slot.to >= slot.from;
}

export const allSlotsValid = computed<boolean>(() => {
  if (times.value.length === 0) return true;
  return times.value.every((slot) => slotValid(slot));
});

export const slotsNonOverlapping = computed(() => {
  const ranges = times.value
    .map((slot) => {
      const start = slot.from || "00:00";
      const end = slot.to || "23:59";
      return [start, end] as [string, string];
    })
    .sort((a, b) => a[0].localeCompare(b[0]));
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i][0] <= ranges[i - 1][1]) {
      return false;
    }
  }
  return true;
});

export function addSlot() {
  if (times.value.length < 3) {
    times.value.push({ from: "", to: "" });
  }
}

export function removeSlot(index: number) {
  times.value.splice(index, 1);
}
