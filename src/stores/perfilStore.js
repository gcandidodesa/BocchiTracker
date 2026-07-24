import { defineStore } from 'pinia'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

export const usePerfilStore = defineStore('perfil', {
  state: () => ({
    perfilAtivo: localStorage.getItem('perfilAtivo') || 'Padrao', 
    nomeExibicao: 'Perfil Padrão',
    fotoUrl: '',
    temaAtual: 'padrao',
    temasCustomizados: {} 
  }),

  actions: {
    async carregarConfiguracoesDoFirebase() {
      try {
        const perfilRef = doc(db, "configuracoes_perfis", this.perfilAtivo);
        const docSnap = await getDoc(perfilRef);

        if (docSnap.exists()) {
          const dados = docSnap.data();
          this.nomeExibicao = dados.nomeExibicao || this.perfilAtivo;
          this.fotoUrl = dados.fotoUrl || '';
          this.temaAtual = dados.temaAtual || 'padrao';
          
          if (dados.temasCustomizados) {
            this.temasCustomizados = dados.temasCustomizados;
          }
          
          document.documentElement.setAttribute('data-theme', this.temaAtual);
          this.aplicarEstilosCustomizados();

        } else {
          this.nomeExibicao = this.perfilAtivo;
          this.fotoUrl = '';
          this.temaAtual = 'padrao';
          this.temasCustomizados = {};
          
          document.documentElement.setAttribute('data-theme', 'padrao');
          this.aplicarEstilosCustomizados();
        }
      } catch (erro) {
        console.error("Erro ao carregar configurações do perfil:", erro);
      }
    },

    async atualizarPerfil(novoNome, novaFoto) {
      this.nomeExibicao = novoNome;
      if (novaFoto) {
        this.fotoUrl = novaFoto;
      }
      await this.salvarConfiguracoesNoFirebase();
    },

    async atualizarTema(novoTemaId, novoTemaConfig = null) {
      if (novoTemaConfig) {
        this.temasCustomizados[novoTemaId] = novoTemaConfig;
      }
      
      this.temaAtual = novoTemaId;
      document.documentElement.setAttribute('data-theme', this.temaAtual);
      this.aplicarEstilosCustomizados();

      await this.salvarConfiguracoesNoFirebase();
    },

    async salvarConfiguracoesNoFirebase() {
      try {
        const perfilRef = doc(db, "configuracoes_perfis", this.perfilAtivo);
        await setDoc(perfilRef, {
          nomeExibicao: this.nomeExibicao,
          fotoUrl: this.fotoUrl,
          temaAtual: this.temaAtual,
          temasCustomizados: this.temasCustomizados
        }, { merge: true });
      } catch (erro) {
        console.error("Erro ao salvar perfil no Firebase:", erro);
        throw erro;
      }
    },

    async trocarPerfil(novoPerfilId) {
      this.perfilAtivo = novoPerfilId;
      localStorage.setItem('perfilAtivo', novoPerfilId);
      await this.carregarConfiguracoesDoFirebase();
    },

    aplicarEstilosCustomizados() {
      const root = document.documentElement;
      const configDoTema = this.temasCustomizados[this.temaAtual];

      if (configDoTema) {
        root.style.setProperty('--bg-app-custom', configDoTema.fundoApp ? `url(${configDoTema.fundoApp})` : 'none');
        root.style.setProperty('--bg-modal-custom', configDoTema.fundoModal ? `url(${configDoTema.fundoModal})` : 'none');
        root.style.setProperty('--icone-estrela-custom', configDoTema.iconeEstrela ? `url(${configDoTema.iconeEstrela})` : 'none');
        
        root.style.setProperty('--cor-fundo-fallback', configDoTema.corFundoFallback || '#0f172a');
        root.style.setProperty('--cor-borda-custom', configDoTema.corBorda || '#1e293b');
        
        // Novas injeções de cor de destaque e texto
        root.style.setProperty('--cor-primaria', configDoTema.corPrimaria || '#38bdf8');
        root.style.setProperty('--cor-texto', configDoTema.corTexto || '#f8fafc');
      } else {
        root.style.setProperty('--bg-app-custom', 'none');
        root.style.setProperty('--bg-modal-custom', 'none');
        root.style.setProperty('--icone-estrela-custom', 'none');
        
        root.style.removeProperty('--cor-fundo-fallback');
        root.style.removeProperty('--cor-borda-custom');
        
        // Remove as injeções para deixar o CSS padrão (Padrao/Bocchi) assumir o controle
        root.style.removeProperty('--cor-primaria');
        root.style.removeProperty('--cor-texto');
      }
    }
  }
})