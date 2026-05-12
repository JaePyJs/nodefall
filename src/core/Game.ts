import * as THREE from 'three';
import { Renderer } from './Renderer';
import { InputHandler } from './InputHandler';
import { GameState } from '../systems/GameState';
import { Grid } from '../systems/Grid';
import { WaveManager } from '../systems/WaveManager';
import { Tower } from '../entities/Tower';
import { FirewallTower, EncryptionNode, OverloadCannon, EMPTower, IceNode } from '../entities/TowerTypes';
import { Enemy } from '../entities/Enemy';
import { DataPacket, WormProcess } from '../entities/EnemyTypes';
import { Projectile } from '../entities/Projectile';
import { DamageNumberPool } from '../systems/Pools';
import { ParticleSystem } from '../systems/Particles';
import { GameStatus, type TowerType } from '../types';
import { TOWER_STATS, COLORS } from '../constants';

// UI Imports
import { HUD } from '../ui/HUD';
import { TowerPanel } from '../ui/TowerPanel';
import { InfoPanel } from '../ui/InfoPanel';
import { WaveBanner } from '../ui/WaveBanner';
import { Menu } from '../ui/Menu';

export class Game {
    private renderer!: Renderer;
    private input!: InputHandler;
    public state!: GameState;
    private grid!: Grid;
    private waveManager!: WaveManager;
    private damagePool!: DamageNumberPool;
    private particles!: ParticleSystem;

    // UI Instances
    private hud!: HUD;
    private towerPanel!: TowerPanel;
    private infoPanel!: InfoPanel;
    private waveBanner!: WaveBanner;
    private menu!: Menu;

    private towers: Tower[] = [];
    private enemies: Enemy[] = [];
    private projectiles: Projectile[] = [];
    
    private selectedTowerType: TowerType | null = null;
    private selectedTower: Tower | null = null;
    private lastTime: number = 0;

    // Persistent UI elements for effects
    private flashOverlay!: HTMLDivElement;
    private screenShakeContainer!: HTMLElement;

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        try {
            this.updateLoading(10, 'INITIALIZING RENDERER...');
            const container = document.getElementById('game-container')!;
            this.renderer = new Renderer(container);
            
            this.updateLoading(30, 'SYNCHRONIZING GRID...');
            this.state = new GameState();
            this.grid = new Grid(this.renderer.scene);
            this.damagePool = new DamageNumberPool();
            this.particles = new ParticleSystem(this.renderer.scene);
            
            this.updateLoading(60, 'DECRYPTING PATHS...');
            const worldPath = this.grid.currentPath.map(p => this.grid.getWorldPosition(p.x, p.y));
            this.waveManager = new WaveManager(this.renderer.scene, this.state, worldPath);
            this.input = new InputHandler(this.renderer.camera, this.renderer.renderer.domElement);
            
            this.updateLoading(80, 'ESTABLISHING HUD...');
            this.hud = new HUD(this.state);
            this.towerPanel = new TowerPanel((type) => this.selectTowerType(type));
            this.infoPanel = new InfoPanel(
                this.state,
                (tower) => this.handleUpgrade(tower),
                (tower) => this.handleSell(tower)
            );
            this.waveBanner = new WaveBanner(() => this.waveManager.startWave());
            this.menu = new Menu(() => this.startGame());

            this.initEffectOverlays();
            this.updateLoading(100, 'SYSTEM READY');
            
            this.initEvents();
            this.initKeyboard();
            this.initHUDButtons();
            this.menu.setEnabled(true);
            
            setTimeout(() => this.finishLoading(), 800);
            requestAnimationFrame(this.loop.bind(this));

        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError(error instanceof Error ? error.message : 'Unknown fatal error');
        }
    }

    private initEffectOverlays(): void {
        this.flashOverlay = document.createElement('div');
        this.flashOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0);pointer-events:none;z-index:1000;transition:background 0.1s;';
        document.body.appendChild(this.flashOverlay);
        this.screenShakeContainer = document.getElementById('game-container')!;
    }

    private triggerFlashEffect(): void {
        this.flashOverlay.style.background = 'rgba(255,0,0,0.3)';
        this.screenShakeContainer.classList.add('shake');
        setTimeout(() => {
            this.flashOverlay.style.background = 'rgba(255,0,0,0)';
            this.screenShakeContainer.classList.remove('shake');
        }, 200);
    }

    private handleWormSplit(enemy: WormProcess): void {
        const latestPath = this.grid.currentPath.map(p => this.grid.getWorldPosition(p.x, p.y));
        const p1 = new DataPacket(this.renderer.scene, latestPath);
        p1.mesh.position.copy(enemy.mesh.position).add(new THREE.Vector3(0.2, 0, 0));
        p1.pathIndex = enemy.pathIndex;
        this.enemies.push(p1);
        
        const p2 = new DataPacket(this.renderer.scene, latestPath);
        p2.mesh.position.copy(enemy.mesh.position).add(new THREE.Vector3(-0.2, 0, 0));
        p2.pathIndex = enemy.pathIndex;
        this.enemies.push(p2);
    }

    private initHUDButtons(): void {
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.onclick = () => {
                this.state.isPaused = !this.state.isPaused;
                this.state.status = this.state.isPaused ? GameStatus.PAUSED : GameStatus.PLAYING;
                pauseBtn.innerText = this.state.isPaused ? 'RESUME' : 'PAUSE';
            };
        }
    }

    private initKeyboard(): void {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e') {
                this.cancelPlacement();
            }
        });
    }

    private cancelPlacement(): void {
        this.selectedTowerType = null;
        this.towerPanel.highlightCard(null);
        this.grid.hidePlacementRange();
        
        if (this.selectedTower) {
            this.selectedTower.setSelection(false);
            this.selectedTower = null;
            this.infoPanel.update(null);
        }
    }

    private updateLoading(percent: number, status: string): void {
        const bar = document.getElementById('loading-bar-fill');
        const statusEl = document.getElementById('loading-status');
        if (bar) bar.style.width = `${percent}%`;
        if (statusEl) statusEl.innerText = status;
    }

    private showError(message: string): void {
        const errorDisplay = document.getElementById('error-display');
        const errorText = document.getElementById('error-text');
        const loadingBar = document.getElementById('loading-bar-container');
        const status = document.getElementById('loading-status');

        if (errorDisplay) errorDisplay.style.display = 'block';
        if (errorText) errorText.innerText = message;
        if (loadingBar) loadingBar.style.display = 'none';
        if (status) status.style.color = 'var(--color-red)';
    }

    private finishLoading(): void {
        const loader = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        if (loader) loader.style.opacity = '0';
        if (app) app.style.opacity = '1';
        setTimeout(() => {
            if (loader) loader.style.display = 'none';
        }, 1000);
    }

    private initEvents(): void {
        this.input.onGridHover = (x, y) => {
            if (this.state.status !== GameStatus.PLAYING) return;
            
            if (this.selectedTowerType) {
                const canPlace = this.grid.isPlaceable(x, y);
                this.grid.highlightCell(x, y, canPlace ? 0x00ff00 : 0xff0000);
                
                const stats = TOWER_STATS[this.selectedTowerType];
                this.grid.showPlacementRange(x, y, stats.range, canPlace ? 0x00ff00 : 0xff0000);
            } else {
                this.grid.highlightCell(x, y, null);
                this.grid.hidePlacementRange();
            }
        };

        this.input.onGridClick = (x, y) => {
            if (this.state.status !== GameStatus.PLAYING) return;

            if (this.selectedTowerType) {
                this.tryPlaceTower(x, y);
            } else {
                this.trySelectTower(x, y);
            }
        };

        this.waveManager.onEnemySpawn = (enemy) => {
            const latestPath = this.grid.currentPath.map(p => this.grid.getWorldPosition(p.x, p.y));
            enemy.updatePath(latestPath); 
            this.enemies.push(enemy);
        };

        this.waveManager.onWaveComplete = () => {
            this.state.addGold(50 + (this.state.wave * 10));
            this.hud.update();
            this.towerPanel.updateAffordability(this.state.gold);
        };

        this.waveManager.onMapChange = (index) => {
            this.grid.loadMap(index);
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,245,255,0.2);pointer-events:none;z-index:1000;';
            document.body.appendChild(overlay);
            setTimeout(() => {
                if (overlay.parentNode) document.body.removeChild(overlay);
            }, 500);
        };

        document.getElementById('restart-btn')!.onclick = () => this.resetGame();
    }

    private resetGame(): void {
        this.enemies.forEach(e => e.dispose());
        this.enemies = [];
        this.projectiles.forEach(p => p.dispose());
        this.projectiles = [];
        this.towers.forEach(t => t.dispose());
        this.towers = [];

        this.state.reset();
        this.grid.loadMap(0);
        
        this.menu.setEnabled(true);
        this.menu.showMenu();
        document.getElementById('game-over-overlay')!.style.display = 'none';
        this.hud.update();
        this.towerPanel.updateAffordability(this.state.gold);
    }

    private selectTowerType(type: TowerType): void {
        if (this.selectedTowerType === type) {
            this.selectedTowerType = null;
            this.towerPanel.highlightCard(null);
            this.grid.hidePlacementRange();
        } else {
            this.selectedTowerType = type;
            this.towerPanel.highlightCard(type);
            
            if (this.selectedTower) {
                this.selectedTower.setSelection(false);
                this.selectedTower = null;
                this.infoPanel.update(null);
            }
        }
    }

    private tryPlaceTower(x: number, y: number): void {
        if (!this.selectedTowerType) return;
        
        const stats = TOWER_STATS[this.selectedTowerType];
        if (this.state.gold < stats.cost) return;

        if (this.grid.placeTower(x, y)) {
            this.state.removeGold(stats.cost);
            this.hud.update();
            this.towerPanel.updateAffordability(this.state.gold);

            const worldPos = this.grid.getWorldPosition(x, y);
            
            let tower: Tower;
            switch (this.selectedTowerType) {
                case 'FIREWALL': tower = new FirewallTower(this.renderer.scene, x, y, worldPos); break;
                case 'ENCRYPTION': tower = new EncryptionNode(this.renderer.scene, x, y, worldPos); break;
                case 'OVERLOAD': tower = new OverloadCannon(this.renderer.scene, x, y, worldPos); break;
                case 'EMP': tower = new EMPTower(this.renderer.scene, x, y, worldPos); break;
                case 'ICE': tower = new IceNode(this.renderer.scene, x, y, worldPos); break;
            }
            
            this.towers.push(tower);
            this.grid.hidePlacementRange(); 
            this.selectedTowerType = null; 
            this.towerPanel.highlightCard(null);

            const latestPath = this.grid.currentPath.map(p => this.grid.getWorldPosition(p.x, p.y));
            this.enemies.forEach(e => e.updatePath(latestPath));
        }
    }

    private trySelectTower(x: number, y: number): void {
        const tower = this.towers.find(t => t.gridX === x && t.gridY === y);
        
        if (this.selectedTower) {
            this.selectedTower.setSelection(false);
        }

        this.selectedTower = tower || null;
        
        if (this.selectedTower) {
            this.selectedTower.setSelection(true);
            this.selectedTowerType = null;
            this.towerPanel.highlightCard(null);
            this.grid.hidePlacementRange();
        }

        this.infoPanel.update(this.selectedTower);
    }

    private handleUpgrade(tower: Tower): void {
        const cost = tower.upgradeStats.cost;
        if (this.state.removeGold(cost)) {
            tower.upgrade();
            this.hud.update();
            this.infoPanel.update(tower);
            this.towerPanel.updateAffordability(this.state.gold);
        }
    }

    private handleSell(tower: Tower): void {
        this.state.addGold(Math.floor(tower.cost * 0.5));
        this.grid.removeTower(tower.gridX, tower.gridY);
        tower.dispose();
        this.towers = this.towers.filter(t => t !== tower);
        this.selectedTower = null;
        this.hud.update();
        this.infoPanel.update(null);
        this.towerPanel.updateAffordability(this.state.gold);
        
        const latestPath = this.grid.currentPath.map(p => this.grid.getWorldPosition(p.x, p.y));
        this.enemies.forEach(e => e.updatePath(latestPath));
    }

    private startGame(): void {
        this.state.status = GameStatus.PLAYING;
        this.menu.hideMenu();
        this.waveBanner.show(1);
        this.hud.update();
        this.towerPanel.updateAffordability(this.state.gold);
    }

    private loop(timestamp: number): void {
        requestAnimationFrame(this.loop.bind(this));

        const rawDelta = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (!this.state || this.state.status === GameStatus.MENU) return;
        
        if (this.state.status === GameStatus.GAME_OVER || this.state.status === GameStatus.VICTORY) {
            this.renderer.render();
            return;
        }

        if (this.state.isPaused) {
            this.renderer.render();
            return;
        }

        const delta = Math.min(rawDelta, 0.1) * this.state.gameSpeed;

        this.waveManager.update(delta, this.enemies.length);
        this.particles.update(delta);

        // Update Entities
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.move(delta)) {
                this.state.removeLife(1);
                this.hud.update();
                enemy.dispose();
                this.enemies.splice(i, 1);
                this.triggerFlashEffect();
            } else {
                enemy.updateHPBar(this.renderer.camera);
            }
        }

        this.towers.forEach(tower => {
            const result = tower.update(delta, this.enemies);
            if (result) {
                if (Array.isArray(result)) this.projectiles.push(...result);
                else this.projectiles.push(result);
            }
        });

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(delta);
            if (!p.active) {
                if (p.target.hp <= 0) {
                    const enemyIdx = this.enemies.indexOf(p.target);
                    if (enemyIdx > -1) {
                        const enemy = this.enemies[enemyIdx];
                        const vector = enemy.mesh.position.clone().project(this.renderer.camera);
                        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
                        this.damagePool.spawn(x, y, `+${enemy.reward}g`, false);
                        this.particles.spawnExplosion(enemy.mesh.position, enemy.color);

                        enemy.onDeath(this.state);
                        this.hud.update();
                        this.towerPanel.updateAffordability(this.state.gold);
                        
                        if (enemy instanceof WormProcess) {
                            this.handleWormSplit(enemy);
                        }

                        enemy.dispose();
                        this.enemies.splice(enemyIdx, 1);
                    }
                }
                this.projectiles.splice(i, 1);
            }
        }

        if (this.state.lives <= 0 && (this.state.status as string) === GameStatus.GAME_OVER) {
            const gameOverOverlay = document.getElementById('game-over-overlay');
            if (gameOverOverlay && gameOverOverlay.style.display !== 'flex') {
                this.menu.showGameOver(this.state.wave, this.state.score, false);
            }
        }

        this.renderer.render();
    }
}
