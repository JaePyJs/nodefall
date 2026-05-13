import * as THREE from 'three';
import { Enemy } from './Enemy';
import { GameState } from '../systems/GameState';
import { ENEMY_STATS } from '../constants';

// ── Shared geometry + material cache per enemy type ──
const ENEMY_MATERIAL_CACHE = new Map<string, THREE.MeshStandardMaterial>();

function getEnemyMaterial(color: number, wireframe = false, keySuffix = ''): THREE.MeshStandardMaterial {
    const key = `${color}_${wireframe ? 'wf' : 'sol'}_${keySuffix}`;
    if (!ENEMY_MATERIAL_CACHE.has(key)) {
        ENEMY_MATERIAL_CACHE.set(key, new THREE.MeshStandardMaterial({
            color, emissive: color, emissiveIntensity: 0.4,
            metalness: 0.3, roughness: 0.5, wireframe,
        }));
    }
    return ENEMY_MATERIAL_CACHE.get(key)!;
}

// Shared geometries — created once, reused across all spawns
const DATA_PACKET_GEO = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const WORM_GEO = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
const DAEMON_GEO = new THREE.OctahedronGeometry(0.55);
const ROOTKIT_GEO = new THREE.TorusKnotGeometry(0.25, 0.08, 48, 8);
const BOSS_OUTER_GEO = new THREE.IcosahedronGeometry(1.0, 1);
const BOSS_CORE_GEO = new THREE.SphereGeometry(0.5, 16, 16);

export function disposeEnemyCache(): void {
    ENEMY_MATERIAL_CACHE.forEach(m => m.dispose());
    ENEMY_MATERIAL_CACHE.clear();
    DATA_PACKET_GEO.dispose(); WORM_GEO.dispose(); DAEMON_GEO.dispose();
    ROOTKIT_GEO.dispose(); BOSS_OUTER_GEO.dispose(); BOSS_CORE_GEO.dispose();
}

export class DataPacket extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        const s = ENEMY_STATS.DATA_PACKET;
        super(scene, s.hp, s.speed, s.reward, path);
        const mat = getEnemyMaterial(this.color);
        this.mesh.add(new THREE.Mesh(DATA_PACKET_GEO, mat));
    }
    public get color(): number { return ENEMY_STATS.DATA_PACKET.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(10); }
}

export class WormProcess extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        const s = ENEMY_STATS.WORM_PROCESS;
        super(scene, s.hp, s.speed, s.reward, path);
        const mat = getEnemyMaterial(this.color);
        const m = new THREE.Mesh(WORM_GEO, mat);
        m.rotation.z = Math.PI / 2;
        this.mesh.add(m);
    }
    public get color(): number { return ENEMY_STATS.WORM_PROCESS.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(25); }
}

export class DaemonThread extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        const s = ENEMY_STATS.DAEMON_THREAD;
        super(scene, s.hp, s.speed, s.reward, path);
        const mat = getEnemyMaterial(this.color, false, 'daemon');
        mat.metalness = 0.5; mat.roughness = 0.3;
        this.mesh.add(new THREE.Mesh(DAEMON_GEO, mat));
    }
    public get color(): number { return ENEMY_STATS.DAEMON_THREAD.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(50); }
}

export class Rootkit extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        const s = ENEMY_STATS.ROOTKIT;
        super(scene, s.hp, s.speed, s.reward, path);
        const mat = getEnemyMaterial(this.color, false, 'rootkit');
        mat.emissiveIntensity = 0.5; mat.metalness = 0.7; mat.roughness = 0.3;
        this.mesh.add(new THREE.Mesh(ROOTKIT_GEO, mat));
    }
    public get color(): number { return ENEMY_STATS.ROOTKIT.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(100); }
}

export class KernelBoss extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        const s = ENEMY_STATS.KERNEL_BOSS;
        super(scene, s.hp, s.speed, s.reward, path);
        const outerMat = getEnemyMaterial(this.color, true, 'boss_outer');
        outerMat.emissiveIntensity = 0.6; outerMat.metalness = 0.8; outerMat.roughness = 0.2;
        this.mesh.add(new THREE.Mesh(BOSS_OUTER_GEO, outerMat));
        const coreMat = getEnemyMaterial(this.color, false, 'boss_core');
        coreMat.color.set(0xffffff); coreMat.emissive.set(this.color);
        coreMat.emissiveIntensity = 0.8;
        this.mesh.add(new THREE.Mesh(BOSS_CORE_GEO, coreMat));
    }
    public get color(): number { return ENEMY_STATS.KERNEL_BOSS.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(1000); }
}
