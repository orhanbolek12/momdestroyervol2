const modalOverlay = document.getElementById('modal-overlay');
const gameContainer = document.getElementById('game-container');
const flashOverlay = document.getElementById('flash-overlay');
const btnOrhan = document.getElementById('btn-orhan');
const btnOmer = document.getElementById('btn-omer');

let animationFrameId;
const tunaCount = 4;
let tunas = [];

// --- Audio Context & Sound Synthesis ---
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playBounceSound() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
}

function playExplosionSound() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;

    // 1. Noise Burst (Explosion)
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = audioCtx.createGain();

    // Shape the noise
    noiseGain.gain.setValueAtTime(1, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

    noise.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start(t);

    // 2. High Pitch Ringing (Tinnitus)
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(6000, t); // High pitch characteristic of flashbang aftermath

    oscGain.gain.setValueAtTime(0.0, t); // Start silent
    oscGain.gain.linearRampToValueAtTime(0.1, t + 0.1); // Fade in quickly
    oscGain.gain.linearRampToValueAtTime(0.0, t + 4); // Fade out slowly

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 5);
}

// --- Orhan Mode (Flashbang) ---
function startOrhanMode() {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    modalOverlay.style.display = 'none';

    // Create Platform
    const platform = document.createElement('div');
    platform.classList.add('platform');
    platform.style.width = '200px';
    platform.style.height = '20px';
    platform.style.left = (window.innerWidth / 2 - 100) + 'px';
    platform.style.top = (window.innerHeight / 2 + 100) + 'px'; // Slightly below center
    gameContainer.appendChild(platform);

    const flashbang = document.createElement('img');
    flashbang.src = 'assets/flashbang.png';
    flashbang.classList.add('flashbang');
    gameContainer.appendChild(flashbang);

    // Initial position (center top, slightly visible)
    let x = window.innerWidth / 2 - 30; // Center
    let y = -100;
    let vy = 0;
    let vx = (Math.random() - 0.5) * 2; // Very slight drift
    const gravity = 0.5;

    // Target landing Y is platform top - flashbang heigh
    // However, since visual height is a bit tricky, let's approximate.
    // Flashbang width is 60px, aspect ratio usually makes it taller. Let's say 80px tall.
    const platformTop = parseInt(platform.style.top);
    const ground = platformTop - 80;

    flashbang.style.left = x + 'px';
    flashbang.style.top = y + 'px';

    let bounces = 0;
    const maxBounces = 2;
    let exploded = false;

    function updatePhysics() {
        if (exploded) return;

        vy += gravity;
        x += vx;
        y += vy;

        // Platform collision
        if (y >= ground) {
            y = ground;
            vy = -vy * 0.4; // Lose more energy on small platform
            bounces++;

            if (bounces <= maxBounces) {
                playBounceSound();
            }
        }

        flashbang.style.top = y + 'px';
        flashbang.style.left = x + 'px';
        flashbang.style.transform = `rotate(${x * 5}deg)`; // Spin

        // Trigger explosion shortly after 2nd bounce
        if (bounces >= 2 && Math.abs(vy) < 1.0) {
            triggerExplosion(flashbang, platform);
            return;
        }

        requestAnimationFrame(updatePhysics);
    }

    requestAnimationFrame(updatePhysics);
}

function triggerExplosion(grenadeElement, platformElement) {
    if (!grenadeElement) return;

    playExplosionSound();

    // Visual Flash
    flashOverlay.classList.add('flash-active');
    grenadeElement.remove(); // Remove grenade
    if (platformElement) platformElement.remove(); // Remove platform

    // Reset after flash fades
    setTimeout(() => {
        flashOverlay.classList.remove('flash-active');
        resetGame();
    }, 4500); // slightly longer than the flash animation
}


// --- Omer Mode (Tuna) ---
function startOmerMode(e) {
    if (e) e.stopPropagation(); // Stop click from bubbling to window immediately

    modalOverlay.style.display = 'none';
    tunas = []; // Clear array

    for (let i = 0; i < tunaCount; i++) {
        const tuna = document.createElement('img');
        tuna.src = 'assets/tuna.png';
        tuna.classList.add('tuna');

        // Random start position (avoid excessive overlap ideally, but random is okay for now)
        const x = Math.random() * (window.innerWidth - 150);
        const y = Math.random() * (window.innerHeight - 150);

        tuna.style.left = x + 'px';
        tuna.style.top = y + 'px';
        gameContainer.appendChild(tuna);

        // Random velocity (Floating in space -> Constant speed)
        const speed = 5;
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        tunas.push({ el: tuna, x, y, vx, vy, width: 120, height: 120, radius: 60 });
    }

    animateTunas();

    // Click anywhere to reset
    window.addEventListener('click', resetGameOnce);
}

function resetGameOnce() {
    window.removeEventListener('click', resetGameOnce);
    resetGame();
}

function checkCollision(obj1, obj2) {
    // Simple circle collision detection
    const dx = (obj1.x + obj1.radius) - (obj2.x + obj2.radius);
    const dy = (obj1.y + obj1.radius) - (obj2.y + obj2.radius);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < obj1.radius + obj2.radius) {
        // Collision detected - Resolve Elastic Collision
        const nx = dx / distance;
        const ny = dy / distance;

        // Relative velocity
        const dvx = obj1.vx - obj2.vx;
        const dvy = obj1.vy - obj2.vy;

        const velAlongNormal = dvx * nx + dvy * ny;

        // Do not resolve if velocities are separating
        if (velAlongNormal > 0) return;

        // Restitution (bounciness)
        const restitution = 1; // Perfectly elastic

        const j = -(1 + restitution) * velAlongNormal;
        // Assuming equal mass for simplicity (1/m1 + 1/m2) becomes 2/m since m=1
        // Impulse scalar
        const impulse = j / 2;

        obj1.vx += impulse * nx;
        obj1.vy += impulse * ny;
        obj2.vx -= impulse * nx;
        obj2.vy -= impulse * ny;

        // Separate slightly to prevent sticking
        const overflow = (obj1.radius + obj2.radius - distance) / 2;
        obj1.x += nx * overflow;
        obj1.y += ny * overflow;
        obj2.x -= nx * overflow;
        obj2.y -= ny * overflow;
    }
}

function animateTunas() {
    if (modalOverlay.style.display !== 'none') return; // Stop if reset

    // Update positions
    tunas.forEach(obj => {
        obj.x += obj.vx;
        obj.y += obj.vy;
    });

    // Check Wall Collisions
    tunas.forEach(obj => {
        if (obj.x <= 0) { obj.x = 0; obj.vx = -obj.vx; }
        if (obj.x >= window.innerWidth - obj.width) { obj.x = window.innerWidth - obj.width; obj.vx = -obj.vx; }
        if (obj.y <= 0) { obj.y = 0; obj.vy = -obj.vy; }
        if (obj.y >= window.innerHeight - obj.height) { obj.y = window.innerHeight - obj.height; obj.vy = -obj.vy; }
    });

    // Check Object Collisions
    for (let i = 0; i < tunas.length; i++) {
        for (let j = i + 1; j < tunas.length; j++) {
            checkCollision(tunas[i], tunas[j]);
        }
    }

    // Render
    tunas.forEach(obj => {
        obj.el.style.left = obj.x + 'px';
        obj.el.style.top = obj.y + 'px';
        // Gentle rotation
        obj.el.style.transform = `rotate(${obj.x * 0.2}deg)`;
    });

    animationFrameId = requestAnimationFrame(animateTunas);
}

function resetGame() {
    cancelAnimationFrame(animationFrameId);
    gameContainer.innerHTML = ''; // Clear images
    modalOverlay.style.display = 'flex'; // Show question again
}


// --- Event Listeners ---
btnOrhan.addEventListener('click', startOrhanMode);
btnOmer.addEventListener('click', startOmerMode);
