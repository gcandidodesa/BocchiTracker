// src/services/api.js

export async function buscarOmniMidia(query) {
  const resultadosGlobais = [];
  
  // Transforma espaços em %20 para todas as APIs não quebrarem
  const termoSeguro = encodeURIComponent(query); 

  // 1. Busca Jogos (RAWG)
  try {
    const chaveRawg = import.meta.env.VITE_RAWG_API_KEY;
    const resJogo = await fetch(`https://api.rawg.io/api/games?search=${termoSeguro}&key=${chaveRawg}&page_size=10`);
    if (resJogo.ok) {
      const jsonJogo = await resJogo.json();
      const jogos = (jsonJogo.results || []).map(item => ({
        id: `jogo_${item.id}`,
        titulo: item.name,
        tituloOriginal: item.name, 
        capaUrl: item.background_image || 'https://via.placeholder.com/220x330?text=Sem+Capa',
        tipo: 'jogo'
      }));
      resultadosGlobais.push(...jogos);
    }
  } catch (erro) { console.error("Erro Jogos:", erro); }

  // 2. Busca Filmes (TMDB)
  try {
    const chaveTmdb = import.meta.env.VITE_TMDB_API_KEY;
    const resFilme = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${chaveTmdb}&query=${termoSeguro}&language=pt-BR`);
    if (resFilme.ok) {
      const jsonFilme = await resFilme.json();
      // Não damos mais o slice(0,3) aqui!
      const filmes = (jsonFilme.results || []).map(item => ({
        id: `filme_${item.id}`,
        titulo: item.title,
        tituloOriginal: item.original_title, // Salva o nome em inglês também
        capaUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/220x330?text=Sem+Capa',
        tipo: 'filme'
      }));
      resultadosGlobais.push(...filmes);
    }
  } catch (erro) { console.error("Erro Filmes:", erro); }

  // 3. Busca Séries (TMDB)
  try {
    const chaveTmdb = import.meta.env.VITE_TMDB_API_KEY;
    const resSerie = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${chaveTmdb}&query=${termoSeguro}&language=pt-BR`);
    if (resSerie.ok) {
      const jsonSerie = await resSerie.json();
      const series = (jsonSerie.results || []).map(item => ({
        id: `serie_${item.id}`,
        titulo: item.name,
        tituloOriginal: item.original_name, // Salva o nome em inglês
        capaUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/220x330?text=Sem+Capa',
        tipo: 'serie'
      }));
      resultadosGlobais.push(...series);
    }
  } catch (erro) { console.error("Erro Séries:", erro); }

  // 4. Busca Animes (Kitsu)
  try {
    const resAnime = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${termoSeguro}&page[limit]=10`);
    if (resAnime.ok) {
      const jsonAnime = await resAnime.json();
      const animes = (jsonAnime.data || []).map(item => ({
        id: `anime_${item.id}`,
        titulo: item.attributes.canonicalTitle,
        tituloOriginal: item.attributes.canonicalTitle,
        capaUrl: item.attributes.posterImage?.medium || 'https://via.placeholder.com/220x330?text=Sem+Capa',
        tipo: 'anime'
      }));
      resultadosGlobais.push(...animes);
    }
  } catch (erro) { console.error("Erro Animes:", erro); }

  // 5. Busca Mangás (Kitsu)
  try {
    const resManga = await fetch(`https://kitsu.io/api/edge/manga?filter[text]=${termoSeguro}&page[limit]=10`);
    if (resManga.ok) {
      const jsonManga = await resManga.json();
      const mangas = (jsonManga.data || []).map(item => ({
        id: `manga_${item.id}`,
        titulo: item.attributes.canonicalTitle,
        tituloOriginal: item.attributes.canonicalTitle,
        capaUrl: item.attributes.posterImage?.medium || 'https://via.placeholder.com/220x330?text=Sem+Capa',
        tipo: 'manga'
      }));
      resultadosGlobais.push(...mangas);
    }
  } catch (erro) { console.error("Erro Mangás:", erro); }

  // 6. Busca Livros (Google Books)
  try {
    const chaveGoogle = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const resLivro = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${termoSeguro}&key=${chaveGoogle}&maxResults=10`);
    if (resLivro.ok) {
      const jsonLivro = await resLivro.json();
      const livros = (jsonLivro.items || []).map(item => ({
        id: `livro_${item.id}`,
        titulo: item.volumeInfo.title,
        tituloOriginal: item.volumeInfo.title,
        capaUrl: item.volumeInfo.imageLinks?.thumbnail ? item.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:') : 'https://via.placeholder.com/220x330?text=Sem+Capa',
        tipo: 'livro'
      }));
      resultadosGlobais.push(...livros);
    }
  } catch (erro) { console.error("Erro Livros:", erro); }

  // --- O NOVO FILTRO SUPER INTELIGENTE ---
  
  const buscaLimpa = query.toLowerCase().trim();
  const palavrasBusca = buscaLimpa.split(' ');

  // Filtra mantendo se bater com o título traduzido OU com o original
  let resultadosFiltrados = resultadosGlobais.filter(midia => {
    const tituloMidia = midia.titulo.toLowerCase();
    const tituloOrig = (midia.tituloOriginal || "").toLowerCase();

    return palavrasBusca.every(palavra => 
      tituloMidia.includes(palavra) || tituloOrig.includes(palavra)
    );
  });

  // Ordenação em Níveis de Relevância
  resultadosFiltrados.sort((a, b) => {
    const tituloA = a.titulo.toLowerCase();
    const tituloOrigA = (a.tituloOriginal || "").toLowerCase();
    const tituloB = b.titulo.toLowerCase();
    const tituloOrigB = (b.tituloOriginal || "").toLowerCase();
    
    // 1. PRIORIDADE MÁXIMA: O nome é EXATAMENTE o que o usuário digitou (Anime/Mangá/Série principal)
    const aExato = tituloA === buscaLimpa || tituloOrigA === buscaLimpa;
    const bExato = tituloB === buscaLimpa || tituloOrigB === buscaLimpa;

    if (aExato && !bExato) return -1; 
    if (!aExato && bExato) return 1;  

    // 2. PRIORIDADE MÉDIA: O título contém a frase junta (Ex: "One Piece: Red")
    const aContem = tituloA.includes(buscaLimpa) || tituloOrigA.includes(buscaLimpa);
    const bContem = tituloB.includes(buscaLimpa) || tituloOrigB.includes(buscaLimpa);

    if (aContem && !bContem) return -1;
    if (!aContem && bContem) return 1;
    
    return 0; // Empate: mantém a ordem de chegada
  });

  // Aumentamos o corte para 24 vagas para caber tudo de franquias gigantes!
  return resultadosFiltrados.slice(0, 24);
}