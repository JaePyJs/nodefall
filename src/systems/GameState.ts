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
        // HUD.update() handles DOM rendering. GameState is pure data.
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
