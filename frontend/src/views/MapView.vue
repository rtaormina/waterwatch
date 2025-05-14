<template>
  <div>
    <h1 class="text-center">Map View</h1>
    <div class="mx-auto my-6 w-2/3 h-[400px]">
      <LocationFallback v-model:location="location"/>
    </div>
    <div>{{ location.lat }}, {{ location.lng }}</div>
  </div>
</template>

<script setup lang="ts">
import LocationFallback from "@/components/LocationFallback.vue";
import { ref } from "vue";
import L from "leaflet";

const location = ref<L.LatLng>(L.latLng(51.999, 4.374));
</script>
