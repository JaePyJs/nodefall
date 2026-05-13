import * as THREE from 'three';
import { GameState } from './GameState';
import { GameStatus } from '../types';
import { DataPacket, WormProcess, DaemonThread, Rootkit, KernelBoss } from '../entities/EnemyTypes';
import { Enemy } from '../entities/Enemy';

// interface WaveConfig {
//     wave: number;
//     enemies: { type: string; count: number; delay: number }[];
//     isBossWave: boolean;
// }

export class WaveManager {
    private scene: THREE.Scene;
    private gameState: GameState;
    private worldPath: THREE.Vector3[];
    private currentWaveIndex: number = 0;
    private spawnQueue: { type: string; delay: number }[] = [];
    private spawnTimer: number = 0;
    private prepTimer: number = 15;
    public isWaveActive: boolean = false;
    public onWaveComplete: (() => void) | null = null;
    public onEnemySpawn: ((enemy: Enemy) => void) | null = null;
    public onMapChange: ((index: number) => void) | null = null;
    public onBossWave: (() => void) | null = null;

    constructor(scene: THREE.Scene, gameState: GameState, worldPath: THREE.Vector3[]) {
        this.scene = scene;
        this.gameState = gameState;
        this.worldPath = worldPath;
    }

    /** Update path reference when map changes — keeps new enemy spawns on correct map path. */
    public updateWorldPath(newPath: THREE.Vector3[]): void {
        this.worldPath = newPath;
    }

    public get waveIndex(): number {
        return this.currentWaveIndex;
    }

    public startWave(): void {
        if (this.isWaveActive) return;
        
        this.currentWaveIndex++;
        this.gameState.setWave(this.currentWaveIndex);
        this.isWaveActive = true;
        this.prepTimer = 0;

        // Map progression every 5 waves (e.g. at start of wave 6, 11, 16)
        if (this.currentWaveIndex > 1 && (this.currentWaveIndex - 1) % 5 === 0) {
            const mapIndex = Math.floor((this.currentWaveIndex - 1) / 5) % 4; // Max 4 maps
            if (this.onMapChange) this.onMapChange(mapIndex);
        }

        // Hide banner
        const banner = document.getElementById('wave-banner');
        if (banner) banner.style.display = 'none';

        // Generate wave composition
        this.generateWave(this.currentWaveIndex);
        
        if (this.currentWaveIndex % 5 === 0) {
            const bossContainer = document.getElementById('boss-hp-container');
            if (bossContainer) bossContainer.style.display = 'block';
            if (this.onBossWave) this.onBossWave();
        }
    }

    private generateWave(wave: number): void {
        this.spawnQueue = [];
        const isBoss = wave % 5 === 0;
        
        if (isBoss) {
            this.spawnQueue.push({ type: 'KernelBoss', delay: 0 });
            // Scale support enemies with wave, diversify types by boss number
            const supportCount = Math.min(5 + wave, 15);
            for (let i = 0; i < supportCount; i++) {
                let type = 'DataPacket';
                const r = Math.random();
                if (wave >= 10 && r > 0.6) type = 'WormProcess';
                else if (wave >= 15 && r > 0.75) type = 'DaemonThread';
                else if (wave >= 18 && r > 0.85) type = 'Rootkit';
                this.spawnQueue.push({ type, delay: 0.5 });
            }
        } else {
            // Gradual difficulty increase
            // Base count starts low and grows
            const count = 5 + Math.floor(wave * 2);
            for (let i = 0; i < count; i++) {
                let type = 'DataPacket';
                // Introduce new enemies slowly
                const rand = Math.random();
                if (wave >= 3 && rand > 0.7) type = 'WormProcess';
                if (wave >= 7 && rand > 0.8) type = 'DaemonThread';
                if (wave >= 12 && rand > 0.85) type = 'Rootkit';
                
                // Spawn delay decreases slightly as waves progress
                const delay = Math.max(0.4, 1.0 - (wave * 0.03));
                this.spawnQueue.push({ type, delay });
            }
        }
    }
    public update(delta: number, enemyCount: number): void {
        if (this.gameState.status === GameStatus.MENU) return;
        if (this.gameState.status === GameStatus.GAME_OVER || this.gameState.status === GameStatus.VICTORY) {
            this.spawnQueue = [];
            this.isWaveActive = false;
            return;
        }

        // Note: Game loop checks isPaused before calling this, so PAUSED check here is redundant
        // Removed: if (this.gameState.status === GameStatus.PAUSED) return;

        if (!this.isWaveActive) {
            if (this.prepTimer > 0) {
                this.prepTimer -= delta;
                const timerEl = document.getElementById('auto-start-timer');
                if (timerEl) timerEl.innerText = `Auto-start in: ${Math.ceil(this.prepTimer)}s`;
                if (this.prepTimer <= 0) this.startWave();
            }
            return;
        }

        if (this.spawnQueue.length > 0) {
            this.spawnTimer -= delta;
            if (this.spawnTimer <= 0) {
                const next = this.spawnQueue.shift()!;
                this.spawnTimer = next.delay;
                this.spawnEnemy(next.type);
            }
        } else if (enemyCount === 0) {
            this.endWave();
        }
    }

    private spawnEnemy(type: string): void {
        let enemy: Enemy;
        switch (type) {
            case 'WormProcess': enemy = new WormProcess(this.scene, this.worldPath); break;
            case 'DaemonThread': enemy = new DaemonThread(this.scene, this.worldPath); break;
            case 'Rootkit': enemy = new Rootkit(this.scene, this.worldPath); break;
            case 'KernelBoss': enemy = new KernelBoss(this.scene, this.worldPath); break;
            default: enemy = new DataPacket(this.scene, this.worldPath); break;
        }
        
        if (this.onEnemySpawn) this.onEnemySpawn(enemy);
    }

    public reset(): void {
        this.currentWaveIndex = 0;
        this.isWaveActive = false;
        this.prepTimer = 15;
        this.spawnQueue = [];
        this.spawnTimer = 0;
    }

    private endWave(): void {
        this.isWaveActive = false;
        this.prepTimer = 15;
        
        if (this.currentWaveIndex >= this.gameState.maxWaves) {
            this.gameState.status = GameStatus.VICTORY;
            return;
        }

        // Show banner for next wave
        const banner = document.getElementById('wave-banner');
        if (banner) {
            banner.style.display = 'block';
            const title = banner.querySelector('.banner-title') as HTMLElement;
            if (title) title.innerHTML = `WAVE ${this.currentWaveIndex + 1} READY`;
            const details = document.getElementById('wave-details');
            if (details) details.innerHTML = `Prepare your defenses.`;
        }
        
        if (this.onWaveComplete) this.onWaveComplete();
    }
}
