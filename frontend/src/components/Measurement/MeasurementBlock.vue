<template>
    <Block title="Measurement">
        <div class="w-full h-48 mb-4">
            <LocationFallback v-model:location="location" />
        </div>
        <UFormField :error="error" label="Water Source">
            <USelect
                data-testid="select-water-source"
                v-model="waterSource"
                value-key="value"
                :items="waterSourceOptions"
                :content="{
                    align: 'center',
                    side: 'bottom',
                    sideOffset: 0,
                }"
                class="w-full"
                :ui="{
                    content: 'z-10',
                }"
            />
        </UFormField>
    </Block>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import * as L from "leaflet";
import type { WaterSource, WaterSourceOptions } from "@/composables/MeasurementCollectionLogic";

const location = defineModel<L.LatLng>("location", {
    required: true,
});
const waterSource = defineModel<WaterSource>("waterSource");

defineProps<{ waterSourceOptions: WaterSourceOptions }>();
const error = ref<string | false>(false);

/**
 * Verifies the validity of the temperature measurement fields.
 *
 * @returns {boolean} True if all fields are valid, false otherwise.
 */
function verify(): boolean {
    resetErrorAfterFirstVerify();
    return verifyWaterSource();
}

/**
 * Verifies the validity or status of a water source.
 * @returns {boolean} True if the water source is valid, otherwise false.
 */
function verifyWaterSource(): boolean {
    if (!waterSource.value) {
        error.value = "Water source is required.";
    } else {
        error.value = false;
    }
    return error.value === false;
}

const resetErrorAfterFirstVerify = (() => {
    let hasBeenCalled = false;
    return function () {
        if (!hasBeenCalled) {
            watch(waterSource, verifyWaterSource);
            hasBeenCalled = true;
        }
    };
})();

defineExpose({
    verify,
});
</script>
