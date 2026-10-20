document.body.classList.add('js-enabled');

const introOverlay = document.getElementById('introOverlay');
const enterBtn = document.getElementById('enterBtn');
const heroStage = document.getElementById('heroStage');
const heroCards = [...document.querySelectorAll('.hero-card')];
const heroPanels = [...document.querySelectorAll('.hero-detail-panel')];
const timelineCards = [...document.querySelectorAll('.timeline-card')];
const projectCards = [...document.querySelectorAll('.project-card')];
const detailPanels = [...document.querySelectorAll('.project-detail-panel')];
const revealEls = [...document.querySelectorAll('.reveal')];

let introDismissed = false;

function dismissIntro() {
  if (introDismissed) return;
  introDismissed = true;
  introOverlay.classList.add('is-hidden');
}

setTimeout(dismissIntro, 2600);
enterBtn?.addEventListener('click', dismissIntro);
introOverlay?.addEventListener('click', dismissIntro);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === 'Escape' || event.key === ' ') {
    dismissIntro();
  }
});

function setHeroMode(mode) {
  const changed = heroStage.dataset.mode !== mode;
  heroStage.dataset.mode = mode;
  document.querySelectorAll('[data-deck]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.deck === mode)));
  heroCards.forEach(card => {
    card.classList.remove('is-drawing');
    if (changed && card.dataset.target === mode) {
      void card.offsetWidth;
      card.classList.add('is-drawing');
    }
  });
  heroCards.forEach((card) => {
    card.classList.toggle('is-active', card.dataset.target === mode);
    card.setAttribute('aria-pressed', String(card.dataset.target === mode));
  });
  heroPanels.forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.panel === mode);
  });
}

heroCards.forEach((card) => {
  card.addEventListener('click', () => setHeroMode(card.dataset.target));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setHeroMode(card.dataset.target);
    }
  });
});
setHeroMode('experience');

timelineCards.forEach((card) => {
  const trigger = card.querySelector('.timeline-trigger');
  trigger?.addEventListener('click', () => {
    card.classList.toggle('is-open');
  });
});

function setProject(projectId) {
  projectCards.forEach((card) => {
    card.classList.toggle('is-active', card.dataset.project === projectId);
  });
  detailPanels.forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.detail === projectId);
  });
}

projectCards.forEach((card) => {
  card.addEventListener('mouseenter', () => setProject(card.dataset.project));
  card.addEventListener('focusin', () => setProject(card.dataset.project));
});
setProject('discovery-pulse');

const observer = 'IntersectionObserver' in window
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.16 }
    )
  : null;

if (observer) {
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

const canvas = document.getElementById('sandCanvas');
const ctx = canvas.getContext('2d');
let width = 0;
let height = 0;
let particles = [];
let time = 0;
let frame = 0;

const pointer = {
  x: 0,
  y: 0,
  active: false,
};

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.width = Math.floor(window.innerWidth * dpr);
  height = canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  buildParticleField();
}

function buildParticleField() {
  const area = window.innerWidth * window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const densityBase = window.innerWidth < 720 ? 700 : 800;
  const count = Math.min(2200, Math.floor(area / densityBase));
  particles = Array.from({ length: count }, () => {
    const layer = Math.random();
    const baseX = Math.random() * width;
    const baseY = Math.random() * height;
    return {
      x: baseX,
      y: baseY,
      baseX,
      baseY,
      vx: 0,
      vy: 0,
      r: (0.4 + Math.random() * 1.05) * dpr,
      alpha: 0.24 + Math.random() * 0.4,
      hue: layer > 0.84 ? 'warm' : 'cool',
      drift: (2 + layer * 7) * dpr,
      glow: layer > 0.8,
    };
  });
}

function drawBackgroundGlow() {
  const glowA = ctx.createRadialGradient(width * 0.2, height * 0.18, 0, width * 0.2, height * 0.18, width * 0.34);
  glowA.addColorStop(0, 'rgba(118, 174, 255, 0.18)');
  glowA.addColorStop(0.45, 'rgba(118, 174, 255, 0.08)');
  glowA.addColorStop(1, 'rgba(101, 155, 255, 0)');
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, width, height);

  const glowB = ctx.createRadialGradient(width * 0.82, height * 0.2, 0, width * 0.82, height * 0.2, width * 0.24);
  glowB.addColorStop(0, 'rgba(255, 201, 126, 0.12)');
  glowB.addColorStop(0.5, 'rgba(255, 201, 126, 0.05)');
  glowB.addColorStop(1, 'rgba(255, 198, 120, 0)');
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, width, height);
}

function drawParticles() {
  const radius = 130 * Math.min(window.devicePixelRatio || 1, 2);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  particles.forEach((particle, index) => {
    const driftX = Math.sin(time * 0.0032 + index * 0.11) * particle.drift;
    const driftY = Math.cos(time * 0.0024 + index * 0.09) * particle.drift;

    particle.vx += (particle.baseX + driftX - particle.x) * 0.0016;
    particle.vy += (particle.baseY + driftY - particle.y) * 0.0016;

    let proximity = 0;
    const previousX = particle.x;
    const previousY = particle.y;
    if (pointer.active && !calm) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        const force = (radius - dist) / radius;
        proximity = force;
        const angle = Math.atan2(dy, dx);
        particle.vx += (Math.cos(angle) * 1.25 - Math.sin(angle) * .55) * force * dpr;
        particle.vy += (Math.sin(angle) * 1.25 + Math.cos(angle) * .55) * force * dpr;
      }
    }

    particle.vx *= 0.944;
    particle.vy *= 0.944;
    if (!calm) {
      particle.x += particle.vx;
      particle.y += particle.vy;
    }
    const brightness = Math.min(.95, particle.alpha + proximity * .45);
    if (proximity > .12) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(164, 215, 255, ${proximity * .32})`;
      ctx.lineWidth = .6 * dpr;
      ctx.moveTo(previousX - particle.vx * 2, previousY - particle.vy * 2);
      ctx.lineTo(particle.x, particle.y);
      ctx.stroke();
    }

    ctx.beginPath();
    if (particle.hue === 'warm') {
      ctx.fillStyle = `rgba(255, 222, 168, ${brightness})`;
    } else {
      ctx.fillStyle = `rgba(191, 222, 255, ${brightness})`;
    }
    ctx.arc(particle.x, particle.y, particle.r * (1 + proximity * .55), 0, Math.PI * 2);
    ctx.fill();

    if (particle.glow || proximity > .45) {
      ctx.beginPath();
      ctx.fillStyle = particle.hue === 'warm'
        ? `rgba(255, 222, 168, ${brightness * 0.12})`
        : `rgba(191, 222, 255, ${brightness * 0.12})`;
      ctx.arc(particle.x, particle.y, particle.r * 3.9, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function render() {
  time += 1;
  frame += 1;
  ctx.clearRect(0, 0, width, height);
  drawBackgroundGlow();
  drawParticles();
  requestAnimationFrame(render);
}

function updatePointer(clientX, clientY) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  pointer.x = clientX * dpr;
  pointer.y = clientY * dpr;
  pointer.active = true;
}

window.addEventListener('pointermove', (event) => updatePointer(event.clientX, event.clientY));
window.addEventListener('pointerdown', (event) => updatePointer(event.clientX, event.clientY));
window.addEventListener('blur', () => { pointer.active = false; });
document.documentElement.addEventListener('pointerleave', () => {
  pointer.active = false;
});
window.addEventListener('touchmove', (event) => {
  const touch = event.touches[0];
  if (touch) updatePointer(touch.clientX, touch.clientY);
}, { passive: true });
window.addEventListener('pointerup', (event) => { if (event.pointerType !== 'mouse') pointer.active = false; });
window.addEventListener('pointercancel', () => { pointer.active = false; });
window.addEventListener('touchend', () => {
  pointer.active = false;
}, { passive: true });
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
render();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-deck]').forEach(button => {
  button.addEventListener('click', () => setHeroMode(button.dataset.deck));
});
heroCards.forEach(card => {
  card.addEventListener('animationend', () => card.classList.remove('is-drawing'));
  card.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    card.style.setProperty('--tilt-x', `${(0.5 - y) * 9}deg`);
    card.style.setProperty('--tilt-y', `${(x - 0.5) * 9}deg`);
    card.style.setProperty('--shine-x', `${x * 100}%`);
    card.style.setProperty('--shine-y', `${y * 100}%`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
});
let swipeStart = null;
let suppressDeckClick = false;
heroStage.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' && !event.target.closest('.deck-controls')) swipeStart = { x: event.clientX, y: event.clientY };
});
heroStage.addEventListener('pointerup', event => {
  if (!swipeStart) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    setHeroMode(heroStage.dataset.mode === 'experience' ? 'projects' : 'experience');
    suppressDeckClick = true;
    setTimeout(() => { suppressDeckClick = false; }, 350);
  }
});
heroStage.addEventListener('pointercancel', () => { swipeStart = null; });
heroStage.addEventListener('click', event => {
  if (suppressDeckClick) { event.stopImmediatePropagation(); event.preventDefault(); }
}, true);
heroStage.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    setHeroMode(heroStage.dataset.mode === 'experience' ? 'projects' : 'experience');
  }
});

const scanCover = document.querySelector('.gradient-a');
const scanButton = scanCover.querySelector('.cover-play');
function scanAt(event) {
  const rect = scanCover.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  scanCover.style.setProperty('--scan-x', `${x * 100}%`);
  scanCover.style.setProperty('--wave-y', `${(x - .5) * 28}px`);
  scanCover.classList.add('is-playing');
}
scanButton.addEventListener('pointermove', scanAt);
scanButton.addEventListener('pointerdown', scanAt);
let scanHoldUntil = 0;
scanButton.addEventListener('pointerleave', () => { if (Date.now() > scanHoldUntil) scanCover.classList.remove('is-playing'); });
scanButton.addEventListener('focus', () => scanCover.classList.add('is-playing'));
scanButton.addEventListener('blur', () => scanCover.classList.remove('is-playing'));
scanButton.addEventListener('click', () => {
  scanHoldUntil = Date.now() + 1800;
  setTimeout(() => { if (Date.now() >= scanHoldUntil && !scanButton.matches(':hover, :focus-visible')) scanCover.classList.remove('is-playing'); }, 1850);
  scanCover.classList.add('is-playing');
  const next = scanCover.style.getPropertyValue('--scan-x') === '75%' ? '25%' : '75%';
  scanCover.style.setProperty('--scan-x', next);
});
const dramaCover = document.querySelector('.gradient-b');
const scenes = [ ['ACT I · 相遇', '“如果，我们从未见过？”'], ['ACT II · 转折', '“可这封信，写着明天的日期。”'], ['ACT III · 选择', '“这一次，结局由你决定。”'] ];
let scene = 0;
dramaCover.querySelector('.cover-play').addEventListener('click', () => {
  scene = (scene + 1) % scenes.length;
  dramaCover.querySelector('.drama-act').textContent = scenes[scene][0];
  dramaCover.querySelector('.drama-line').textContent = scenes[scene][1];
  dramaCover.classList.remove('is-playing');
  void dramaCover.offsetWidth;
  dramaCover.classList.add('is-playing');
});
const breathCover = document.querySelector('.gradient-c');
const breathButton = breathCover.querySelector('.cover-play');
function breathe(active) {
  breathCover.classList.toggle('is-playing', active);
  breathCover.querySelector('.cover-caption').textContent = active ? 'breathe in.' : 'breathe out.';
}
breathButton.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  breathButton.setPointerCapture(event.pointerId);
  breathe(true);
});
['pointerup','pointercancel','lostpointercapture','blur'].forEach(type => breathButton.addEventListener(type, () => breathe(false)));
breathButton.addEventListener('keydown', event => {
  if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); breathe(true); }
});
breathButton.addEventListener('keyup', event => {
  if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); breathe(false); }
});
window.addEventListener('blur', () => breathe(false));

const introKeys = [...document.querySelectorAll('[data-intro]')];
introKeys.forEach(button => button.addEventListener('click', () => {
  introKeys.forEach(key => {
    const selected = key === button;
    key.classList.toggle('is-selected', selected);
    key.setAttribute('aria-expanded', String(selected));
    document.getElementById(`intro-${key.dataset.intro}`).hidden = !selected;
  });
}));

const workStories = {
  discover: { index: '01 · DISCOVER', status: 'OBSERVING · 寻找关联', title: '先找到值得解决的问题。', description: '从用户、市场与业务信息中交叉观察，把零散线索变成可以验证的问题。', tools: ['竞品研究', '数据探查', 'SQL / Hive'], example: '在滴滴巴西业务中，抽样 100+ 商户，构建三层竞争图谱，识别高潜转化对象。', link: '#experience', linkText: '查看相关经历' },
  structure: { index: '02 · STRUCTURE', status: 'ORGANIZING · 让信息有序', title: '给复杂问题，一个清楚的结构。', description: '把观察转成字段、规则和优先级，让不同团队可以在同一套逻辑下协作。', tools: ['字段架构', '标签规则', 'PRD', '跨团队协同'], example: '在番茄音乐，从 0 到 1 搭建线索字段架构，覆盖 5 平台 70+ 榜单，建立数据质量验收机制。', link: '#experience', linkText: '查看相关经历' },
  build: { index: '03 · BUILD', status: 'BUILDING · 想法开始成形', title: '不止提出想法，把它做出来。', description: '用 AI 辅助开发，把内容、结构与交互拼成可体验的网页原型，尽早让想法接受真实体验。', tools: ['AI-Native 开发', '交互原型', '网页实现'], example: '独立设计与实现 Discovery Pulse、Short Drama LLM 和 Meditation in Peace，探索信息、叙事与音频体验。', link: '#projects', linkText: '去作品展厅体验' },
  iterate: { index: '04 · ITERATE', status: 'REFINING · 反馈推动下一轮', title: '让反馈，改变下一步。', description: '通过指标、验证集与试点结果检验判断，把发现的问题带回下一轮调整。原型里的变化，是这个过程的缩影。', tools: ['指标评测', '验证集', '试点验证', '数据质量'], example: '在滴滴巴西，配套销售话术被负责人采纳，试点触达并转化 10+ 商户；在番茄音乐，以覆盖率与准确率验收数据质量。', link: '#experience', linkText: '查看验证与成果' }
};
const workbench = document.querySelector('.workbench');
const workSteps = [...document.querySelectorAll('.work-step')];
function selectWorkStep(step) {
  const story = workStories[step];
  workbench.dataset.step = step;
  workSteps.forEach(button => {
    const selected = button.dataset.step === step;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  ['index','status','title','description','example'].forEach(field => {
    document.getElementById(`work-${field}`).textContent = story[field];
  });
  document.getElementById('work-tools').replaceChildren(...story.tools.map(tool => {
    const label = document.createElement('span'); label.textContent = tool; return label;
  }));
  const link = document.getElementById('work-link');
  link.href = story.link; link.textContent = story.linkText;
}
workSteps.forEach((button, index) => {
  button.addEventListener('click', () => selectWorkStep(button.dataset.step));
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % workSteps.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + workSteps.length - 1) % workSteps.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = workSteps.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    workSteps[next].focus(); selectWorkStep(workSteps[next].dataset.step);
  });
});
