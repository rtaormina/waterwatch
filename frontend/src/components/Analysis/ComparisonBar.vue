<template>
    <UCard
        class="override-card absolute z-30 bg-default/70 backdrop-blur-sm shadow-lg rounded-md p-0 md:top-4 md:bottom-auto md:w-[36rem] md:max-w-[36rem] md:block bottom-8 w-100 max-w-100"
        :class="{ 'hidden md:block': mode === 'phase3' }"
        style="left: 50%; transform: translateX(-50%)"
    >
        <div class="flex items-center justify-between gap-4">
            <div class="flex-1">
                <UButton
                    class="font-medium flex justify-center items-center cursor-pointer disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted md:px-4 md:py-2 md:w-40 md:text-base px-2 py-1 w-30 text-sm whitespace-nowrap"
                    :color="leftButtonColor"
                    @click="handleLeftButtonClick"
                >
                    {{ leftLabel }}
                </UButton>
            </div>
            <div class="flex-1 flex justify-center items-center">
                <span class="font-semibold text-highlighted md:text-lg text-sm whitespace-nowrap">
                    {{ centerLabel }}
                </span>
            </div>
            <div class="flex-1">
                <UButton
                    class="font-medium flex justify-center items-center cursor-pointer disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted md:px-4 md:py-2 md:w-40 md:text-base px-2 py-1 w-30 text-sm whitespace-nowrap"
                    :color="rightButtonColor"
                    :disabled="rightButtonDisabled"
                    @click="handleRightButtonClick"
                >
                    {{ rightLabel }}
                </UButton>
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
    // numeric phase (1 or 2) for "Select group 1" vs. "Select group 2"
    phaseNum: {
        type: Number as () => 1 | 2 | null,
        required: true,
    },
    // how many hexes are in each group
    group1Count: {
        type: Number,
        required: true,
    },
    group2Count: {
        type: Number,
        required: true,
    },
    // string‐mode: "phase1" | "phase2" | "phase3"
    mode: {
        type: String as () => "phase1" | "phase2" | "phase3",
        required: true,
    },
});

const emit = defineEmits<{
    (e: "cancel"): void;
    (e: "next"): void;
    (e: "previous"): void;
    (e: "compare"): void;
    (e: "restart"): void;
    (e: "exit"): void;
}>();

const leftLabel = computed(() => {
    if (props.mode === "phase3") {
        return "Restart";
    }
    return props.phaseNum === 1 ? "Cancel" : "Previous group";
});

const rightLabel = computed(() => {
    if (props.mode === "phase3") {
        return "Exit";
    }
    return props.phaseNum === 1 ? "Next group" : "Compare";
});

const centerLabel = computed(() => {
    if (props.mode === "phase3") {
        return "Comparing";
    }
    return props.phaseNum === 1 ? "Select group 1" : "Select group 2";
});

const leftButtonColor = computed<
    "primary" | "neutral" | "secondary" | "success" | "info" | "warning" | "error" | undefined
>(() => "primary");

const rightButtonDisabled = computed(() => {
    if (props.mode === "phase3") {
        return false;
    }
    if (props.phaseNum === 1) {
        return props.group1Count <= 0;
    }
    return props.group2Count <= 0;
});

const rightButtonColor = computed(() => {
    return rightButtonDisabled.value ? "neutral" : "primary";
});

/**
 * Handles the left button click event.
 * If in phase 1, it cancels the selection.
 * If in phase 2, it goes to the previous group.
 * If in phase 3, it restarts the comparison.
 *
 * @returns {void}
 */
function handleLeftButtonClick() {
    if (props.mode === "phase3") {
        emit("restart");
    } else {
        if (props.phaseNum === 1) {
            emit("cancel");
        } else {
            emit("previous");
        }
    }
}

/**
 * Handles the right button click event.
 * If in phase 1, it goes to the next group.
 * If in phase 2, it compares the two groups.
 * If in phase 3, it exits the comparison.
 *
 * @returns {void}
 */
function handleRightButtonClick() {
    if (props.mode === "phase3") {
        emit("exit");
        return;
    }
    if (rightButtonDisabled.value) return;
    if (props.phaseNum === 1) {
        emit("next");
    } else {
        emit("compare");
    }
}
</script>

<style scoped>
.override-card ::v-deep .p-4 {
    padding: 1rem !important;
}
.override-card ::v-deep .sm\:p-6 {
    padding: 1rem !important;
}
</style>
