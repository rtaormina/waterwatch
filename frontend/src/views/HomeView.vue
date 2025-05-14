<script setup>
import Cookies from "universal-cookie"
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import NavBar from "../components/NavBar.vue"

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
        <NavBar />
        <h1>Homepage</h1>
</template>
