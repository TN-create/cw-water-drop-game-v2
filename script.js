// Full game script (replaces or creates script.js)
(() => {
  const DIFFICULTIES = {
    Easy:    { time: 45, target: 10, spawnInterval: 1000, goodPoints: 1, badPenalty: 1 },
    Normal:  { time: 30, target: 15, spawnInterval: 700,  goodPoints: 1, badPenalty: 1 },
    Hard:    { time: 20, target: 20, spawnInterval: 450,  goodPoints: 1, badPenalty: 2 },
  };

  const gameContainer = document.getElementById('game-container');
  const startBtn = document.getElementById('start-btn');
  const scoreEl = document.getElementById('score');
  const timeEl = document.getElementById('time');
  const goalEl = document.getElementById('goal');
  const difficultySelect = document.getElementById('difficulty');
  const scorePanel = document.querySelector('.score-panel'); // for multiplier badge

  // New: streak and multiplier
  const MAX_MULTIPLIER = 3;
  const STREAK_STEP = 5;
  let streak = 0;
  let multiplier = 1;

  let timer = null;
  let spawnTimer = null;
  let remainingTime = 30;
  let score = 0;
  let currentGoal = 15;
  let currentConfig = DIFFICULTIES.Normal;
  let running = false;

  function applyDifficulty(mode) {
    currentConfig = DIFFICULTIES[mode] || DIFFICULTIES.Normal;
    remainingTime = currentConfig.time;
    currentGoal = currentConfig.target;
    timeEl.textContent = remainingTime;
    goalEl.textContent = currentGoal;
    score = 0;
    scoreEl.textContent = score;

    // reset streak & multiplier and UI
    streak = 0;
    multiplier = 1;
    updateMultiplierUI();
    purgeTransientUI();
  }

  // New: show/hide/update a multiplier badge near the score
  function updateMultiplierUI() {
    let badge = document.getElementById('multiplier-badge');
    if (multiplier <= 1) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'multiplier-badge';
      badge.className = 'multiplier-badge';
      scorePanel?.appendChild(badge);
    }
    badge.textContent = `x${multiplier}`;
  }

  // New: remove transient UI elements (float texts, ripples)
  function purgeTransientUI() {
    gameContainer.querySelectorAll('.float-text, .ripple').forEach(n => n.remove());
    gameContainer.classList.remove('shake');
  }

  // New: floating feedback text at click position
  function createFloatingText(x, y, text, kind) {
    const el = document.createElement('div');
    el.className = `float-text ${kind}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    gameContainer.appendChild(el);
    // animate in next frame
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => el.remove(), 900);
  }

  // New: ripple effect at a position
  function createRipple(x, y, kind) {
    const r = document.createElement('span');
    r.className = `ripple ${kind}`;
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    gameContainer.appendChild(r);
    setTimeout(() => r.remove(), 650);
  }

  function startGame() {
    if (running) return;
    const selected = difficultySelect.value;
    applyDifficulty(selected);
    running = true;
    startBtn.disabled = true;
    difficultySelect.disabled = true;

    timer = setInterval(() => {
      remainingTime -= 1;
      timeEl.textContent = remainingTime;
      if (remainingTime <= 0) {
        endGame(false);
      }
    }, 1000);

    spawnTimer = setInterval(spawnDrop, currentConfig.spawnInterval);
    // immediately spawn one to make the game feel responsive
    spawnDrop();
  }

  function endGame(won) {
    running = false;
    clearInterval(timer);
    clearInterval(spawnTimer);
    startBtn.disabled = false;
    difficultySelect.disabled = false;
    // simple end feedback
    const message = won ? `You win! Score: ${score}` : `Time's up. Score: ${score}`;
    // brief DOM feedback: overlay element
    showEndOverlay(message);
  }

  function showEndOverlay(text) {
    // remove existing overlay if any
    const existing = document.getElementById('end-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'end-overlay';
    overlay.className = 'end-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="end-box" role="document">
        <p class="end-text">${text}</p>
        <button id="replay-btn" class="btn btn-primary" aria-label="Play again">Play Again</button>
      </div>`;
    document.body.appendChild(overlay);

    const replayBtn = document.getElementById('replay-btn');
    // focus for accessibility
    setTimeout(() => replayBtn?.focus(), 0);

    const cleanup = () => {
      overlay.remove();
      // reset to current difficulty defaults
      applyDifficulty(difficultySelect.value);
    };

    replayBtn.addEventListener('click', cleanup);
    // Esc key closes modal and resets
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
      }
    });
    // enable key handling
    overlay.tabIndex = -1;
    overlay.focus();
  }

  function spawnDrop() {
    if (!running) return;
    const drop = document.createElement('div');
    const badChance = difficultySelect.value === 'Hard' ? 0.35 : 0.2;
    const isBad = Math.random() < badChance;
    drop.className = `drop ${isBad ? 'bad' : 'good'}`;

    const rect = gameContainer.getBoundingClientRect();
    const left = Math.max(10, Math.random() * (rect.width - 60));
    drop.style.left = `${left}px`;
    gameContainer.appendChild(drop);

    const fallDuration = 3000; // ms
    const start = performance.now();
    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / fallDuration);
      drop.style.transform = `translateY(${progress * (rect.height - 50)}px)`;
      if (progress < 1 && document.body.contains(drop)) {
        requestAnimationFrame(animate);
      } else {
        // reached bottom -> ripple and remove
        if (document.body.contains(drop)) {
          const x = parseFloat(drop.style.left) + 18;
          const y = rect.height - 24;
          createRipple(x, y, isBad ? 'bad' : 'good');
          drop.remove();
        }
      }
    }
    requestAnimationFrame(animate);

    // click handler with visual + DOM feedback
    drop.addEventListener('click', (e) => {
      if (!running) return;

      const containerRect = gameContainer.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      if (isBad) {
        // penalty, ripple, shake, reset streak/multiplier
        score = Math.max(0, score - currentConfig.badPenalty);
        streak = 0;
        multiplier = 1;
        updateMultiplierUI();
        createFloatingText(x, y, `-${currentConfig.badPenalty}`, 'bad');
        createRipple(x, y, 'bad');
        gameContainer.classList.add('shake');
        setTimeout(() => gameContainer.classList.remove('shake'), 320);
      } else {
        // reward, floating + ripple, streak/multiplier handling
        streak += 1;
        if (streak % STREAK_STEP === 0 && multiplier < MAX_MULTIPLIER) {
          multiplier += 1;
        }
        const gained = currentConfig.goodPoints * multiplier;
        score += gained;
        updateMultiplierUI();
        createFloatingText(x, y, `+${gained}`, 'good');
        createRipple(x, y, 'good');
      }

      scoreEl.textContent = score;

      // visual feedback then remove
      drop.classList.add('collected');
      setTimeout(() => drop.remove(), 150);

      if (score >= currentGoal) {
        endGame(true);
      }
    });

    setTimeout(() => drop.remove(), fallDuration + 500);
  }

  // wire controls
  startBtn.addEventListener('click', startGame);
  difficultySelect.addEventListener('change', () => {
    // update goal/time preview when difficulty changes
    applyDifficulty(difficultySelect.value);
  });

  // initialize UI on load
  applyDifficulty(difficultySelect.value);
})();
