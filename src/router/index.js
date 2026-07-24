import { createRouter, createWebHistory } from "vue-router";
import SelecionarPerfil from "../views/SelecionarPerfil.vue";
import Dashboard from "../views/Dashboard.vue";
import { usePerfilStore } from "../stores/perfilStore";
import AdicionarMidia from "../views/AdicionarMidia.vue";
import Configuracoes from "../views/Configuracoes.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {path: '/', component: SelecionarPerfil},
        {path: '/dashboard', component:Dashboard},
        {path: '/adicionar', component: AdicionarMidia},
        {path: '/configuracoes', name: 'Configuracoes', component: Configuracoes},
    ]
})

router.beforeEach((to, from) => {
    const perfilStore = usePerfilStore()

    if (to.path === '/dashboard' && !perfilStore.perfilAtivo){
        return '/'
    }
})

export default router