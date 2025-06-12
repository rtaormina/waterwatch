<script setup lang="ts">
import { ref, watch } from "vue";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import type { Time } from "@/composables/MeasurementCollectionLogic";

const dateTime = ref<Date | null>(null);
const maxDate = ref(new Date());
const modelValue = defineModel<Time>({
    required: true,
});

watch(
    dateTime,
    (dt) => {
        if (!dt) return;

        const iso = dt.toISOString();
        const newDate = iso.slice(0, 10);
        const newTime = iso.slice(11, 19);

        modelValue.value = {
            localDate: newDate,
            localTime: newTime,
        };
    },
    { immediate: false },
);
</script>

<template>
    <Block title="Date and Time" :optional="true">
        <VueDatePicker
            data-testid="date-time-picker"
            v-model="dateTime"
            :enable-time-picker="true"
            time-picker-inline
            :max-date="maxDate"
            placeholder="Select date and time"
        />
    </Block>
</template>
