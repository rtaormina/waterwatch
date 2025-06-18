<script setup lang="ts">
const {
    settings = {
        modal: true,
        overlay: true,
        dismissible: true,
    },
} = defineProps<{
    title: string;
    settings?: {
        modal?: boolean;
        overlay?: boolean;
        dismissible?: boolean;
    };
}>();
const emit = defineEmits<{
    (e: "close"): void;
}>();
import { XMarkIcon } from "@heroicons/vue/24/outline";
const open = defineModel<boolean>("open", { default: false });
</script>

<template>
    <USlideover
        side="left"
        v-model:open="open"
        :modal="settings.modal"
        :overlay="settings.overlay"
        :dismissible="settings.dismissible"
        :ui="{
            content: 'w-screen max-w-screen md:w-1/2 md:max-w-lg overflow-y-auto',
        }"
    >
        <template #content>
            <div class="pt-16 w-full h-full">
                <div class="mx-4 pt-4 flex flex-col h-full overflow-visible box-border md:p-4 md:block">
                    <h1
                        class="bg-primary text-lg font-bold text-inverted rounded-lg p-4 mb-6 mt-2 shadow w-full md:max-w-screen-md md:mx-auto flex items-center justify-between"
                    >
                        {{ title }}
                        <button
                            class="bg-primary rounded-md p-1 text-inverted hover:cursor-pointer"
                            @click="
                                () => {
                                    open = false;
                                    emit('close');
                                }
                            "
                            aria-label="close sidebar"
                        >
                            <XMarkIcon class="w-10 h-10" />
                        </button>
                    </h1>
                    <slot name="content"></slot>
                </div>
            </div>
        </template>
        <slot></slot>
    </USlideover>
</template>
