import * as THREE from 'three';
import { Enemy } from './Enemy';
import { GameState } from '../systems/GameState';
import { ENEMY_STATS } from '../constants';

export class DataPacket extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        super(scene, path, ENEMY_STATS.DATA_PACKET);
        const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3
        });
        this.mesh.add(new THREE.Mesh(geo, mat));
    }
    public get color(): number { return ENEMY_STATS.DATA_PACKET.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(10); }
}

export class WormProcess extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        super(scene, path, ENEMY_STATS.WORM_PROCESS);
        const geo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3
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
        super(scene, path, ENEMY_STATS.DAEMON_THREAD);
        const geo = new THREE.OctahedronGeometry(0.6);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3
        });
        this.mesh.add(new THREE.Mesh(geo, mat));
    }
    public get color(): number { return ENEMY_STATS.DAEMON_THREAD.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(50); }
}

export class Rootkit extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        super(scene, path, ENEMY_STATS.ROOTKIT);
        const geo = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3
        });
        this.mesh.add(new THREE.Mesh(geo, mat));
    }
    public get color(): number { return ENEMY_STATS.ROOTKIT.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(100); }
}

export class KernelBoss extends Enemy {
    constructor(scene: THREE.Scene, path: THREE.Vector3[]) {
        super(scene, path, ENEMY_STATS.KERNEL_BOSS);
        const geo = new THREE.IcosahedronGeometry(1.2, 0);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.5,
            wireframe: true
        });
        this.mesh.add(new THREE.Mesh(geo, mat));
        
        // Inner core
        const coreGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 });
        this.mesh.add(new THREE.Mesh(coreGeo, coreMat));
    }
    public get color(): number { return ENEMY_STATS.KERNEL_BOSS.color; }
    public onDeath(gameState: GameState): void { gameState.addGold(this.reward); gameState.addScore(1000); }
}
