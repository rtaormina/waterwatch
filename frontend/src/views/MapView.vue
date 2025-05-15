<template>
  <div class="w-full h-screen">
    <LocationFallback v-model:location="location" :auto-locate="false" />
    <div class="fixed bottom-5 z-[1000] flex align-center justify-center gap-4">
      <button
        class="bg-main rounded-md p-2 text-white"
        @click="router.push({ name: 'Measurement' })"
      >
        Add measurement
      </button>
      <div>({{ location.lat }}, {{ location.lng }})</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LocationFallback from "@/components/LocationFallback.vue";
import { ref } from "vue";
import L from "leaflet";
import { useRouter } from "vue-router";

const router = useRouter();

const location = ref<L.LatLng>(L.latLng(52.3824, 4.8995)); // Default to Amsterdam
</script>
