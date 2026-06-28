# CineScope

Aplicação web para descobrir filmes e séries: busca por título, navegação por gênero, detalhes em modal e lista de favoritos persistente. Desenvolvida com HTML, CSS e JavaScript puro, consumindo a API do TMDB.

## Funcionalidades

- Busca de filmes e séries por título
- Navegação por gênero
- Favoritos salvos no navegador (localStorage), persistentes entre sessões
- Modal de detalhes com sinopse, gêneros, nota e duração
- Seção "Em alta" com os títulos da semana
- Layout responsivo para mobile e desktop

## Tecnologias

- HTML, CSS e JavaScript, sem frameworks
- API do TMDB
- Google Fonts (Bebas Neue e Inter)

## Como rodar

Basta abrir o arquivo index.html no navegador. Não é necessário servidor nem instalação. Para uma experiência melhor durante o desenvolvimento, recomenda-se a extensão Live Server do VS Code.

O projeto já inclui uma chave pública de demonstração da API do TMDB. Em uma aplicação estática a chave fica sempre visível no navegador, por isso ela é somente leitura e com limite de requisições, adequada apenas para demonstração. Em produção, o ideal é usar um proxy, como uma função serverless, que mantenha a chave no servidor.

Para usar uma chave própria, crie uma conta no TMDB, gere uma API Key (v3 auth) e substitua o valor em js/api.js.

## Estrutura

As responsabilidades são separadas em arquivos distintos: api.js para a comunicação com o TMDB, favorites.js para o gerenciamento de favoritos, ui.js para a renderização de cards, modal e avisos, e app.js para a lógica e a inicialização. Os estilos ficam em css/style.css e a página principal em index.html.

## Deploy

Publicado via GitHub Pages. Após o push para o repositório, basta ativar a opção em Settings, Pages, usando a branch principal como origem.

## Autora

Isabela Oliveira — github.com/isabelaloliveira
