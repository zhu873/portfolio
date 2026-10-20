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
  heroStage.dataset.mode = mode;
  heroCards.forEach((card) => {
    card.classList.toggle('is-active', card.dataset.target === mode);
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
  card.addEventListener('focus', () => setProject(card.dataset.project));
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
  const densityBase = dpr > 1.5 ? 2700 : 2200;
  const count = Math.min(1280, Math.floor(area / densityBase));
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
      r: 0.24 + Math.random() * 0.9,
      alpha: 0.12 + Math.random() * 0.28,
      hue: layer > 0.84 ? 'warm' : 'cool',
      drift: 0.12 + layer * 0.52,
      glow: layer > 0.88,
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
  const radius = 250 * Math.min(window.devicePixelRatio || 1, 2);
  particles.forEach((particle, index) => {
    const driftX = Math.sin(time * 0.0032 + index * 0.11) * particle.drift;
    const driftY = Math.cos(time * 0.0024 + index * 0.09) * particle.drift;

    particle.vx += (particle.baseX + driftX - particle.x) * 0.0016;
    particle.vy += (particle.baseY + driftY - particle.y) * 0.0016;

    if (pointer.active) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        const force = (radius - dist) / radius;
        const angle = Math.atan2(dy, dx);
        particle.vx += Math.cos(angle) * force * 0.82;
        particle.vy += Math.sin(angle) * force * 0.82;
      }
    }

    particle.vx *= 0.944;
    particle.vy *= 0.944;
    particle.x += particle.vx;
    particle.y += particle.vy;

    ctx.beginPath();
    if (particle.hue === 'warm') {
      ctx.fillStyle = `rgba(255, 222, 168, ${particle.alpha})`;
    } else {
      ctx.fillStyle = `rgba(191, 222, 255, ${particle.alpha})`;
    }
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();

    if (particle.glow && frame % 2 === 0) {
      ctx.beginPath();
      ctx.fillStyle = particle.hue === 'warm'
        ? `rgba(255, 222, 168, ${particle.alpha * 0.42})`
        : `rgba(191, 222, 255, ${particle.alpha * 0.42})`;
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
window.addEventListener('pointerleave', () => {
  pointer.active = false;
});
window.addEventListener('touchmove', (event) => {
  const touch = event.touches[0];
  if (touch) updatePointer(touch.clientX, touch.clientY);
}, { passive: true });
window.addEventListener('touchend', () => {
  pointer.active = false;
}, { passive: true });
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
render();
