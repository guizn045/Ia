# Jogos no Navegador

Catálogo estático de jogos clássicos que rodam no navegador. Sem build, sem dependências.

## Arquivos

- `index.html`: a página
- `style.css`: visual (dark mode com neon)
- `games.js`: **a lista de jogos** (é aqui que você adiciona novos)
- `app.js`: busca, filtros por categoria e botão de copiar link

## Adicionar um jogo

Em `games.js`, copie uma linha e mude os campos:

```js
{ nome: "Nome do jogo", categoria: "FPS", url: "https://exemplo.com", desc: "Descrição curta." },
```

## Publicar

- **GitHub Pages:** suba os arquivos na raiz do repositório e ative em Settings → Pages (branch `main`, pasta `/ (root)`).
- **Vercel:** importe o repositório (ou envie os arquivos); não precisa de configuração.
