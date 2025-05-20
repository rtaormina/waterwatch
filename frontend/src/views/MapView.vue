<template>
  <div class="w-full h-screen flex flex-col">
    <NavBar />

  <CampaignBannerComponent
      v-if="campaigns.length"
    :campaigns="campaigns"/>

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
import { ref, onMounted } from "vue";
import MeasurementComponent from "@/components/MeasurementComponent.vue";
import CampaignBannerComponent from "@/components/CampaignBannerComponent.vue";

const addingMeasurement = ref(false);
const campaigns = ref([])

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

const getLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  })
}

onMounted(async () => {
    getLocation().then((position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        fetchCampaigns(lat, lng)
    }).catch((err) => {
            console.error('Error getting location or fetching campaigns:', err)
    campaigns.value = []
    })

})

</script>
