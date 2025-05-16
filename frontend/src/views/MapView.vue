<template>
  <div class="w-full h-screen">
    <NavBar />
    <LocationFallback v-model:location="location" :auto-locate="false" />
    <div class="fixed left-4 bottom-5 flex align-center justify-center gap-4">
      <button
        class="bg-main rounded-md p-1 text-white"
        @click="router.push({ name: 'Measurement' })"
      >
        <PlusCircleIcon class="w-10 h-10" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusCircleIcon } from "@heroicons/vue/24/outline";
import LocationFallback from "@/components/LocationFallback.vue";
import NavBar from "@/components/NavBar.vue";
import { ref } from "vue";
import L from "leaflet";
import { useRouter } from "vue-router";

const router = useRouter();

const location = ref<L.LatLng>(L.latLng(52.3824, 4.8995)); // Default to Amsterdam
</script>
