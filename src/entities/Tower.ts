import * as THREE from 'three';
import type { UpgradeData } from '../types';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';

export abstract class Tower {
    public readonly id: string;
    public position: THREE.Vector3;
    public gridX: number;
    public gridY: number;
    public damage!: number;
    public range!: number;
    public fireRate!: number;
    public cost!: number;
    public level: number = 1;
    public killCount: number = 0;
    public mesh: THREE.Group;
    public rangeCircle: THREE.Mesh | null = null;
    protected cooldown: number = 0;
    protected scene: THREE.Scene;

    constructor(scene: THREE.Scene, gridX: number, gridY: number, worldPos: THREE.Vector3) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.position = worldPos.clone();
        
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    private createRangeCircle(): void {
        const geometry = new THREE.RingGeometry(this.range - 0.05, this.range + 0.05, 64);
        const material = new THREE.MeshBasicMaterial({ 
            color: this.color, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        this.rangeCircle = new THREE.Mesh(geometry, material);
        this.rangeCircle.rotation.x = -Math.PI / 2;
        this.rangeCircle.position.y = 0.1;
        this.rangeCircle.visible = false;
        this.mesh.add(this.rangeCircle);
    }

    public setSelection(selected: boolean): void {
        if (!this.rangeCircle && selected) {
            this.createRangeCircle();
        }
        if (this.rangeCircle) {
            this.rangeCircle.visible = selected;
        }
    }

    public abstract update(delta: number, enemies: Enemy[]): Projectile | Projectile[] | null;
    public abstract get color(): number;
    public abstract get upgradeStats(): UpgradeData;
    public abstract get name(): string;

    public upgrade(): boolean {
        if (this.level >= 3) return false;
        const stats = this.upgradeStats;
        this.damage = stats.damage;
        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.level++;
        
        this.updateRangeCircle();

        // Visual feedback for upgrade
        this.mesh.scale.set(1.2, 1.2, 1.2);
        setTimeout(() => this.mesh.scale.set(1, 1, 1), 200);
        return true;
    }

    private updateRangeCircle(): void {
        if (this.rangeCircle) {
            this.mesh.remove(this.rangeCircle);
            this.rangeCircle.geometry.dispose();
            this.createRangeCircle();
            this.rangeCircle.visible = true;
        }
    }

    protected findTarget(enemies: Enemy[]): Enemy | null {
        let closest: Enemy | null = null;
        let minDist = this.range;

        for (const enemy of enemies) {
            const dist = this.position.distanceTo(enemy.mesh.position);
            if (dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }

        return closest;
    }

    public dispose(): void {
        this.scene.remove(this.mesh);
    }
}
