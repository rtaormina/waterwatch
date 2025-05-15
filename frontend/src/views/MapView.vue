<template>
  <div>
    <h1 class="text-center">Map View</h1>
    <div class="mx-auto my-6 w-2/3 h-[600px]">
      <LocationFallback v-model:location="location" :auto-locate="false" />
    </div>
    <div class="flex align-center justify-center">
      <div>({{ location.lat }}, {{ location.lng }})</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LocationFallback from "@/components/LocationFallback.vue";
import { ref } from "vue";
import L from "leaflet";

const location = ref<L.LatLng>(L.latLng(52.3824, 4.8995)); // Default to Amsterdam
</script>
