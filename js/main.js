import { CONTACT, PORTFOLIO, SITES, waLink } from './data.js';
import { createSchool } from './school.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

// Decisão do cliente: todas as animações aparecem para todos, mesmo com "movimento reduzido" ligado no sistema.
// Para voltar a respeitar essa preferência, troque por: window.matchMedia('(prefers-reduced-motion: reduce)').matches
const reduced = false;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Contatos ---------- */
$$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });
$$('[data-contact="email"]').forEach((a) => { a.href = `mailto:${CONTACT.email}`; a.textContent = CONTACT.email; });
$$('[data-contact="instagram"]').forEach((a) => { a.href = `https://instagram.com/${CONTACT.instagram}`; a.textContent = `@${CONTACT.instagram}`; });
$$('[data-contact="whatsapp"]').forEach((a) => { a.textContent = CONTACT.whatsappLabel; });
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---------- Rolagem suave ---------- */
let lenis = null;
if (!reduced) {
  // rolagem suave: lerp menor = mais deslizante
  lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
// rolagem suave também dentro do pop-up do projeto
let modalLenis = null;
if (!reduced) {
  modalLenis = new Lenis({ wrapper: document.querySelector('.modal__panel'), content: document.querySelector('.modal__content'), lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true });
  modalLenis.stop();
  gsap.ticker.add((time) => modalLenis.raf(time * 1000));
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const el = document.querySelector(a.getAttribute('href'));
  if (!el) return;
  e.preventDefault();
  lenis ? lenis.scrollTo(el, { offset: -68 }) : el.scrollIntoView();
}));

/* ---------- Header e botão flutuante ---------- */
const header = $('[data-header]');
const waFloat = $('.wa-float');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('is-solid', y > 10);
  waFloat.classList.toggle('is-on', y > 700);
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Cardume 3D no palco ---------- */
createSchool($('.stage__canvas'), { calm: reduced });

/* ---------- Manifesto: palavras acendem ---------- */
{
  const p = $('[data-words]');
  const KEYS = ['voa.', 'raso', 'importa.'];
  const words = p.textContent.trim().split(/\s+/);
  p.innerHTML = words.map((w) => `<span class="w${KEYS.includes(w) ? ' is-key' : ''}">${w}</span>`).join(' ');
  const spans = $$('.w', p);
  if (reduced) spans.forEach((s) => s.classList.add('is-lit'));
  else {
    ScrollTrigger.create({
      trigger: p, start: 'top 85%', end: 'bottom 55%', scrub: true,
      onUpdate: (self) => {
        const n = Math.round(self.progress * spans.length);
        spans.forEach((s, i) => s.classList.toggle('is-lit', i < n));
      },
    });
  }
}

/* ---------- Serviços: linhas que expandem ---------- */
$$('.svc').forEach((svc) => {
  const btn = $('.svc__row', svc);
  btn.addEventListener('click', () => {
    const open = !svc.classList.contains('is-open');
    $$('.svc').forEach((o) => { o.classList.remove('is-open'); $('.svc__row', o).setAttribute('aria-expanded', 'false'); });
    svc.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    setTimeout(() => ScrollTrigger.refresh(), 600);
  });
});

/* ---------- Portfólio ---------- */
// Imagem i do projeto (0 = primeira). Sem imagens, gera uma capa tipográfica.
const cover = (item, i = 0, pos = '') => {
  const img = item.images[i];
  if (!img) return `<div class="cover" style="--c1:var(--abismo);--c2:var(--asa)"><span>${item.name}</span></div>`;
  return `<div class="cover cover--img"><img src="assets/portfolio/${item.slug}/${img}"${pos ? ` style="object-position:${pos}"` : ''} alt="${item.name} — imagem ${i + 1} de ${item.images.length}" loading="lazy" decoding="async"></div>`;
};

// Posição da capa dentro da galeria (cover é o número do arquivo, ex.: 29 → 29.jpg)
const coverIndex = (item) => Math.max(0, item.images.indexOf(`${String(item.cover || 1).padStart(2, '0')}.jpg`));

const track = $('[data-works]');
const wrap = $('[data-mosaic-wrap]');
const pad = (n) => String(n).padStart(2, '0');

/* Mosaico montado em módulos de 4 colunas × 3 linhas com 7 blocos, que se encaixam sem sobras.
   Posições do módulo: 1 grande (2×2), 2–4 e 7 quadrados, 5 alto (1×2), 6 largo (2×1).
   Páginas ímpares usam o módulo espelhado; a sobra do fim vira uma faixa extra na última página. */
const MODULE = ['1 1 2 3', '1 1 4 5', '6 6 7 5'];
const mirror = (rows) => rows.map((r) => r.split(' ').reverse().join(' '));
const TAIL = { // sobras: linhas da faixa final (posições numeradas na ordem da lista)
  1: ['1 1 1 1'], 2: ['1 1 2 2'], 3: ['1 1 2 3'], 4: ['1 2 3 4'],
  5: ['1 1 2 3', '1 1 4 5'], 6: ['1 1 2 3', '4 5 6 6'],
};
function buildMosaic(n, flip = false) {
  const rows = [];
  const kind = []; // formato de cada posição, para escolher a classe do bloco
  let next = 0;
  const place = (template) => {
    const used = new Map();
    for (const row of template) {
      rows.push(row.split(' ').map((k) => {
        if (!used.has(k)) used.set(k, next + Number(k) - 1);
        return `t${used.get(k)}`;
      }).join(' '));
    }
    next += used.size;
  };
  const full = Math.floor(n / 7);
  for (let i = 0; i < full; i++) place((i + (flip ? 1 : 0)) % 2 ? mirror(MODULE) : MODULE);
  if (n % 7) place(TAIL[n % 7]);
  const spans = {};
  rows.forEach((row, y) => row.split(' ').forEach((area, x) => {
    const s = spans[area] || (spans[area] = { x0: x, x1: x, y0: y, y1: y });
    s.x1 = Math.max(s.x1, x); s.y1 = Math.max(s.y1, y);
  }));
  for (let i = 0; i < n; i++) {
    const s = spans[`t${i}`];
    const w = s.x1 - s.x0 + 1, h = s.y1 - s.y0 + 1;
    kind[i] = w >= 2 && h >= 2 ? 'big' : h >= 2 ? 'tall' : w >= 2 ? 'wide' : 'square';
  }
  return { areas: rows.map((r) => `"${r}"`).join(' '), kind };
}

/* Carrossel: uma página = um módulo (7 projetos); a sobra do fim entra na última página */
const PER_PAGE = 7;
const pages = [];
for (let i = 0; i < PORTFOLIO.length; i += PER_PAGE) {
  pages.push(PORTFOLIO.slice(i, i + PER_PAGE).map((item, k) => ({ item, index: i + k })));
}
if (pages.length > 1 && pages[pages.length - 1].length < PER_PAGE) pages[pages.length - 2].push(...pages.pop());

function renderPage(p) {
  const list = pages[p];
  const layout = buildMosaic(list.length, p % 2 === 1);
  track.style.gridTemplateAreas = layout.areas;
  // No tablet (2 colunas) os grandes ocupam 2×2 e o resto 1×1; se sobrar meia linha, o último bloco ocupa a linha toda
  const tabletCells = layout.kind.reduce((s, k) => s + (k === 'big' ? 4 : 1), 0);
  track.innerHTML = list.map(({ item, index }, i) => {
    const last = i === list.length - 1 && tabletCells % 2;
    return `
  <li class="tile tile--${layout.kind[i]}${last ? ' tile--tab-wide' : ''}" style="grid-area:t${i}" data-tile>
    <button class="work__btn" type="button" data-index="${index}" aria-label="Ver projeto ${item.name}">
      ${cover(item, coverIndex(item), item.pos)}
      <span class="tile__info">
        <span class="tile__name">${item.name}</span>
        <span class="tile__view">Ver projeto ↗</span>
      </span>
    </button>
  </li>`;
  }).join('');
}

let page = 0;
let busy = false;
const dots = $('[data-dots]');
$('[data-page-total]').textContent = pad(pages.length);
dots.innerHTML = pages.map((_, i) => `<button class="pager__dot" type="button" data-dot="${i}" aria-label="Página ${i + 1} de ${pages.length}"></button>`).join('');

function syncControls() {
  $('[data-page-current]').textContent = pad(page + 1);
  $$('[data-prev]').forEach((btn) => { btn.disabled = page === 0; });
  $$('[data-next]').forEach((btn) => { btn.disabled = page === pages.length - 1; });
  $$('.pager__dot', dots).forEach((d, i) => d.setAttribute('aria-current', String(i === page)));
}
// Carrega antes as capas da próxima página para a transição não piscar
const preload = (p) => pages[p]?.forEach(({ item }) => { new Image().src = `assets/portfolio/${item.slug}/${item.images[coverIndex(item)]}`; });

// Transição "cardume": os blocos levantam voo um a um e os da nova página chegam nadando do outro lado
async function goTo(next, { scrollBack = false } = {}) {
  if (busy || next === page || next < 0 || next >= pages.length) return;
  busy = true;
  const dir = next > page ? 1 : -1;
  if (scrollBack) {
    if (lenis) lenis.scrollTo('#portfolio', { offset: -68 });
    else $('#portfolio').scrollIntoView();
  }
  // A troca é provocada pelo próprio visitante, então anima sempre; com "movimento reduzido" no sistema,
  // o voo fica mais curto e sem giro (k menor), mas a transição continua existindo.
  const k = reduced ? 0.5 : 1;
  wrap.style.height = `${track.offsetHeight}px`;
  await gsap.to($$('[data-tile]', track), {
    x: -dir * 140 * k, y: -70 * k, rotate: reduced ? 0 : -dir * 7, scale: 1 - 0.1 * k, opacity: 0,
    duration: 0.5, ease: 'power2.in', stagger: { each: 0.045, from: dir > 0 ? 'start' : 'end' },
  });
  renderPage(next); page = next; syncControls();
  gsap.to(wrap, {
    height: track.offsetHeight, duration: 0.5, ease: 'power3.inOut',
    onComplete: () => { wrap.style.height = ''; ScrollTrigger.refresh(); },
  });
  await gsap.from($$('[data-tile]', track), {
    x: dir * 160 * k, y: 60 * k, rotate: reduced ? 0 : dir * 6, scale: 1 - 0.08 * k, opacity: 0,
    duration: 0.85, ease: 'power3.out', stagger: { each: 0.06, from: dir > 0 ? 'start' : 'end' },
  });
  busy = false;
  preload(next + 1);
}

$$('[data-prev]').forEach((btn) => btn.addEventListener('click', () => goTo(page - 1, { scrollBack: !!btn.closest('.pager--bottom') })));
$$('[data-next]').forEach((btn) => btn.addEventListener('click', () => goTo(page + 1, { scrollBack: !!btn.closest('.pager--bottom') })));
dots.addEventListener('click', (e) => {
  const d = e.target.closest('[data-dot]');
  if (d) goTo(+d.dataset.dot, { scrollBack: true });
});
// Setas do teclado quando o foco está no portfólio
$('#portfolio').addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') goTo(page + 1);
  if (e.key === 'ArrowLeft') goTo(page - 1);
});
// Deslizar o dedo para os lados no celular
{
  let x0 = 0, y0 = 0;
  track.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(page + (dx < 0 ? 1 : -1));
  }, { passive: true });
}

renderPage(0);
syncControls();
preload(1);
$('[data-work-total]').textContent = PORTFOLIO.length;

/* ---------- Portfólio de sites ---------- */
$('[data-sites]').innerHTML = SITES.map((s) => {
  const host = new URL(s.url).hostname.replace(/^www\./, '');
  return `
  <li class="site" data-reveal>
    <a class="site__link" href="${s.url}" target="_blank" rel="noopener" aria-label="Visitar o site ${s.name} (abre em nova aba)">
      <div class="site__frame">
        <div class="site__bar" aria-hidden="true"><i></i><i></i><i></i><span>${host}</span></div>
        <div class="site__view"><img src="assets/sites/${s.slug}.jpg" alt="Página inicial do site ${s.name}" loading="lazy" decoding="async"></div>
      </div>
      <div class="site__info">
        <span class="site__name">${s.name}</span>
        <span class="site__go">Visitar site <span aria-hidden="true">↗</span></span>
      </div>
    </a>
  </li>`;
}).join('');

/* ---------- Animações ---------- */
document.fonts.ready.then(() => {
  if (reduced) return;

  // Entrada: o palco cresce e o conteúdo sobe
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__top > *', { opacity: 0, y: -10, duration: 0.8 }, 0.3)
    // o menu só aparece com fade: animar a posição dele deixava o menu deslocado para cima
    .from('.header', { opacity: 0, duration: 0.8, clearProps: 'all' }, 0.3)
    .from('.stage', { clipPath: 'inset(8% 4% 0% 4% round 28px)', duration: 1.4 }, 0.1)
    .from('.stage__content > *, .stage__tags, .stage__hint', { y: 30, opacity: 0, duration: 1, stagger: 0.08 }, 0.5);

  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 36, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Entrada da primeira página quando a seção aparece: o cardume chega nadando
  gsap.from('[data-tile]', {
    x: 160, y: 60, rotate: 6, scale: 0.92, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.06,
    scrollTrigger: { trigger: '.mosaic', start: 'top 85%', once: true },
  });

  gsap.from('.svc', {
    y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
    scrollTrigger: { trigger: '.svc-list', start: 'top 85%', once: true },
  });

  const fmt = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const d = parseInt(el.dataset.decimals || '0', 10);
    const obj = { v: 0 };
    el.textContent = fmt(0, d);
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = fmt(obj.v, d); },
    });
  });

  // Chamada final: as letras de "Bora voar?" sobem ao entrar na tela
  const big = $('.cta__big');
  big.innerHTML = [...big.textContent].map((ch) => `<span class="ch">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  gsap.from('.cta__big .ch', {
    yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.035,
    scrollTrigger: { trigger: '.cta', start: 'top 75%', once: true },
  });

  ScrollTrigger.refresh();
});

/* ---------- Botões magnéticos ---------- */
if (finePointer && !reduced) {
  $$('.magnetic').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.25);
      y((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

/* ---------- Modal do projeto ---------- */
{
  const modal = $('.modal');
  const panel = $('.modal__panel');
  let opener = null;

  const open = (i) => {
    const item = PORTFOLIO[i];
    $('.modal__title').textContent = item.name;
    const n = Math.max(item.images.length, 1);
    $('.modal__gallery').innerHTML = Array.from({ length: n }, (_, k) => cover(item, k)).join('');
    modal.hidden = false;
    panel.scrollTop = 0;
    lenis?.stop();
    modalLenis?.scrollTo(0, { immediate: true });
    modalLenis?.start();
    document.body.style.overflow = 'hidden';
    if (!reduced) {
      gsap.fromTo('.modal__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(panel, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    }
    $('.modal__close').focus({ preventScroll: true });
  };
  const close = () => {
    modal.hidden = true;
    modalLenis?.stop();
    lenis?.start();
    document.body.style.overflow = '';
    opener?.focus({ preventScroll: true });
  };

  track.addEventListener('click', (e) => {
    const btn = e.target.closest('.work__btn');
    if (!btn) return;
    opener = btn;
    open(+btn.dataset.index);
  });
  $$('[data-close]', modal).forEach((el) => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
}
