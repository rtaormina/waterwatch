<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, defineProps } from "vue";
import { ArrowDownTrayIcon } from "@heroicons/vue/24/solid";
import { exportData, format } from "@/composables/MeasurementExportLogic";
import Modal from "./Modal.vue";
import { permissionsLogic } from "@/composables/PermissionsLogic";
import { all } from "axios";

const canDownload = ref(false);
const perms = ref<string[]>([]);

const {
  fetchPermissions,
  hasPermission,
  inGroup,
  loaded,
  allPermissions,
} = permissionsLogic();

const props = defineProps({ results: Object });
const wrapperRef = ref<HTMLElement | null>(null);
const totalWidth = ref(0);

const showModal = ref(false);

const getData = async () => {
  const exportSuccessful = await exportData();
  showModal.value = !exportSuccessful;
  console.log(showModal.value);
};

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
  await fetchPermissions();
  canDownload.value = hasPermission("measurement_export.can_export");
  perms.value = allPermissions();
  console.log("canDownload", canDownload.value);
  console.log("permissions", perms.value);
});
</script>

<template>
  <div class="flex flex-col flex-grow min-h-0">
    <div class="md:overflow-y-auto space-y-4 px-4 md:pt-6 md:mt-[54px]">
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
    <div class="md:overflow-y-auto flex flex-col items-center mb-4 md:mb-8">
      <ArrowDownTrayIcon
        :class="[
          'md:min-h-12 md:min-w-12 max-h-25 max-w-25 stroke-current stroke-[1.25] mb-4 transition-colors duration-200',
          canDownload
            ? 'cursor-pointer text-gray-800 hover:text-gray-600'
            : 'cursor-not-allowed text-gray-400',
        ]"
        @click="canDownload ? getData() : null"
      />
      <div class="w-11/12 md:w-9/12 flex items-center justify-between space-x-2 mb-4">
        <label for="format" class="font-semibold">Download as</label>
        <select
          id="format"
          v-model="format"
          class="flex-1 border rounded bg-white px-3 py-2"
        >
          <option value="csv">CSV File</option>
          <option value="xml">XML</option>
          <option value="json">JSON</option>
          <option value="geojson">GeoJSON</option>
        </select>
      </div>
      <button
        @click="getData"
        :disabled="!canDownload"
        class="w-11/12 md:w-9/12 py-3 text-white rounded-2xl font-semibold text-lg"
        :class="canDownload ? 'bg-main cursor-pointer' : 'bg-gray-300 cursor-not-allowed'"
      >
        Download
      </button>
      <Modal :visible="showModal" @close="showModal = false">
        <h2 class="text-lg font-semibold mb-4">Export Failed</h2>
        <div class="flex items-center mt-4 gap-2">
          <button
            @click="showModal = false"
            class="flex-1 bg-main text-white mr-2 px-4 py-2 rounded hover:cursor-pointer hover:bg-primary-light"
          >
            Okay
          </button>
        </div>
      </Modal>
    </div>
  </div>
</template>
