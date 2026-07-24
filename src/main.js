import { createApp } from 'vue'
import {createPinia} from 'pinia'
import router from './router'
import './assets/style.css'
import App from './App.vue'
import { usePerfilStore } from './stores/perfilStore.js'


const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

const perfilStore = usePerfilStore()

perfilStore.carregarConfiguracoesDoFirebase()

app.mount('#app')