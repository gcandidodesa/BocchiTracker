<script setup>
import { ref } from 'vue';
import { buscarAnime } from '../services/api';
import { useRouter } from 'vue-router';

const router = useRouter ()
const termoBusca = ref('')
const resultados = ref([])
const carregando = ref(false)

async function pesquisar() {
    if (termoBusca.value.length < 3) return
    carregando.value = true

    resultados.value = await buscarAnime(termoBusca.value)
    carregando.value = false
}

function selecionarMidia(midia) {
    console.log ("Deu certo pra isso:", midia.title)
    alert ('Selecionado rapaz: ${midia.title}.')
}
</script>

<template>
    <div class="adicionar-container">
        <header class="cabecalho">
            <button class="btn-voltar" @click="router.push('/dashboard')">
                ← Voltar
            </button>
            <h2>Adicionar Nova Mídia</h2>
        </header>

        <div class="busca-area">
            <input 
            v-model="termoBusca"
            type="text"
            placeholder="Buscar mídia"
            @keyup.enter="pesquisar"
            />
            <button class="btn-buscar" @click="pesquisar" :disabled="carregando">
                {{ carregando ? 'Buscando...' : 'Buscar' }}
            </button>
        </div>

        <div v-if="resultados.length > 0" class="resultados-grid">
            <div
                class="cartao-resultado"
                v-for="anime in resultados"
                :key="anime.mal_id"
                @click="selecionarMidia(anime)"
            >
                <img src="anime.images.jpg.image_url" :alt="anime.title">
                <p class="titulo-midia">{{ anime.title }}</p>
            </div>
        </div>

        <div v-else-if="termoBusca.length >= 3 && !carregando" class="estado-vazio">
            Nenhum resultado encontrado.
        </div>
    </div>
</template>

<style scoped>
.adicionar-container {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.cabecalho {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.btn-voltar {
  background: transparent;
  border: 1px solid var(--cor-primaria);
  color: var(--cor-texto);
}

.busca-area {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

input {
  flex: 1;
  padding: 1rem;
  font-size: 1.1rem;
  border-radius: 8px;
  border: 2px solid var(--cor-card);
  background: var(--cor-card);
  color: var(--cor-texto);
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: var(--cor-primaria);
}

.btn-buscar {
  padding: 0 2rem;
  font-size: 1.1rem;
}

.resultados-grid {
  display: grid;
  /* Grid responsivo: ajusta as colunas baseadas no tamanho da tela */
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.5rem;
}

.cartao-resultado {
  background: var(--cor-card);
  border-radius: 12px;
  padding: 0.8rem;
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.cartao-resultado:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--cor-primaria);
}

.cartao-resultado img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 6px;
}

.titulo-midia {
  font-weight: bold;
  font-size: 0.95rem;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Corta o texto após 2 linhas */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.estado-vazio {
  text-align: center;
  padding: 3rem;
  color: var(--cor-texto);
  opacity: 0.7;
}
</style>