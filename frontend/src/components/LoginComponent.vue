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
                        <label class="block text-lg font-medium text-default">Username</label>
                        <input
                            type="text"
                            v-model="formData.username"
                            placeholder="Your Username"
                            class="w-full mt-1 px-4 py-2 border border-accented rounded-md placeholder:italic focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label class="block text-lg font-medium text-default">Password</label>
                        <input
                            type="password"
                            v-model="formData.password"
                            placeholder="Your Password"
                            class="w-full mt-1 px-4 py-2 border border-accented rounded-md focus:outline-none italic focus:ring-2 focus:ring-primary"
                        />
                        <!-- Add once we have account system -->
                        <!-- <div class="text-left">
                            <a href="#" class="text-sm text-gray-500 underline italic">Forgot password?</a>
                        </div> -->
                    </div>

                    <div v-if="showError" class="text-error text-sm mt-1">{{ errorMessage }}</div>

                    <UButton
                        data-testid="login-button"
                        type="submit"
                        class="w-full py-2 text-inverted text-lg bg-primary rounded-md justify-center transition hover:cursor-pointer"
                    >
                        Log In
                    </UButton>

                    <!-- Turn into email link once email address exists -->
                    <p class="text-center text-sm text-toned">
                        Don't have an account? Send an email to
                        <b>waterwatch@tudelft.nl</b>
                        to register!
                        <!-- <a href="#" class="font-semibold text-black hover:underline">waterwatch@tudelft.nl</a> -->
                    </p>
                </form>
            </div>
        </div>
    </div>
</template>
