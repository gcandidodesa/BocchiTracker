<script setup>
import { usePerfilStore } from '../stores/perfilStore';
import { useRouter } from 'vue-router';

const perfilStore = usePerfilStore()
const router = useRouter()

function sair(){
    perfilStore.trocarPerfil(null, 'padrao')
    router.push('/')
}
</script>
<template>
    <div class="dashboard-container">
        <header>
            <p>Bem-vindo, <strong>{{ perfilStore.perfilAtivo }}</strong>!</p>
            <button class="btn-voltar" @click="sair">Trocar de Perfil</button>
        </header>

        <main class="painel">
            <h2>Seu Painel de Mídias</h2>
            <p>Template aqui</p>
        </main>
    </div>
</template>

<style scoped>


.btn-voltar {
  background-color: var(--cor-card);
  color: var(--cor-texto);
  border: 1px solid var(--cor-primaria);
}

.painel {
  margin-top: 2rem;
  padding: 2rem;
  background-color: var(--cor-card);
  border-radius: 12px;
  border: 1px solid var(--borda-destaque, var(--cor-primaria));
}


.dashboard-container{ 
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}


</style>