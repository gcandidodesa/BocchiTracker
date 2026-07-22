// src/services/api.js

export async function buscarMidiaExterna(query, tipo) {
  try {
    if (tipo === 'anime') {
      const resposta = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=5`);
      if (!resposta.ok) throw new Error("Erro Jikan");
      const json = await resposta.json();
      
      // Padronizamos a resposta para que a interface não precise adivinhar onde está o título ou a capa
      return (json.data || []).map(item => ({
        id: item.mal_id,
        titulo: item.title,
        capaUrl: item.images.jpg.image_url,
        tipo: 'anime'
      }));
    } 
    
    else if (tipo === 'jogo') {
      // TODO: Substituir pela URL real do RAWG quando tivermos a chave
      throw new Error("RAWG não configurado");
    }

    else if (tipo === 'filme') {
      // TODO: Substituir pela URL real do TMDB quando tivermos a chave
      throw new Error("TMDB não configurado");
    }

  } catch (erro) {
    console.error(`Erro ao buscar ${tipo}, ativando MOCK:`, erro);
    
    // Mocks padronizados para o desenvolvimento não parar
    if (tipo === 'anime') {
      return [{ id: 31933, titulo: "JoJo's Bizarre Adventure (Mock)", capaUrl: "https://cdn.myanimelist.net/images/anime/3/79156.jpg", tipo: 'anime' }];
    } else if (tipo === 'jogo') {
      return [{ id: 1, titulo: "Elden Ring (Mock)", capaUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/aGhopp3MHppi7kooGE2Dtt8C.png", tipo: 'jogo' }];
    } else if (tipo === 'filme') {
      return [{ id: 2, titulo: "O Senhor dos Anéis (Mock)", capaUrl: "https://image.tmdb.org/t/p/w500/1Xm0WqvzAJWgwMWGQCEepE2JqYS.jpg", tipo: 'filme' }];
    }
  }
}