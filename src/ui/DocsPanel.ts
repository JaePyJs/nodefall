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
<div style="max-width: 800px; margin: 0 auto;">

    <!-- Title -->
    <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="font-size: 2.2rem; color: #00f5ff; letter-spacing: 4px; margin-bottom: 8px; text-shadow: 0 0 20px rgba(0,245,255,0.5);">
            NODEFALL
        </h1>
        <p style="color: var(--text-secondary); font-size: 0.85rem; letter-spacing: 2px;">
            NETWORK DEFENSE SIMULATOR
        </p>
    </div>

    <!-- Objectives -->
    <section style="margin-bottom: 36px;">
        <h2 style="font-size: 0.8rem; color: #d97757; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 6px;">
            Objectives
        </h2>
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px; padding-left: 16px; border-left: 2px solid #6a9bcc;">
                <strong style="color: #d97757;">Defend</strong> the Core Server from corrupted data packets
            </li>
            <li style="margin-bottom: 8px; padding-left: 16px; border-left: 2px solid #6a9bcc;">
                <strong style="color: #d97757;">Survive</strong> 20 waves of increasingly dangerous threats
            </li>
            <li style="margin-bottom: 8px; padding-left: 16px; border-left: 2px solid #6a9bcc;">
                <strong style="color: #d97757;">Build</strong> and <strong style="color: #d97757;">upgrade</strong> defensive towers along the data path
            </li>
            <li style="margin-bottom: 8px; padding-left: 16px; border-left: 2px solid #6a9bcc;">
                <strong style="color: #d97757;">Boss waves</strong> every 5th wave feature a massive Kernel Boss
            </li>
        </ul>
    </section>

    <!-- Controls -->
    <section style="margin-bottom: 36px;">
        <h2 style="font-size: 0.8rem; color: #d97757; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 6px;">
            Controls
        </h2>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 20px; font-size: 0.85rem;">
            <span style="color: #00f5ff; font-weight: bold;">Left Click</span>
            <span style="color: var(--text-secondary);">Place tower / Select tower</span>

            <span style="color: #00f5ff; font-weight: bold;">1 – 5</span>
            <span style="color: var(--text-secondary);">Quick-select towers by number</span>

            <span style="color: #00f5ff; font-weight: bold;">E / ESC</span>
            <span style="color: var(--text-secondary);">Cancel placement</span>

            <span style="color: #00f5ff; font-weight: bold;">Space</span>
            <span style="color: var(--text-secondary);">Toggle pause</span>

            <span style="color: #00f5ff; font-weight: bold;">Speed Button</span>
            <span style="color: var(--text-secondary);">Cycle 1x, 2x, 3x game speed</span>
        </div>
    </section>

    <!-- Tower Types -->
    <section style="margin-bottom: 36px;">
        <h2 style="font-size: 0.8rem; color: #d97757; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 6px;">
            Tower Types — Progressive Unlock
        </h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">
            New towers unlock as you progress through waves.
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Tower cards -->
            <div style="background: var(--bg-card); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: #00f5ff; font-size: 0.9rem; margin-bottom: 2px;">1 &nbsp; Firewall</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem;">Single target, balanced protection</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #d97757; font-size: 0.85rem;">100g</div>
                    <div style="color: var(--text-muted); font-size: 0.7rem;">Unlocks Wave 1</div>
                </div>
            </div>
            <div style="background: var(--bg-card); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: #00f5ff; font-size: 0.9rem; margin-bottom: 2px;">2 &nbsp; Encryption Node</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem;">Applies <span style="color:#6a9bcc;">SLOW</span> effect to enemies</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #d97757; font-size: 0.85rem;">150g</div>
                    <div style="color: var(--text-muted); font-size: 0.7rem;">Unlocks Wave 2</div>
                </div>
            </div>
            <div style="background: var(--bg-card); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: #00f5ff; font-size: 0.9rem; margin-bottom: 2px;">3 &nbsp; Overload Cannon</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem;">High DMG, slow fire rate</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #d97757; font-size: 0.85rem;">200g</div>
                    <div style="color: var(--text-muted); font-size: 0.7rem;">Unlocks Wave 3</div>
                </div>
            </div>
            <div style="background: var(--bg-card); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: #00f5ff; font-size: 0.9rem; margin-bottom: 2px;">4 &nbsp; EMP Tower</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem;">AoE burst, hits all nearby threats</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #d97757; font-size: 0.85rem;">250g</div>
                    <div style="color: var(--text-muted); font-size: 0.7rem;">Unlocks Wave 4</div>
                </div>
            </div>
            <div style="background: var(--bg-card); border: 1px solid rgba(0,245,255,0.15); border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: #00f5ff; font-size: 0.9rem; margin-bottom: 2px;">5 &nbsp; Ice Node</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem;">Applies <span style="color:#a490c2;">FREEZE</span> effect briefly</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #d97757; font-size: 0.85rem;">175g</div>
                    <div style="color: var(--text-muted); font-size: 0.7rem;">Unlocks Wave 5</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Map Progression -->
    <section style="margin-bottom: 36px;">
        <h2 style="font-size: 0.8rem; color: #d97757; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 6px;">
            Map Progression
        </h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 14px;">
            The network map changes every 5 waves. Each change refunds 80% of tower costs + bonus gold, then pauses for 3 seconds to let you rebuild.
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="background: var(--bg-card); border-radius: 6px; padding: 10px 14px; border-left: 3px solid #00f5ff;">
                <div style="color: #00f5ff; font-size: 0.8rem;">Waves 1–5</div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">Simple snake path</div>
            </div>
            <div style="background: var(--bg-card); border-radius: 6px; padding: 10px 14px; border-left: 3px solid #d97757;">
                <div style="color: #d97757; font-size: 0.8rem;">Waves 6–10</div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">Zigzag layout</div>
            </div>
            <div style="background: var(--bg-card); border-radius: 6px; padding: 10px 14px; border-left: 3px solid #6a9bcc;">
                <div style="color: #6a9bcc; font-size: 0.8rem;">Waves 11–15</div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">Loop-de-loop</div>
            </div>
            <div style="background: var(--bg-card); border-radius: 6px; padding: 10px 14px; border-left: 3px solid #a490c2;">
                <div style="color: #a490c2; font-size: 0.8rem;">Waves 16–20</div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">Spiral</div>
            </div>
        </div>
    </section>

    <!-- Enemy Types -->
    <section style="margin-bottom: 36px;">
        <h2 style="font-size: 0.8rem; color: #d97757; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 6px;">
            Enemy Types
        </h2>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="color: var(--text-primary);">Data Packet</span>
                <span style="color: var(--text-muted); font-size: 0.8rem;">Basic corrupted data, low HP</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="color: var(--text-primary);">Worm Process</span>
                <span style="color: var(--text-muted); font-size: 0.8rem;">Splits into two smaller units when killed</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="color: var(--text-primary);">Daemon Thread</span>
                <span style="color: var(--text-muted); font-size: 0.8rem;">High HP, slow moving</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="color: var(--text-primary);">Rootkit</span>
                <span style="color: var(--text-muted); font-size: 0.8rem;">Fast, medium HP</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="color: #ff2244; font-weight: bold;">Kernel Boss</span>
                <span style="color: #ff2244; font-size: 0.8rem;">Massive boss, appears every 5 waves</span>
            </div>
        </div>
    </section>

    <!-- Tech Stack -->
    <section style="margin-bottom: 40px;">
        <h2 style="font-size: 0.8rem; color: #d97757; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(217,119,87,0.3); padding-bottom: 6px;">
            Tech Stack
        </h2>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; font-size: 0.85rem;">
            <span style="color: #00f5ff;">Engine</span>
            <span style="color: var(--text-secondary);">Three.js (3D rendering)</span>
            <span style="color: #00f5ff;">Language</span>
            <span style="color: var(--text-secondary);">TypeScript</span>
            <span style="color: #00f5ff;">Build Tool</span>
            <span style="color: var(--text-secondary);">Vite</span>
            <span style="color: #00f5ff;">Architecture</span>
            <span style="color: var(--text-secondary);">Component-based ECS pattern</span>
        </div>
    </section>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(0,245,255,0.1);">
        <p style="color: var(--text-muted); font-size: 0.7rem; letter-spacing: 2px;">
            COURSE: PROGRAMMING 2 &nbsp;|&nbsp; DEVELOPERS: JAE + TEAMMATES
        </p>
    </div>

</div>
`;