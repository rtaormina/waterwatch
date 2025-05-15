<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import burgerBar from '@/assets/burger-bar.png'
import { useRouter } from 'vue-router'

// a reactive flag…
const isMobile = ref(false)

const router = useRouter()

const page = router.currentRoute.value.name

// check once and on resize
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const showOverlay = ref(false)

function openOverlay() {
  showOverlay.value = true
}
function closeOverlay() {
  showOverlay.value = false
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>

  <!-- overlay menu mobile -->
  <transition enter-active-class="transform transition-transform duration-300 ease-out"
    enter-from-class="translate-x-full" enter-to-class="translate-x-0"
    leave-active-class="transform transition-transform duration-200 ease-in" leave-from-class="translate-x-0"
    leave-to-class="translate-x-full">
    <div v-if="showOverlay" class="fixed inset-0 bg-[#00A6D6] z-50">
      <div class="flex">
        <div class="text-4xl text-white font-custom mt-6 ml-6">WATERWATCH</div>
      </div>
      <button @click="closeOverlay" class="absolute top-4 right-4 text-white text-5xl" aria-label="Close">×</button>
      <div class="flex flex-row  h-screen">
        <div class="flex flex-col items-center space-y-3 h-screen ml-10">

          <!-- spacer 1/6 -->
          <div class="grow"></div>

          <div class="flex flex-row justify-center space-y-6">

            <!-- white bar -->
            <div class="bg-white w-1.5 h-75  ml-auto mx-4"></div>

            <!-- Menu items -->
            <div class="flex flex-col justify-right space-y-6 text-4xl">
              <div v-if="page == 'Map'" class="text-white  underline">
                <a href="/map">
                  Map
                </a>
              </div>
              <div v-else>
                <a href="/map" class="text-white hover:underline">
                  Map
                </a>
              </div>

              <div v-if="page == 'Tutorial'" class="text-white underline">
                <a href="/tutorial">
                  Tutorial
                </a>

              </div v-else>
              <div v-else>
                <a href="/tutorial" class="text-white hover:underline">
                  Tutorial
                </a>
              </div>

              <div v-if="page == 'Data'" class="text-white underline">
                <a href="/data">
                  Data
                </a>

              </div v-else>
              <div v-else>
                <a href="/data" class="text-white hover:underline">
                  Data
                </a>
              </div>

              <div v-if="page == 'About'" class="text-white underline">
                <a href="/about">
                  About
                </a>

              </div v-else>
              <div v-else>
                <a href="/about" class="text-white hover:underline">
                  About
                </a>
              </div>

              <div v-if="page == 'Contact'" class="text-white underline">
                <a href="/contact">
                  Contact
                </a>

              </div v-else>
              <div v-else>
                <a href="/contact" class="text-white hover:underline">
                  Contact
                </a>
              </div>
            </div>
          </div>

          <!-- spacer 5/6 -->
          <div class="grow-[5]"></div>

        </div>

        <!-- registration/login buttons -->
        <div
          class="flex flex-row justify-center space-x-3 absolute bottom-0 width-screen left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div>
            <button class="px-7 py-1 rounded-md border-2 border-white text-white text-2xl
           hover:bg-white hover:text-[#00A6D6] transition-colors duration-200 whitespace-nowrap">
              Sign in
            </button>
          </div>
          <div>
            <button class="px-7 py-1 rounded-md bg-white border-2 border-transparent text-[#00A6D6] font-medium text-2xl
           hover:bg-gray-100 transition-colors duration-200">
              Register
            </button>
          </div>
        </div>
      </div>

    </div>
  </transition>

  <!-- main navbar desktop -->
  <div v-if="!isMobile" class="relative z-30">
    <div class="font-custom bg-[#00A6D6] text-white p-4 w-screen text-3xl flex flex-row justify-between">
      <div>WATERWATCH</div>
      <div class="flex flex-row space-x-6">
        <div class="border-b-2" :class="page == 'Home' ? 'border-white' : 'border-transparent'">
          <a href="/home" class="text-white text-2xl hover:border-white">
            Map
          </a>
        </div>

        <div class="border-b-2" :class="page == 'Login' ? 'border-white' : 'border-transparent'">
          <a href="/" class="text-white text-2xl hover:border-white">
            Tutorial
          </a>
        </div>

        <div class="border-b-2" :class="page == 'Export' ? 'border-white' : 'border-transparent'">
          <a href="/export" class="text-white text-2xl hover:border-white">
            Data
          </a>
        </div>

        <div class="border-b-2" :class="page == 'Contact' ? 'border-white' : 'border-transparent'">
          <a href="/home" class="text-white text-2xl hover:border-white">
            About
          </a>
        </div>

        <div class="border-b-2" :class="page == 'Map' ? 'border-white' : 'border-transparent'">
          <a href="/home" class="text-white text-2xl hover:border-white">
            Contact
          </a>
        </div>
      </div>

    </div>
  </div>

  <!-- main navbar mobile -->
  <div v-else class="relative z-30">
    <div class="font-custom bg-[#00A6D6] text-white p-2 w-screen flex justify-between">
      <div class="text-4xl text-white font-custom mt-4 mb-3 ml-4">WATERWATCH</div>
      <div>
        <button @click="openOverlay"><img :src="burgerBar" alt="Menu icon" class="w-12 mt-3 mr-3  object-contain"></button>
      </div>
    </div>
  </div>

</template>
