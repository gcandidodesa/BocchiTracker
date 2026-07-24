<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePerfilStore } from '../stores/perfilStore'
import { db, collection, getDocs } from '../services/firebase'

const router = useRouter()
const perfilStore = usePerfilStore()

const perfisCarregados = ref([])
const carregando = ref(true)

onMounted(async () => {
  // --- BLOQUEIO DE TEMA ---
  // Força o tema para "padrao" no HTML para limpar o fundo claro da Bocchi
  document.documentElement.setAttribute('data-theme', 'padrao');
  
  // Limpa todas as injeções de JavaScript dos temas customizados
  const root = document.documentElement;
  root.style.removeProperty('--bg-app-custom');
  root.style.removeProperty('--bg-modal-custom');
  root.style.removeProperty('--icone-estrela-custom');
  root.style.removeProperty('--cor-fundo-fallback');
  root.style.removeProperty('--cor-borda-custom');
  root.style.removeProperty('--cor-primaria');
  root.style.removeProperty('--cor-texto');
  // -----------------------

  try {
    // Busca todos os perfis salvos no Firebase[cite: 9]
    const querySnapshot = await getDocs(collection(db, "configuracoes_perfis"));
    let perfisTemp = [];

    querySnapshot.forEach((doc) => {
      const dados = doc.data();
      perfisTemp.push({
        id: doc.id, // O ID real ('Padrao', 'Bocchi', etc)[cite: 9]
        nomeExibicao: dados.nomeExibicao || doc.id, // O nome customizado[cite: 9]
        fotoUrl: dados.fotoUrl || `https://ui-avatars.com/api/?name=${dados.nomeExibicao || doc.id}&background=333&color=fff`
      });
    });

    // Se o banco estiver vazio (primeiro acesso no app), injeta os padrões para não ficar com a tela em branco[cite: 9]
    if (perfisTemp.length === 0) {
      perfisTemp = [
        { id: 'Padrao', nomeExibicao: 'Perfil Padrão', fotoUrl: `https://ui-avatars.com/api/?name=Padrao&background=333&color=fff` },
        { id: 'Bocchi', nomeExibicao: 'Bocchi', fotoUrl: `https://ui-avatars.com/api/?name=Bocchi&background=333&color=fff` }
      ];
    }

    perfisCarregados.value = perfisTemp;
  } catch (erro) {
    console.error("Erro ao buscar perfis do Firebase:", erro);
  } finally {
    carregando.value = false;
  }
})

// Função acionada ao clicar em um perfil[cite: 9]
async function entrarNoPerfil(perfilId) {
  // O Pinia faz o trabalho pesado de buscar os dados completos e injetar o tema[cite: 9]
  await perfilStore.trocarPerfil(perfilId); 
  
  // Vai para a tela principal[cite: 9]
  router.push('/dashboard');
}
</script>

<template>
  <div class="selecao-container">
    <div v-if="carregando" class="carregando-tela">
      <p>Carregando perfis...</p>
    </div>

    <div v-else class="conteudo-selecao">
      <h1 class="titulo-principal">Quem está assistindo?</h1>
      
      <div class="grade-perfis">
        <div 
          class="cartao-perfil" 
          v-for="perfil in perfisCarregados" 
          :key="perfil.id"
          @click="entrarNoPerfil(perfil.id)"
        >
          <img :src="perfil.fotoUrl" :alt="perfil.nomeExibicao" class="avatar-perfil">
          <p class="nome-perfil">{{ perfil.nomeExibicao }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Garante que a fonte limpa seja usada na tela inicial inteira */
.selecao-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  /* Fundo escuro fixo para a tela de perfis, ignorando o background do body */
  background-color: #111 !important; 
  background-image: none !important;
  color: #fff;
  text-align: center;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.carregando-tela {
  font-size: 1.5rem;
  color: #888;
}

/* Força o título a ser branco, ignorando o vermelho do tema customizado */
.titulo-principal {
  font-size: 3rem;
  margin-bottom: 3rem;
  font-weight: 500;
  color: #ffffff !important;
}

.grade-perfis {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cartao-perfil {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  width: 150px;
}

.cartao-perfil:hover {
  transform: scale(1.1);
}

.avatar-perfil {
  width: 150px;
  height: 150px;
  border-radius: 12px;
  object-fit: cover;
  border: 4px solid transparent;
  transition: border-color 0.2s;
}

.cartao-perfil:hover .avatar-perfil {
  /* No hover, usa um branco limpo ao invés da cor primária do tema */
  border-color: #ffffff;
}

/* Força os nomes embaixo das fotos a serem cinza claro/branco */
.nome-perfil {
  margin-top: 1rem;
  font-size: 1.2rem;
  color: #888 !important;
  font-family: inherit;
  transition: color 0.2s;
}

.cartao-perfil:hover .nome-perfil {
  color: #fff !important;
  font-weight: bold;
}
</style>