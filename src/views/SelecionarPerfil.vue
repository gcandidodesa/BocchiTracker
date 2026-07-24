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
  try {
    // Busca todos os perfis salvos no Firebase
    const querySnapshot = await getDocs(collection(db, "configuracoes_perfis"));
    let perfisTemp = [];

    querySnapshot.forEach((doc) => {
      const dados = doc.data();
      perfisTemp.push({
        id: doc.id, // O ID real ('Padrao', 'Bocchi', etc)
        nomeExibicao: dados.nomeExibicao || doc.id, // O nome customizado
        fotoUrl: dados.fotoUrl || `https://ui-avatars.com/api/?name=${dados.nomeExibicao || doc.id}&background=333&color=fff`
      });
    });

    // Se o banco estiver vazio (primeiro acesso no app), injeta os padrões para não ficar com a tela em branco
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

// Função acionada ao clicar em um perfil
async function entrarNoPerfil(perfilId) {
  // O Pinia faz o trabalho pesado de buscar os dados completos e injetar o tema
  await perfilStore.trocarPerfil(perfilId); 
  
  // Vai para a tela principal
  router.push('/dashboard');
}
</script>

<template>
  <div class="selecao-container">
    <div v-if="carregando" class="carregando-tela">
      <p>Carregando perfis...</p>
    </div>

    <div v-else class="conteudo-selecao">
      <h1>Quem está assistindo?</h1>
      
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
.selecao-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #111; /* Fundo escuro fixo para a tela de perfis */
  color: #fff;
  text-align: center;
}

.carregando-tela {
  font-size: 1.5rem;
  color: #888;
}

h1 {
  font-size: 3rem;
  margin-bottom: 3rem;
  font-weight: normal;
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
  border-radius: 12px; /* Pode mudar para 50% se quiser redondo aqui também */
  object-fit: cover;
  border: 4px solid transparent;
  transition: border-color 0.2s;
}

.cartao-perfil:hover .avatar-perfil {
  border-color: var(--cor-primaria, #fff); /* Borda brilha ao passar o mouse */
}

.nome-perfil {
  margin-top: 1rem;
  font-size: 1.2rem;
  color: #888;
  transition: color 0.2s;
}

.cartao-perfil:hover .nome-perfil {
  color: #fff;
  font-weight: bold;
}
</style>