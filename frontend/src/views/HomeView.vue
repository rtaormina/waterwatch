<script setup>
import Cookies from "universal-cookie"
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const cookies = new Cookies()
const router = useRouter()
const name = ref('')

const logoutView = () => {
  fetch("api/logout/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": cookies.get("csrftoken"),
    },
    credentials: "same-origin",
  })
    .then((res) => res.json())
    .then((data) => {
      // console.log(data)
      router.push({ name: 'Login' })
    })
    .catch((err) => {
      // console.log(err);
    });
}

const whoamiView = () => {
  fetch("api/whoami/", {
    credentials: "same-origin",
  })
    .then((res) => res.json())
    .then((data) => {
      // console.log(data);
      name.value = data.username
    })
    .catch((err) => {
      console.log(err);
    });
}

onMounted(() => {
  whoamiView()
})
</script>

<template>
  <div class="row">
    <div class="col-md-8 mx-auto">
      <div class="flex justify-content-between mb-5 bg-red-509">
        <h1>Hello, {{ name }}</h1>
        <button type="submit" class="btn btn-outline-primary" @click="logoutView">
          Logout
        </button>
      </div>
    </div>
  </div>
</template>