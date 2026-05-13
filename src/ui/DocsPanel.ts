import { GameState } from '../systems/GameState';
import { GameStatus } from '../types';

/**
 * DocsPanel — static singleton module for the in-game documentation overlay.
 *
 * Usage:
 *   DocsPanel.init(gameState);
 *   DocsPanel.open();    // opens panel, pauses game if playing
 *   DocsPanel.close();   // closes panel, restores game state
 *   DocsPanel.isOpen();  // returns current open state
 */
export const DocsPanel = (() => {
    // Module-level state
    let gameState: GameState | null = null;
    let _isOpen = false;

    // Saved game state for restore on close
    let savedIsPaused = false;
    let savedStatus: GameStatus = GameStatus.MENU;

    // DOM refs (set on first open)
    let overlayEl: HTMLElement | null = null;
    let closeBtn: HTMLElement | null = null;
    let escHandler: ((e: KeyboardEvent) => void) | null = null;

    function init(gs: GameState): void {
        gameState = gs;
    }

    function open(): void {
        if (!gameState) {
            return;
        }

        // Save game state — only when opened during active gameplay
        if (gameState.status !== GameStatus.MENU) {
            savedIsPaused = gameState.isPaused;
            savedStatus = gameState.status;
            gameState.isPaused = true;
        }

        // First open: create DOM once
        if (!overlayEl) {
            buildDOM();
        }

        (overlayEl as HTMLElement).style.display = 'flex';
        _isOpen = true;
    }

    function close(): void {
        if (!_isOpen || !overlayEl) return;

        (overlayEl as HTMLElement).style.display = 'none';
        _isOpen = false;

        // Remove ESC listener to prevent leak
        if (escHandler) {
            window.removeEventListener('keydown', escHandler);
            escHandler = null;
        }

        // Restore game state — only when we saved it (i.e., not opened from MENU)
        if (gameState && gameState.status !== GameStatus.MENU) {
            gameState.isPaused = savedIsPaused;
            gameState.status = savedStatus;
        }
    }

    function isOpen(): boolean {
        return _isOpen;
    }

    function buildDOM(): void {
        overlayEl = document.createElement('div');
        overlayEl.id = 'docs-panel-overlay';
        overlayEl.style.cssText = [
            'position: fixed; top: 0; left: 0; width: 100%; height: 100%;',
            'background: rgba(5, 5, 20, 0.92); z-index: 2000;',
            'display: flex; align-items: center; justify-content: center;',
        ].join(' ');

        const inner = document.createElement('div');
        inner.id = 'docs-panel-inner';
        inner.style.cssText = [
            'width: 90%; height: 90%; max-width: 950px;',
            'background: #100c1a;',
            'border: 1px solid rgba(0,245,255,0.25);',
            'border-radius: 12px;',
            'display: flex; flex-direction: column;',
            'box-shadow: 0 0 40px rgba(0,245,255,0.15), inset 0 1px 0 rgba(0,245,255,0.1);',
            'overflow: hidden; position: relative;',
        ].join(' ');

        // Header
        const header = document.createElement('div');
        header.style.cssText = [
            'display: flex; justify-content: space-between; align-items: center;',
            'padding: 16px 24px;',
            'border-bottom: 1px solid rgba(0,245,255,0.15);',
            'background: rgba(0,0,0,0.3); flex-shrink: 0;',
        ].join(' ');

        const title = document.createElement('span');
        title.style.cssText = [
            "font-family: 'Share Tech Mono', monospace;",
            'font-size: 0.75rem; letter-spacing: 3px;',
            'color: #00f5ff; text-transform: uppercase;',
        ].join(' ');
        title.textContent = 'NODEFALL — Documentation';

        closeBtn = document.createElement('button');
        closeBtn.id = 'docs-panel-close-btn';
        closeBtn.style.cssText = [
            'background: rgba(255,34,68,0.15);',
            'border: 1px solid rgba(255,34,68,0.4);',
            'color: #ff2244; padding: 6px 16px; border-radius: 4px;',
            "font-family: 'Share Tech Mono', monospace;",
            'font-size: 0.75rem; letter-spacing: 2px;',
            'cursor: pointer; transition: all 0.2s;',
        ].join(' ');
        closeBtn.textContent = 'CLOSE [ESC]';
        closeBtn.addEventListener('click', close);

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Scrollable content area
        const content = document.createElement('div');
        content.id = 'docs-panel-content';
        content.style.cssText = [
            'flex: 1; overflow-y: auto; padding: 0;',
            'scrollbar-width: thin; scrollbar-color: #00f5ff #1a1028;',
        ].join(' ');

        // Inject scanline overlay + scrollbar CSS
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            #docs-panel-content::before {
                content: '';
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
                pointer-events: none; z-index: 9999;
            }
            #docs-panel-content::-webkit-scrollbar { width: 6px; }
            #docs-panel-content::-webkit-scrollbar-track { background: #1a1028; }
            #docs-panel-content::-webkit-scrollbar-thumb { background: #00f5ff; border-radius: 3px; }
        `;
        content.appendChild(styleEl);

        // Documentation body
        const docBody = document.createElement('div');
        docBody.style.cssText = [
            '--bg-deep: #100c1a;',
            '--bg-card: #1f1836;',
            '--bg-card-hover: #2d2450;',
            '--accent-primary: #d97757;',
            '--accent-secondary: #6a9bcc;',
            '--accent-tertiary: #a490c2;',
            '--text-primary: #f0edf8;',
            '--text-secondary: #b8b0d0;',
            '--text-muted: #7a7292;',
            'padding: 32px 40px;',
            'font-family: "Share Tech Mono", monospace;',
            'color: var(--text-primary);',
            'line-height: 1.7;',
            'max-width: 100%;',
            'box-sizing: border-box;',
        ].join(' ');

        docBody.innerHTML = DOCS_HTML;
        content.appendChild(docBody);

        inner.appendChild(header);
        inner.appendChild(content);
        overlayEl.appendChild(inner);
        document.body.appendChild(overlayEl);

        // ESC key handler
        escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && _isOpen) close();
        };
        window.addEventListener('keydown', escHandler);
    }

    return { init, open, close, isOpen };
})();

const DOCS_HTML = `

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