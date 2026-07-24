<!-- src/views/Configuracoes.vue -->
<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePerfilStore } from '../stores/perfilStore'

const router = useRouter()
const perfilStore = usePerfilStore()

// --- ESTADOS DO PERFIL ---
// Carregamos os dados atuais da store (ajuste se suas variáveis tiverem nomes diferentes)
const nomeEditado = ref(perfilStore.nomeExibicao)
const fotoEditada = ref(perfilStore.fotoUrl) 
const fazendoUpload = ref(false)

watch(() => perfilStore.nomeExibicao, (novoNome) => {nomeEditado.value = novoNome})
watch(() => perfilStore.fotoUrl, (novaFoto) => {fotoEditada.value = novaFoto})

//-- CONFIGURAÇÕES CLOUDINARY --
const CLOUD_NAME = 'dkg5zne5i';
const UPLOAD_PRESET = 'Bocchi-Tracker';


// --- ESTADOS DO TEMA ---
const temaSelecionado = ref(perfilStore.temaAtual || 'padrao')
const modalTemaAberto = ref(false)
const mensagemToast = ref('')

watch (() => perfilStore.temaAtual, (novoTema) => {temaSelecionado.value - novoTema})

// --- FUNÇÕES ---

async function fazerUploadImagem(event) {
  console.log("1. Botão de upload clicado!");

  const arquivo = event.target.files[0];
  if (!arquivo) {
    console.log("Nenhum arquivo selecionado.");
    return;
  }

  console.log("2. Arquivo selecionado:", arquivo.name, "| Tamanho:", arquivo.size);

  if (arquivo.size > 5 * 1024 * 1024) {
    console.warn("Arquivo muito grande!");
    mensagemToast.value = "A imagem deve ter no máximo 5MB!";
    event.target.value = ''; // Limpa o input
    setTimeout(() => { mensagemToast.value = '' }, 3000);
    return;
  }

  // Verificação de segurança das credenciais
  if (CLOUD_NAME === 'SEU_CLOUD_NAME_AQUI' || UPLOAD_PRESET === 'SEU_UPLOAD_PRESET_AQUI') {
    console.error("ERRO: As chaves do Cloudinary não foram configuradas no código!");
    mensagemToast.value = "Configure as chaves do Cloudinary!";
    setTimeout(() => { mensagemToast.value = '' }, 3000);
    return;
  }

  fazendoUpload.value = true;
  const formData = new FormData();
  formData.append('file', arquivo);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    console.log("3. Enviando para o Cloudinary...");
    const resposta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const dados = await resposta.json();
    console.log("4. Resposta do Cloudinary recebida:", dados);

    if (dados.secure_url) {
      fotoEditada.value = dados.secure_url; 
      
      console.log("5. Salvando no Firebase...");
      await perfilStore.atualizarPerfil(nomeEditado.value, fotoEditada.value);
      
      mensagemToast.value = "Foto atualizada e salva no perfil!";
    } else {
      throw new Error("Falha ao gerar link: " + (dados.error?.message || "Erro desconhecido"));
    }
  } catch (erro) {
    console.error("Erro no upload:", erro);
    mensagemToast.value = "Erro ao enviar a imagem.";
  } finally {
    fazendoUpload.value = false;
    
    // MUDANÇA CRUCIAL: Limpa a memória do input para permitir o upload da mesma foto de novo
    event.target.value = ''; 
    
    setTimeout(() => { mensagemToast.value = '' }, 3000);
  }
}


async function salvarPerfil() {
if (!nomeEditado.value) {
    mensagemToast.value = "O nome não pode ser vazio!";
    setTimeout(() => { mensagemToast.value = '' }, 3000);
    return;
  }
  await perfilStore.atualizarPerfil(nomeEditado.value, fotoEditada.value);
  
  mensagemToast.value = "Perfil atualizado com sucesso!";
  setTimeout(() => { mensagemToast.value = '' }, 3000);
}

function aplicarTemaPredefinido(nomeTema) {
  temaSelecionado.value = nomeTema
  perfilStore.aplicarTema(nomeTema);
  
  mensagemToast.value = `Tema ${nomeTema} aplicado!`
  setTimeout(() => { mensagemToast.value = '' }, 3000)
}

function abrirCriacaoTema() {
  modalTemaAberto.value = true
}

function fecharModalTema() {
  modalTemaAberto.value = false
}

function salvarTemaCustomizado() {
  // Lógica futura para salvar as cores escolhidas
  fecharModalTema()
  mensagemToast.value = "Tema customizado salvo!"
  setTimeout(() => { mensagemToast.value = '' }, 3000)
}
</script>

<template>
  <div class="configuracoes-container">
    <header class="cabecalho-pagina">
      <button class="btn-voltar" @click="router.back()">← Voltar</button>
      <h2>Configurações</h2>
    </header>

    <main class="grid-configuracoes">
      
      <!-- SEÇÃO 1: EDIÇÃO DE PERFIL -->
      <section class="cartao-config">
        <h3>👤 Meu Perfil</h3>
        <p class="descricao-config">Atualize suas informações básicas.</p>
        
        <div class="form-perfil">
          <!-- Preview da Foto -->
          <div class="foto-preview-area">
            <img 
              :src="fotoEditada || `https://ui-avatars.com/api/?name=${nomeEditado}&background=333&color=fff`" 
              alt="Preview do Avatar" 
              class="avatar-preview"
            >
          </div>

          <div class="campos-perfil">
            <div class="grupo-campo">
              <label>Nome do Perfil</label>
              <input type="text" v-model="nomeEditado" placeholder="Como quer ser chamado?" />
            </div>

            <div class="grupo-campo">
              <label>Foto de Perfil</label>
              <input
                type="file"
                id = "input-foto"
                accept="image/*"
                @change="fazerUploadImagem"
                class="input-escondido" 
                />

                <label for="input-foto" class="btn-upload" :class="{'carregando': fazendoUpload}">
                    <span v-if="fazendoUpload">⏳ Enviando...</span>
                    <span v-else>📁 Escolher Arquivo</span>
                </label>
            </div>
            
            <button class="btn-salvar-perfil" @click="salvarPerfil" :disabled="fazendoUpload">Salvar Perfil</button>
          </div>
        </div>
      </section>

      <!-- SEÇÃO 2: APARÊNCIA E TEMAS -->
      <section class="cartao-config">
        <h3>🎨 Aparência</h3>
        <p class="descricao-config">Personalize a interface do seu aplicativo.</p>

        <div class="grade-temas">
          <!-- Tema Padrão -->
          <div 
            class="card-tema" 
            :class="{ ativo: temaSelecionado === 'padrao' }"
            @click="aplicarTemaPredefinido('padrao')"
          >
            <div class="preview-cores padrao"></div>
            <p>Tema Padrão</p>
          </div>

          <!-- Tema Bocchi -->
          <div 
            class="card-tema" 
            :class="{ ativo: temaSelecionado === 'Bocchi' }"
            @click="aplicarTemaPredefinido('Bocchi')"
          >
            <div class="preview-cores bocchi"></div>
            <p>Tema Bocchi</p>
          </div>

          <!-- Botão Criar Novo Tema -->
          <div class="card-tema btn-novo-tema" @click="abrirCriacaoTema">
            <div class="icone-novo">+</div>
            <p>Criar Novo</p>
          </div>
        </div>
      </section>

    </main>

    <!-- MODAL DO TEMA CUSTOMIZÁVEL -->
    <Transition name="fade">
      <div v-if="modalTemaAberto" class="modal-overlay" @click.self="fecharModalTema">
        <div class="modal-conteudo">
          <header class="modal-cabecalho">
            <h3>Criar Tema Customizado</h3>
            <button class="btn-fechar" @click="fecharModalTema">✕</button>
          </header>

          <div class="modal-corpo">
            <p class="aviso-construcao">🚧 Área em construção 🚧<br>Aqui colocaremos os seletores de cores primária, fundo e cards na próxima etapa!</p>
            
            <!-- Esqueleto para a futura integração de cores -->
            <div class="grupo-campo inativo">
              <label>Nome do Tema:</label>
              <input type="text" placeholder="Ex: Cyberpunk Red" disabled />
            </div>
          </div>

          <footer class="modal-rodape">
            <button class="btn-cancelar" @click="fecharModalTema">Cancelar</button>
            <button class="btn-salvar" @click="salvarTemaCustomizado">Criar Tema</button>
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
/* =========================================
   Layout Base das Configurações
   ========================================= */
.configuracoes-container {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.cabecalho-pagina {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.cabecalho-pagina h2 { margin: 0; font-size: 2rem; color: var(--cor-texto); }
.btn-voltar { background: transparent; border: 1px solid var(--cor-primaria); color: var(--cor-texto); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.btn-voltar:hover { background: var(--cor-primaria); color: #111; }

.grid-configuracoes {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* =========================================
   Cartões de Configuração (Seções)
   ========================================= */
.cartao-config {
  background: var(--cor-card);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.cartao-config h3 { margin: 0 0 0.5rem 0; font-size: 1.4rem; color: var(--cor-primaria); display: flex; align-items: center; gap: 0.5rem; }
.descricao-config { color: #aaa; margin-bottom: 2rem; font-size: 0.95rem; }

/* =========================================
   Formulário de Perfil
   ========================================= */
.form-perfil {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  flex-wrap: wrap; /* Responsivo para telas menores */
}

.foto-preview-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--cor-primaria);
  box-shadow: 0 0 15px rgba(0,0,0,0.3);
}

.campos-perfil {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 250px;
}

.grupo-campo { display: flex; flex-direction: column; gap: 0.5rem; font-weight: bold; }
input { padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: var(--cor-texto); font-family: inherit; width: 100%; box-sizing: border-box; }
input:focus { outline: none; border-color: var(--cor-primaria); }

.btn-salvar-perfil {
  background: var(--cor-primaria);
  color: #111;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  align-self: flex-end;
  transition: transform 0.2s;
}
.btn-salvar-perfil:hover { transform: translateY(-2px); }

/* =========================================
   Grade de Temas
   ========================================= */
.grade-temas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.5rem;
}

.card-tema {
  background: rgba(0,0,0,0.2);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.card-tema:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.2); }
.card-tema.ativo { border-color: var(--cor-primaria); background: rgba(255,255,255,0.05); box-shadow: 0 0 15px rgba(0,0,0,0.3); }

/* Caixinhas que simulam as cores do tema */
.preview-cores { width: 100%; height: 60px; border-radius: 8px; }
.preview-cores.padrao { background: linear-gradient(135deg, #222 50%, #38bdf8 50%); border: 1px solid #444; }
.preview-cores.bocchi { background: linear-gradient(135deg, #1a151b 50%, #FFB6C1 50%); border: 1px solid #332835; }

/* Estilo do Botão Criar Novo */
.btn-novo-tema { border: 2px dashed #666; justify-content: center; }
.btn-novo-tema:hover { border-color: var(--cor-primaria); }
.icone-novo { font-size: 2rem; color: #666; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
.btn-novo-tema:hover .icone-novo { color: var(--cor-primaria); }

/* =========================================
   Modal de Tema e Toast (Reaproveitados)
   ========================================= */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-conteudo { background: var(--cor-fundo); border: 1px solid var(--cor-card); border-radius: 12px; width: 90%; max-width: 500px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.modal-cabecalho { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--cor-card); padding-bottom: 1rem; }
.modal-cabecalho h3 { margin: 0; font-size: 1.2rem; }
.btn-fechar { background: transparent; border: none; color: var(--cor-texto); font-size: 1.5rem; cursor: pointer; }
.modal-corpo { display: flex; flex-direction: column; gap: 1.5rem; }
.aviso-construcao { text-align: center; color: #ffd900; font-weight: bold; background: rgba(255, 217, 0, 0.1); padding: 1rem; border-radius: 8px; }
.inativo { opacity: 0.5; }
.modal-rodape { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
.btn-cancelar { background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; font-weight: bold; }
.btn-salvar { background: var(--cor-primaria); color: #111; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; font-weight: bold; border: none; }

.toast-aviso { position: fixed; bottom: 30px; right: 30px; background-color: var(--cor-primaria); color: #111; padding: 1rem 1.5rem; border-radius: 8px; font-weight: bold; font-size: 1.1rem; box-shadow: 0 8px 20px rgba(0,0,0,0.4); z-index: 2000; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(20px); }


/* Estilos do Upload de Imagem */
.input-escondido {
  display: none;
}

.btn-upload {
  display: inline-block;
  background: rgba(0, 0, 0, 0.3);
  border: 2px dashed var(--cor-primaria);
  color: var(--cor-texto);
  padding: 0.8rem;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-upload:hover:not(.carregando) {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.btn-upload.carregando {
  cursor: wait;
  opacity: 0.7;
  border-style: solid;
}

.btn-salvar-perfil:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}


</style>