import { createRouter, createWebHistory } from "vue-router";
import SelecionarPerfil from "../views/SelecionarPerfil.vue";
import Dashboard from "../views/Dashboard.vue";
import { usePerfilStore } from "../stores/perfilStore";
import AdicionarMidia from "../views/AdicionarMidia.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', component: SelecionarPerfil},
        {path: '/dashboard', component:Dashboard},
        {path: '/adicionar', component: AdicionarMidia},
    ]
})

router.beforeEach((to, from) => {
    const perfilStore = usePerfilStore()

    if (to.path === '/dashboard' && !perfilStore.perfilAtivo){
        return '/'
    }
})

export default router