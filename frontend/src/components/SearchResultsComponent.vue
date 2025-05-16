<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, defineProps } from "vue";
import { ArrowDownTrayIcon } from "@heroicons/vue/24/solid";
import { exportData, format } from "@/composables/MeasurementExportLogic";

const props = defineProps({ results: Object });
const wrapperRef = ref<HTMLElement | null>(null);
const totalWidth = ref(0);

import { permissionsLogic } from '@/composables/PermissionsLogic.ts'
import { all } from "axios";

const canDownload = ref(false);
const perms = ref<string[]>([]);

const {
  fetchPermissions,
  hasPermission,
  inGroup,
  loaded,
  allPermissions
} = permissionsLogic()



onMounted(async () => {
  // wait for DOM
  await nextTick();
  const measure = () => {
    if (wrapperRef.value) {
      totalWidth.value = wrapperRef.value.scrollWidth + 100;
    }
  };
  measure();
  window.addEventListener("resize", measure);
  onBeforeUnmount(() => {
    window.removeEventListener("resize", measure);
  });
  await fetchPermissions()
  canDownload.value = hasPermission("measurement_export.can_export")
  perms.value = allPermissions()
  console.log("canDownload", canDownload.value)
  console.log("permissions", perms.value);
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="space-y-4 px-4 md:pt-6 md:mt-[54px]">
      <h3 class="font-bold text-lg mb-4 hidden md:block">Search Results</h3>
      <h4 class="font-semibold text-lg hidden md:block">Summary</h4>
      <div class="mt-2 space-y-1">
        <div class="flex justify-between">
          <span>Number of Results:</span><span>{{ results?.count }}</span>
        </div>
        <div class="hidden md:flex md:justify-between">
          <span>Average Temperature:</span><span>{{ results?.avgTemp }} °C</span>
        </div>
      </div>
    </div>
    <div class="flex-grow"></div>
    <div class="flex flex-col items-center mb-4 md:mb-8">
      <ArrowDownTrayIcon :class="[
        'h-25 w-25 stroke-current stroke-[1.25] mb-4 transition-colors duration-200',
        canDownload ? 'cursor-pointer text-gray-800 hover:text-gray-600' : 'cursor-not-allowed text-gray-400'
      ]" @click="canDownload ? exportData() : null" />
      <div class="w-11/12 md:w-9/12 flex items-center justify-between space-x-2 mb-4">
        <label for="format" class="font-semibold">Download as</label>
        <select id="format" v-model="format" class="flex-1 border rounded bg-white px-3 py-2">
          <option value="csv">CSV File</option>
          <option value="xml">XML</option>
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="json">JSON</option>
          <option value="geojson">GeoJSON</option>
        </select>
      </div>
      <button @click="exportData" :disabled="!canDownload"
        class=" w-11/12 md:w-9/12 py-3 text-white rounded-full font-semibold text-lg"
        :class="canDownload ? 'bg-main cursor-pointer' : 'bg-gray-300 cursor-not-allowed'">
        Download
      </button>
    </div>
  </div>
</template>
