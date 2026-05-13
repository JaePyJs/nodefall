import '../style.css';
import { DocsPanel } from './DocsPanel';
import { TOWER_STATS, TIER_UNLOCKS } from '../constants';
import type { TowerType } from '../types';

// Presentation mode state
let presentationOpen = false;
let slides: string[] = [];
let currentSlideIndex = 0;

function togglePresentationMode(): void {
    if (presentationOpen) {
        closePresentation();
    } else {
        openPresentation();
    }
}

function openPresentation(): void {
    presentationOpen = true;
    let overlay = document.getElementById('presentation-overlay');
    if (!overlay) {
        buildPresentationDOM();
        overlay = document.getElementById('presentation-overlay')!;
    }
    overlay.classList.add('active');
    updatePresentationSlide(0);
    document.addEventListener('keydown', presentationKeyHandler);
}

function closePresentation(): void {
    presentationOpen = false;
    const overlay = document.getElementById('presentation-overlay');
    if (overlay) overlay.classList.remove('active');
    document.removeEventListener('keydown', presentationKeyHandler);
}

function buildPresentationDOM(): void {
    const overlay = document.createElement('div');
    overlay.id = 'presentation-overlay';

    // Header
    const header = document.createElement('div');
    header.id = 'presentation-header';
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 24px;border-bottom:1px solid var(--border-cyan);background:rgba(5,5,20,0.8);';

    const title = document.createElement('div');
    title.id = 'presentation-title';
    title.style.cssText = "font-size:0.75rem;color:var(--color-cyan);letter-spacing:2px;";
    title.textContent = 'NODEFALL — Slide 1 of 1';
    header.appendChild(title);

    const controls = document.createElement('div');
    controls.id = 'presentation-controls';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'CLOSE [ESC]';
    closeBtn.style.cssText = 'background:rgba(0,245,255,0.1);border:1px solid var(--border-cyan);color:var(--color-cyan);padding:4px 12px;border-radius:4px;font-family:inherit;font-size:0.7rem;cursor:pointer;';
    closeBtn.onclick = closePresentation;
    controls.appendChild(closeBtn);
    header.appendChild(controls);

    // Body
    const body = document.createElement('div');
    body.id = 'presentation-body';
    body.style.cssText = 'display:flex;flex:1;overflow:hidden;';

    const thumbs = document.createElement('div');
    thumbs.id = 'presentation-thumbs';
    body.appendChild(thumbs);

    const slideArea = document.createElement('div');
    slideArea.id = 'presentation-slide-area';
    slideArea.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;overflow:hidden;';

    const slideContent = document.createElement('div');
    slideContent.id = 'presentation-slide-content';
    slideContent.style.cssText = 'max-width:900px;width:100%;font-size:1.3rem;line-height:1.7;';
    slideArea.appendChild(slideContent);
    body.appendChild(slideArea);

    // Footer
    const footer = document.createElement('div');
    footer.id = 'presentation-footer';
    footer.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 24px;border-top:1px solid var(--border-cyan);background:rgba(5,5,20,0.8);';

    const prevBtn = document.createElement('button');
    prevBtn.id = 'presentation-prev-btn';
    prevBtn.textContent = '◀ PREV';
    prevBtn.style.cssText = 'background:rgba(0,245,255,0.1);border:1px solid var(--border-cyan);color:var(--color-cyan);padding:6px 16px;border-radius:4px;font-family:inherit;font-size:0.8rem;cursor:pointer;';
    prevBtn.onclick = () => navigateSlide(-1);

    const dots = document.createElement('div');
    dots.id = 'presentation-dots';
    dots.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;max-width:400px;justify-content:center;';

    const nextBtn = document.createElement('button');
    nextBtn.id = 'presentation-next-btn';
    nextBtn.textContent = 'NEXT ▶';
    nextBtn.style.cssText = 'background:rgba(0,245,255,0.1);border:1px solid var(--border-cyan);color:var(--color-cyan);padding:6px 16px;border-radius:4px;font-family:inherit;font-size:0.8rem;cursor:pointer;';
    nextBtn.onclick = () => navigateSlide(1);

    footer.appendChild(prevBtn);
    footer.appendChild(dots);
    footer.appendChild(nextBtn);

    overlay.appendChild(header);
    overlay.appendChild(body);
    overlay.appendChild(footer);
    document.body.appendChild(overlay);

    buildPresentationSlides();
}

function buildPresentationSlides(): void {
    const content = document.getElementById('presentation-slide-content');
    const thumbs = document.getElementById('presentation-thumbs');
    if (!content || !thumbs) return;

    // Parse DOCS_FOR_SLIDES by <section> tags into individual slides
    const tmp = document.createElement('div');
    tmp.innerHTML = DOCS_FOR_SLIDES;
    const sectionEls = tmp.querySelectorAll('section');
    slides = Array.from(sectionEls).map(s => s.outerHTML);

    // If no sections found, use full content as single slide
    if (slides.length === 0) {
        slides = [DOCS_FOR_SLIDES];
    }

    // Build thumbnails and dots
    thumbs.innerHTML = '';
    const dots = document.getElementById('presentation-dots');
    if (dots) dots.innerHTML = '';

    slides.forEach((_, i) => {
        const thumb = document.createElement('div');
        thumb.className = `presentation-thumb ${i === 0 ? 'active' : ''}`;
        thumb.textContent = String(i + 1);
        thumb.style.cssText = 'border-radius:4px;padding:6px 4px;cursor:pointer;font-size:0.6rem;color:var(--text-secondary);text-align:center;';
        if (i === 0) thumb.style.cssText += 'border:2px solid var(--color-cyan);opacity:1;background:rgba(0,245,255,0.1);';
        thumb.onclick = () => goToSlide(i);
        thumbs.appendChild(thumb);

        if (dots) {
            const dot = document.createElement('div');
            dot.className = `presentation-dot ${i === 0 ? 'active' : ''}`;
            dot.style.cssText = 'width:8px;height:8px;border-radius:50%;cursor:pointer;';
            if (i === 0) dot.style.cssText += 'background:var(--color-cyan);box-shadow:0 0 8px var(--color-cyan);';
            dot.onclick = () => goToSlide(i);
            dots.appendChild(dot);
        }
    });

    // Set first slide content
    content.innerHTML = slides[0];
    updatePresentationSlide(0);
}

function updatePresentationSlide(index: number): void {
    if (index < 0 || index >= slides.length) return;
    currentSlideIndex = index;

    const content = document.getElementById('presentation-slide-content');
    const dots = document.getElementById('presentation-dots');
    const thumbEls = document.querySelectorAll('.presentation-thumb');
    const title = document.getElementById('presentation-title');

    if (title) title.textContent = `NODEFALL — Slide ${index + 1} of ${slides.length}`;

    if (content) {
        content.innerHTML = slides[index];
        content.style.animation = 'none';
        content.offsetHeight;
        content.style.animation = 'slideFadeIn 0.2s ease-out';
    }

    if (dots) {
        dots.querySelectorAll('.presentation-dot').forEach((d, i) => {
            (d as HTMLElement).className = `presentation-dot ${i === index ? 'active' : ''}`;
        });
    }

    thumbEls.forEach((t, i) => {
        (t as HTMLElement).className = `presentation-thumb ${i === index ? 'active' : ''}`;
    });

    const prevBtn = document.getElementById('presentation-prev-btn') as HTMLButtonElement;
    const nextBtn = document.getElementById('presentation-next-btn') as HTMLButtonElement;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === slides.length - 1;
}

function navigateSlide(dir: number): void {
    updatePresentationSlide(currentSlideIndex + dir);
}

function goToSlide(index: number): void {
    updatePresentationSlide(index);
}

function presentationKeyHandler(e: KeyboardEvent): void {
    if (e.key === 'Escape') closePresentation();
    else if (e.key === 'ArrowLeft') navigateSlide(-1);
    else if (e.key === 'ArrowRight') navigateSlide(1);
}

// Full docs content for presentation mode — mirrors DocsPanel
const DOCS_FOR_SLIDES = `

<div style="max-width: 850px; margin: 0 auto; font-family: 'Share Tech Mono', monospace;">

    <!-- Title Page -->
    <div style="text-align: center; margin-bottom: 50px; padding: 40px 0; border-bottom: 2px solid rgba(0,245,255,0.2);">
        <h1 style="font-size: 3rem; color: #00f5ff; letter-spacing: 6px; margin-bottom: 10px; text-shadow: 0 0 30px rgba(0,245,255,0.5);">NODEFALL</h1>
        <p style="color: #a490c2; font-size: 1rem; letter-spacing: 3px; text-transform: uppercase;">Network Defense Simulator</p>
        <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #d97757, #6a9bcc); margin: 20px auto;"></div>
        <p style="color: #7a7292; font-size: 0.8rem;">Programming 2 — Course Project Documentation</p>
        <p style="color: #b8b0d0; font-size: 0.85rem; margin-top: 10px;">Developers: <strong style="color:#f0edf8;">Jose Miguel Barron</strong> & <strong style="color:#f0edf8;">Jho Av Maurish Yee</strong></p>
    </div>

    <!-- Introduction -->
    <section style="margin-bottom: 40px;">
        <h2 style="font-size: 0.9rem; color: #d97757; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 8px;">01 — Introduction</h2>
        <p style="color: #b8b0d0; line-height: 1.8; margin-bottom: 16px;">
            <strong style="color:#f0edf8;">NODEFALL</strong> is a cyberpunk-themed tower defense game where players defend a Core Server against waves of malicious data entities. The game features 20 waves of escalating difficulty, dynamic map rotation every 5 waves, and progressive tower unlocking.
        </p>
        <p style="color: #7a7292; font-size: 0.85rem;">
            Built with TypeScript, Three.js (3D rendering), and Vite. Runs entirely in the browser via WebGL.
        </p>
    </section>

    <!-- Objectives -->
    <section style="margin-bottom: 40px;">
        <h2 style="font-size: 0.9rem; color: #d97757; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 8px;">02 — Objectives</h2>
        <ol style="color: #b8b0d0; padding-left: 24px; line-height: 2;">
            <li><strong style="color:#d97757;">Defend</strong> the Core Server from corrupted data packets</li>
            <li><strong style="color:#d97757;">Survive</strong> 20 waves of increasingly dangerous threats</li>
            <li><strong style="color:#d97757;">Build</strong> and upgrade defensive towers along the data path</li>
            <li><strong style="color:#d97757;">Boss waves</strong> every 5th wave feature a massive Kernel Boss</li>
            <li><strong style="color:#d97757;">Adapt</strong> strategy when map topology changes every 5 waves</li>
        </ol>
    </section>

    <!-- Game Description -->
    <section style="margin-bottom: 40px;">
        <h2 style="font-size: 0.9rem; color: #d97757; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 8px;">03 — Game Description</h2>
        
        <h3 style="color: #6a9bcc; font-size: 0.85rem; margin-bottom: 12px;">Core Mechanics</h3>
        <p style="color: #b8b0d0; line-height: 1.8; margin-bottom: 20px;">
            Enemies travel along a fixed path toward the Core Server. Place towers adjacent to the path to eliminate threats before they breach the defense. Each breach deals damage to Core HP. Survive all 20 waves for victory.
        </p>

        <h3 style="color: #6a9bcc; font-size: 0.85rem; margin-bottom: 12px;">Wave System</h3>
        <div style="background: rgba(31,24,54,0.8); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center;">
                <div><div style="color: #00f5ff; font-size: 1.2rem;">1-5</div><div style="color: #7a7292; font-size: 0.7rem;">Snake Path</div></div>
                <div><div style="color: #d97757; font-size: 1.2rem;">6-10</div><div style="color: #7a7292; font-size: 0.7rem;">Zigzag Layout</div></div>
                <div><div style="color: #6a9bcc; font-size: 1.2rem;">11-15</div><div style="color: #7a7292; font-size: 0.7rem;">Loop-de-Loop</div></div>
                <div><div style="color: #a490c2; font-size: 1.2rem;">16-20</div><div style="color: #7a7292; font-size: 0.7rem;">Spiral</div></div>
            </div>
        </div>
    </section>

    <!-- Tower Types -->
    <section style="margin-bottom: 40px;">
        <h2 style="font-size: 0.9rem; color: #d97757; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 8px;">04 — Tower Types</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: rgba(31,24,54,0.8); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div><div style="color: #00f5ff;">1 — Firewall</div><div style="color: #7a7292; font-size: 0.75rem;">Single target, balanced protection</div></div>
                <div style="text-align: right;"><div style="color: #d97757;">100g</div><div style="color: #7a7292; font-size: 0.7rem;">Wave 1</div></div>
            </div>
            <div style="background: rgba(31,24,54,0.8); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div><div style="color: #00f5ff;">2 — Encryption Node</div><div style="color: #7a7292; font-size: 0.75rem;">Applies SLOW effect</div></div>
                <div style="text-align: right;"><div style="color: #d97757;">150g</div><div style="color: #7a7292; font-size: 0.7rem;">Wave 4</div></div>
            </div>
            <div style="background: rgba(31,24,54,0.8); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div><div style="color: #00f5ff;">3 — Overload Cannon</div><div style="color: #7a7292; font-size: 0.75rem;">High damage, slow fire rate</div></div>
                <div style="text-align: right;"><div style="color: #d97757;">200g</div><div style="color: #7a7292; font-size: 0.7rem;">Wave 8</div></div>
            </div>
            <div style="background: rgba(31,24,54,0.8); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div><div style="color: #00f5ff;">4 — EMP Tower</div><div style="color: #7a7292; font-size: 0.75rem;">AoE burst damage</div></div>
                <div style="text-align: right;"><div style="color: #d97757;">250g</div><div style="color: #7a7292; font-size: 0.7rem;">Wave 12</div></div>
            </div>
            <div style="background: rgba(31,24,54,0.8); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div><div style="color: #00f5ff;">5 — Ice Node</div><div style="color: #7a7292; font-size: 0.75rem;">Applies FREEZE effect</div></div>
                <div style="text-align: right;"><div style="color: #d97757;">175g</div><div style="color: #7a7292; font-size: 0.7rem;">Wave 16</div></div>
            </div>
        </div>
    </section>

    <!-- Enemy Types -->
    <section style="margin-bottom: 40px;">
        <h2 style="font-size: 0.9rem; color: #d97757; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 8px;">05 — Enemy Types</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color:#f0edf8;">Data Packet</span><br><span style="color:#7a7292;font-size:0.75rem;">Basic, low HP</span></div>
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color:#f0edf8;">Worm Process</span><br><span style="color:#7a7292;font-size:0.75rem;">Splits on death</span></div>
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color:#f0edf8;">Daemon Thread</span><br><span style="color:#7a7292;font-size:0.75rem;">High HP, slow</span></div>
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color:#f0edf8;">Rootkit</span><br><span style="color:#7a7292;font-size:0.75rem;">Fast, medium HP</span></div>
            <div style="padding: 10px; grid-column: span 2;"><span style="color:#ff2244;font-weight:bold;">Kernel Boss</span><br><span style="color:#7a7292;font-size:0.75rem;">Massive HP, appears every 5 waves</span></div>
        </div>
    </section>

    <!-- Controls -->
    <section style="margin-bottom: 40px;">
        <h2 style="font-size: 0.9rem; color: #d97757; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 8px;">06 — Controls</h2>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px 30px; font-size: 0.9rem;">
            <span style="color: #00f5ff; font-weight: bold;">Left Click</span><span style="color: #b8b0d0;">Place tower / Select tower</span>
            <span style="color: #00f5ff; font-weight: bold;">1 – 5</span><span style="color: #b8b0d0;">Quick-select towers</span>
            <span style="color: #00f5ff; font-weight: bold;">E / ESC</span><span style="color: #b8b0d0;">Cancel placement</span>
            <span style="color: #00f5ff; font-weight: bold;">Space</span><span style="color: #b8b0d0;">Toggle pause</span>
            <span style="color: #00f5ff; font-weight: bold;">Q</span><span style="color: #b8b0d0;">Upgrade selected tower</span>
        </div>
    </section>

    <!-- Tech Stack -->
    <section style="margin-bottom: 40px;">
        <h2 style="font-size: 0.9rem; color: #d97757; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 8px;">07 — Tech Stack</h2>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; font-size: 0.85rem;">
            <span style="color: #00f5ff;">Engine</span><span style="color: #b8b0d0;">Three.js (WebGL)</span>
            <span style="color: #00f5ff;">Language</span><span style="color: #b8b0d0;">TypeScript</span>
            <span style="color: #00f5ff;">Build Tool</span><span style="color: #b8b0d0;">Vite</span>
            <span style="color: #00f5ff;">Architecture</span><span style="color: #b8b0d0;">Component-based ECS pattern</span>
        </div>
    </section>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 30px; border-top: 1px solid rgba(0,245,255,0.1);">
        <p style="color: #7a7292; font-size: 0.7rem; letter-spacing: 2px;">
            NODEFALL — NETWORK DEFENSE SIMULATOR<br>
            PROGRAMMING 2 — BARRON & YEE — MAY 2026
        </p>
    </div>
</div>

`;

export class Menu {
    private onStart: () => void;

    constructor(onStart: () => void) {
        this.onStart = onStart;

        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) startBtn.onclick = this.onStart;

        const manualBtn = document.getElementById('how-to-play-btn');
        const closeManualBtn = document.getElementById('close-manual-btn');
        const manualModal = document.getElementById('manual-modal');

        if (manualBtn && manualModal) {
            manualBtn.onclick = () => manualModal.style.display = 'flex';
        }
        if (closeManualBtn && manualModal) {
            closeManualBtn.onclick = () => manualModal.style.display = 'none';
        }

        const docsBtn = document.getElementById('docs-btn');
        if (docsBtn) docsBtn.onclick = () => DocsPanel.open();

        const presBtn = document.getElementById('presentation-mode-btn');
        if (presBtn) presBtn.onclick = togglePresentationMode;

        this.initSettings();
        this.buildTowerShowcase(1);
        this.loadHighScore();
    }

    private initSettings(): void {
        const soundToggle = document.getElementById('menu-sound-toggle') as HTMLInputElement;
        const particlesToggle = document.getElementById('menu-particles-toggle') as HTMLInputElement;
        const fullscreenToggle = document.getElementById('menu-fullscreen-toggle') as HTMLInputElement;
        const autostartToggle = document.getElementById('menu-autostart-toggle') as HTMLInputElement;

        if (soundToggle) {
            soundToggle.checked = localStorage.getItem('soundEnabled') !== 'false';
        }
        if (particlesToggle) {
            particlesToggle.checked = localStorage.getItem('particlesEnabled') !== 'false';
        }
        if (autostartToggle) {
            autostartToggle.checked = localStorage.getItem('autoStart') === 'true';
        }

        if (soundToggle) {
            soundToggle.addEventListener('change', () => {
                localStorage.setItem('soundEnabled', String(soundToggle.checked));
            });
        }
        if (particlesToggle) {
            particlesToggle.addEventListener('change', () => {
                localStorage.setItem('particlesEnabled', String(particlesToggle.checked));
            });
        }
        if (fullscreenToggle) {
            fullscreenToggle.addEventListener('change', () => {
                if (fullscreenToggle.checked) {
                    document.documentElement.requestFullscreen?.();
                } else {
                    document.exitFullscreen?.();
                }
            });
        }
        if (autostartToggle) {
            autostartToggle.addEventListener('change', () => {
                localStorage.setItem('autoStart', String(autostartToggle.checked));
            });
        }
    }

    public buildTowerShowcase(currentWave: number): void {
        const container = document.getElementById('menu-tower-cards');
        if (!container) return;

        const types: TowerType[] = ['FIREWALL', 'ENCRYPTION', 'OVERLOAD', 'EMP', 'ICE'];
        container.innerHTML = '';

        let unlockedCount = 0;
        types.forEach((type, idx) => {
            const stats = TOWER_STATS[type];
            const unlockWave = TIER_UNLOCKS[type];
            if (currentWave < unlockWave) return; // skip locked towers

            unlockedCount++;
            const card = document.createElement('div');
            card.className = 'menu-tower-card-item unlocked';
            card.innerHTML = `
                <span class="menu-tower-key">${idx + 1}</span>
                <span class="menu-tower-card-name">${stats.name}</span>
                <span class="menu-tower-card-cost">${stats.cost}g</span>
            `;
            container.appendChild(card);
        });

        const progress = document.getElementById('menu-tower-progress');
        if (progress) progress.textContent = `${unlockedCount}/5`;
    }

    private loadHighScore(): void {
        const highScore = parseInt(localStorage.getItem('nodefall_highscore') || '0', 10);
        const el = document.getElementById('menu-highscore-display');
        if (el) el.innerText = highScore.toLocaleString();
    }

    public showGameOver(wave: number, score: number, victory: boolean = false): void {
        const overlay = document.getElementById('game-over-overlay')!;
        const title = document.getElementById('game-over-title')!;
        const finalWave = document.getElementById('final-wave')!;
        const finalScore = document.getElementById('final-score')!;

        overlay.style.display = 'flex';
        finalWave.innerText = wave.toString();
        finalScore.innerText = score.toString();

        if (victory) {
            title.innerText = 'KERNEL DEFEATED';
            title.style.color = 'var(--color-green)';
        } else {
            title.innerText = 'GRID BREACHED';
            title.style.color = 'var(--color-red)';
        }
    }

    public setEnabled(enabled: boolean): void {
        const startBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
        const statusText = document.getElementById('menu-status-text');
        if (startBtn) {
            startBtn.disabled = !enabled;
            startBtn.classList.toggle('pulse', enabled);
        }
        if (statusText) {
            statusText.innerText = enabled ? 'SYSTEM READY' : 'SYSTEM OFFLINE';
            statusText.style.color = enabled ? 'var(--color-green)' : 'var(--color-red)';
        }
    }

    public hideMenu(): void {
        const overlay = document.getElementById('menu-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    public showMenu(): void {
        const overlay = document.getElementById('menu-overlay');
        if (overlay) overlay.style.display = 'flex';
    }
}