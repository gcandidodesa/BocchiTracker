<!-- src/views/Dashboard.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePerfilStore } from '../stores/perfilStore'
import { useRouter } from 'vue-router'
import { db, collection, getDocs, doc, deleteDoc, updateDoc } from '../services/firebase'

const perfilStore = usePerfilStore()
const router = useRouter()
const minhasMidias = ref([])
const carregando = ref(true)

// Variáveis para a Modal de Edição
const mostrarModal = ref(false)
const formularioEdicao = ref(null)

// --- AGRUPAMENTO AUTOMÁTICO (Filtro por Categoria) ---
const midiasAgrupadas = computed(() => {
  const categorias = {
    Animes: [],
    Mangás: [],
    Jogos: [],
    Filmes: [],
    Séries: [],
    Livros: []
  }

  // Distribui as mídias salvas nas suas respectivas prateleiras
  minhasMidias.value.forEach(midia => {
    if (midia.tipo === 'anime') categorias.Animes.push(midia)
    else if (midia.tipo === 'manga') categorias.Mangás.push(midia)
    else if (midia.tipo === 'jogo') categorias.Jogos.push(midia)
    else if (midia.tipo === 'filme') categorias.Filmes.push(midia)
    else if (midia.tipo === 'serie') categorias.Séries.push(midia)
    else if (midia.tipo === 'livro') categorias.Livros.push(midia)
    else categorias.Animes.push(midia) // Fallback caso não tenha tipo
  })

  // Retorna apenas as prateleiras que não estão vazias
  const categoriasPreenchidas = {}
  for (const chave in categorias) {
    if (categorias[chave].length > 0) {
      categoriasPreenchidas[chave] = categorias[chave]
    }
  }

  return categoriasPreenchidas
})

// --- FUNÇÕES DO CRUD ---

// R (Read): Carrega tudo do banco de dados
async function carregarMidias() {
  try {
    const querySnapshot = await getDocs(collection(db, "midias"))
    const listaTemporaria = []
    
    querySnapshot.forEach((doc) => {
      listaTemporaria.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    minhasMidias.value = listaTemporaria
  } catch (erro) {
    console.error("Erro ao buscar mídias:", erro)
  } finally {
    carregando.value = false
  }
}

// D (Delete): Exclui do banco e da tela
async function deletarMidia(idMidia, nomeMidia) {
  const confirmacao = confirm(`Tem certeza que deseja remover "${nomeMidia}" da sua lista?`)
  if (!confirmacao) return

  try {
    await deleteDoc(doc(db, "midias", idMidia))
    minhasMidias.value = minhasMidias.value.filter(midia => midia.id !== idMidia)
  } catch (erro) {
    console.error("Erro ao deletar:", erro)
    alert("Ocorreu um erro ao tentar excluir.")
  }
}

// U (Update - Abrir modal): Prepara os dados
function abrirEdicao(midia) {
  formularioEdicao.value = { ...midia } // Faz uma cópia para não alterar a tela em tempo real
  mostrarModal.value = true
}

// U (Update - Fechar modal): Cancela a edição
function fecharModal() {
  mostrarModal.value = false
  formularioEdicao.value = null
}

// U (Update - Salvar): Envia para o banco
async function salvarEdicao() {
  try {
    const docRef = doc(db, "midias", formularioEdicao.value.id)
    
    await updateDoc(docRef, {
      status: formularioEdicao.value.status,
      nota: formularioEdicao.value.nota,
      resenha: formularioEdicao.value.resenha
    })

    // Atualiza a lista local para a tela piscar a mudança na mesma hora
    const index = minhasMidias.value.findIndex(m => m.id === formularioEdicao.value.id)
    if (index !== -1) {
      minhasMidias.value[index] = { ...formularioEdicao.value }
    }

    fecharModal()
  } catch (erro) {
    console.error("Erro ao atualizar:", erro)
    alert("Erro ao salvar as alterações.")
  }
}

// --- FUNÇÕES DA INTERFACE ---
onMounted(() => {
  carregarMidias()
})

function sair() {
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
      <div class="cabecalho-painel">
        <h2>Minha Lista</h2>
        <button class="btn-adicionar" @click="router.push('/adicionar')">
          + Adicionar Nova Mídia
        </button>
      </div>

      <!-- Estado de Carregamento -->
      <div v-if="carregando" class="estado-vazio">
        Carregando sua coleção...
      </div>

      <!-- Estado Vazio -->
      <div v-else-if="minhasMidias.length === 0" class="estado-vazio">
        Sua lista está vazia. Adicione seu primeiro jogo, anime ou filme!
      </div>

      <!-- Trilhos de Carrossel Agrupados -->
      <div v-else class="listas-agrupadas">
        <div v-for="(lista, categoria) in midiasAgrupadas" :key="categoria" class="trilho-categoria">
          
          <h3 class="titulo-categoria">{{ categoria }}</h3>
          
          <div class="carrossel">
            <div v-for="midia in lista" :key="midia.id" class="cartao-midia" @click="abrirEdicao(midia)">
              
              <button class="btn-deletar" @click.stop="deletarMidia(midia.id, midia.titulo)">
                🗑️
              </button>

              <div class="status-tag" :class="midia.status">{{ midia.status }}</div>
              <img :src="midia.capaUrl" :alt="midia.titulo" />
              
              <div class="info-cartao">
                <p class="titulo">{{ midia.titulo }}</p>
                <p v-if="midia.nota" class="nota">⭐ {{ midia.nota }}/10</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  </div>

  <!-- Modal de Edição (Sobrepõe a tela) -->
  <div v-if="mostrarModal" class="modal-overlay" @click.self="fecharModal">
    <div class="modal-conteudo">
      <h3>Editar: {{ formularioEdicao.titulo }}</h3>
      
      <div class="grupo-campo">
        <label>Status:</label>
        <div class="botoes-status">
          <button 
            :class="{ ativo: formularioEdicao.status === 'planejo' }"
            :disabled="formularioEdicao.status === 'planejo'"
            @click="formularioEdicao.status = 'planejo'"
          >Planejo</button>
          <button 
            :class="{ ativo: formularioEdicao.status === 'ativo' }"
            :disabled="formularioEdicao.status === 'ativo'"
            @click="formularioEdicao.status = 'ativo'"
          >Assistindo/Jogando</button>
          <button 
            :class="{ ativo: formularioEdicao.status === 'finalizado' }"
            :disabled="formularioEdicao.status === 'finalizado'"
            @click="formularioEdicao.status = 'finalizado'"
          >Finalizado</button>
          <button 
            :class="{ ativo: formularioEdicao.status === 'dropado' }"
            :disabled="formularioEdicao.status === 'dropado'"
            @click="formularioEdicao.status = 'dropado'"
          >Dropado</button>
        </div>
      </div>

      <div class="grupo-campo">
        <label>Nota (1 a 10):</label>
        <input type="number" min="1" max="10" v-model="formularioEdicao.nota" />
      </div>

      <div class="grupo-campo">
        <label>Resenha:</label>
        <textarea rows="3" v-model="formularioEdicao.resenha" placeholder="O que achou?"></textarea>
      </div>

      <div class="acoes-modal">
        <button class="btn-cancelar" @click="fecharModal">Cancelar</button>
        <button class="btn-salvar" @click="salvarEdicao">Salvar Alterações</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Layout Base do Dashboard */
.dashboard-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.btn-voltar { background: transparent; border: 1px solid var(--cor-primaria); color: var(--cor-texto); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }

.cabecalho-painel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.btn-adicionar { background: var(--cor-primaria); color: #111; padding: 0.8rem 1.5rem; font-size: 1rem; border-radius: 8px; cursor: pointer; border: none; font-weight: bold; }

.estado-vazio { text-align: center; padding: 4rem; opacity: 0.7; font-size: 1.2rem; }

/* Estilos dos Trilhos e Carrossel */
.listas-agrupadas {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.trilho-categoria {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.titulo-categoria {
  margin: 0;
  font-size: 1.5rem;
  color: var(--cor-texto);
  border-left: 4px solid var(--cor-primaria);
  padding-left: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.carrossel {
  display: flex;
  overflow-x: auto;
  gap: 1.5rem;
  padding-bottom: 1rem;
  scrollbar-width: none; /* Firefox */
}

.carrossel::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* Cartões de Mídia */
.cartao-midia {
  flex: 0 0 auto;
  width: 180px;
  background: var(--cor-card);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  transition: transform 0.2s;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  cursor: pointer;
}

.cartao-midia:hover {
  transform: translateY(-5px);
  border: 1px solid var(--cor-primaria);
}

.cartao-midia img {
  width: 100%;
  height: 260px;
  object-fit: cover;
  display: block;
}

.info-cartao {
  padding: 1rem;
}

.titulo {
  font-weight: bold;
  font-size: 0.95rem;
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nota { margin: 0; color: var(--cor-primaria); font-weight: bold; }

/* Etiquetas flutuantes */
.status-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: capitalize;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: 1px solid currentColor;
}

.status-tag.planejo { color: #aaaaaa; }
.status-tag.ativo { color: #38bdf8; }
.status-tag.finalizado { color: #4ade80; }
.status-tag.dropado { color: #ff4444; }

.btn-deletar {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 0, 0, 0.8);
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

.cartao-midia:hover .btn-deletar { opacity: 1; }
.btn-deletar:hover { transform: scale(1.1); background: red; }

/* Estilos da Modal de Edição */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-conteudo {
  background: var(--cor-card);
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  border: 1px solid var(--cor-primaria);
}

.modal-conteudo h3 { margin: 0; color: var(--cor-primaria); }

.grupo-campo { display: flex; flex-direction: column; gap: 0.5rem; font-weight: bold;}

.botoes-status { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.botoes-status button { background: transparent; border: 1px solid var(--cor-primaria); color: var(--cor-texto); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;}
.botoes-status button:disabled { background: var(--cor-primaria); color: #111; cursor: not-allowed; opacity: 1;}

input[type="number"], textarea {
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--cor-card);
  background: rgba(0,0,0,0.2);
  color: var(--cor-texto);
  font-family: inherit;
  box-sizing: border-box;
}

.acoes-modal { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
.btn-cancelar { background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
.btn-salvar { background: var(--cor-primaria); color: #111; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: bold;}

/* Cores por tipo para facilitar a batida de olho */
.badge-tipo.anime { color: #FFB6C1; } 
.badge-tipo.jogo { color: #38bdf8; }  
.badge-tipo.filme { color: #FFFACD; } 
/* Novas cores: */
.badge-tipo.serie { color: #c084fc; } /* Roxo */
.badge-tipo.manga { color: #fb923c; } /* Laranja */
.badge-tipo.livro { color: #a3e635; } /* Verde limão */

</style>