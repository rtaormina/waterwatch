import { createApp } from 'vue'

// import CSS files
import './index.css'

import 'leaflet/dist/leaflet.css'

// import App and router
import App from '@/App.vue'
import router from '@/router'

// mount the app
createApp(App).use(router).mount('#app')
