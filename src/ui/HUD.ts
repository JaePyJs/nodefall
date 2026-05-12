import { GameState } from '../systems/GameState';

export class HUD {
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.update();
    }

    public update(): void {
        const goldEl = document.getElementById('gold-counter');
        const livesEl = document.getElementById('lives-counter');
        const waveEl = document.getElementById('wave-counter');

        if (goldEl) goldEl.innerText = this.gameState.gold.toString();
        if (livesEl) {
            livesEl.innerText = this.gameState.lives.toString();
            if (this.gameState.lives < 5) livesEl.style.color = 'var(--color-red)';
            else livesEl.style.color = 'var(--color-cyan)';
        }
        if (waveEl) waveEl.innerText = `${this.gameState.wave}/${this.gameState.maxWaves}`;
    }
}
