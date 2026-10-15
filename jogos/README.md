# Jogos no navegador

Lista de jogos clássicos que abrem direto no navegador. Site estático (HTML, CSS e JS puros, sem build) + 2 funções na pasta `api/`.

## Arquivos

- `index.html`: a página, incluindo o aviso de manutenção e a tela de privacidade
- `style.css`: visual escuro de biblioteca de jogos (cards com capa gerada pela cor da categoria), fontes do sistema
- `games.js`: **a lista de jogos** (é aqui que você adiciona novos)
- `app.js`: busca, categorias, favoritos, sortear, atalhos, status, placar e modo de privacidade
- `api/status.js`: o servidor testa os links dos jogos e guarda o resultado por 2 minutos
- `api/stats.js`: conta "jogando agora" (quem avisou nos últimos 70 s) e partidas por jogo
- `api/_r.js`: ajudante de acesso ao Redis (Upstash)

## Adicionar um jogo

Em `games.js`, copie uma linha e mude os campos:

```js
{nome:"Nome do jogo",categoria:"FPS",url:"https://exemplo.com",desc:"Descrição curta"},
```

Para pôr uma imagem de capa, acrescente `img:"endereço-da-imagem"` na linha (ou coloque um arquivo de imagem na pasta e use `img:"capa-nome.jpg"`). Sem `img`, ou se a imagem não carregar, o site gera uma capa colorida pela categoria. As capas atuais vêm das imagens oficiais da Steam.

Uma categoria nova aparece sozinha nas abas. O contador de partidas só conta jogos que estão em `games.js`.

## Modo de privacidade

- **Esc** (em qualquer lugar da página) ou o botão discreto no canto inferior direito escondem tudo e mostram uma tela em branco com um indicador de carregamento parado. O título da aba também muda para "Documento sem título".
- Para voltar: **Esc** de novo, ou **dois cliques/toques seguidos no canto inferior direito** da tela (vale para o celular).
- Isso esconde só esta página. Os jogos abertos em outras abas continuam abertos e com som.

## Aviso de manutenção

O aviso no topo fica em `index.html`, dentro do bloco `<div id="aviso">`. Quem fecha o aviso só deixa de vê-lo naquela visita. Para tirar de vez, apague o bloco.

## Atalhos (no computador)

`/` buscar, `j` `k` mover, `Enter` abrir, `f` favoritar, `r` sortear, `Esc` ocultar a página.

## Links com filtro

Dá para mandar o link já filtrado: `#c=Terror`, `#q=quake`, `#o=az` (e combinados, como `#c=FPS&o=az`).

## Publicar na Vercel

1. Importe o repositório com **Root Directory = `jogos`** e Framework = **Other**.
2. Para o placar e as partidas funcionarem: no projeto, em **Storage** (ou Marketplace), adicione **Upstash Redis**, conecte ao projeto e faça um **Redeploy**.

Sem o Redis o site funciona normalmente, só não mostra "jogando agora" e as partidas. Em hospedagem sem funções (GitHub Pages), o status é testado no navegador de cada pessoa e o placar fica desligado.

## Player de música (Spotify)
Botão "Música" no canto inferior esquerdo. As playlists ficam em `musica.js`: para adicionar, copie uma linha e troque o `id` (trecho final do link `open.spotify.com/playlist/ID`). O player é o oficial incorporado do Spotify; músicas inteiras só tocam se a pessoa estiver logada no Spotify no navegador (senão, trechos de 30 s). No modo de privacidade (Esc) o som é cortado.

## Modo discreto
Tecla `D` (no celular, o botão redondo pontilhado acima do botão de ocultar) liga e desliga: a tela fica escura, embaçada e com cores trocadas, e só um círculo em volta do mouse (ou do dedo) fica nítido. Arquivo: `discreto.js` + bloco "Modo discreto" no `style.css`. O Esc (ocultar a página) continua valendo por cima.
