<template>
  <div class="w-full h-screen flex flex-col">
    <NavBar />
    <div class="w-full h-full flex flex-row">
      <div
        class="left-0 bottom-0 w-3/5 relative"
        v-if="addingMeasurement"
      >
      <div class="absolute top-5 right-4">
        <button
          class="bg-main rounded-md p-1 text-white"
          @click="addingMeasurement = false"
          v-if="addingMeasurement"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div class="mt-4">
        <MeasurementComponent />
      </div>
      <HexMap />
      <div class="fixed left-4 bottom-5 flex align-center justify-center gap-4">
        <button
          class="bg-main rounded-md p-1 text-white"
          @click="addingMeasurement = true"
          v-if="!addingMeasurement"
        >
          <PlusCircleIcon class="w-10 h-10" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusCircleIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import HexMap from "@/components/HexMap.vue";
import NavBar from "@/components/NavBar.vue";
import { ref } from "vue";
import MeasurementComponent from "@/components/MeasurementComponent.vue";


const addingMeasurement = ref(false);

</script>
