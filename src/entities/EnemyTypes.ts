import * as THREE from 'three';
import { Enemy } from './Enemy';
import { GameState } from '../systems/GameState';
import { ENEMY_STATS } from '../constants';

export class DataPacket extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        const s = ENEMY_STATS.DATA_PACKET;
        super(scene, s.hp, s.speed, s.reward, path);
        const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.4,
            metalness: 0.3,
            roughness: 0.5
        });
        this.mesh.add(new THREE.Mesh(geo, mat));
    }
    public get color(): number { return ENEMY_STATS.DATA_PACKET.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(10); }
}

export class WormProcess extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        const s = ENEMY_STATS.WORM_PROCESS;
        super(scene, s.hp, s.speed, s.reward, path);
        const geo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.4,
            metalness: 0.3,
            roughness: 0.5
        });
        const m = new THREE.Mesh(geo, mat);
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
        const geo = new THREE.OctahedronGeometry(0.55);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.4,
            metalness: 0.5,
            roughness: 0.3
        });
        this.mesh.add(new THREE.Mesh(geo, mat));
    }
    public get color(): number { return ENEMY_STATS.DAEMON_THREAD.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(50); }
}

export class Rootkit extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        const s = ENEMY_STATS.ROOTKIT;
        super(scene, s.hp, s.speed, s.reward, path);
        const geo = new THREE.TorusKnotGeometry(0.25, 0.08, 48, 8);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.5,
            metalness: 0.7,
            roughness: 0.3
        });
        this.mesh.add(new THREE.Mesh(geo, mat));
    }
    public get color(): number { return ENEMY_STATS.ROOTKIT.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(100); }
}

export class KernelBoss extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        const s = ENEMY_STATS.KERNEL_BOSS;
        super(scene, s.hp, s.speed, s.reward, path);
        const geo = new THREE.IcosahedronGeometry(1.0, 1);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.6,
            wireframe: true,
            metalness: 0.8,
            roughness: 0.2
        });
        this.mesh.add(new THREE.Mesh(geo, mat));
        
        const coreGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            emissive: this.color, 
            emissiveIntensity: 0.8 
        });
        this.mesh.add(new THREE.Mesh(coreGeo, coreMat));
    }
    public get color(): number { return ENEMY_STATS.KERNEL_BOSS.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(1000); }
}
