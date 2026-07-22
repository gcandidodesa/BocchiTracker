<script setup>
import { usePerfilStore } from '../stores/perfilStore';
import { useRouter } from 'vue-router'


const perfilStore = usePerfilStore ()
const router = useRouter()

function entrar(nome, tema) {
    perfilStore.trocarPerfil(nome, tema)
    router.push('/dashboard')
}
</script>

<template>
    <div class="app-container">
        <h1>Quem está acessando?</h1>

        <div class = "selecao-perfis">
            <div class ="perfil-card" @click="entrar('Guilherme', 'padrao')">
                <div class="avatar dark"></div>
                <p>Guilherme</p>
            </div>
            <div class="perfil-card" @click="entrar ('Hitori', 'bocchi')">
                <div class="avatar bocchi"></div>
                <p>Hitori (Bocchi)</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
}

h1 {
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.selecao-perfis {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.perfil-card {
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  opacity: 0.8;
}

.perfil-card:hover {
  transform: scale(1.1);
  opacity: 1;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 4px solid var(--cor-card);
}

.avatar.dark {
  background-color: #38bdf8;
  background-image: url('https://ui-avatars.com/api/?name=G&background=38bdf8&color=0f172a&size=120'); /* Exemplo provisório */
  background-size: cover;
}

.avatar.bocchi {
  background-color: #FFB6C1;
  background-image: url('https://ui-avatars.com/api/?name=H&background=FFB6C1&color=333333&size=120'); /* Exemplo provisório */
  background-size: cover;
}
</style>