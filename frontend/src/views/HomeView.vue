<script setup>
import Cookies from "universal-cookie"
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { permissionsLogic } from '@/composables/PermissionsLogic.ts'
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

const getPermissions = () => {
  if (inGroup('researcher')) {
    console.log('User is a researcher')
  } else {
    console.log('User is not a researcher')
  }
}

const whoamiView = () => {
  fetch("api/whoami/", {
    credentials: "same-origin",
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      name.value = data.username
    })
    .catch((err) => {
      console.log(err);
    });
}

const {
  fetchPermissions,
  hasPermission,
  inGroup,
  loaded
} = permissionsLogic()

onMounted(async () => {
  await fetchPermissions()

  if (hasPermission('app_label.view_sensitive_data')) {
    console.log('User can view sensitive data')
  }

  if (inGroup('researcher')) {
    console.log('User is a researcher')
  } else {
    console.log('User is not a researcher')
  }
  whoamiView()
})



</script>

<template>
  <NavBar />
  <h1>Homepage</h1>
  <button @click="getPermissions">who am i</button>
</template>
