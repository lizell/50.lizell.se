(() => {
  // ── image manifest ─────────────────────────────────────
  const exts = {
    1:'jpg',2:'jpg',3:'jpg',4:'jpg',5:'jpg',6:'jpg',7:'jpg',
    8:'webp',9:'avif',10:'jpg',11:'jpg',12:'webp',13:'jpg',
    14:'jpg',15:'jpg',16:'jpg',17:'webp',19:'jpg',
    20:'jpg',21:'jpg',22:'webp',23:'jpg',24:'jpg',25:'jpg',
    26:'jpg',27:'jpg'
  };
  const path = n => `images/nina-${String(n).padStart(2,'0')}.${exts[n]}`;
  const all = Object.keys(exts).map(Number);

  // handskrivna captions, en per index, atmosfäriska och vagt periodiserade
  const caps = {
    1:  "70-talet, klart",
    2:  "promofoto",
    3:  "posen! händerna!",
    4:  "med Lee på dalahäst",
    5:  "någon turné",
    6:  "studio",
    7:  "tidigt 70-tal i motljus",
    8:  "skivomslag",
    9:  "TV",
    10: "modiga skor",
    11: "tight jeans",
    12: "duett-eran",
    13: "schlagereran",
    14: "ung",
    15: "Mello-vibes",
    16: "nästan 80-tal",
    17: "soul-fasen",
    19: "svensktoppen, 60-tal",
    20: "scenkläder",
    21: "kameran",
    22: "70-tal igen",
    23: "comeback",
    24: "Gotland och cowboy",
    25: "jeanshatt? Ja!",
    26: "alltid scen",
    27: "Nina, Nina, Nina"
  };

  // ── countdown ──────────────────────────────────────────
  const target = new Date('2026-06-13T15:00:00+02:00');
  const daysEl = document.getElementById('days');
  const tick = () => {
    const diff = target - new Date();
    daysEl.textContent = diff <= 0 ? '0' : Math.ceil(diff / 86_400_000);
  };
  tick();
  setInterval(tick, 60_000);

  // ── helpers ────────────────────────────────────────────
  const make = (tag, attrs = {}, kids = []) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    }
    kids.forEach(k => el.appendChild(k));
    return el;
  };
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];

  // ── COLLAGE ────────────────────────────────────────────
  const collage = document.getElementById('collage');

  // 6 polaroidplatser. Plats 5 (näst sista på mobil = bottenrad höger) är fast Chrille.
  const SLOT_COUNT = 6;
  const FIXED_SLOT = 5;        // 0-indexerat
  const fixedSlot = {
    src: 'images/chrille-cowboy.png',
    cap: 'och jag, gör mitt bästa',
    fixed: true
  };

  const startPicks = [4, 11, 19, 7, 22];   // 5 startbilder för cyklande slots
  const slots = [];

  for (let i = 0; i < SLOT_COUNT; i++) {
    const isFixed = i === FIXED_SLOT;
    let n, src, cap;

    if (isFixed) {
      src = fixedSlot.src;
      cap = fixedSlot.cap;
    } else {
      const idx = i < FIXED_SLOT ? i : i - 1;
      n = startPicks[idx];
      src = path(n);
      cap = caps[n];
    }

    const img = make('img', { src, alt: cap, loading: i < 4 ? 'eager' : 'lazy' });
    const frame = make('div', { class: 'pol-frame' }, [img]);
    const capEl = make('span', { class: 'pol-cap', text: cap });
    const btn = make('button', { class: 'pol', type: 'button',
                                 'aria-label': `Visa stor: ${cap}` },
                     [frame, capEl]);

    if (isFixed) btn.dataset.fixed = '1';

    btn.addEventListener('click', () => openLightbox(img.src, cap));
    collage.appendChild(btn);

    slots.push({ btn, img, capEl, n: isFixed ? null : n, fixed: isFixed });
  }

  // ── cykla bilder slumpmässigt över tid ────────────────
  let cycling = true;
  const swap = () => {
    if (!cycling) return;

    // välj en icke-fixed slot
    const candidates = slots.filter(s => !s.fixed);
    const slot = rand(candidates);

    // välj en bild som inte just nu visas
    const inUse = new Set(slots.filter(s => !s.fixed).map(s => s.n));
    const pool = all.filter(n => !inUse.has(n));
    if (!pool.length) return;
    const next = rand(pool);

    slot.img.classList.add('is-leaving');
    setTimeout(() => {
      slot.img.src = path(next);
      slot.img.alt = caps[next];
      slot.capEl.textContent = caps[next];
      slot.btn.setAttribute('aria-label', `Visa stor: ${caps[next]}`);
      slot.n = next;
      slot.img.classList.remove('is-leaving');
    }, 1100);
  };
  setInterval(swap, 3400);

  // ── LIGHTBOX ───────────────────────────────────────────
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCap = document.getElementById('lightbox-cap');
  const lbClose = document.getElementById('lightbox-close');

  function openLightbox(src, cap) {
    lbImg.src = src;
    lbImg.alt = cap;
    lbCap.textContent = cap;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    cycling = false;
  }
  function closeLightbox() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    cycling = true;
  }

  lbClose.addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lb.classList.contains('is-open')) closeLightbox();
  });

  // ── STICKY CTA ─────────────────────────────────────────
  // Visa när användaren scrollat förbi hero, dölj när OSA-sektionen är i viewport.
  const hero = document.querySelector('.hero');
  const osa = document.getElementById('osa');
  let pastHero = false;
  let inOsa = false;

  const updateCta = () => {
    document.body.classList.toggle('cta-visible', pastHero && !inOsa);
  };

  new IntersectionObserver(([entry]) => {
    pastHero = !entry.isIntersecting;
    updateCta();
  }, { rootMargin: '-30% 0px 0px 0px' }).observe(hero);

  new IntersectionObserver(([entry]) => {
    inOsa = entry.isIntersecting;
    updateCta();
  }, { threshold: 0.2 }).observe(osa);
})();
