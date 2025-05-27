<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { UserIcon, XMarkIcon, Bars3Icon } from "@heroicons/vue/24/solid";
import { useLogin } from "@/composables/LoginLogic.ts";

const { login, logout, loggedIn } = useLogin();

const isMobile = ref(false);

const showOverlay = ref(false);

/**
 * Check if the user is on a mobile device
 */
const checkMobile = () => {
    isMobile.value = window.innerWidth < 768;
};

/**
 * Opens the navbar overlay
 * @returns {void}
 */
function openOverlay() {
    showOverlay.value = true;
}

/**
 * Closes the navbar overlay and makes sure the body is scrollable again
 * @returns {void}
 */
function closeOverlay() {
    showOverlay.value = false;
}

onMounted(async () => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
    window.removeEventListener("resize", checkMobile);
});

const items = ref([
    { label: "Preferences", icon: "i-lucide-settings", to: "/preferences" },
    { label: "See History", icon: "i-lucide-history", to: "/history" },
    { type: "separator" },
    {
        label: "Log Out",
        icon: "i-lucide-log-out",

        /**
         * Logout function
         */
        onSelect: () => logout(),
        class: "cursor-pointer",
    },
]);

const navItems = [
    { label: "Map", to: "/", name: "Map" },
    { label: "Tutorial", to: "/tutorial", name: "Tutorial" },
    { label: "Data", to: "/export", name: "Export" },
    { label: "About", to: "/about", name: "About" },
    { label: "Contact", to: "/contact", name: "Contact" },
];
</script>

<template>
    <!-- overlay menu mobile -->
    <transition
        enter-active-class="transform transition-transform duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transform transition-transform duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
    >
        <div v-if="showOverlay" class="fixed inset-0 bg-[#00A6D6] z-50">
            <div class="flex">
                <div class="text-4xl text-white font-custom mt-6 ml-6">WATERWATCH</div>
            </div>
            <button @click="closeOverlay" class="absolute top-6 right-6 text-white text-5xl" aria-label="Close">
                <XMarkIcon class="w-12 h-12" />
            </button>
            <div class="flex flex-row h-full">
                <div class="flex flex-col items-center space-y-3 h-full ml-10">
                    <!-- spacer 1/6 -->
                    <div class="grow"></div>

                    <div class="flex flex-row justify-center space-y-6">
                        <!-- white bar -->
                        <div class="bg-white w-1.5 h-75 ml-auto mx-4"></div>

                        <!-- Menu items -->
                        <div class="flex flex-col justify-right space-y-6 text-4xl">
                            <div v-for="item in navItems" :key="item.name">
                                <router-link
                                    :to="item.to"
                                    class="text-white"
                                    @click="closeOverlay()"
                                    active-class="underline"
                                    exact-active-class="underline"
                                >
                                    {{ item.label }}
                                </router-link>
                            </div>
                        </div>
                    </div>

                    <!-- spacer 5/6 -->
                    <div class="grow-[5]"></div>
                </div>

                <!-- registration/login buttons -->
                <div
                    v-if="loggedIn"
                    class="flex flex-row justify-center space-x-3 absolute bottom-0 width-screen left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                    <div>
                        <router-link
                            to="/preferences"
                            class="px-7 py-1 rounded-md border-2 border-white text-white text-2xl hover:bg-white hover:text-[#00A6D6] transition-colors duration-200 whitespace-nowrap"
                        >
                            Preferences
                        </router-link>
                    </div>
                    <div>
                        <router-link
                            to="/login"
                            class="px-7 py-1 rounded-md bg-white border-2 border-transparent text-[#00A6D6] font-medium text-2xl hover:bg-gray-100 transition-colors duration-200"
                        >
                            History
                        </router-link>
                    </div>
                    <div>
                        <router-link
                            @click="logout()"
                            to="/"
                            class="px-7 py-1 rounded-md bg-white border-2 border-transparent text-[#00A6D6] font-medium text-2xl hover:bg-gray-100 transition-colors duration-200"
                        >
                            Logout
                        </router-link>
                    </div>
                </div>
                <div
                    v-else
                    class="flex flex-row justify-center space-x-3 absolute bottom-0 width-screen left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                    <div>
                        <router-link
                            to="/login"
                            @click="closeOverlay()"
                            class="px-7 py-1 rounded-md border-2 border-white text-white text-2xl hover:bg-white hover:text-[#00A6D6] transition-colors duration-200 whitespace-nowrap"
                        >
                            Sign in
                        </router-link>
                    </div>
                    <div>
                        <router-link
                            to="/register"
                            @click="closeOverlay()"
                            class="px-7 py-1 rounded-md bg-white border-2 border-transparent text-[#00A6D6] font-medium text-2xl hover:bg-gray-100 transition-colors duration-200"
                        >
                            Register
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
    </transition>

    <!-- main navbar desktop -->
    <div v-if="!isMobile" class="relative z-30">
        <div class="font-custom bg-[#00A6D6] text-white p-4 w-full text-3xl flex flex-row justify-between">
            <router-link to="/">
                <div>WATERWATCH</div>
            </router-link>
            <div class="flex flex-row space-x-6">
                <div v-for="item in navItems" :key="item.name">
                    <router-link
                        :to="item.to"
                        class="text-white text-2xl hover:border-white"
                        active-class="underline"
                        exact-active-class="underline"
                    >
                        {{ item.label }}
                    </router-link>
                </div>
                <div>
                    <div v-if="loggedIn">
                        <UDropdownMenu
                            :items="items"
                            :ui="{
                                content: 'w-48 z-50',
                            }"
                        >
                            <user-icon
                                class="w-7 h-10 text-white cursor-pointer hover:scale-110 transition duration-200 ease-in-out"
                            />
                        </UDropdownMenu>
                    </div>
                    <div v-else>
                        <user-icon
                            class="w-7 h-10 text-white cursor-pointer hover:scale-110 transition duration-200 ease-in-out"
                            @click="login()"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- main navbar mobile -->
    <div v-else class="relative z-60">
        <div class="font-custom bg-[#00A6D6] text-white p-2 w-full flex justify-between">
            <router-link to="/" @click="closeOverlay()" class="text-4xl text-white font-custom mt-3 mb-2 ml-3">
                WATERWATCH
            </router-link>
            <div class="mt-2 mr-4">
                <button @click="showOverlay ? closeOverlay() : openOverlay()">
                    <transition
                        mode="out-in"
                        enter-active-class="transform transition duration-300 ease-out"
                        enter-from-class="opacity-0 -rotate-90"
                        enter-to-class="opacity-100 rotate-0"
                        leave-active-class="transform transition duration-200 ease-in"
                        leave-from-class="opacity-100 rotate-0"
                        leave-to-class="opacity-0 rotate-90"
                    >
                        <Bars3Icon v-if="!showOverlay" key="bars" class="w-12 h-12 text-white cursor-pointer" />
                        <XMarkIcon v-else key="close" class="w-12 h-12 text-white cursor-pointer" />
                    </transition>
                </button>
            </div>
        </div>
    </div>
</template>
