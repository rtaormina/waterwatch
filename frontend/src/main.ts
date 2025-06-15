import { createApp } from "vue";
import { i18n } from "./i18n";
// import CSS files
import "./index.css";

import "leaflet/dist/leaflet.css";

// import App and router
import App from "@/App.vue";
import router from "@/router";
import ui from "@nuxt/ui/vue-plugin";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import { createPinia } from "pinia";

// mount the app
createApp(App).use(ui).use(router).use(i18n).component("VueDatePicker", VueDatePicker).use(createPinia()).mount("#app");
