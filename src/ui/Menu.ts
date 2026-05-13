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
<section>
    <h1 style="font-size:2.2rem;color:#00f5ff;letter-spacing:4px;margin-bottom:8px;text-align:center;">NODEFALL</h1>
    <p style="color:#b8b0d0;text-align:center;margin-bottom:40px;letter-spacing:2px;">NETWORK DEFENSE SIMULATOR</p>
    <h2 style="font-size:1rem;color:#d97757;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid rgba(217,119,87,0.3);padding-bottom:6px;">Objectives</h2>
    <ul style="list-style:none;padding:0;margin-bottom:32px;">
        <li style="margin-bottom:10px;padding-left:16px;border-left:2px solid #6a9bcc;"><strong style="color:#d97757;">Defend</strong> the Core Server from corrupted data packets</li>
        <li style="margin-bottom:10px;padding-left:16px;border-left:2px solid #6a9bcc;"><strong style="color:#d97757;">Survive</strong> 20 waves of increasingly dangerous threats</li>
        <li style="margin-bottom:10px;padding-left:16px;border-left:2px solid #6a9bcc;"><strong style="color:#d97757;">Build</strong> and <strong style="color:#d97757;">upgrade</strong> defensive towers</li>
        <li style="margin-bottom:10px;padding-left:16px;border-left:2px solid #6a9bcc;"><strong style="color:#d97757;">Boss waves</strong> every 5th wave feature a massive Kernel Boss</li>
    </ul>
</section>
<section>
    <h2 style="font-size:1rem;color:#d97757;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid rgba(217,119,87,0.3);padding-bottom:6px;">Controls</h2>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 20px;font-size:0.9rem;margin-bottom:24px;">
        <span style="color:#00f5ff;font-weight:bold;">Left Click</span><span>Place tower / Select tower</span>
        <span style="color:#00f5ff;font-weight:bold;">1–5</span><span>Quick-select tower by number</span>
        <span style="color:#00f5ff;font-weight:bold;">E / ESC</span><span>Cancel placement</span>
        <span style="color:#00f5ff;font-weight:bold;">Space</span><span>Toggle pause</span>
    </div>
    <h2 style="font-size:1rem;color:#d97757;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid rgba(217,119,87,0.3);padding-bottom:6px;">Map Rotation</h2>
    <p style="color:#b8b0d0;font-size:0.9rem;margin-bottom:12px;">Map changes every 5 waves — refunds 80% of towers + bonus gold.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:var(--bg-card);border-radius:6px;padding:10px 14px;border-left:3px solid #00f5ff;"><div style="color:#00f5ff;font-size:0.8rem;">Waves 1–5</div><div style="color:var(--text-muted);font-size:0.75rem;">Simple snake path</div></div>
        <div style="background:var(--bg-card);border-radius:6px;padding:10px 14px;border-left:3px solid #d97757;"><div style="color:#d97757;font-size:0.8rem;">Waves 6–10</div><div style="color:var(--text-muted);font-size:0.75rem;">Zigzag layout</div></div>
        <div style="background:var(--bg-card);border-radius:6px;padding:10px 14px;border-left:3px solid #6a9bcc;"><div style="color:#6a9bcc;font-size:0.8rem;">Waves 11–15</div><div style="color:var(--text-muted);font-size:0.75rem;">Loop-de-loop</div></div>
        <div style="background:var(--bg-card);border-radius:6px;padding:10px 14px;border-left:3px solid #a490c2;"><div style="color:#a490c2;font-size:0.8rem;">Waves 16–20</div><div style="color:var(--text-muted);font-size:0.75rem;">Spiral</div></div>
    </div>
</section>
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