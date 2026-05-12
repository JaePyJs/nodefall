import { INITIAL_GOLD, INITIAL_LIVES } from '../constants';
import { GameStatus } from '../types';

export class GameState {
    public gold: number;
    public lives: number;
    public score: number;
    public wave: number;
    public maxWaves: number = 20;
    public gameSpeed: number = 1;
    public isPaused: boolean = false;
    public status: GameStatus = GameStatus.MENU;

    constructor() {
        this.gold = INITIAL_GOLD;
        this.lives = INITIAL_LIVES;
        this.score = 0;
        this.wave = 0;
    }

    public addGold(amount: number): void {
        this.gold += amount;
        this.updateUI();
    }

    public removeGold(amount: number): boolean {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.updateUI();
            return true;
        }
        return false;
    }

    public removeLife(amount: number = 1): void {
        this.lives = Math.max(0, this.lives - amount);
        this.updateUI();
        
        if (this.lives <= 0) {
            this.status = GameStatus.GAME_OVER;
        }
    }

    public addScore(amount: number): void {
        this.score += amount;
        this.updateUI();
    }

    public setWave(wave: number): void {
        this.wave = wave;
        this.updateUI();
    }

    public updateUI(): void {
        const goldEl = document.getElementById('gold-counter');
        const livesEl = document.getElementById('lives-counter');
        const waveEl = document.getElementById('wave-counter');

        if (goldEl) goldEl.innerText = this.gold.toString();
        if (livesEl) {
            livesEl.innerText = this.lives.toString();
            if (this.lives < 5) livesEl.style.color = 'var(--color-red)';
            else livesEl.style.color = '';
        }
        if (waveEl) waveEl.innerText = `${this.wave}/${this.maxWaves}`;
    }

    public reset(): void {
        this.gold = INITIAL_GOLD;
        this.lives = INITIAL_LIVES;
        this.score = 0;
        this.wave = 0;
        this.gameSpeed = 1;
        this.isPaused = false;
        this.status = GameStatus.MENU;
        this.updateUI();
    }
}
