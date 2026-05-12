import * as THREE from 'three';
import { Enemy, type StatusEffect } from './Enemy';

export class Projectile {
    public mesh: THREE.Mesh;
    public target: Enemy;
    public damage: number;
    public speed: number = 20;
    public active: boolean = true;
    public effect: StatusEffect | null = null;
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene, startPos: THREE.Vector3, target: Enemy, damage: number, color: number) {
        this.scene = scene;
        this.target = target;
        this.damage = damage;

        // Using a cylinder as a laser beam
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPos);
        this.mesh.position.y += 0.5;
        this.scene.add(this.mesh);
    }

    public update(delta: number): void {
        if (!this.active) return;

        if (this.target.hp <= 0) {
            this.dispose();
            return;
        }

        const targetPos = this.target.mesh.position.clone();
        targetPos.y += 0.2;

        const direction = targetPos.clone().sub(this.mesh.position).normalize();
        const dist = this.speed * delta;

        if (this.mesh.position.distanceTo(targetPos) < dist) {
            this.hit();
        } else {
            this.mesh.position.add(direction.multiplyScalar(dist));
            
            // Orient laser towards movement
            this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        }
    }

    private hit(): void {
        this.target.takeDamage(this.damage);
        if (this.effect) {
            this.target.applyEffect({ ...this.effect });
        }
        this.dispose();
    }

    public dispose(): void {
        this.active = false;
        this.scene.remove(this.mesh);
    }
}
