export async function buscarAnime (query) {
    try {
        const resposta = await fetch('https://api.jikan.moe/v4/anime?q=${query}&limit=5');
       const json = await resposta.json(); 
    }
    catch (erro) {
        console.error ("Erro ao buscar mídia:", erro);
        return [];
    }
}