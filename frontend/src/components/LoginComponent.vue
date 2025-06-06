<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useLogin } from "../composables/LoginLogic.ts";

const { formData, errorMessage, showError, handleSubmit } = useLogin();

const isMobile = ref(false);

/**
 * Check if the user is on a mobile device
 */
const checkMobile = () => {
    isMobile.value = window.innerWidth < 1024;
};

onMounted(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
    window.removeEventListener("resize", checkMobile);
});

defineExpose({
    /** Checks if user is on mobile. */
    checkMobile,
});
</script>

<template>
    <div class="h-screen flex flex-col">
        <div class="flex-1 flex flex-col items-center justify-center px-4">
            <div class="text-4xl mb-6 text-center font-bold">Welcome Back!</div>

            <div class="w-full max-w-md p-6">
                <form @submit.prevent="handleSubmit" class="space-y-5">
                    <div>
                        <label class="block text-lg font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            v-model="formData.username"
                            placeholder="Your Username"
                            class="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md placeholder:italic focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label class="block text-lg font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            v-model="formData.password"
                            placeholder="Your Password"
                            class="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none italic focus:ring-2 focus:ring-blue-400"
                        />
                        <div class="text-left">
                            <a href="#" class="text-sm text-gray-500 underline italic">Forgot password?</a>
                        </div>
                    </div>

                    <div v-if="showError" class="text-red-500 text-sm mt-1">{{ errorMessage }}</div>

                    <button
                        type="submit"
                        class="w-full py-2 text-white bg-[#00A6D6] rounded-md hover:bg-sky-600 transition"
                    >
                        Log In
                    </button>

                    <p class="text-center text-sm text-gray-600 underline">
                        Don’t have an account?
                        <a href="#" class="font-semibold text-black hover:underline">Sign up.</a>
                    </p>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
