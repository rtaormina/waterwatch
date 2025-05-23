<template>
  <div class="w-full h-screen flex flex-col">
    <NavBar />

  <CampaignBannerComponent
      v-if="campaigns.length"
    :campaigns="campaigns" class="bg-white"/>

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
      <HexMap :data="sampleData" />
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
import { ref, onMounted } from "vue";
import MeasurementComponent from "@/components/MeasurementComponent.vue";
import CampaignBannerComponent from "@/components/CampaignBannerComponent.vue";

const sampleData = [
  { point: { lat: 51.999, lng: 4.3737 }, value: 1 },
  { point: { lat: 51.998, lng: 4.3737 }, value: 2 },
  { point: { lat: 51.997, lng: 4.3737 }, value: 3 },
  { point: { lat: 51.996, lng: 4.3737 }, value: 4 },
  { point: { lat: 51.995, lng: 4.3737 }, value: 5 },
  { point: { lat: 51.994, lng: 4.3437 }, value: 6 },
  { point: { lat: 51.993, lng: 4.3437 }, value: 7 },
  { point: { lat: 51.992, lng: 4.3437 }, value: 8 },
  { point: { lat: 51.991, lng: 4.3417 }, value: 9 },
  { point: { lat: 51.990, lng: 4.3417 }, value: 10 },
  { point: { lat: 51.989, lng: 4.3717 }, value: 11 },
  { point: { lat: 51.988, lng: 4.3717 }, value: 12 },
  { point: { lat: 51.987, lng: 4.3717 }, value: 13 },
  { point: { lat: 51.986, lng: 4.3717 }, value: 14 },

];


const addingMeasurement = ref(false);
const campaigns = ref([])
type Location = {
  latitude: number
  longitude: number
}
const fetchCampaigns = async (lat: number, lng: number) => {
  const now = new Date().toISOString()

  const res = await fetch(
    `/api/campaigns/active/?datetime=${encodeURIComponent(now)}&lat=${lat}&lng=${lng}`,
    {
      method: 'GET',
      credentials: 'same-origin',
    }
  )

  if (!res.ok) throw new Error(`Status: ${res.status}`)

  const data = await res.json()
  campaigns.value = data.campaigns || []
}

const getLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, falling back to IP-based location');
      getIpLocation().then(resolve).catch(reject);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn('Geolocation failed, falling back to IP-based location', err);
        getIpLocation().then(resolve).catch(reject);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
const getIpLocation = (): Promise<Location> => {
  return fetch("https://www.geolocation-db.com/json/")
    .then((res) => res.json())
    .then((data) => {
      if (!data.latitude || !data.longitude) {
        throw new Error('Invalid IP location data')
      }
      return {
        latitude: data.latitude,
        longitude: data.longitude,
      }
    })
}

onMounted(async () => {
    getLocation().then((position) => {
        const lat = position.latitude
        const lng = position.longitude

        fetchCampaigns(lat, lng)
    }).catch((err) => {
            console.error('Error getting location or fetching campaigns:', err)
    campaigns.value = []
    })

})

</script>
