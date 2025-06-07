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
    <div class="h-screen flex flex-col login-container">
        <div class="flex-1 flex flex-col items-center justify-center px-4">
            <div class="text-4xl mb-6 text-center font-bold">Welcome Back!</div>

            <div class="w-full max-w-md p-6 input-container">
                <form @submit.prevent="handleSubmit" class="space-y-5 form-container">
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

<style scoped>
@media (max-height: 500px) {
    .input-container {
        padding: 0;
    }
    .login-container {
        padding-top: 0;
        padding-bottom: 0;
        margin-bottom: 0;
    }

    .login-container .text-4xl {
        font-size: 1.5rem;
        line-height: 2rem;
        margin-bottom: 1rem;
    }

    .login-container label.block.text-lg {
        font-size: 1rem;
        line-height: 1.5rem;
    }

    .login-container form.space-y-5 {
        gap: 0.25rem;
    }

    .login-container input {
        padding-left: 0.75rem;
        padding-right: 0.75rem;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        font-size: 0.875rem;
    }

    .login-container a.text-sm {
        font-size: 0.75rem;
    }

    .login-container button {
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        font-size: 0.875rem;
    }

    .login-container p.text-center.text-sm {
        font-size: 0.75rem;
    }
}
</style>
