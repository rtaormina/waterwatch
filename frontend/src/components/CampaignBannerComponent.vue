<script setup lang="ts">
import Cookies from "universal-cookie";
import { useRouter } from "vue-router";
import {
  ref,
  computed,
  reactive,
  defineEmits,
  defineProps,
  watch,
  onMounted,
  onUnmounted,
} from "vue";

const cookies = new Cookies();
const router = useRouter();
const campaignMessage = ref("Placeholder Text");
const campaignDescription = ref("Campaign Description");
const now = new Date().toISOString();

interface Campaign {
  id: number
  name: string
  description: string
  start_time: string
  end_time: string
}

const props = defineProps<{
  campaigns: Campaign[]
}>();

const timeLeft = ref<string>('')
const hasEnded = ref<boolean>(false)
let timer: number | undefined

function updateCountdown(endTime: string) {
  const now = new Date().getTime()
  const end = new Date(endTime).getTime()
  const diffMs = now - end

  if (diffMs > 0) {
    hasEnded.value = true
    timeLeft.value = 'Campaign has ended!'
    clearInterval(timer)
    return
  }

  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.abs(Math.floor(totalSeconds / (3600 * 24)))
  const hours = Math.abs(Math.floor((totalSeconds % (3600 * 24)) / 3600))
  const minutes = Math.abs(Math.floor((totalSeconds % 3600) / 60))
  const seconds = Math.abs(totalSeconds % 60)

  timeLeft.value = `${days}d ${hours}h ${minutes}m ${seconds}s`
}

onMounted(() => {
  if (props.campaigns.length > 0) {
    updateCountdown(props.campaigns[0].end_time)
    timer = window.setInterval(() => {
      updateCountdown(props.campaigns[0].end_time)
    }, 1000)
  }
})

onUnmounted(() => {
  clearInterval(timer)
})

</script>

<template>
  <div class="w-full text-black px-4 py-2 shadow-md bg-white/20 backdrop-blur-sm">
    <div class="w-full flex justify-center items-center">
      <div class="text-center">
        <h2 class="text-base font-semibold items-center">{{ campaigns[0].name }}</h2>
              <p v-if="timeLeft" class="text-sm text-gray-700 mt-1">
        Campaign ends in: {{ timeLeft }}
      </p>
      </div>
    </div>
  </div>
</template>
