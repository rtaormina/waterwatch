<script setup>
import Cookies from "universal-cookie";
import { ref, onUnmounted, reactive, onMounted } from "vue";
import { useRouter } from 'vue-router'
import NavBar from "./NavBar.vue";

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const cookies = new Cookies()
const router = useRouter()

const formData = reactive({
  username: '',
  password: ''
})

const sessionView = () => {
  fetch("api/session/", {
    credentials: "same-origin",
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

const errorMessage = ref('')
const showError = ref(false)
const showErrorMessage = (message) => {
  errorMessage.value = message
  showError.value = true

}

// Submits to api/login/ with as payload the username and password
const handleSubmit = () => {

  fetch("api/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": cookies.get("csrftoken"),
    },
    credentials: "same-origin",
    body: JSON.stringify(formData),
  })
    .then(async (res) => {
      const data = await res.json()

      if (!res.ok) {
        // Show backend error message, or fallback
        showErrorMessage(data.detail || 'Login failed.')
        throw new Error(data.detail)
      }

      // On successful login, redirect to the home page
      if (data.detail === 'Successfully logged in.') {
        router.push({ name: 'Home' })
      }
    })
    .catch((err) => {
      console.error(err);
      if (err.message === 'Failed to fetch') {
        showErrorMessage('Network error. Please try again later.')
      } else {
        showErrorMessage('Invalid username or password.')
      }
    });
}

onMounted(() => {
  sessionView()
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>


  <div class="h-screen flex flex-col">
    <NavBar />

    <!-- Centered content container -->
    <div class="flex-1 flex flex-col items-center justify-center px-4">
      <div class="text-4xl mb-6 text-center font-bold">Welcome Back!</div>

      <div class="w-full max-w-md p-6">
        <form @submit.prevent="handleSubmit" class="space-y-5">

          <!-- username -->
          <div>
            <label class="block text-lg font-medium text-gray-700">Username</label>
            <input type="text" v-model="formData.username" placeholder="Your Username"
              class="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none italic focus:ring-2 focus:ring-blue-400" />
            <div v-if="showError" class="text-red-500 text-sm mt-1">
              {{ errorMessage }}</div>
          </div>

          <!-- password -->
          <div>
            <label class="block text-lg font-medium text-gray-700">Password</label>
            <input type="password" v-model="formData.password" placeholder="Your Password"
              class="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none italic focus:ring-2 focus:ring-blue-400" />
            <div class="text-left">
              <a href="#" class="text-sm text-gray-500 underline italic">Forgot password?</a>
            </div>
          </div>

          <!-- submit button -->
          <button type="submit" class="w-full py-2 text-white bg-[#00A6D6] rounded-md hover:bg-sky-600 transition">
            Log In
          </button>

          <!-- sign up link -->
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
