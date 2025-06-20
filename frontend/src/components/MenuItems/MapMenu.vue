<template>
    <div class="flex flex-row-reverse items-center z-20 justify-center gap-4">
        <UTooltip :text="open ? 'Close' : 'Options'" class="z-60">
            <button
                data-testid="open-button"
                @click="toggleMenu"
                class="bg-main rounded-md p-1 text-inverted hover:cursor-pointer"
                aria-label="toggle map menu"
            >
                <transition
                    mode="out-in"
                    enter-active-class="transform transition duration-300 ease-out"
                    enter-from-class="opacity-0 -rotate-90"
                    enter-to-class="opacity-100 rotate-0"
                    leave-active-class="transform transition duration-200 ease-in"
                    leave-from-class="opacity-100 rotate-0"
                    leave-to-class="opacity-0 rotate-90"
                >
                    <EllipsisHorizontalCircleIcon v-if="!open" key="bars" class="w-10 h-10" />
                    <XMarkIcon v-else key="close" class="w-10 h-10" />
                </transition>
            </button>
        </UTooltip>

        <div class="flex flex-row-reverse items-center gap-4">
            <MenuButton
                class="bg-main rounded-md p-1 text-inverted hover:cursor-pointer menu-button"
                :class="{ 'menu-visible': showButtons }"
                :style="{ '--delay': '0.1s' }"
                v-for="item in menuItems"
                :key="item.icon"
                :icon="item.icon"
                :tooltip="item.tooltip"
                @click="item.handler"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { EllipsisHorizontalCircleIcon, XMarkIcon } from "@heroicons/vue/24/outline";

type MenuItem = {
    icon: string;
    tooltip: string;
    handler: () => void;
};

defineProps<{
    selectMult: boolean;
    menuItems: MenuItem[];
}>();

const emit = defineEmits<{
    (e: "open"): void;
}>();

const open = ref(false);
const showButtons = ref(false);

watch(open, (val) => {
    if (!val) showButtons.value = false;
});

/**
 * Toggles the menu open and closed with animation
 *
 * @return {void}
 */
function toggleMenu() {
    if (open.value) {
        showButtons.value = false;
        setTimeout(() => (open.value = false), 200);
    } else {
        open.value = true;
        setTimeout(() => (showButtons.value = true), 50);
    }
    emit("open");
}
</script>

<style>
.menu-button {
    opacity: 0;
    transform: translateX(50px) scale(0.8);
    transition:
        opacity 0.4s ease-out,
        transform 0.4s ease-out;
    pointer-events: none;
}
.menu-button.menu-visible {
    opacity: 1;
    transform: translateX(0) scale(1);
    pointer-events: auto;
    transition-delay: var(--delay, 0s);
}
</style>
