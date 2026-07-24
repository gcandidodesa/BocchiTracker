<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePerfilStore } from '../stores/perfilStore'

const router = useRouter()
const perfilStore = usePerfilStore()

// Lembre-se de manter suas chaves do Cloudinary aqui!
const CLOUD_NAME = 'dkg5zne5i';
const UPLOAD_PRESET = 'Bocchi-Tracker';

const nomeEditado = ref('')
const fotoEditada = ref('')
const fazendoUpload = ref(false)
const mensagemToast = ref('')

const modalTemaAberto = ref(false)
const temaEditado = ref({
  nome: '', 
  fundoApp: '',
  fundoModal: '',
  iconeEstrela: '',
  corFundoFallback: '#0f172a',
  corBorda: '#1e293b',
  corPrimaria: '#38bdf8',
  corTexto: '#f8fafc'
})

onMounted(() => {
  nomeEditado.value = perfilStore.nomeExibicao
  fotoEditada.value = perfilStore.fotoUrl || `https://ui-avatars.com/api/?name=${perfilStore.nomeExibicao}&background=333&color=fff`
})

async function salvarPerfil() {
  await perfilStore.atualizarPerfil(nomeEditado.value, fotoEditada.value)
  mensagemToast.value = "Perfil salvo com sucesso!"
  setTimeout(() => { mensagemToast.value = '' }, 3000)
}

async function fazerUploadImagem(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  if (arquivo.size > 5 * 1024 * 1024) {
    mensagemToast.value = "A imagem deve ter no máximo 5MB!";
    event.target.value = '';
    setTimeout(() => { mensagemToast.value = '' }, 3000);
    return;
  }

  fazendoUpload.value = true;
  mensagemToast.value = "Enviando imagem...";
  const formData = new FormData();
  formData.append('file', arquivo);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const resposta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const dados = await resposta.json();

    if (dados.secure_url) {
      fotoEditada.value = dados.secure_url; 
      await perfilStore.atualizarPerfil(nomeEditado.value, fotoEditada.value);
      mensagemToast.value = "Foto atualizada e salva no perfil!";
    } else {
      throw new Error("Falha ao gerar link");
    }
  } catch (erro) {
    console.error("Erro no upload:", erro);
    mensagemToast.value = "Erro ao enviar a imagem.";
  } finally {
    fazendoUpload.value = false;
    event.target.value = ''; 
    setTimeout(() => { mensagemToast.value = '' }, 3000);
  }
}

async function aplicarTemaPredefinido(nomeDoTema) {
  await perfilStore.atualizarTema(nomeDoTema); 
}

async function fazerUploadTema(event, chave) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  fazendoUpload.value = true;
  mensagemToast.value = "Enviando imagem do tema...";
  const formData = new FormData();
  formData.append('file', arquivo);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const resposta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const dados = await resposta.json();
    if (dados.secure_url) {
      temaEditado.value[chave] = dados.secure_url;
      mensagemToast.value = "Imagem carregada com sucesso!";
    }
  } catch (erro) {
    console.error("Erro no upload do tema:", erro);
    mensagemToast.value = "Erro ao enviar a imagem do tema.";
  } finally {
    fazendoUpload.value = false;
    // O event.target.value = ''; foi removido daqui para o nome não piscar!
    setTimeout(() => { mensagemToast.value = '' }, 3000);
  }
}

async function salvarTemaCustomizado() {
  const nomeDigitado = temaEditado.value.nome.trim();
  
  if (!nomeDigitado) {
    mensagemToast.value = "Por favor, dê um nome para o seu tema!";
    setTimeout(() => { mensagemToast.value = '' }, 3000);
    return;
  }

  await perfilStore.atualizarTema(nomeDigitado, temaEditado.value);
  modalTemaAberto.value = false;
  
  temaEditado.value = { nome: '', fundoApp: '', fundoModal: '', iconeEstrela: '', corFundoFallback: '#0f172a', corBorda: '#1e293b', corPrimaria: '#38bdf8', corTexto: '#f8fafc' };

  mensagemToast.value = "Tema salvo com sucesso!";
  setTimeout(() => { mensagemToast.value = '' }, 3000);
}

function editarTemaCustomizado(nomeTema, config) {
  temaEditado.value = {
    nome: nomeTema, 
    fundoApp: config.fundoApp || '',
    fundoModal: config.fundoModal || '',
    iconeEstrela: config.iconeEstrela || '',
    corFundoFallback: config.corFundoFallback || '#0f172a',
    corBorda: config.corBorda || '#1e293b',
    corPrimaria: config.corPrimaria || '#38bdf8',
    corTexto: config.corTexto || '#f8fafc'
  };
  modalTemaAberto.value = true;
}

// Variáveis para a modal de exclusão
const modalExclusaoAberto = ref(false)
const temaParaExcluir = ref('')

// Prepara a exclusão abrindo a modal
function tentarExcluirTema(nomeTema) {
  temaParaExcluir.value = nomeTema
  modalExclusaoAberto.value = true
}

// Cancela a exclusão
function cancelarExclusaoTema() {
  modalExclusaoAberto.value = false
  temaParaExcluir.value = ''
}

// Confirma e deleta de fato
async function confirmarExclusaoTema() {
  const nomeTema = temaParaExcluir.value
  delete perfilStore.temasCustomizados[nomeTema];
  
  if(perfilStore.temaAtual === nomeTema) {
    await perfilStore.atualizarTema('padrao');
  } else {
    await perfilStore.salvarConfiguracoesNoFirebase();
  }

  modalExclusaoAberto.value = false;
  temaParaExcluir.value = '';
  
  mensagemToast.value = "Tema excluído com sucesso!";
  setTimeout(() => { mensagemToast.value = '' }, 3000);
}
</script>

<template>
  <div class="config-container">
    <header class="cabecalho-config">
      <button class="btn-voltar" @click="router.push('/dashboard')">← Voltar</button>
      <h1>Configurações</h1>
    </header>

    <div class="secao-config">
      <h2>👤 Meu Perfil</h2>
      <p class="subtitulo">Atualize suas informações básicas.</p>

      <div class="form-perfil">
        <div class="avatar-container">
          <img :src="fotoEditada" alt="Sua foto de perfil" class="avatar-preview">
        </div>
        
        <div class="campos-perfil">
          <div class="grupo-input-perfil">
            <label>Nome do Perfil</label>
            <input type="text" v-model="nomeEditado" class="input-texto" placeholder="Seu nome aqui">
          </div>

          <div class="grupo-input-perfil">
            <label>Foto de Perfil</label>
            <div class="input-arquivo-customizado">
              <input 
                type="file" 
                id="input-foto" 
                accept="image/*" 
                @change="fazerUploadImagem" 
                class="input-escondido"
              />
              <label for="input-foto" class="btn-arquivo">
                <span v-if="fazendoUpload">⏳ Enviando...</span>
                <span v-else>📁 Escolher Arquivo</span>
              </label>
            </div>
          </div>
          
          <button class="btn-salvar-perfil" @click="salvarPerfil">Salvar Perfil</button>
        </div>
      </div>
    </div>

    <div class="secao-config">
      <h2>🎨 Aparência</h2>
      <p class="subtitulo">Personalize a interface do seu aplicativo.</p>

      <div class="grade-temas">
        <div 
          class="cartao-tema-padrao" 
          @click="aplicarTemaPredefinido('padrao')"
          :class="{ ativo: perfilStore.temaAtual === 'padrao' }"
        >
          <div class="preview-tema-padrao bg-padrao"></div>
          <p>Tema Padrão</p>
        </div>

        <div 
          class="cartao-tema-padrao" 
          @click="aplicarTemaPredefinido('Bocchi')"
          :class="{ ativo: perfilStore.temaAtual === 'Bocchi' }"
        >
          <div class="preview-tema-padrao bg-bocchi"></div>
          <p>Tema Bocchi</p>
        </div>

        <div 
          class="cartao-tema-custom" 
          v-for="(config, nomeTema) in perfilStore.temasCustomizados" 
          :key="nomeTema"
          :class="{ ativo: perfilStore.temaAtual === nomeTema }"
        >
          <div class="preview-tema-custom" 
               :style="{ 
                  backgroundColor: config.corFundoFallback,
                  borderColor: config.corBorda,
                  backgroundImage: config.fundoApp ? `url(${config.fundoApp})` : 'none'
               }"
               @click="aplicarTemaPredefinido(nomeTema)">
            <div v-if="config.fundoApp" class="overlay-texto"></div>
          </div>
          
          <p>{{ nomeTema }}</p>

          <div class="acoes-tema">
            <button class="btn-icone" @click.stop="editarTemaCustomizado(nomeTema, config)" title="Editar">✏️</button>
            <button class="btn-icone perigo" @click.stop="tentarExcluirTema(nomeTema)" title="Excluir">🗑️</button>
          </div>
        </div>

        <div class="cartao-tema-padrao btn-criar-novo" @click="modalTemaAberto = true">
          <div class="icone-mais">+</div>
          <p>Criar Novo</p>
        </div>
      </div>
    </div>

    <div v-if="mensagemToast" class="toast-mensagem">
      {{ mensagemToast }}
    </div>

    <div v-if="modalTemaAberto" class="modal-overlay">
      <div class="modal-conteudo">
        <h2>{{ temaEditado.nome ? 'Editar Tema' : 'Criar Tema Customizado' }}</h2>

        <!-- ============================================== -->
        <!-- ÁREA DE PREVIEW EM TEMPO REAL -->
        <!-- ============================================== -->
        <div class="preview-live-container" :style="{ 
          backgroundColor: temaEditado.corFundoFallback, 
          backgroundImage: temaEditado.fundoApp ? `url(${temaEditado.fundoApp})` : 'none',
          color: temaEditado.corTexto
        }">
          <div class="preview-live-modal" :style="{
            backgroundColor: 'var(--cor-card, #1e293b)',
            backgroundImage: temaEditado.fundoModal ? `url(${temaEditado.fundoModal})` : 'none',
            borderColor: temaEditado.corBorda
          }">
            <h4 :style="{ color: temaEditado.corTexto }">Preview Interativo</h4>
            
            <div class="preview-live-midia" :style="{ borderColor: temaEditado.corPrimaria }">
              <div class="preview-live-capa"></div>
              <div class="preview-live-info">
                <span :style="{ color: temaEditado.corTexto }">Exemplo Mídia</span>
                <div class="preview-live-nota" :style="{ backgroundColor: temaEditado.corPrimaria, color: '#111' }">
                  5
                  <img v-if="temaEditado.iconeEstrela" :src="temaEditado.iconeEstrela" class="icone-estrela-custom" alt="★">
                  <span v-else>★</span>
                </div>
              </div>
            </div>
            
            <button class="preview-live-btn" :style="{ backgroundColor: temaEditado.corPrimaria, color: '#111' }">
              Botão Destaque
            </button>
          </div>
        </div>
        <!-- ============================================== -->

        <div class="grupo-input">
          <label>Nome do Tema *</label>
          <input type="text" v-model="temaEditado.nome" placeholder="Ex: Meu Tema Dark" class="input-texto-modal" :disabled="!!perfilStore.temasCustomizados[temaEditado.nome]">
        </div>

        <div class="grupo-input">
          <label>Plano de Fundo do App (Imagem)</label>
          <input type="file" accept="image/*" @change="(e) => fazerUploadTema(e, 'fundoApp')">
        </div>

        <div class="grupo-input">
          <label>Plano de Fundo das Modais (Imagem)</label>
          <input type="file" accept="image/*" @change="(e) => fazerUploadTema(e, 'fundoModal')">
        </div>

        <div class="grupo-input">
          <label>Ícone das Estrelas das Notas (Imagem)</label>
          <input type="file" accept="image/*" @change="(e) => fazerUploadTema(e, 'iconeEstrela')">
        </div>

        <hr>
        <p>Ajuste as cores da interface:</p>

        <div class="cores-container">
          <div class="grupo-input">
            <label>Fundo</label>
            <input type="color" v-model="temaEditado.corFundoFallback">
          </div>
          <div class="grupo-input">
            <label>Bordas</label>
            <input type="color" v-model="temaEditado.corBorda">
          </div>
          <div class="grupo-input">
            <label>Destaque</label>
            <input type="color" v-model="temaEditado.corPrimaria">
          </div>
          <div class="grupo-input">
            <label>Texto</label>
            <input type="color" v-model="temaEditado.corTexto">
          </div>
        </div>

        <div class="botoes-modal">
          <button class="btn-cancelar" @click="modalTemaAberto = false">Cancelar</button>
          <button class="btn-salvar" @click="salvarTemaCustomizado">Salvar Tema</button>
        </div>
      </div>
    </div>

    <!-- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DO TEMA -->
    <div v-if="modalExclusaoAberto" class="modal-overlay" @click.self="cancelarExclusaoTema">
      <div class="modal-conteudo" style="max-width: 400px; text-align: center;">
        <h3 style="color: #ff6b6b; margin: 0 0 10px 0; font-size: 1.5rem;">⚠️ Atenção</h3>
        <p style="font-size: 1rem; margin-bottom: 5px;">Tem certeza que deseja excluir o tema <strong>"{{ temaParaExcluir }}"</strong>?</p>
        <p style="font-size: 0.85rem; opacity: 0.7;">Esta ação não pode ser desfeita.</p>
        
        <div class="botoes-modal" style="justify-content: center; margin-top: 1.5rem;">
          <button class="btn-cancelar" @click="cancelarExclusaoTema">Cancelar</button>
          <!-- Botão vermelho para confirmar a exclusão -->
          <button class="btn-salvar" style="background-color: #ff6b6b; color: #fff;" @click="confirmarExclusaoTema">Sim, Excluir</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  color: var(--cor-texto, #f8fafc);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.config-container * { font-family: inherit; }

.cabecalho-config {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-voltar {
  background: transparent;
  color: var(--cor-primaria, #38bdf8);
  border: 1px solid var(--cor-primaria, #38bdf8);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.btn-voltar:hover {
  background: var(--cor-primaria, #38bdf8);
  color: #111;
}

.secao-config {
  background-color: var(--cor-card, #1e293b);
  background-image: var(--bg-modal-custom, none);
  background-size: cover;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  border: 1px solid var(--cor-borda-custom, transparent);
}

.subtitulo { color: var(--cor-texto, #888); margin-bottom: 2rem; font-size: 0.9rem; }

.form-perfil { display: flex; gap: 2rem; align-items: flex-start; }
.avatar-container { flex-shrink: 0; }
.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--cor-primaria, #38bdf8);
}

.campos-perfil { display: flex; flex-direction: column; gap: 1.5rem; width: 100%; }
.grupo-input-perfil { display: flex; flex-direction: column; gap: 0.5rem; }

.input-texto {
  background-color: rgba(0, 0, 0, 0.2);
  color: var(--cor-texto, #f8fafc);
  border: 1px solid var(--cor-borda-custom, #333);
  padding: 10px;
  border-radius: 8px;
  outline: none;
}

.input-escondido { display: none; }

.btn-arquivo {
  display: inline-block;
  background-color: transparent;
  color: var(--cor-texto, #fff);
  border: 1px dashed var(--cor-primaria, #38bdf8);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.btn-arquivo:hover { background-color: rgba(128, 128, 128, 0.1); }

.btn-salvar-perfil {
  background-color: var(--cor-primaria, #38bdf8);
  color: #111;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  align-self: flex-end;
  transition: opacity 0.2s;
}

.btn-salvar-perfil:hover { opacity: 0.8; }

.grade-temas {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: flex-start; 
}

.cartao-tema-padrao, .cartao-tema-custom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  width: 140px;
}

.cartao-tema-padrao p, .cartao-tema-custom p {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
}

.preview-tema-padrao, .preview-tema-custom {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.preview-tema-padrao:hover, .preview-tema-custom:hover { transform: scale(1.05); }

.ativo .preview-tema-padrao, .ativo .preview-tema-custom {
  outline: none;
  box-shadow: 0 0 0 3px var(--cor-card, #1e293b), 0 0 0 6px var(--cor-primaria, #38bdf8);
}

.bg-padrao { background: linear-gradient(135deg, #0f172a 50%, #38bdf8 50%); }
.bg-bocchi { background: linear-gradient(135deg, #1e1e1e 50%, #FFB6C1 50%); }

.btn-criar-novo { cursor: pointer; }

.icone-mais {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  border: 2px dashed var(--cor-primaria, #38bdf8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--cor-primaria, #38bdf8);
  transition: background-color 0.2s;
}

.btn-criar-novo:hover .icone-mais { background-color: rgba(128, 128, 128, 0.1); }

.overlay-texto {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.4);
}

.acoes-tema {
  display: flex;
  gap: 0.8rem;
  justify-content: center;
  width: 100%;
}

.btn-icone {
  background: transparent;
  color: var(--cor-texto, #f8fafc);
  border: 1px solid currentColor;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.btn-icone:hover { 
  opacity: 1;
  transform: translateY(-2px); 
  background: rgba(128, 128, 128, 0.15);
}

.btn-icone.perigo:hover { 
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
  color: #ff6b6b;
}

/* =======================================
   ESTILOS DA MODAL E PREVIEW LIVE
   ======================================= */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-conteudo {
  background-color: var(--cor-card, #1e293b);
  color: var(--cor-texto, #f8fafc); 
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  border: 1px solid var(--cor-borda-custom, transparent);
  
  /* Permite rolar se a tela for muito pequena */
  max-height: 90vh;
  overflow-y: auto;
}

.modal-conteudo h2 { margin: 0; font-size: 1.5rem; }
.modal-conteudo p { margin: 0; font-size: 0.9rem; opacity: 0.8; }
.modal-conteudo hr { border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 0.5rem 0; }

/* ---- O PREVIEW MÁGICO ---- */
.preview-live-container {
  width: 100%;
  min-height: 220px; /* Trocamos height fixo por min-height para garantir espaço */
  flex-shrink: 0; /* A MÁGICA AQUI: Impede que o navegador esprema a div */
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 0.5rem;
}
.preview-live-modal {
  width: 80%;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
}

.preview-live-modal h4 {
  margin: 0;
  font-size: 1.1rem;
}

.preview-live-midia {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(0,0,0,0.3);
  padding: 0.5rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.preview-live-capa {
  width: 35px;
  height: 50px;
  background: #333;
  border-radius: 4px;
}

.preview-live-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.preview-live-info span {
  font-size: 0.85rem;
  font-weight: bold;
}

.preview-live-nota {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  width: fit-content;
}

.icone-estrela-custom {
  width: 1.2em; height: 1.2em; object-fit: contain; vertical-align: text-bottom; margin-left: 2px;
}

.preview-live-btn {
  padding: 6px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.8rem;
}
/* -------------------------- */

.grupo-input { display: flex; flex-direction: column; gap: 0.5rem; }
.grupo-input label { font-size: 0.9rem; font-weight: bold; opacity: 0.9; }

.input-texto-modal {
  background-color: rgba(0, 0, 0, 0.2);
  color: var(--cor-texto, #f8fafc);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 1rem;
  outline: none;
}
.input-texto-modal:focus { border-color: var(--cor-primaria, #38bdf8); }
.input-texto-modal:disabled { opacity: 0.5; cursor: not-allowed; }

.grupo-input input[type="file"] {
  background-color: rgba(0, 0, 0, 0.2);
  color: var(--cor-texto, #f8fafc);
  padding: 10px;
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  cursor: pointer;
}

.cores-container { 
  display: flex; 
  flex-direction: row; 
  gap: 1.5rem; 
  flex-wrap: wrap; 
}
.cores-container input[type="color"] {
  -webkit-appearance: none;
  border: none; width: 60px; height: 40px; border-radius: 8px; cursor: pointer; padding: 0; background: none;
}
.cores-container input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
.cores-container input[type="color"]::-webkit-color-swatch {
  border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 8px;
}

.botoes-modal { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
.btn-cancelar {
  background-color: transparent; color: #ff6b6b; border: 1px solid #ff6b6b; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s;
}
.btn-cancelar:hover { background-color: rgba(255, 107, 107, 0.1); }
.btn-salvar {
  background-color: var(--cor-primaria, #38bdf8); color: #111; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: opacity 0.2s;
}
.btn-salvar:hover { opacity: 0.8; }

.toast-mensagem {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: var(--cor-primaria, #38bdf8);
  color: #111;
  padding: 15px 25px;
  border-radius: 8px;
  font-weight: bold;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  z-index: 10000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Customiza a barrinha de scroll da modal */
.modal-conteudo::-webkit-scrollbar {
  width: 8px;
}
.modal-conteudo::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.2); 
  border-radius: 8px;
}
.modal-conteudo::-webkit-scrollbar-thumb {
  background: var(--cor-primaria, #888); 
  border-radius: 8px;
}
</style>