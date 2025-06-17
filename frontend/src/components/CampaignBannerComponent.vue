<script setup lang="ts">
import Modal from "./Modal.vue";
import { ref, defineProps, onMounted, onUnmounted } from "vue";
import { formatDateTime, updateCountdown } from "../composables/CampaignLogic";

const showModal = ref(false);
interface Campaign {
    id: number;
    name: string;
    description: string;
    start_time: string;
    end_time: string;
}

const props = defineProps<{
    campaigns: Campaign[];
}>();

const timeLeft = ref<string>("");
const hasEnded = ref<boolean>(false);
let timer: number | undefined;

onMounted(() => {
    if (props.campaigns.length > 0) {
        const output = updateCountdown(props.campaigns[0].end_time);
        hasEnded.value = output.hasEnded;
        timeLeft.value = output.timeLeft;
        timer = window.setInterval(() => {
            const output = updateCountdown(props.campaigns[0].end_time);
            hasEnded.value = output.hasEnded;
            timeLeft.value = output.timeLeft;
        }, 1000);
    }
});

onUnmounted(() => {
    clearInterval(timer);
});
</script>

<template>
    <div
        class="w-full text-default px-4 py-2 shadow-md bg-default backdrop-blur-sm hover:cursor-pointer"
        @click="showModal = true"
    >
        <div class="w-full flex justify-center items-center">
            <div class="text-center">
                <h2 class="text-base font-semibold items-center">
                    {{ campaigns[0].name }}
                </h2>
                <p v-if="timeLeft" class="text-sm text-gray-700 mt-1">Campaign ends in: {{ timeLeft }}</p>
            </div>
        </div>
    </div>

    <Modal :visible="showModal" @close="showModal = false">
        <h2 class="text-lg font-semibold mb-4">Campaign Information</h2>
        <p>
            <strong>Description:</strong>
            {{ campaigns[0].description }}
        </p>
        <p>
            <strong>Start Time:</strong>
            {{ formatDateTime(campaigns[0].start_time) }}
        </p>
        <p>
            <strong>End Time:</strong>
            {{ formatDateTime(campaigns[0].end_time) }}
        </p>
        <div class="flex items-center mt-4 gap-2">
            <button
                @click="showModal = false"
                class="flex-1 bg-main text-inverted px-4 py-2 rounded mr-2 hover:bg-primary-light hover:cursor-pointer"
            >
                Okay
            </button>
        </div>
    </Modal>
</template>
