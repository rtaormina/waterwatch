<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import burgerBar from "@/assets/burger-bar.png";
import { useRouter } from "vue-router";
import { UserIcon } from "@heroicons/vue/24/solid";
import { useLogin } from "@/composables/LoginLogic.ts";

const { login, logout, loggedIn, isLoggedIn } = useLogin();

const router = useRouter();
const page = router.currentRoute.value.name;

const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const showOverlay = ref(false);
function openOverlay() {
  showOverlay.value = true;
}
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
    onSelect: () => logout(),
    class: "cursor-pointer",
  },
]);
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
      <button
        @click="closeOverlay"
        class="absolute top-4 right-4 text-white text-5xl"
        aria-label="Close"
      >
        ×
      </button>
      <div class="flex flex-row h-screen">
        <div class="flex flex-col items-center space-y-3 h-screen ml-10">
          <!-- spacer 1/6 -->
          <div class="grow"></div>

          <div class="flex flex-row justify-center space-y-6">
            <!-- white bar -->
            <div class="bg-white w-1.5 h-75 ml-auto mx-4"></div>

            <!-- Menu items -->
            <div class="flex flex-col justify-right space-y-6 text-4xl">
              <router-link
                to="/"
                class="text-white"
                :class="{
                  underline: page === 'Map',
                  'hover:underline': page !== 'Map',
                }"
              >
                Map
              </router-link>

              <router-link
                to="/"
                class="text-white"
                :class="{
                  underline: page === 'Tutorial',
                  'hover:underline': page !== 'Tutorial',
                }"
              >
                Tutorial
              </router-link>

              <router-link
                to="/export"
                class="text-white"
                :class="{
                  underline: page === 'Data',
                  'hover:underline': page !== 'Data',
                }"
              >
                Data
              </router-link>

              <router-link
                to="/"
                class="text-white"
                :class="{
                  underline: page === 'About',
                  'hover:underline': page !== 'About',
                }"
              >
                About
              </router-link>

              <router-link
                to="/"
                class="text-white"
                :class="{
                  underline: page === 'Contact',
                  'hover:underline': page !== 'Contact',
                }"
              >
                Contact
              </router-link>
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
              class="px-7 py-1 rounded-md border-2 border-white text-white text-2xl hover:bg-white hover:text-[#00A6D6] transition-colors duration-200 whitespace-nowrap"
            >
              Sign in
            </router-link>
          </div>
          <div>
            <router-link
              to="/login"
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
    <div
      class="font-custom bg-[#00A6D6] text-white p-4 w-screen text-3xl flex flex-row justify-between"
    >
      <router-link to="/">
        <div>WATERWATCH</div>
      </router-link>
      <div class="flex flex-row space-x-6">
        <div
          class="border-b-2"
          :class="page == 'Map' ? 'border-white' : 'border-transparent'"
        >
          <router-link to="/" class="text-white text-2xl hover:border-white">
            Map
          </router-link>
        </div>

        <div
          class="border-b-2"
          :class="page == 'Tutorial' ? 'border-white' : 'border-transparent'"
        >
          <router-link to="/" class="text-white text-2xl hover:border-white">
            Tutorial
          </router-link>
        </div>

        <div
          class="border-b-2"
          :class="page == 'Export' ? 'border-white' : 'border-transparent'"
        >
          <router-link
            to="/export"
            class="text-white text-2xl hover:border-white"
          >
            Data
          </router-link>
        </div>

        <div
          class="border-b-2"
          :class="page == 'About' ? 'border-white' : 'border-transparent'"
        >
          <router-link
            to="/about"
            class="text-white text-2xl hover:border-white"
          >
            About
          </router-link>
        </div>

        <div
          class="border-b-2"
          :class="page == 'Contact' ? 'border-white' : 'border-transparent'"
        >
          <router-link to="/" class="text-white text-2xl hover:border-white">
            Contact
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
                class="w-8 h-8 text-white cursor-pointer hover:scale-110 transition duration-200 ease-in-out"
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
  <div v-else class="relative z-30">
    <div
      class="font-custom bg-[#00A6D6] text-white p-2 w-screen flex justify-between"
    >
      <router-link
        to="/"
        class="text-4xl text-white font-custom mt-4 mb-3 ml-4"
      >
        WATERWATCH
      </router-link>
      <div>
        <button @click="openOverlay">
          <img
            :src="burgerBar"
            alt="Menu icon"
            class="w-12 mt-3 mr-3 object-contain"
          />
        </button>
      </div>
    </div>
  </div>
</template>
