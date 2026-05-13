import * as THREE from 'three';
import { Renderer } from './Renderer';
import { InputHandler } from './InputHandler';
import { GameState } from '../systems/GameState';
import { Grid } from '../systems/Grid';
import { WaveManager } from '../systems/WaveManager';
import { Tower } from '../entities/Tower';
import { FirewallTower, EncryptionNode, OverloadCannon, EMPTower, IceNode } from '../entities/TowerTypes';
import { Enemy } from '../entities/Enemy';
import { disposeEnemyCache, DataPacket, WormProcess, KernelBoss } from '../entities/EnemyTypes';
import { Projectile, disposeProjectileCache } from '../entities/Projectile';
import { DamageNumberPool } from '../systems/Pools';
import { ParticleSystem } from '../systems/Particles';
import { AudioManager } from '../systems/AudioManager';
import { GameStatus, type TowerType } from '../types';
import { TOWER_STATS, MAPS, TIER_UNLOCKS } from '../constants';

// UI Imports
import { HUD } from '../ui/HUD';
import { TowerPanel } from '../ui/TowerPanel';
import { InfoPanel } from '../ui/InfoPanel';
import { WaveBanner } from '../ui/WaveBanner';
import { Menu } from '../ui/Menu';
import { DocsPanel } from '../ui/DocsPanel';

export class Game {
    private renderer!: Renderer;
    private input!: InputHandler;
    public state!: GameState;
    private grid!: Grid;
    private waveManager!: WaveManager;
    private damagePool!: DamageNumberPool;
    private particles!: ParticleSystem;
    private audio!: AudioManager;

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
    private lastVisibilityHidden: boolean = false;

    // Persistent UI elements for effects
    private flashOverlay!: HTMLDivElement;
    // Camera shake state
    private screenShake: { offsetX: number; offsetY: number; elapsed: number; duration: number; intensity: number; } | null = null;

    private boundLoop: (timestamp: number) => void;
    private activeMapNotification: HTMLDivElement | null = null;
    private currentMapNotificationTimeout: ReturnType<typeof setTimeout> | null = null;
    private activeUnlockBanner: HTMLDivElement | null = null;
    private goldFlashTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        this.boundLoop = this.loop.bind(this);
        this.init();
    }

    private async init(): Promise<void> {
        try {
            console.log("[Game] Step 1: Init renderer");
            this.updateLoading(10, 'INITIALIZING RENDERER...');
            const container = document.getElementById('game-container')!;
            this.renderer = new Renderer(container);
            
            console.log("[Game] Step 2: Grid");
            this.updateLoading(30, 'SYNCHRONIZING GRID...');
            this.state = new GameState();
            this.grid = new Grid(this.renderer.scene);
            this.damagePool = new DamageNumberPool();
            this.particles = new ParticleSystem(this.renderer.scene);
            this.audio = new AudioManager();
            
            console.log("[Game] Step 3: Paths");
            this.updateLoading(60, 'DECRYPTING PATHS...');
            const worldPath = this.grid.currentPath.map(p => this.grid.getWorldPosition(p.x, p.y));
            this.waveManager = new WaveManager(this.renderer.scene, this.state, worldPath);
            this.input = new InputHandler(this.renderer.camera, this.renderer.renderer.domElement);
            
            console.log("[Game] Step 4: HUD");
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
            DocsPanel.init(this.state);

            this.initEffectOverlays();
            console.log("[Game] Step 5: System ready!");
            this.updateLoading(100, 'SYSTEM READY');
            
            this.initEvents();
            this.initKeyboard();
            this.initHUDButtons();
            this.menu.setEnabled(true);

            // Pause game when tab is hidden — prevents delta explosion on return
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.lastVisibilityHidden = true;
                } else {
                    this.lastVisibilityHidden = false;
                }
            });
            
            setTimeout(() => this.finishLoading(), 800);
            requestAnimationFrame(this.boundLoop);

        } catch (error) {
            console.error('[Game] INIT FAILED:', error); console.error('[Game] Stack:', error instanceof Error ? error.stack : 'none');
            this.showError(error instanceof Error ? error.message : 'Unknown fatal error');
        }
    }

    private initEffectOverlays(): void {
        this.flashOverlay = document.createElement('div');
        this.flashOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0);pointer-events:none;z-index:1000;transition:background 0.1s;';
        document.body.appendChild(this.flashOverlay);
    }

    private triggerFlashEffect(severity: 'normal' | 'boss' | 'core' = 'normal'): void {
        const cfg = { normal: { intensity: 0.5, duration: 0.15 }, boss: { intensity: 1.2, duration: 0.2 }, core: { intensity: 2.0, duration: 0.3 } }[severity];
        this.screenShake = { offsetX: 0, offsetY: 0, elapsed: 0, duration: cfg.duration, intensity: cfg.intensity };
        this.flashOverlay.style.background = severity === 'core' ? 'rgba(255,0,0,0.5)' : 'rgba(255,0,0,0.3)';
        setTimeout(() => { this.flashOverlay.style.background = 'rgba(255,0,0,0)'; }, 150);
    }

    private handleWormSplit(enemy: WormProcess): void {
        const splitPath = enemy.path.slice();
        const splitIndex = enemy.pathIndex;
        const p1 = new DataPacket(this.renderer.scene, splitPath);
        p1.mesh.position.copy(enemy.mesh.position).add(new THREE.Vector3(0.2, 0, 0));
        p1.pathIndex = splitIndex;
        this.enemies.push(p1);
        
        const p2 = new DataPacket(this.renderer.scene, splitPath);
        p2.mesh.position.copy(enemy.mesh.position).add(new THREE.Vector3(-0.2, 0, 0));
        p2.pathIndex = splitIndex;
        this.enemies.push(p2);
    }

    private initHUDButtons(): void {
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.onclick = () => {
                this.state.isPaused = !this.state.isPaused;
                pauseBtn.innerText = this.state.isPaused ? 'RESUME' : '⏸';
                const gameContainer = document.getElementById('game-container');
                const pauseOverlay = document.getElementById('pause-overlay');
                if (gameContainer) gameContainer.classList.toggle('paused', this.state.isPaused);
                if (pauseOverlay) pauseOverlay.classList.toggle('show', this.state.isPaused);
            };
        }

        const speedBtn = document.getElementById('speed-btn');
        if (speedBtn) {
            speedBtn.innerHTML = `${this.state.gameSpeed}x`;
            speedBtn.onclick = () => {
                const speeds = [1, 2, 3];
                const currentIdx = speeds.indexOf(this.state.gameSpeed);
                const nextIdx = (currentIdx + 1) % speeds.length;
                this.state.gameSpeed = speeds[nextIdx];
                speedBtn.innerHTML = `${this.state.gameSpeed}x`;
            };
        }
    }

    private initKeyboard(): void {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelPlacement();
            } else if (e.key === ' ' || e.key.toLowerCase() === 'space') {
                // Toggle pause (prevent scroll)
                e.preventDefault();
                this.state.isPaused = !this.state.isPaused;
                const pauseBtn = document.getElementById('pause-btn');
                const gameContainer = document.getElementById('game-container');
                const pauseOverlay = document.getElementById('pause-overlay');
                if (pauseBtn) pauseBtn.innerText = this.state.isPaused ? 'RESUME' : '⏸';
                if (gameContainer) gameContainer.classList.toggle('paused', this.state.isPaused);
                if (pauseOverlay) pauseOverlay.classList.toggle('show', this.state.isPaused);
            } else if (e.key.toLowerCase() === 'e' && this.selectedTower) {
                this.handleSell(this.selectedTower);
            } else if (e.key.toLowerCase() === 'q' && this.selectedTower) {
                this.handleUpgrade(this.selectedTower);
            } else if (e.key === '1') {
                this.selectTowerType('FIREWALL');
            } else if (e.key === '2') {
                this.selectTowerType('ENCRYPTION');
            } else if (e.key === '3') {
                this.selectTowerType('OVERLOAD');
            } else if (e.key === '4') {
                this.selectTowerType('EMP');
            } else if (e.key === '5') {
                this.selectTowerType('ICE');
            }
        });
    }

    private cancelPlacement(): void {
        this.selectedTowerType = null;
        this.towerPanel.highlightCard(null);
        this.grid.hidePlacementRange();
        this.grid.highlightCell(-1, -1, null);
        if (this.selectedTower) {
            this.selectedTower.setSelection(false);
            this.selectedTower = null;
        }
        this.infoPanel.update(null);
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

    /** Show tower unlock notification banner */
    private showTowerUnlockNotification(towerName: string): void {
        if (this.activeUnlockBanner) {
            this.activeUnlockBanner.remove();
        }
        const banner = document.createElement('div');
        banner.id = 'tower-unlock-banner-inline';
        banner.style.cssText = [
            'position:fixed;top:-60px;left:50%;transform:translateX(-50%);',
            'background:rgba(20,15,5,0.92);border:1px solid var(--color-gold);',
            'border-radius:8px;padding:10px 24px;z-index:500;',
            'font-size:0.85rem;color:var(--color-gold);',
            'box-shadow:0 0 20px rgba(255,230,0,0.3);',
            'transition:top 0.4s cubic-bezier(0.34,1.56,0.64,1);',
        ].join('');
        banner.innerHTML = `⚠ NEW TOWER UNLOCKED: <strong>${towerName}</strong>`;
        document.body.appendChild(banner);
        this.activeUnlockBanner = banner;

        // Slide in
        requestAnimationFrame(() => {
            banner.style.top = '60px';
        });

        // Slide out after 3 seconds
        setTimeout(() => {
            banner.style.top = '-60px';
            setTimeout(() => {
                banner.remove();
                if (this.activeUnlockBanner === banner) {
                    this.activeUnlockBanner = null;
                }
            }, 400);
        }, 3000);
    }

    /** Flash gold display when gold increases */
    private flashGoldDisplay(): void {
        const goldEl = document.getElementById('gold-counter');
        if (!goldEl) return;

        goldEl.style.transition = 'none';
        goldEl.style.color = 'var(--color-gold)';
        goldEl.style.textShadow = '0 0 12px rgba(255,230,0,0.8)';

        if (this.goldFlashTimeout) clearTimeout(this.goldFlashTimeout);
        this.goldFlashTimeout = setTimeout(() => {
            goldEl.style.transition = 'color 0.3s, text-shadow 0.3s';
            goldEl.style.color = '';
            goldEl.style.textShadow = '';
        }, 300);
    }

    /** Check if any new tower was unlocked at this wave */
    private checkTowerUnlocks(wave: number): void {
        const types: TowerType[] = ['FIREWALL', 'ENCRYPTION', 'OVERLOAD', 'EMP', 'ICE'];
        for (const type of types) {
            if (wave === TIER_UNLOCKS[type]) {
                this.showTowerUnlockNotification(TOWER_STATS[type].name);
                break; // Only show one at a time
            }
        }
    }

    /** Show map change notification (existing method) */
    private showMapChangeNotification(mapIndex: number, refund: number, bonus: number): void {
        // Remove any existing notification to prevent stacking
        if (this.activeMapNotification) {
            this.activeMapNotification.remove();
        }
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(5,5,20,0.92);border:2px solid #00f5ff;border-radius:12px;padding:24px 40px;text-align:center;z-index:1500;color:#fff;font-family:monospace;';
        overlay.innerHTML = `
            <div style="font-size:0.7rem;color:#00f5ff;letter-spacing:3px;margin-bottom:6px;">NETWORK RECONFIGURING</div>
            <div style="font-size:1.5rem;margin-bottom:10px;">WAVE ${this.waveManager.waveIndex}</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);">Map ${mapIndex + 1} of ${MAPS.length}</div>
            <div style="font-size:0.8rem;margin-top:8px;color:var(--color-gold);">
                +${refund}g refund · +${bonus}g bonus
            </div>
            <div style="font-size:0.7rem;margin-top:12px;color:var(--text-secondary);">Resuming in 3s...</div>
        `;
        this.activeMapNotification = overlay;
        this.currentMapNotificationTimeout = window.setTimeout(() => {
            overlay.style.transition = 'opacity 0.4s';
            overlay.style.opacity = '0';
            this.currentMapNotificationTimeout = window.setTimeout(() => {
                overlay.remove();
                this.activeMapNotification = null;
                this.currentMapNotificationTimeout = null;
            }, 400);
        }, 2500);
    }

    private initEvents(): void {
        this.input.onGridHover = (x, y) => {
            // Allow placement when: playing, OR when tower type selected (prep phase)
            if (this.state.status !== GameStatus.PLAYING && !this.selectedTowerType) return;
            
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
            // Allow placement when: playing, OR when tower type selected (prep phase)
            if (this.state.status !== GameStatus.PLAYING && !this.selectedTowerType) return;

            if (this.selectedTowerType) {
                this.tryPlaceTower(x, y);
            } else {
                this.trySelectTower(x, y);
            }
        };

        this.waveManager.onEnemySpawn = (enemy) => {
            this.enemies.push(enemy);
        };

        this.waveManager.onWaveComplete = () => {
            this.state.addGold(50 + (this.state.wave * 10));
            this.hud.update();
            this.towerPanel.updateAffordability(this.state.gold);
            if (this.selectedTower) this.infoPanel.update(this.selectedTower);
            const newUnlockWave = this.state.wave + 1;
            this.towerPanel.updateUnlock(newUnlockWave);
            this.checkTowerUnlocks(newUnlockWave);
            this.flashGoldDisplay();
        };

        this.waveManager.onMapChange = (index) => {
            this.state.isPaused = true;

            // Refund all towers — dispose only, DON'T call removeTower (which triggers calculatePath)
            // grid.loadMap() will reset the entire grid anyway
            let totalRefund = 0;
            for (const tower of this.towers) {
                totalRefund += Math.floor(tower.totalInvestment * 0.8);
                tower.dispose();
            }
            this.towers = [];
            this.selectedTower = null;
            this.infoPanel.update(null);

            const bonus = 50;
            this.state.addGold(totalRefund + bonus);

            // Load new map — resets grid, calculates fresh path in ONE call
            this.grid.loadMap(index);
            const latestPath = this.grid.currentPath.map(p => this.grid.getWorldPosition(p.x, p.y));
            this.waveManager.updateWorldPath(latestPath);
            this.enemies.forEach(e => e.updatePath(latestPath));

            this.showMapChangeNotification(index, totalRefund, bonus);

            setTimeout(() => {
                this.state.isPaused = false;
            }, 3000);
        };

        this.waveManager.onBossWave = () => {
            this.audio.play('boss_incoming');
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

        const savedSpeed = this.state.gameSpeed;
        this.state.reset();
        this.state.status = GameStatus.MENU;
        this.state.gameSpeed = savedSpeed; // Preserve speed across restarts

        // Update speed button to reflect restored speed
        const speedBtn = document.getElementById('speed-btn');
        if (speedBtn) speedBtn.innerHTML = `${savedSpeed}x`;
        this.grid.loadMap(0);

        // Clean up pause state
        const gameContainer = document.getElementById('game-container');
        const pauseOverlay = document.getElementById('pause-overlay');
        if (gameContainer) gameContainer.classList.remove('paused');
        if (pauseOverlay) pauseOverlay.classList.remove('show');
        this.state.isPaused = false;
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.towerPanel.highlightCard(null);
        this.grid.hidePlacementRange();
        this.infoPanel.update(null);

        this.menu.setEnabled(true);
        this.menu.showMenu();
        document.getElementById('game-over-overlay')!.style.display = 'none';
        document.getElementById('boss-hp-container')!.style.display = 'none';

        // Clean up lingering damage numbers and their timers
        // damage pool auto-clears via timeout

        // Kill pending map notification timeout
        if (this.currentMapNotificationTimeout) {
            clearTimeout(this.currentMapNotificationTimeout);
            this.currentMapNotificationTimeout = null;
        }

        // Clean up orphaned map change notification overlays
        document.querySelectorAll('body > div[style*="z-index: 1500"]').forEach(el => el.remove());

        this.hud.update();
        this.towerPanel.updateAffordability(this.state.gold);
        this.towerPanel.updateUnlock(1);
        this.waveManager.isWaveActive = false;
        this.waveManager.reset();

        // Release shared geometry/material caches to prevent stale GPU state on restart
        disposeEnemyCache();
        disposeProjectileCache();
        this.particles.dispose();
    }

    private selectTowerType(type: TowerType): void {
        // Check if tower is unlocked
        if (this.state.wave < TIER_UNLOCKS[type]) return;
        
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
            this.audio.play('tower_place');
            this.grid.spawnPlacementRing(worldPos, stats.color);
            this.grid.hidePlacementRange(); 
            this.selectedTowerType = null; 
            this.towerPanel.highlightCard(null);
            // Note: grid.placeTower() already recalculates path internally
            // No need to update enemy paths here — they already have correct map path
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
        if (tower.level >= 3) return;
        const cost = tower.upgradeStats.cost;
        if (this.state.removeGold(cost)) {
            tower.upgrade();
            this.hud.update();
            this.infoPanel.update(tower);
            this.towerPanel.updateAffordability(this.state.gold);
        }
    }

    private pendingPathRecalc = false;

    private handleSell(tower: Tower): void {
        // Sell = 50% of total investment (base + all upgrades)
        const sellValue = Math.floor(tower.totalInvestment * 0.5);
        this.state.addGold(sellValue);
        this.audio.play('tower_sell');
        tower.dispose();
        this.grid.removeTowerSilent(tower.gridX, tower.gridY);
        const idx = this.towers.indexOf(tower);
        if (idx >= 0) this.towers.splice(idx, 1);

        // Batch path recalc — only ONE after burst of rapid sells
        if (!this.pendingPathRecalc) {
            this.pendingPathRecalc = true;
            queueMicrotask(() => {
                this.grid.calculatePath();
                this.pendingPathRecalc = false;
            });
        }

        this.selectedTower = null;
        this.hud.update();
        this.infoPanel.update(null);
        this.towerPanel.updateAffordability(this.state.gold);
    }

    private startGame(): void {
        this.state.isPaused = false;
        this.state.status = GameStatus.PLAYING;
        this.menu.hideMenu();
        this.waveBanner.show(1);
        this.audio.play('wave_start');
        this.hud.update();
        this.towerPanel.updateAffordability(this.state.gold);
        this.towerPanel.updateUnlock(1);

        // Clean up pause visuals
        const gameContainer = document.getElementById('game-container');
        const pauseOverlay = document.getElementById('pause-overlay');
        if (gameContainer) gameContainer.classList.remove('paused');
        if (pauseOverlay) pauseOverlay.classList.remove('show');
    }

    private loop(timestamp: number): void {
        requestAnimationFrame(this.boundLoop);

        const rawDelta = (timestamp - this.lastTime) / 1000;

        // Tab switch: skip frame, reset time so enemies don't teleport on return
        if (this.lastVisibilityHidden || rawDelta > 1.0) {
            this.lastTime = timestamp;
            this.lastVisibilityHidden = false;
            this.renderer.render();
            return;
        }
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
        this.grid.update(delta);

        // Tower fire: creates projectiles (enemies may be updated mid-frame)
        this.towers.forEach(tower => {
            const result = tower.update(delta, this.enemies);
            if (result) {
                if (Array.isArray(result)) this.projectiles.push(...result);
                else this.projectiles.push(result);
            }
        });

        // Projectile loop: ONLY move and deal damage, NEVER process death
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(delta);
            if (!p.active) {
                this.projectiles.splice(i, 1);
            }
        }

        // Enemy loop: CENTRALIZED death processing
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.move(delta)) {
                // Reached end — lose life, enemy escapes
                this.state.removeLife(1);
                this.audio.play('core_damage');
                this.hud.update();
                enemy.dispose();
                this.enemies.splice(i, 1);
                this.triggerFlashEffect('core');
            } else if (enemy.hp <= 0) {
                // Death processing (one place, one time)
                const vector = enemy.mesh.position.clone().project(this.renderer.camera);
                const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
                this.damagePool.spawn(x, y, `+${enemy.reward}g`, false);
                this.particles.spawnExplosion(enemy.mesh.position, enemy.color);
                this.audio.play('enemy_death');

                if (enemy instanceof WormProcess) {
                    this.handleWormSplit(enemy);
                }

                enemy.onDeath(this.state);
                this.hud.update();

                enemy.dispose();
                this.enemies.splice(i, 1);
            } else {
                enemy.updateHPBar(this.renderer.camera);
            }
        }

        if (this.state.lives <= 0) {
            const gameOverOverlay = document.getElementById('game-over-overlay');
            if (gameOverOverlay && gameOverOverlay.style.display !== 'flex') {
                this.menu.showGameOver(this.state.wave, this.state.score, false);
            }
        }

        this.updateBossHpBar();
        this.applyScreenShake();

        this.renderer.render();
    }

    /** Apply camera shake offset before render — call every frame while shaking */
    private applyScreenShake(): void {
        if (!this.screenShake) return;
        this.screenShake.elapsed += 0.016; // approx one frame
        const t = this.screenShake.elapsed / this.screenShake.duration;
        if (t >= 1) {
            this.renderer.camera.position.x -= this.screenShake.offsetX;
            this.renderer.camera.position.y -= this.screenShake.offsetY;
            this.screenShake = null;
            return;
        }
        const angle = Math.random() * Math.PI * 2;
        const mag = this.screenShake.intensity * (1 - t);
        const dx = Math.cos(angle) * mag;
        const dy = Math.sin(angle) * mag;
        this.renderer.camera.position.x += dx - this.screenShake.offsetX;
        this.renderer.camera.position.y += dy - this.screenShake.offsetY;
        this.screenShake.offsetX = dx;
        this.screenShake.offsetY = dy;
    }

    /** Update boss HP bar overlay — called every frame during boss waves */
    private updateBossHpBar(): void {
        const bossContainer = document.getElementById('boss-hp-container');
        if (!bossContainer || bossContainer.style.display === 'none') return;

        const boss = this.enemies.find(e => e instanceof KernelBoss);
        const hpFill = document.getElementById('boss-hp-fill') as HTMLElement;
        if (!hpFill) return;

        if (!boss) {
            // Boss dead — hide container
            bossContainer.style.display = 'none';
            return;
        }

        const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
        hpFill.style.width = `${pct}%`;

        // Color: green >60, yellow >30, red <=30
        if (pct > 60) hpFill.style.background = 'var(--color-green)';
        else if (pct > 30) hpFill.style.background = 'var(--color-yellow)';
        else hpFill.style.background = 'var(--color-red)';
    }
}
