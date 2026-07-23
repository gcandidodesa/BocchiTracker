<!-- src/views/AdicionarMidia.vue -->
<script setup>
import { ref, computed } from 'vue'
import { buscarOmniMidia } from '../services/api'
import { useRouter } from 'vue-router'
import { db, collection, addDoc } from '../services/firebase'

const router = useRouter()
const termoBusca = ref('')
const resultados = ref([])
const carregando = ref(false)
const filtroTipo = ref('todos')

const midiaSelecionada = ref(null)
const formulario = ref({
  status: 'planejo',
  nota: '',
  resenha: ''
})

// Lista inteligente que reage instantaneamente ao filtro escolhido
const resultadosFiltrados = computed(() => {
  if (filtroTipo.value === 'todos') {
    return resultados.value
  }
  return resultados.value.filter(midia => midia.tipo === filtroTipo.value)
})

// Proteção do Debounce
let temporizadorBusca = null

function pesquisar() {
  if (termoBusca.value.length < 3) {
    resultados.value = [] // Limpa a tela se apagar o texto
    return 
  }
  
  // Cancela a busca anterior se o usuário ainda estiver digitando
  clearTimeout(temporizadorBusca)
  
  // Só executa após 800ms sem digitar
  temporizadorBusca = setTimeout(async () => {
    carregando.value = true
    try {
      resultados.value = await buscarOmniMidia(termoBusca.value)
    } catch (erro) {
      console.error(erro)
    } finally {
      carregando.value = false
    }
  }, 800)
}

function selecionarMidia(midia) {
  midiaSelecionada.value = midia
  formulario.value = { status: 'planejo', nota: '', resenha: '' }
}

function cancelarSelecao() {
  midiaSelecionada.value = null
}

async function salvarMidia() {
  try {
    const novaMidia = {
      titulo: midiaSelecionada.value.titulo,
      tipo: midiaSelecionada.value.tipo,
      capaUrl: midiaSelecionada.value.capaUrl,
      status: formulario.value.status,
      nota: formulario.value.nota || null,
      resenha: formulario.value.resenha || "",
      dataAdicao: new Date()
    };

    await addDoc(collection(db, "midias"), novaMidia);
    
    alert("Salvo com sucesso!");
    midiaSelecionada.value = null;
    termoBusca.value = '';
    resultados.value = [];
  } catch (erro) {
    console.error("Erro ao salvar:", erro);
    alert("Deu erro ao salvar!");
  }
}
</script>

<template>
  <div class="adicionar-container">
    <header>
      <button class="btn-voltar" @click="router.back()">← Voltar</button>
      <h2>Adicionar Nova Mídia</h2>
    </header>
    
    <main class="painel-adicionar">
      <!-- ÁREA DE BUSCA (Só aparece se não houver mídia selecionada) -->
      <div class="busca-area" v-if="!midiaSelecionada">
        <div class="grupo-pesquisa">
          <input 
            type="text" 
            v-model="termoBusca" 
            @keyup.enter="pesquisar"
            @input="pesquisar"
            placeholder="Ex: Harry Potter, Cyberpunk, Naruto..." 
          />
          
          <select v-model="filtroTipo" class="btn-filtro">
            <option value="todos">Tudo</option>
            <option value="anime">Animes</option>
            <option value="jogo">Jogos</option>
            <option value="filme">Filmes</option>
            <option value="serie">Séries</option>
            <option value="manga">Mangás</option>
            <option value="livro">Livros</option>
          </select>
        </div>
      </div>

      <!-- Estados da Busca -->
      <div v-if="carregando" class="estado-vazio">
        Buscando em todos os universos...
      </div>

      <!-- Grade de Resultados Filtrados -->
      <div v-else-if="resultadosFiltrados.length > 0 && !midiaSelecionada" class="resultados-grid">
        <div 
          class="cartao-resultado" 
          v-for="midia in resultadosFiltrados" 
          :key="midia.id"
          @click="selecionarMidia(midia)"
        >
          <span class="badge-tipo" :class="midia.tipo">{{ midia.tipo }}</span>
          <img :src="midia.capaUrl" :alt="midia.titulo" />
          <p class="titulo-midia">{{ midia.titulo }}</p>
        </div>
      </div>

      <!-- Sem resultados para o filtro específico -->
      <div v-else-if="resultados.length > 0 && resultadosFiltrados.length === 0 && !midiaSelecionada" class="estado-vazio">
        Nenhum resultado encontrado para o filtro selecionado.
      </div>

      <!-- ÁREA DO FORMULÁRIO (Aparece após clicar na capa) -->
      <div v-if="midiaSelecionada" class="formulario-area">
        <div class="info-midia">
          <img :src="midiaSelecionada.capaUrl" :alt="midiaSelecionada.titulo" class="capa-preview" />
          <h3>{{ midiaSelecionada.titulo }}</h3>
        </div>

        <div class="campos-form">
          <div class="grupo-campo">
            <label>Status:</label>
            <div class="botoes-status">
              <button 
                :class="{ ativo: formulario.status === 'planejo' }"
                :disabled="formulario.status === 'planejo'"
                @click="formulario.status = 'planejo'"
              >Planejo</button>
              <button 
                :class="{ ativo: formulario.status === 'ativo' }"
                :disabled="formulario.status === 'ativo'"
                @click="formulario.status = 'ativo'"
              >Consumindo (Lendo/Assist/Jogando)</button>
              <button 
                :class="{ ativo: formulario.status === 'finalizado' }"
                :disabled="formulario.status === 'finalizado'"
                @click="formulario.status = 'finalizado'"
              >Finalizado</button>
              <button 
                :class="{ ativo: formulario.status === 'dropado' }"
                :disabled="formulario.status === 'dropado'"
                @click="formulario.status = 'dropado'"
              >Dropado</button>
            </div>
          </div>

          <div class="grupo-campo">
            <label>Nota (1 a 10):</label>
            <input type="number" min="1" max="10" v-model="formulario.nota" />
          </div>

          <div class="grupo-campo">
            <label>Resenha (Opcional):</label>
            <textarea rows="3" v-model="formulario.resenha" placeholder="O que achou?"></textarea>
          </div>

          <div class="acoes-form">
            <button class="btn-cancelar" @click="cancelarSelecao">Cancelar</button>
            <button class="btn-salvar" @click="salvarMidia">Salvar na Coleção</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Layout Base */
.adicionar-container { padding: 2rem; max-width: 1000px; margin: 0 auto; }
header { display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem; }
.btn-voltar { background: transparent; border: 1px solid var(--cor-primaria); color: var(--cor-texto); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }

.painel-adicionar { background: var(--cor-fundo); border-radius: 12px; }
.estado-vazio { text-align: center; padding: 4rem; opacity: 0.7; font-size: 1.2rem; }

/* Nova Área de Busca com Filtro */
.busca-area { margin-bottom: 2rem; }
.grupo-pesquisa {
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
.grupo-pesquisa input {
  flex: 1;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--cor-card);
  background: rgba(0,0,0,0.2);
  color: var(--cor-texto);
  font-size: 1.1rem;
}

.btn-filtro {
  background: var(--cor-card);
  color: var(--cor-texto);
  border: 1px solid var(--cor-primaria);
  padding: 0 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-filtro:hover, .btn-filtro:focus {
  background: var(--cor-primaria);
  color: #111;
}
.btn-filtro option {
  background: var(--cor-fundo);
  color: var(--cor-texto);
}

/* Grade de Resultados */
.resultados-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}

/* Cartões */
.cartao-resultado {
  background: var(--cor-card);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-align: center;
  position: relative;
}
.cartao-resultado:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  border: 1px solid var(--cor-primaria);
}
.cartao-resultado img {
  width: 100%;
  height: 260px;
  object-fit: cover;
}
.titulo-midia {
  padding: 0.8rem;
  margin: 0;
  font-weight: bold;
  font-size: 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Badge (Etiquetas Coloridas) */
.badge-tipo {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.85);
  z-index: 5;
  border: 1px solid currentColor;
}
.badge-tipo.anime { color: #FFB6C1; } 
.badge-tipo.jogo { color: #38bdf8; }  
.badge-tipo.filme { color: #FFFACD; } 
.badge-tipo.serie { color: #c084fc; } 
.badge-tipo.manga { color: #fb923c; } 
.badge-tipo.livro { color: #a3e635; } 

/* Área do Formulário */
.formulario-area {
  display: flex;
  gap: 2rem;
  background: var(--cor-card);
  padding: 2rem;
  border-radius: 12px;
  flex-wrap: wrap; /* Para se adaptar no mobile depois */
}
.info-midia {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
  text-align: center;
}
.capa-preview {
  width: 100%;
  border-radius: 12px;
  margin-bottom: 1rem;
}
.campos-form {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Campos Internos */
.grupo-campo { display: flex; flex-direction: column; gap: 0.5rem; font-weight: bold; }
.botoes-status { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.botoes-status button { background: transparent; border: 1px solid var(--cor-primaria); color: var(--cor-texto); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
.botoes-status button:disabled { background: var(--cor-primaria); color: #111; cursor: not-allowed; opacity: 1; }

input[type="number"], textarea {
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--cor-fundo);
  background: rgba(0,0,0,0.2);
  color: var(--cor-texto);
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.acoes-form { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
.btn-cancelar { background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold;}
.btn-salvar { background: var(--cor-primaria); color: #111; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; border: none;}
</style>