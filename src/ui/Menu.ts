export class Menu {
    constructor(onStart: () => void) {
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) startBtn.onclick = onStart;

        const manualBtn = document.getElementById('how-to-play-btn');
        const closeManualBtn = document.getElementById('close-manual-btn');
        const manualModal = document.getElementById('manual-modal');

        if (manualBtn && manualModal) {
            manualBtn.onclick = () => manualModal.style.display = 'flex';
        }
        if (closeManualBtn && manualModal) {
            closeManualBtn.onclick = () => manualModal.style.display = 'none';
        }
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
        const status = document.getElementById('menu-status');
        if (startBtn) {
            startBtn.disabled = !enabled;
            if (enabled) {
                startBtn.classList.add('pulse');
            }
        }
        if (status) {
            status.innerText = enabled ? 'SYSTEM READY' : 'SYSTEM OFFLINE';
            status.style.color = enabled ? 'var(--color-green)' : 'var(--color-red)';
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
