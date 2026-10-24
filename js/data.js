// Conteúdo editável do site. Troque aqui contatos e portfólio sem mexer no resto do código.

export const CONTACT = {
  whatsapp: '5562986002205',
  whatsappLabel: '(62) 98600-2205',
  instagram: 'asadepeixe',
  email: 'contato@asadepeixe.com',
  city: 'Goiânia, GO',
};

// Mensagens pré-preenchidas do WhatsApp, por intenção.
export const MESSAGES = {
  geral: 'Olá! Vim pelo site da ASADEPEIXE e quero fazer meu negócio crescer.',
  marca: 'Olá! Vim pelo site e quero criar (ou renovar) a marca do meu negócio.',
  trafego: 'Olá! Vim pelo site e quero saber sobre gestão de tráfego pago.',
  site: 'Olá! Vim pelo site e quero um site para o meu negócio.',
};

export const waLink = (key = 'geral') =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(MESSAGES[key] || MESSAGES.geral)}`;

// Portfólio. As imagens ficam em assets/portfolio/<slug>/01.jpg, 02.jpg… (geradas a partir de SITE ASA:
// pasta SUBIR do cliente, ou a pasta inteira quando não há SUBIR).
// `images`: páginas que aparecem na galeria — só 3 versões da marca, mockups e aplicações
//           (ficam de fora capa da ASADEPEIXE, conceito, moodboard, construção do logo, tipografia e cores).
// `cover`: número da imagem usada como capa no mosaico (de preferência um mockup).
// O mosaico é montado em módulos de 7 posições, nesta ordem: grande, quadrado, quadrado, quadrado, alto, largo, quadrado
// (um módulo por página; o seguinte espelhado). Escolha capas que funcionem no formato da posição.
// `pos` ajusta o enquadramento da capa (CSS object-position).
const file = (n) => `${String(n).padStart(2, '0')}.jpg`;
const pick = (...nums) => nums.flatMap((n) => (Array.isArray(n) ? range(...n) : [n])).map(file);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Portfólio de sites: a imagem fica em assets/sites/<slug>.jpg (captura comprida da página inicial;
// na vitrine ela rola ao passar o mouse). Para atualizar uma captura, refaça a imagem com o mesmo nome.
export const SITES = [
  { slug: 'stay-coworking',      name: 'Stay Coworking',       url: 'https://staycoworking.com.br/' },
  { slug: 'grupo-octopus',       name: 'Grupo Octopus',        url: 'https://octopuscred.com/' },
  { slug: 'servicos-pontual',    name: 'Serviços Pontual',     url: 'https://spservicospontual.com.br/' },
  { slug: 'chedid-odontologica', name: 'Chedid Odontológica',  url: 'https://claudiochedidodonto.com.br/' },
];

export const PORTFOLIO = [
  // página 1
  { slug: 'icy',                  name: 'Icy',                  images: pick([1, 7]),                    cover: 2 },
  { slug: 'neiva',                name: 'Neiva',                images: pick(2, 3, [5, 10]),             cover: 6 },
  { slug: 'gofruta',              name: 'GoFruta',              images: pick([1, 6]),                    cover: 4 },
  { slug: 'lumiere',              name: 'Lumière',              images: pick([1, 5], 7, 8),              cover: 3 },
  { slug: 'dalton-regis',         name: 'Dalton Regis',         images: pick([1, 5]),                    cover: 3 },
  { slug: 'box-rapido',           name: 'Box Rápido',           images: pick([1, 6]),                    cover: 4 },
  { slug: '5a-essencia',          name: '5ª Essência',          images: pick([1, 5]),                    cover: 4 },
  // página 2
  { slug: 'mmr',                  name: 'MMR',                  images: pick(17, 18, 21, [24, 32]),      cover: 29 },
  { slug: 'nous',                 name: 'Nous',                 images: pick(11, 12, 18, [24, 31]),      cover: 27 },
  { slug: 'brazilfit',            name: 'Brasil Fit',           images: pick([1, 6]),                    cover: 3 },
  { slug: 'precisa',              name: 'Precisa',              images: pick(11, 12, 17, [24, 31]),      cover: 26 },
  { slug: 'leppoa',               name: 'Leppoá',               images: pick([1, 6]),                    cover: 4 },
  { slug: 'climafast',            name: 'ClimaFast',            images: pick(11, 12, 18, [24, 28], [30, 34]), cover: 26, pos: '50% 66%' },
  { slug: 'portaz-s-a',           name: 'Portaz S/A',           images: pick(3, 4, 8, [9, 11], 13, 14),  cover: 9 },
  // página 3
  { slug: 'manzo',                name: 'Manzo',                images: pick(3, 5, 6, [7, 11], [13, 15]), cover: 8 },
  { slug: 'salvatore',            name: 'Salvatore',            images: pick(17, 18, 24, [30, 39]),      cover: 32 },
  { slug: 'md-imob',              name: 'MD Imob',              images: pick(11, 12, 19, [24, 30]),      cover: 27 },
  { slug: 'ismael-marmota',       name: 'Ismael Marmota',       images: pick([1, 5]),                    cover: 4 },
  { slug: 'studio-eli',           name: 'Studio Eli',           images: pick(15, 16, 22, [28, 34]),      cover: 32 },
  { slug: 'multicloud',           name: 'Multicloud',           images: pick(11, 12, 18, [24, 34]),      cover: 30 },
  { slug: 'prazeres-da-carne',    name: 'Prazeres da Carne',    images: pick(3, 4, 6, 7, 8, [10, 13]),   cover: 7 },
  // página 4 (+ a sobra do fim)
  { slug: 'castanho-pescados',    name: 'Castanho Pescados',    images: pick(10, 11, 17, [25, 33]),      cover: 29 },
  { slug: 'royal-representacoes', name: 'Royal Representações', images: pick(17, 18, 23, [30, 39]),      cover: 35 },
  { slug: 'grupo-octopus',        name: 'Grupo Octopus',        images: pick(10, 11, 18, [23, 33]),      cover: 25 },
  { slug: 'nutribio',             name: 'Excellencce NutriBio', images: pick(11, 12, 17, [24, 29]),      cover: 26 },
  { slug: 'lusma',                name: 'Lusma',                images: pick([1, 7]),                    cover: 6, pos: '22% 50%' },
  { slug: 'dupllo',               name: 'Dupllo',               images: pick(11, 13, 18, [24, 34]),      cover: 32 },
  { slug: 'morfos-ambiental',     name: 'Morfos Ambiental',     images: pick(17, 19, 24, [30, 39]),      cover: 33 },
  { slug: 'teixeira-santos',      name: 'Teixeira Santos',      images: pick(5, 6, 8, [9, 12]),          cover: 10 },
  { slug: 'bdwin',                name: 'BDWIN',                images: pick(11, 13, 18, [24, 35]),      cover: 27 },
  { slug: 'luiza-colman',         name: 'Luiza Colmán',         images: pick(11, 12, 18, [24, 30]),      cover: 24 },
];
