<script setup lang="ts">
/**
 * Handles key presses for the time input fields.
 *
 * @param {KeyboardEvent} event - The keypress event.
 */
const handleKeyPress = (event: KeyboardEvent) => {
    const key = event.key;
    const target = event.target as HTMLInputElement;
    let raw = target.value.replace(/[^0-9]/g, "");

    if (!/^\d$/.test(key)) {
        event.preventDefault();
        return;
    }

    const current = raw === "" ? 0 : parseInt(raw, 10);
    const attempted = current * 10 + Number(key);
    if (attempted > 59 || attempted < 0) {
        event.preventDefault();
        return;
    }
    return attempted;
};

/**
 * Handles paste events for the time input fields.
 *
 * @param {ClipboardEvent} event - The paste event.
 */
const handlePaste = (event: ClipboardEvent) => {
    const pastedText = event.clipboardData?.getData("text");

    if (pastedText && !/^\d+$/.test(pastedText)) {
        event.preventDefault();
        return;
    }
    if (Number(pastedText) < 0 || Number(pastedText) > 59) {
        event.preventDefault();
        return;
    }
    return Number(pastedText);
};

/**
 * Handles events for the time input fields.
 *
 * @param {Event} event - The input event.
 */
const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    let raw = target.value.replace(/[^0-9]/g, "");

    const attempted = raw === "" ? 0 : parseInt(raw, 10);
    if (attempted > 59 || attempted < 0) {
        event.preventDefault();
        return;
    }
    return attempted;
};

type Duration = {
    minutes?: number;
    seconds?: number;
};

defineModel<Duration>({
    required: true,
});

defineExpose({
    /** Handles key presses for the time input fields. */
    handleKeyPress,
    /** Handles paste events for the time input fields. */
    handlePaste,
    /** Handles input events for the time input fields. */
    handleInput,
});
</script>

<template>
    <div class="flex items-center w-full gap-4">
        <UInput
            data-testid="time-waited-mins"
            id="time-waited_min"
            @input="handleInput"
            @keypress="handleKeyPress"
            @paste="handlePaste"
            v-model="modelValue.minutes"
            min="0"
            max="59"
            placeholder="00"
            type="number"
            ref="minsRef"
            class="flex-1"
            :ui="{
                trailing: 'pointer-events-none',
            }"
            aria-label="Time waited in minutes"
        >
            <template #trailing><span>min</span></template>
        </UInput>
        <UInput
            data-testid="time-waited-sec"
            id="time-waited_sec"
            @input="handleInput"
            @keypress="handleKeyPress"
            @paste="handlePaste"
            v-model="modelValue.seconds"
            min="0"
            max="59"
            placeholder="00"
            type="number"
            ref="secRef"
            class="flex-1"
            :ui="{
                trailing: 'pointer-events-none',
            }"
            aria-label="Time waited in seconds"
        >
            <template #trailing><span>sec</span></template>
        </UInput>
    </div>
</template>
