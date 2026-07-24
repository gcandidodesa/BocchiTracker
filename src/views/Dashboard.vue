<!-- src/views/Dashboard.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { db, collection, getDocs, doc, updateDoc, deleteDoc} from '../services/firebase'
import { usePerfilStore } from '../stores/perfilStore'
import { query, where } from 'firebase/firestore'

const router = useRouter()
const perfilStore = usePerfilStore()
const minhasMidias = ref([])
const carregando = ref(true)

// 'geral' é a nova aba de Visão Geral (padrão)
const statusAtivo = ref('geral')

const mensagemToast = ref('')

// Lógica de Modais
const modalAberto = ref(false)
const modalConfirmacaoAberto = ref(false)
const midiaEmEdicao = ref(null)

const formularioEdicao = ref({
  status: '',
  nota: null,
  resenha: ''
})

const menuPerfilAberto = ref(false)
const fotoPerfil = computed(() => {
  if (perfilStore.fotoUrl) {
    return perfilStore.fotoUrl;
  }
  // Foto padrão
  return `https://ui-avatars.com/api/?name=${perfilStore.nomeExibicao}&background=333&color=fff`;
})


function irParaConfiguracoes() {
  menuPerfilAberto.value = false;
  router.push('/configuracoes')
}

function trocarPerfil() {
  menuPerfilAberto.value = false;
  router.push('/');
}


async function buscarMidiasDoPerfil() {
  carregando.value = true;
  minhasMidias.value = []

  try{
    const perfilAtual = perfilStore.perfilAtivo || 'Padrao';
    const consultaFiltrada = query(
      collection(db, "midias"),
      where("perfil", "==", perfilAtual)
    );
    const querySnapshot = await getDocs(consultaFiltrada);
    const midiasTemp = [];

    querySnapshot.forEach((doc) => {
      midiasTemp.push({ id: doc.id, ...doc.data() });
    });

    midiasTemp.sort((a,b) => b.dataAdicao?.toMillis() - a.dataAdicao?.toMillis());
    minhasMidias.value = midiasTemp;
  } catch (erro) {
    console.error("Erro ao bucar:", erro);
  } finally {
    carregando.value = false;
  }
  
}

onMounted(() => {
  buscarMidiasDoPerfil();
})

watch(() => perfilStore.perfilAtivo, () => {
  buscarMidiasDoPerfil();
})

// Mágica da Visão Geral + Abas de Status
const midiasAgrupadas = computed(() => {
  const categorias = {
    Animes: [],
    Mangás: [],
    Jogos: [],
    Filmes: [],
    Séries: [],
    Livros: []
  }

  // Se estiver na Visão Geral, pega TUDO. Se estiver em uma aba, filtra pelo status
  const midiasFiltradas = statusAtivo.value === 'geral' 
    ? minhasMidias.value 
    : minhasMidias.value.filter(m => m.status === statusAtivo.value)

  midiasFiltradas.forEach(midia => {
    if (midia.tipo === 'anime') categorias.Animes.push(midia)
    else if (midia.tipo === 'manga') categorias.Mangás.push(midia)
    else if (midia.tipo === 'jogo') categorias.Jogos.push(midia)
    else if (midia.tipo === 'filme') categorias.Filmes.push(midia)
    else if (midia.tipo === 'serie') categorias.Séries.push(midia)
    else if (midia.tipo === 'livro') categorias.Livros.push(midia)
  })

  // Esconde prateleiras sem itens
  return Object.fromEntries(
    Object.entries(categorias).filter(([_, lista]) => lista.length > 0)
  )
})

// Converte a chave interna para o texto amigável da etiqueta de status
function formatarStatus(status) {
  const mapa = {
    planejo: 'Para Consumir',
    ativo: 'Consumindo',
    finalizado: 'Finalizado',
    dropado: 'Dropado'
  }
  return mapa[status] || status
}

// Funções de Modal e Ações
function abrirEdicao(midia) {
  midiaEmEdicao.value = midia
  formularioEdicao.value = {
    status: midia.status,
    nota: midia.nota,
    resenha: midia.resenha || ''
  }
  modalAberto.value = true
}

function fecharEdicao() {
  modalAberto.value = false
  midiaEmEdicao.value = null
}

async function salvarEdicao() {
  try {
    const midiaRef = doc(db, "midias", midiaEmEdicao.value.id)
    const dadosAtualizados = {
      status: formularioEdicao.value.status,
      nota: formularioEdicao.value.nota !== '' ? formularioEdicao.value.nota : null,
      resenha: formularioEdicao.value.resenha
    }

    await updateDoc(midiaRef, dadosAtualizados)
    
    const index = minhasMidias.value.findIndex(m => m.id === midiaEmEdicao.value.id)
    if (index !== -1) {
      minhasMidias.value[index] = { ...minhasMidias.value[index], ...dadosAtualizados }
    }

    fecharEdicao()
    
    mensagemToast.value = "Alterações salvas com sucesso!"
    setTimeout(() => { mensagemToast.value = '' }, 3000)

  } catch (erro) {
    console.error("Erro ao atualizar:", erro)
    mensagemToast.value = "Erro ao salvar edição!"
    setTimeout(() => { mensagemToast.value = '' }, 3000)
  }
}

function tentarExcluirMidia() {
  modalConfirmacaoAberto.value = true
}

function cancelarExclusao() {
  modalConfirmacaoAberto.value = false
}

async function confirmarExclusao() {
  try {
    const midiaRef = doc(db, "midias", midiaEmEdicao.value.id);
    await deleteDoc(midiaRef);
    
    minhasMidias.value = minhasMidias.value.filter(m => m.id !== midiaEmEdicao.value.id);
    
    modalConfirmacaoAberto.value = false;
    fecharEdicao();

    mensagemToast.value = "Mídia excluída da coleção!"
    setTimeout(() => { mensagemToast.value = '' }, 3000)

  } catch (erro) {
    console.error("Erro ao excluir:", erro);
    mensagemToast.value = "Erro ao excluir a mídia!"
    setTimeout(() => { mensagemToast.value = '' }, 3000)
  }
}
</script>

<template>
  <div class="dashboard-container">
    <header class="cabecalho">
      <div class="topo-cabecalho">
        <h2>Minha Coleção</h2>
        
        <!-- Grupo de Ações do Topo -->
        <div class="acoes-topo">
          <!-- BOTÃO PARA ADICIONAR MÍDIA -->
          <button class="btn-adicionar" @click="router.push('/adicionar')">
            ＋ Adicionar Mídia
          </button>
          <div class="perfil-container">
            <img 
              :src="fotoPerfil" 
              alt="Avatar do Perfil" 
              class="avatar-perfil"
              @click="menuPerfilAberto = !menuPerfilAberto"
            />
            <!-- Menu Suspenso -->
            <Transition name="fade">
              <div v-if="menuPerfilAberto" class="menu-suspenso">
                <div class="menu-cabecalho">
                  <span class="nome-perfil">{{ perfilStore.nomeExibicao}}</span>
                </div>
                <button class="item-menu" @click="irParaConfiguracoes">
                  ⚙️ Configurações
                </button>
                <button class="item-menu" @click="trocarPerfil">
                  🔄 Trocar Perfil
                </button>
              </div>
            </Transition>
          </div>
        </div>
        <!-- Fundo invisível para fechar o menu ao clicar fora -->
        <div v-if="menuPerfilAberto" class="overlay-invisivel" @click="menuPerfilAberto = false"></div>

      </div>
      
      <!-- ABA VISÃO GERAL + ABAS DE STATUS -->
      <nav class="abas-status">
        <button 
          :class="{ ativo: statusAtivo === 'geral' }" 
          @click="statusAtivo = 'geral'"
        >Visão Geral</button>
        <button 
          :class="{ ativo: statusAtivo === 'planejo' }" 
          @click="statusAtivo = 'planejo'"
        >Para Consumir</button>
        <button 
          :class="{ ativo: statusAtivo === 'ativo' }" 
          @click="statusAtivo = 'ativo'"
        >Consumindo</button>
        <button 
          :class="{ ativo: statusAtivo === 'finalizado' }" 
          @click="statusAtivo = 'finalizado'"
        >Finalizados</button>
        <button 
          :class="{ ativo: statusAtivo === 'dropado' }" 
          @click="statusAtivo = 'dropado'"
        >Dropados</button>
      </nav>
    </header>

    <!-- Estados da Tela -->
    <main v-if="carregando" class="estado-vazio">
      <p>Abrindo o cofre...</p>
    </main>
    
    <main v-else-if="Object.keys(midiasAgrupadas).length === 0" class="estado-vazio">
      <p>Nenhuma mídia encontrada nesta seção.</p>
    </main>

    <!-- Prateleiras -->
    <main v-else class="colecao-grid">
      <section v-for="(lista, nomeCategoria) in midiasAgrupadas" :key="nomeCategoria" class="categoria-secao">
        
        <h3 class="titulo-categoria">
          {{ nomeCategoria }} 
          <span class="contador">{{ lista.length }}</span>
        </h3>
        
        <div class="carrossel-midias">
          <div class="cartao-midia" v-for="midia in lista" :key="midia.id" @click="abrirEdicao(midia)">
            
            <!-- BADGE DE STATUS (Aparece na Visão Geral) -->
            <span v-if="statusAtivo === 'geral'" class="badge-status" :class="midia.status">
              {{ formatarStatus(midia.status) }}
            </span>

            <img :src="midia.capaUrl" :alt="midia.titulo">
            
            <div class="info-hover">
              <p class="titulo">{{ midia.titulo }}</p>
              <div class="badge-nota" v-if="midia.nota !== null">
                {{ midia.nota }} 
                <!-- Verifica o icone no badge de nota da home -->
                <template v-if="perfilStore.temasCustomizados[perfilStore.temaAtual]?.iconeEstrela">
                  <img 
                    :src="perfilStore.temasCustomizados[perfilStore.temaAtual].iconeEstrela" 
                    class="icone-estrela-custom" 
                    alt="Estrela" 
                  />
                </template>
                <template v-else>
                  <span>★</span>
                </template>
              </div>
            </div>
          </div>
        </div>

      </section>
    </main>

    <!-- MODAL DE EDIÇÃO -->
    <Transition name="fade">
      <div v-if="modalAberto" class="modal-overlay" @click.self="fecharEdicao">
        <div class="modal-conteudo">
          
          <header class="modal-cabecalho">
            <h3>Editar: {{ midiaEmEdicao?.titulo }}</h3>
            <button class="btn-fechar" @click="fecharEdicao">✕</button>
          </header>

          <div class="modal-corpo">
            <div class="grupo-campo">
              <label>Status:</label>
              <select v-model="formularioEdicao.status" class="select-estilizado">
                <option value="planejo">Para Consumir</option>
                <option value="ativo">Consumindo</option>
                <option value="finalizado">Finalizado</option>
                <option value="dropado">Dropado</option>
              </select>
            </div>

            <div class="grupo-campo">
              <label>Avaliação (0 a 5):</label>
              <div class="seletor-nota">
                <button 
                  v-for="n in 6" 
                  :key="n - 1"
                  type="button"
                  :class="{ ativo: formularioEdicao.nota === (n - 1) }"
                  @click="formularioEdicao.nota = (n - 1)"
                >
                  {{ n - 1 }} 
                  <!-- Verifica o icone no modal de edição da home -->
                  <template v-if="perfilStore.temasCustomizados[perfilStore.temaAtual]?.iconeEstrela">
                    <img 
                      :src="perfilStore.temasCustomizados[perfilStore.temaAtual].iconeEstrela" 
                      class="icone-estrela-custom" 
                      alt="Estrela" 
                    />
                  </template>
                  <template v-else>
                    <span class="icone-nota">★</span>
                  </template>
                </button>
              </div>
            </div>

            <div class="grupo-campo">
              <label>Resenha:</label>
              <textarea rows="3" v-model="formularioEdicao.resenha" placeholder="Suas anotações..."></textarea>
            </div>
          </div>

          <footer class="modal-rodape">
            <button class="btn-excluir" @click="tentarExcluirMidia">🗑️ Excluir Mídia</button>
            <div class="acoes-direita">
              <button class="btn-cancelar" @click="fecharEdicao">Cancelar</button>
              <button class="btn-salvar" @click="salvarEdicao">Salvar Alterações</button>
            </div>
          </footer>
          
        </div>
      </div>
    </Transition>

    <!-- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO -->
    <Transition name="fade">
      <div v-if="modalConfirmacaoAberto" class="modal-overlay modal-sobreposto" @click.self="cancelarExclusao">
        <div class="modal-conteudo modal-pequeno">
          <div class="modal-corpo texto-centro">
            <h3 class="titulo-perigo">⚠️ Atenção</h3>
            <p>Tem certeza que deseja remover <strong>"{{ midiaEmEdicao?.titulo }}"</strong> da sua coleção?</p>
            <p class="texto-dica">Esta ação não poderá ser desfeita.</p>
          </div>
          
          <footer class="modal-rodape centralizado">
            <button class="btn-cancelar" @click="cancelarExclusao">Não, manter</button>
            <button class="btn-excluir" @click="confirmarExclusao">Sim, excluir</button>
          </footer>
        </div>
      </div>
    </Transition>

    <!-- TOAST DE NOTIFICAÇÃO -->
    <Transition name="fade">
      <div v-if="mensagemToast" class="toast-aviso">
        {{ mensagemToast }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Base */
.dashboard-container { padding: 2rem; max-width: 1200px; margin: 0 auto; color: var(--cor-texto); }
.cabecalho { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 3rem; }

.topo-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.topo-cabecalho h2 { font-size: 2rem; color: var(--cor-texto); margin: 0; }

/* Botão Adicionar Mídia */
.btn-adicionar {
  background: var(--cor-primaria);
  color: #111;
  border: none;
  padding: 0.7rem 1.3rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-adicionar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--cor-primaria);
}

.estado-vazio { text-align: center; padding: 5rem 0; font-size: 1.2rem; color: var(--cor-texto); opacity: 0.7; }

/* Abas */
.abas-status {
  display: flex;
  gap: 0.8rem;
  background: var(--cor-card);
  padding: 0.5rem;
  border-radius: 12px;
  flex-wrap: wrap;
}

.abas-status button {
  background: transparent;
  border: none;
  color: var(--cor-texto);
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
}

.abas-status button:hover { background: rgba(255,255,255,0.05); }
.abas-status button.ativo { background: var(--cor-primaria); color: #111; box-shadow: 0 0 10px var(--cor-primaria); }

/* Prateleiras */
.categoria-secao { margin-bottom: 3rem; }
.titulo-categoria { font-size: 1.4rem; color: var(--cor-texto); border-bottom: 2px solid var(--cor-card); padding-bottom: 0.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; }
.contador { background: var(--cor-card); color: var(--cor-texto); font-size: 0.9rem; padding: 0.2rem 0.6rem; border-radius: 20px; }

/* Carrossel e Cartões */
.carrossel-midias { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.5rem; }
.cartao-midia { position: relative; border-radius: 12px; overflow: hidden; cursor: pointer; aspect-ratio: 2 / 3; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.3s, box-shadow 0.3s; }
.cartao-midia:hover { transform: translateY(-8px); box-shadow: 0 8px 20px rgba(0,0,0,0.5); border: 1px solid var(--cor-primaria); }
.cartao-midia img { width: 100%; height: 100%; object-fit: cover; transition: filter 0.3s; }

/* Etiqueta de Status na Capa (Visão Geral) */
.badge-status {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  z-index: 5;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  border: 1px solid currentColor;
}

.badge-status.planejo { color: #38bdf8; }
.badge-status.ativo { color: #a3e635; }
.badge-status.finalizado { color: #ffd900; }
.badge-status.dropado { color: #ff4444; }

/* Hover info */
.info-hover { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 1rem; opacity: 0; transition: opacity 0.3s; }
.cartao-midia:hover .info-hover { opacity: 1; }
.cartao-midia:hover img { filter: brightness(0.6); }
.info-hover .titulo { margin: 0 0 0.5rem 0; font-weight: bold; font-size: 0.95rem; text-shadow: 1px 1px 3px black; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: #fff;} /* A cor do titulo no card mantemos branco pelo fundo escuro do degradê */
.badge-nota { align-self: flex-start; background: #ffd900; color: #111; font-weight: 900; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.85rem; display: flex; align-items: center; gap: 2px;}

/* Modais */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-conteudo { background: var(--cor-card); background-image: var(--bg-modal-custom); background-size: cover; color: var(--cor-texto); border: 1px solid var(--cor-borda-custom, transparent); border-radius: 12px; width: 90%; max-width: 500px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.modal-cabecalho { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 1rem; }
.modal-cabecalho h3 { margin: 0; font-size: 1.2rem; color: var(--cor-texto); }
.btn-fechar { background: transparent; border: none; color: #ff4444; font-size: 1.5rem; cursor: pointer; }
.modal-corpo { display: flex; flex-direction: column; gap: 1.5rem; }
.grupo-campo { display: flex; flex-direction: column; gap: 0.5rem; font-weight: bold; }
.select-estilizado, textarea { padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0,0,0,0.2); color: var(--cor-texto); font-family: inherit; width: 100%; box-sizing: border-box; }
.select-estilizado:focus, textarea:focus { border-color: var(--cor-primaria); outline: none; }
.select-estilizado option { background: var(--cor-card); color: var(--cor-texto); }
.modal-rodape { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; }
.acoes-direita { display: flex; gap: 1rem; }
.btn-excluir { background: #ff4444; color: white; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; font-weight: bold; border: none; transition: background 0.2s; }
.btn-excluir:hover { background: #cc0000; }
.btn-cancelar { background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; font-weight: bold; }
.btn-salvar { background: var(--cor-primaria); color: #111; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; font-weight: bold; border: none; }

/* Botões de Nota */
.seletor-nota { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.seletor-nota button { min-width: 45px; height: 38px; border-radius: 8px; border: 2px solid var(--cor-primaria); background: rgba(0, 0, 0, 0.3); color: var(--cor-texto); font-weight: bold; font-size: 1rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px; }
.icone-nota { font-size: 1rem; color: #666; transition: color 0.3s; }
.icone-estrela-custom { width: 1.2em; height: 1.2em; object-fit: contain; vertical-align: text-bottom; margin-left: 2px; }

.seletor-nota button:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-2px); }
.seletor-nota button.ativo { background: var(--cor-primaria); color: #111; border-color: var(--cor-primaria); transform: scale(1.1) translateY(-2px); box-shadow: 0 5px 15px var(--cor-primaria); }
.seletor-nota button.ativo .icone-nota { color: #ffd900; }

/* Modal de Confirmação */
.modal-sobreposto { z-index: 1500; background: rgba(0, 0, 0, 0.85); }
.modal-pequeno { max-width: 400px; padding: 2rem 1.5rem; }
.texto-centro { text-align: center; gap: 1rem; }
.titulo-perigo { color: #ff4444; font-size: 1.5rem; margin: 0 0 1rem 0; }
.texto-dica { font-size: 0.9rem; color: var(--cor-texto); opacity: 0.7; margin-top: 0.5rem; }
.modal-rodape.centralizado { justify-content: center; margin-top: 1.5rem; gap: 1rem; }

/* Toast */
.toast-aviso { position: fixed; bottom: 30px; right: 30px; background-color: var(--cor-primaria); color: #111; padding: 1rem 1.5rem; border-radius: 8px; font-weight: bold; font-size: 1.1rem; box-shadow: 0 8px 20px rgba(0,0,0,0.4); z-index: 2000; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(20px); }

/* Container dos botões no topo */
.acoes-topo { display: flex; align-items: center; gap: 1.5rem; }

/* =========================================
   Menu Suspenso do Perfil (Avatar)
   ========================================= */
.perfil-container { position: relative; display: flex; align-items: center; z-index: 1000; }
.avatar-perfil { width: 45px; height: 45px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 2px solid var(--cor-primaria); transition: transform 0.2s, box-shadow 0.2s; }
.avatar-perfil:hover { transform: scale(1.05); box-shadow: 0 0 10px var(--cor-primaria); }

.menu-suspenso {
  position: absolute;
  top: 60px;
  right: 0;
  background: var(--cor-card);
  border: 1px solid var(--cor-borda-custom, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
  width: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.menu-cabecalho { padding: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-weight: bold; text-align: center; color: var(--cor-primaria); }
.item-menu { background: transparent; color: var(--cor-texto); border: none; padding: 1rem; text-align: left; font-size: 0.95rem; cursor: pointer; transition: background 0.2s; display: flex; gap: 0.8rem; align-items: center; }
.item-menu:hover { background: rgba(255, 255, 255, 0.05); }

/* Fundo invisível para capturar o clique fora do menu */
.overlay-invisivel { position: fixed; inset: 0; z-index: 999; }
</style>