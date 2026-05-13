import * as THREE from 'three';
import { Enemy, type StatusEffect } from './Enemy';

const SHARED_PROJECTILE_GEO = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
const PROJECTILE_MATERIALS: Map<string, THREE.MeshLambertMaterial> = new Map();

function getProjectileMaterial(color: number): THREE.MeshLambertMaterial {
    const key = color.toString(16);
    if (!PROJECTILE_MATERIALS.has(key)) {
        PROJECTILE_MATERIALS.set(key, new THREE.MeshLambertMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8
        }));
    }
    return PROJECTILE_MATERIALS.get(key)!;
}

export function disposeProjectileCache(): void {
    PROJECTILE_MATERIALS.forEach(m => m.dispose());
    PROJECTILE_MATERIALS.clear();
    SHARED_PROJECTILE_GEO.dispose();
}

export class Projectile {
    public mesh: THREE.Mesh;
    public target: Enemy;
    public damage: number;
    public speed: number = 20;
    public active: boolean = true;
    public effect: StatusEffect | null = null;
    private scene: THREE.Scene;
    private trailPositions: THREE.Vector3[] = [];
    private trailLine: THREE.Line | null = null;
    private trailMaterial: THREE.LineBasicMaterial;

    constructor(scene: THREE.Scene, startPos: THREE.Vector3, target: Enemy, damage: number, color: number) {
        this.scene = scene;
        this.target = target;
        this.damage = damage;

        this.mesh = new THREE.Mesh(SHARED_PROJECTILE_GEO, getProjectileMaterial(color));
        this.mesh.position.copy(startPos);
        this.mesh.position.y += 0.5;
        this.scene.add(this.mesh);

        for (let i = 0; i < 4; i++) {
            this.trailPositions.push(startPos.clone().add(new THREE.Vector3(0, 0.5, 0)));
        }

        this.trailMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5
        });
    }

    public update(delta: number): void {
        if (!this.active) return;

        const targetPos = this.target.mesh.position.clone();
        targetPos.y += 0.2;

        const direction = targetPos.clone().sub(this.mesh.position).normalize();
        const dist = this.speed * delta;

        if (this.mesh.position.distanceTo(targetPos) < dist) {
            this.hit();
        } else {
            this.mesh.position.add(direction.multiplyScalar(dist));
            this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

            this.trailPositions.shift();
            this.trailPositions.push(this.mesh.position.clone());
            this.updateTrail();
        }
    }

    private updateTrail(): void {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < this.trailPositions.length - 1; i++) {
            pts.push(this.trailPositions[i].clone());
            pts.push(this.trailPositions[i + 1].clone());
        }
        if (pts.length < 2) return;

        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        if (!this.trailLine) {
            this.trailLine = new THREE.Line(geo, this.trailMaterial);
            this.scene.add(this.trailLine);
        } else {
            this.trailLine.geometry.dispose();
            this.trailLine.geometry = geo;
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
        if (this.trailLine) {
            this.scene.remove(this.trailLine);
            this.trailLine.geometry.dispose();
            this.trailLine = null;
        }
    }
}
