import { defineStore } from "pinia";
import { ref } from "vue";

export const usePerfilStore = defineStore('perfil', () => {
    const perfilAtivo = ref(null)
    const temaAtual = ref('padrao')

    function trocarPerfil(nomeDoPerfil, nomeDoTema) {
        perfilAtivo.value = nomeDoPerfil
        temaAtual.value = nomeDoTema

        document.documentElement.setAttribute('data-theme', nomeDoTema)
    }

    return {perfilAtivo, temaAtual, trocarPerfil}
})