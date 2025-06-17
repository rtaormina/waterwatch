<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { UserIcon, XMarkIcon, Bars3Icon } from "@heroicons/vue/24/solid";
import { useLogin } from "../composables/LoginLogic.ts";

const { login, logout, loggedIn } = useLogin();

const isMobile = ref(false);

const showOverlay = ref(false);

/**
 * Check if the user is on a mobile device
 */
const checkMobile = () => {
    isMobile.value = window.innerWidth < 1024;
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
    // { label: "Preferences", icon: "i-lucide-settings", to: "/preferences" },
    // { label: "See History", icon: "i-lucide-history", to: "/history" },
    // { type: "separator" },
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

defineExpose({
    /** Checks if user is on mobile. */
    checkMobile,
    /** Opens mobile overlay. */
    openOverlay,
    /** Closes mobile overlay. */
    closeOverlay,
});
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
        <div v-if="showOverlay" class="fixed inset-0 bg-primary z-50 overlay">
            <div class="flex">
                <div class="text-4xl text-inverted font-custom mt-6 ml-6">WATERWATCH</div>
            </div>
            <div class="flex flex-row h-full">
                <div class="flex flex-col items-center space-y-3 h-full ml-10">
                    <!-- spacer 1/6 -->
                    <div class="grow"></div>

                    <div class="flex flex-row justify-center space-y-6">
                        <!-- white bar -->
                        <div class="bg-default w-1.5 h-75 ml-auto mx-4 bar"></div>

                        <!-- Menu items -->
                        <div class="flex flex-col justify-right space-y-6 text-4xl menu-items">
                            <div v-for="item in navItems" :key="item.name">
                                <router-link
                                    :to="item.to"
                                    class="text-inverted hover:text-accented"
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
                <div
                    class="absolute inset-x-0 bottom-0 flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-3 pb-6 bg-transparent"
                >
                    <!-- logged in -->
                    <template v-if="loggedIn">
                        <!-- <router-link
                            to="/preferences"
                            class="w-48 text-center px-7 py-1 rounded-md border-2 border-white text-white text-2xl hover:bg-white hover:text-[#00A6D6] transition-colors duration-200"
                        >
                            Preferences
                        </router-link>

                        <router-link
                            to="/login"
                            class="w-48 text-center px-7 py-1 rounded-md bg-white border-2 border-transparent text-[#00A6D6] font-medium text-2xl hover:bg-gray-100 transition-colors duration-200"
                        >
                            History
                        </router-link> -->

                        <router-link
                            @click="logout()"
                            to="/"
                            class="w-48 text-center px-7 py-1 rounded-md bg-default border-2 border-transparent text-primary font-medium text-2xl hover:bg-muted transition-colors duration-200"
                        >
                            Logout
                        </router-link>
                    </template>

                    <!-- not logged in -->
                    <template v-else>
                        <router-link
                            to="/login"
                            @click="closeOverlay()"
                            class="w-48 text-center px-7 py-1 rounded-md border-2 border-default text-inverted text-2xl hover:bg-default hover:text-primary transition-colors duration-200"
                        >
                            Sign in
                        </router-link>

                        <router-link
                            to="/register"
                            @click="closeOverlay()"
                            class="w-48 text-center px-7 py-1 rounded-md bg-default border-2 border-transparent text-primary font-medium text-2xl hover:bg-muted transition-colors duration-200"
                        >
                            Register
                        </router-link>
                    </template>
                </div>
            </div>
        </div>
    </transition>

    <!-- main navbar desktop -->
    <div v-if="!isMobile" class="relative z-30">
        <div class="font-custom bg-primary text-inverted p-4 w-full text-3xl flex flex-row justify-between">
            <router-link class="hover:text-accented" to="/">
                <div>WATERWATCH</div>
            </router-link>
            <div class="flex flex-row space-x-6">
                <div v-for="item in navItems" :key="item.name">
                    <router-link
                        :to="item.to"
                        class="text-inverted text-2xl hover:text-accented"
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
                                class="w-7 h-10 text-inverted cursor-pointer hover:scale-110 transition duration-200 ease-in-out"
                            />
                        </UDropdownMenu>
                    </div>
                    <div v-else>
                        <user-icon
                            class="w-7 h-10 text-inverted cursor-pointer hover:scale-110 transition duration-200 ease-in-out"
                            @click="login()"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- main navbar mobile -->
    <div v-else class="relative z-60">
        <div class="font-custom bg-main text-inverted p-2 w-full flex justify-between">
            <router-link
                to="/"
                @click="closeOverlay()"
                class="text-4xl text-inverted hover:text-accented font-custom mt-3 mb-2 ml-3"
            >
                WATERWATCH
            </router-link>
            <div class="mt-2 mr-4">
                <button @click="showOverlay ? closeOverlay() : openOverlay()" aria-label="Toggle menu">
                    <transition
                        mode="out-in"
                        enter-active-class="transform transition duration-300 ease-out"
                        enter-from-class="opacity-0 -rotate-90"
                        enter-to-class="opacity-100 rotate-0"
                        leave-active-class="transform transition duration-200 ease-in"
                        leave-from-class="opacity-100 rotate-0"
                        leave-to-class="opacity-0 rotate-90"
                    >
                        <Bars3Icon v-if="!showOverlay" key="bars" class="w-12 h-12 text-inverted cursor-pointer" />
                        <XMarkIcon v-else key="close" class="w-12 h-12 text-inverted cursor-pointer" />
                    </transition>
                </button>
            </div>
        </div>
    </div>
</template>

<style>
@media (max-width: 768px) and (orientation: landscape) {
    .menu-items {
        font-size: 1.7rem !important;
        margin-bottom: 0.5rem !important;
        line-height: 1.25rem;
    }
    .bar {
        height: auto !important;
    }
}
</style>
