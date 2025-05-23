import { createApp } from "vue";

// import CSS files
import "./index.css";

import "leaflet/dist/leaflet.css";

// import App and router
import App from "@/App.vue";
import router from "@/router";
import ui from "@nuxt/ui/vue-plugin";

// mount the app
createApp(App).use(ui).use(router).mount("#app");
