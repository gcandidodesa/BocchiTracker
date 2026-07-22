<script setup>
import { ref } from 'vue'
import { buscarMidiaExterna } from '../services/api'
import { useRouter } from 'vue-router'
import { db, collection, addDoc } from '../services/firebase'

const router = useRouter()
const termoBusca = ref('')
const resultados = ref([])
const carregando = ref(false)
const tipoBusca = ref('anime')

// Novas variáveis para controlar o formulário
const midiaSelecionada = ref(null)
const formulario = ref({
  status: 'planejo', // Valor inicial padrão
  nota: '',
  resenha: ''
})

async function pesquisar() {
  if (termoBusca.value.length < 3) return 
  
  carregando.value = true
  try {
    resultados.value = await buscarMidiaExterna(termoBusca.value, tipoBusca.value)
  } catch (erro) {
    console.error(erro)
  } finally {
    carregando.value = false
  }
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
    // Monta o objeto com os dados da API + os dados do seu formulário
    const novaMidia = {
      titulo: midiaSelecionada.value.titulo,
      tipo: midiaSelecionada.value.tipo, // Como estamos usando o Jikan, sabemos que é anime
      capaUrl: midiaSelecionada.value.capaUrl,
      status: formulario.value.status,
      nota: formulario.value.nota || null,
      resenha: formulario.value.resenha || "",
      dataAdicao: new Date() // Salva o dia exato em que você adicionou
    };

    // Envia para a coleção "midias" no Firestore
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
    <header class="cabecalho">
      <button class="btn-voltar" @click="router.push('/dashboard')">← Voltar</button>
      <h2>Adicionar Nova Mídia</h2>
    </header>
    
    <!-- ÁREA DE BUSCA (Só aparece se nenhuma mídia foi clicada) -->
    <div v-if="!midiaSelecionada">
      <div class="busca-area">
        <input 
          v-model="termoBusca" 
          type="text" 
          placeholder="Buscar anime (ex: Naruto, JoJo...)"
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
          :key="midia.id"
          @click="selecionarMidia(midia)"
        >
          <img :src="midia.capaUrl" :alt="midia.titulo" />
          <p class="titulo-midia">{{ midia.titulo }}</p>
        </div>
      </div>
      
      <div v-else-if="termoBusca.length >= 3 && !carregando" class="estado-vazio">
        Nenhum resultado encontrado.
      </div>
    </div>

    <!-- ÁREA DO FORMULÁRIO (Só aparece após clicar em uma capa) -->
    <div v-else class="formulario-area">
      <div class="info-midia">
        <img :src="midiaSelecionada.images.jpg.image_url" :alt="midiaSelecionada.title" class="capa-preview" />
        <h3>{{ midiaSelecionada.title }}</h3>
      </div>

      <div class="campos-formulario">
        <div class="grupo-campo">
          <label>Status:</label>
          <div class="botoes-status">
            <!-- Os botões são desativados dinamicamente quando já estão ativos -->
            <button 
              :class="{ ativo: formulario.status === 'planejo' }"
              :disabled="formulario.status === 'planejo'"
              @click="formulario.status = 'planejo'"
            >Planejo</button>
            
            <button 
              :class="{ ativo: formulario.status === 'ativo' }"
              :disabled="formulario.status === 'ativo'"
              @click="formulario.status = 'ativo'"
            >Assistindo</button>
            
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
          <label for="nota">Nota (1 a 10):</label>
          <input id="nota" type="number" min="1" max="10" v-model="formulario.nota" />
        </div>

        <div class="grupo-campo">
          <label for="resenha">Resenha (Opcional):</label>
          <textarea id="resenha" rows="4" v-model="formulario.resenha" placeholder="O que achou da obra?"></textarea>
        </div>

        <div class="acoes-formulario">
          <button class="btn-cancelar" @click="cancelarSelecao">Cancelar</button>
          <button class="btn-salvar" @click="salvarMidia">Salvar no Tracker</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos anteriores mantidos */
.adicionar-container { padding: 2rem; max-width: 900px; margin: 0 auto; }
.cabecalho { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
.btn-voltar { background: transparent; border: 1px solid var(--cor-primaria); color: var(--cor-texto); }
.busca-area { display: flex; gap: 1rem; margin-bottom: 2rem; }
input[type="text"] { flex: 1; padding: 1rem; border-radius: 8px; border: 2px solid var(--cor-card); background: var(--cor-card); color: var(--cor-texto); }
.btn-buscar { padding: 0 2rem; }
.resultados-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.5rem; }
.cartao-resultado { background: var(--cor-card); border-radius: 12px; padding: 0.8rem; cursor: pointer; text-align: center; }
.cartao-resultado img { width: 100%; height: 220px; object-fit: cover; border-radius: 6px; }
.titulo-midia { font-weight: bold; font-size: 0.95rem; margin-top: 0.8rem; line-clamp: 2; -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }

/* Novos estilos do formulário */
.formulario-area {
  background: var(--cor-card);
  padding: 2rem;
  border-radius: 12px;
  display: flex;
  gap: 2rem;
}

.info-midia {
  flex: 1;
  text-align: center;
}

.capa-preview {
  width: 100%;
  max-width: 250px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  margin-bottom: 1rem;
}

.campos-formulario {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.grupo-campo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: bold;
}

/* Botões de status com desativação dinâmica */
.botoes-status {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.botoes-status button {
  background: transparent;
  border: 1px solid var(--cor-primaria);
  color: var(--cor-texto);
  padding: 0.5rem 1rem;
}

.botoes-status button:disabled {
  background: var(--cor-primaria);
  color: #111;
  cursor: not-allowed;
  opacity: 1;
}

input[type="number"], textarea {
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--cor-card);
  background: rgba(0,0,0,0.2);
  color: var(--cor-texto);
  font-family: inherit;
}

.acoes-formulario {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-cancelar {
  background: transparent;
  border: 1px solid #ff4444;
  color: #ff4444;
}

.btn-salvar {
  background: var(--cor-primaria);
  color: #111;
}
</style>