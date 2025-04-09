import './assets/index.css'
import '@formkit/themes/genesis'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { plugin, defaultConfig } from '@formkit/vue'
import VueKonva from 'vue-konva';

const app = createApp(App)

app.use(router).use(plugin, defaultConfig)
app.use(VueKonva)

app.mount('#app')
