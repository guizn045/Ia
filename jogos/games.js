// LISTA DE JOGOS. Para adicionar, copie uma linha e troque os dados.
// "img" é opcional: endereço de uma imagem de capa. Sem "img" (ou se a imagem não carregar), o site gera uma capa colorida.
// Dá para usar um arquivo seu: coloque a imagem na pasta e escreva img:"capa-nome.jpg".
var S="https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/";
var JOGOS=[
{nome:"BO1 Zombies",categoria:"FPS",url:"https://vel.gg/bo1z",desc:"Zumbis do Black Ops 1",img:S+"42700/header.jpg"},
{nome:"Modern Warfare 2",categoria:"FPS",url:"https://ovz-game-production.up.railway.app",desc:"Tiro online multiplayer",img:S+"10180/header.jpg"},
{nome:"CS Surf",categoria:"FPS",url:"https://surfd.net",desc:"Mapas de surf do Counter-Strike",img:S+"240/header.jpg"},
{nome:"Half-Life",categoria:"FPS",url:"https://pixelsuft.github.io/hl/",desc:"O clássico da Valve",img:S+"70/header.jpg"},
{nome:"Half-Life / CS 1.6",categoria:"FPS",url:"https://x8bitrain.github.io/webXash/",desc:"Half-Life e Counter-Strike 1.6",img:S+"10/header.jpg"},
{nome:"Halo CE",categoria:"FPS",url:"https://mitchellhynes.com/halo",desc:"Combat Evolved no navegador",img:S+"976730/header.jpg"},
{nome:"Halo CE Mobile",categoria:"FPS",url:"https://hcemobile.com",desc:"Halo com controles de toque",img:S+"976730/header.jpg"},
{nome:"Quake 1",categoria:"FPS",url:"https://q1.pieter.com",desc:"O pai dos FPS 3D",img:S+"2310/433ed70abc2743386b152cded8d7d0cbc6b26a2c/header.jpg"},
{nome:"Quake 2",categoria:"FPS",url:"https://q2.pieter.com",desc:"Fase de campanha completa",img:S+"2320/header.jpg"},
{nome:"Quake 3",categoria:"FPS",url:"https://q3.pieter.com",desc:"Arena rápida contra bots",img:S+"2200/header.jpg"},
{nome:"Return to Castle Wolfenstein",categoria:"FPS",url:"https://rtcw.pieter.com",desc:"Nazistas, ocultismo e muito tiro",img:S+"9010/header.jpg"},
{nome:"Unreal Tournament",categoria:"FPS",url:"https://ut.pieter.com",desc:"Arena clássica de 1999",img:S+"13240/header.jpg"},
{nome:"ULTRAKILL",categoria:"FPS",url:"https://cake-logic.itch.io/ultrakill-web-port",desc:"Tiro frenético em que o sangue recupera sua vida",img:S+"1229490/header.jpg"},
{nome:"FNAF 1",categoria:"Terror",url:"https://dorukyum.github.io/FNAF-Web/",desc:"Vigie as câmeras e sobreviva à noite",img:S+"319510/header.jpg"},
{nome:"FNAF 2",categoria:"Terror",url:"https://fivenightsatfreddysonline.github.io/",desc:"Máscara, lanterna e uma sala sem portas",img:S+"332800/header.jpg"},
{nome:"FNAF 4",categoria:"Terror",url:"https://ubg365.github.io/fnaf-4/",desc:"Terror no quarto de uma criança, guiado pelo som",img:S+"388090/header.jpg"},
{nome:"Granny: Chapter 3",categoria:"Terror",url:"https://horror-games-hub.vercel.app/games/granny3/",desc:"Fuja sem fazer barulho"},
{nome:"Buckshot Roulette",categoria:"Terror",url:"https://funny-school.github.io/game/buckshotroulette/",desc:"Roleta-russa com escopeta contra um crupiê",img:S+"2835570/header.jpg"},
{nome:"Skate 3",categoria:"Skate",url:"https://skate.aaddpp.lol",desc:"Manobras em Port Carverton"},
{nome:"Skate Rust",categoria:"Skate",url:"https://global-terror.net",desc:"Skate com visual cru"},
{nome:"GTA Vice City",categoria:"Aventura",url:"https://joncodeofficial.github.io/gta-vice-city-wasm/",desc:"Miami dos anos 80",img:S+"12110/header.jpg"},
{nome:"GTA V",categoria:"Aventura",url:"https://gta.deloskiyt.pl/",desc:"Los Santos em mundo aberto",img:S+"271590/header.jpg"},
{nome:"The Simpsons: Hit & Run",categoria:"Aventura",url:"https://shar-wasm.cjoseph.workers.dev/?skipmovie",desc:"Springfield em mundo aberto"},
{nome:"Pizza Tower",categoria:"Plataforma",url:"https://classroomlesson.github.io/basic-ruffle-player/html/pizza_tower/index.html",desc:"Plataforma de corrida com combos e visual de desenho animado",img:S+"2231450/header.jpg"},
{nome:"PES 6",categoria:"Esporte",url:"https://pes6.optijuegos.net",desc:"Futebol clássico"},
{nome:"Retro Bowl",categoria:"Esporte",url:"https://ubghyper.github.io/retro-bowl/",desc:"Futebol americano em pixel art, você é técnico e jogador"},
{nome:"Diablo",categoria:"RPG",url:"https://johnimril.github.io/diablo_web/",desc:"Desça até o inferno",img:"https://johnimril.github.io/diablo_web/og-image.png"},
{nome:"Command & Conquer: Red Alert 2",categoria:"Estratégia",url:"https://chronodivide.com",desc:"Estratégia em tempo real: Aliados contra Soviéticos",img:S+"2229850/header.jpg"},
{nome:"Balatro",categoria:"Estratégia",url:"https://outblade.github.io/balatro-web/",desc:"Pôquer com coringas que mudam as regras",img:S+"2379780/7a85430784e4d613cdb0547414d8cf16ffa45747/header.jpg"},
{nome:"Hedgewars",categoria:"Estratégia",url:"https://webwars.link",desc:"Ouriços com bazuca por turnos"}
];
if(typeof module!=="undefined")module.exports=JOGOS;else window.GAMES=JOGOS;
