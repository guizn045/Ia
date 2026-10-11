# Jogos no Navegador

Catálogo de jogos clássicos que rodam no navegador. Site estático + 2 funções na pasta `api/`.

## Arquivos

- `index.html`, `style.css`: a página (dark mode com neon)
- `games.js`: **a lista de jogos** (é aqui que você adiciona novos)
- `app.js`: busca, filtros, ordenação, copiar link, placar e status
- `api/status.js`: o servidor testa os links dos jogos e guarda o resultado por 2 minutos
- `api/stats.js`: conta "jogando agora" (quem avisou nos últimos 70 s) e partidas por jogo
- `api/_r.js`: ajudante de acesso ao Redis (Upstash)

## Adicionar um jogo

Em `games.js`, copie uma linha e mude os campos:

```js
{nome:"Nome do jogo",categoria:"FPS",url:"https://exemplo.com",desc:"Descrição curta"},
```

O contador de partidas só conta jogos que estão em `games.js`.

## Publicar na Vercel

1. Importe o repositório com **Root Directory = `jogos`** e Framework = **Other**.
2. Para o placar e as partidas funcionarem: no projeto, em **Storage** (ou Marketplace), adicione **Upstash Redis**, conecte ao projeto e faça um **Redeploy**.

Sem o Redis o site funciona normalmente, só mostra "–" no placar. Em hospedagem sem funções (GitHub Pages), o status é testado no navegador de cada pessoa e o placar fica desligado.
