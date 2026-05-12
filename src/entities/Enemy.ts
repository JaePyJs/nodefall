import * as THREE from 'three';
import { GameState } from '../systems/GameState';

export interface StatusEffect {
    type: 'slow' | 'freeze';
    duration: number;
    value: number;
}

export abstract class Enemy {
    public readonly id: string;
    public hp: number;
    public maxHp: number;
    public speed: number;
    public reward: number;
    public pathIndex: number = 0;
    public mesh: THREE.Group;
    public hpBarElement: HTMLElement;
    protected hpFill: HTMLElement;
    protected scene: THREE.Scene;
    protected path: THREE.Vector3[];
    protected effects: StatusEffect[] = [];

    constructor(scene: THREE.Scene, hp: number, speed: number, reward: number, path: THREE.Vector3[]) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.scene = scene;
        this.hp = hp;
        this.maxHp = hp;
        this.speed = speed;
        this.reward = reward;
        this.path = path;

        this.mesh = new THREE.Group();
        this.mesh.position.copy(path[0]);
        this.scene.add(this.mesh);

        // Create HP Bar element
        this.hpBarElement = document.createElement('div');
        this.hpBarElement.className = 'hp-bar';
        this.hpFill = document.createElement('div');
        this.hpFill.className = 'hp-fill';
        this.hpFill.style.transition = 'width 0.3s ease-out, background 0.3s ease';
        this.hpBarElement.appendChild(this.hpFill);
        document.body.appendChild(this.hpBarElement);
    }

    public abstract get color(): number;
    public abstract onDeath(gameState: GameState): void;

    public updatePath(newPath: THREE.Vector3[]): void {
        this.path = newPath;
    }

    public takeDamage(amount: number): boolean {
        this.hp -= amount;
        this.updateHPBarVisual();
        
        // Flash white effect
        const mesh = this.mesh.children[0] as THREE.Mesh;
        if (mesh && mesh.material instanceof THREE.MeshLambertMaterial) {
            const mat = mesh.material;
            const oldColor = mat.color.getHex();
            mat.color.set(0xffffff);
            setTimeout(() => mat.color.set(oldColor), 50);
        }

        return this.hp <= 0;
    }

    public applyEffect(effect: StatusEffect): void {
        this.effects.push(effect);
    }

    public move(delta: number): boolean {
        if (this.pathIndex >= this.path.length - 1) return true;

        let currentSpeed = this.speed;
        this.effects = this.effects.filter(e => {
            e.duration -= delta;
            if (e.duration > 0) {
                currentSpeed *= e.value;
                return true;
            }
            return false;
        });

        const target = this.path[this.pathIndex + 1];
        const direction = target.clone().sub(this.mesh.position).normalize();
        
        // Rotate mesh to face direction
        this.mesh.lookAt(target);

        const dist = currentSpeed * delta;
        
        if (this.mesh.position.distanceTo(target) < dist) {
            this.mesh.position.copy(target);
            this.pathIndex++;
        } else {
            this.mesh.position.add(direction.multiplyScalar(dist));
        }

        return false;
    }

    public updateHPBar(camera: THREE.Camera): void {
        const vector = this.mesh.position.clone().project(camera);
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight - 30;

        this.hpBarElement.style.left = `${x - 20}px`;
        this.hpBarElement.style.top = `${y}px`;
        
        // Hide if behind camera
        if (vector.z > 1) {
            this.hpBarElement.style.display = 'none';
        } else {
            this.hpBarElement.style.display = 'block';
        }
    }

    protected updateHPBarVisual(): void {
        const pct = (this.hp / this.maxHp) * 100;
        this.hpFill.style.width = `${pct}%`;
        
        if (pct > 60) this.hpFill.style.background = 'var(--color-green)';
        else if (pct > 30) this.hpFill.style.background = 'var(--color-yellow)';
        else this.hpFill.style.background = 'var(--color-red)';
    }

    public dispose(): void {
        this.scene.remove(this.mesh);
        if (this.hpBarElement.parentNode) {
            this.hpBarElement.parentNode.removeChild(this.hpBarElement);
        }
    }
}
