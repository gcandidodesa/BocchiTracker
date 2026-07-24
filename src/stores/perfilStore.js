import { defineStore } from "pinia";
import { ref } from "vue";
import { db,doc, getDoc, setDoc } from "../services/firebase";

export const usePerfilStore = defineStore('perfil', {
  state: () => ({
    // O ID de busca (não deve mudar para não perder as mídias salvas)
    perfilAtivo: localStorage.getItem('perfilAtivo') || 'Padrao', 
    
    // Dados visuais do perfil
    nomeExibicao: 'Perfil Padrão',
    fotoUrl: '',
    temaAtual: 'padrao'
  }),

  actions: {
    // 1. Troca o usuário ativo e busca as configurações dele no Firebase
    async trocarPerfil(novoPerfilId) {
      this.perfilAtivo = novoPerfilId;
      localStorage.setItem('perfilAtivo', novoPerfilId);
      
      await this.carregarConfiguracoesDoFirebase();
    },

    // 2. Muda apenas o tema visual e salva no Firebase
    async aplicarTema(novoTema) {
      this.temaAtual = novoTema;
      document.documentElement.setAttribute('data-theme', novoTema);
      
      // Salva a escolha do tema no banco de dados em segundo plano
      await this.salvarConfiguracoesNoFirebase();
    },

    // 3. Salva o novo nome e foto editados na tela de Configurações
    async atualizarPerfil(novoNome, novaFoto) {
      this.nomeExibicao = novoNome;
      if (novaFoto) {
        this.fotoUrl = novaFoto;
      }
      
      await this.salvarConfiguracoesNoFirebase();
    },

    // --- FUNÇÕES INTERNAS DE BANCO DE DADOS ---

    // Busca os dados do perfil atual no Firebase
    async carregarConfiguracoesDoFirebase() {
      try {
        const perfilRef = doc(db, "configuracoes_perfis", this.perfilAtivo);
        const docSnap = await getDoc(perfilRef);

        if (docSnap.exists()) {
          const dados = docSnap.data();
          this.nomeExibicao = dados.nomeExibicao || this.perfilAtivo;
          this.fotoUrl = dados.fotoUrl || '';
          this.temaAtual = dados.temaAtual || 'padrao';
          
          // MUDANÇA AQUI: Injeta o tema salvo usando this.temaAtual
          document.documentElement.setAttribute('data-theme', this.temaAtual);
        } else {
          // Se for a primeira vez que usa este perfil, cria um documento padrão
          this.nomeExibicao = this.perfilAtivo;
          this.fotoUrl = '';
          this.temaAtual = 'padrao';
          
          // MUDANÇA AQUI: Injeta o tema padrão usando a string 'padrao'
          document.documentElement.setAttribute('data-theme', 'padrao');
          await this.salvarConfiguracoesNoFirebase();
        }
      } catch (erro) {
        console.error("Erro ao carregar configurações do perfil:", erro);
      }
    },

    // Envia o estado atual para o Firebase
    async salvarConfiguracoesNoFirebase() {
      try {
        const perfilRef = doc(db, "configuracoes_perfis", this.perfilAtivo);
        await setDoc(perfilRef, {
          nomeExibicao: this.nomeExibicao,
          fotoUrl: this.fotoUrl,
          temaAtual: this.temaAtual,
          ultimaAtualizacao: new Date()
        }, { merge: true }); // O merge evita apagar outros campos que possam existir
      } catch (erro) {
        console.error("Erro ao salvar configurações do perfil:", erro);
      }
    }
  }
})