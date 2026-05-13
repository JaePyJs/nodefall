import * as THREE from 'three';

export class DamageNumberPool {
    private pool: HTMLElement[] = [];
    private active: HTMLElement[] = [];

    constructor() {}

    public spawn(x: number, y: number, text: string, isCritical: boolean = false): void {
        let el: HTMLElement;
        if (this.pool.length > 0) {
            el = this.pool.pop()!;
        } else {
            el = document.createElement('div');
            el.className = 'damage-number';
        }

        el.innerText = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.color = isCritical ? 'var(--color-red)' : 'var(--text-primary)';
        el.style.fontSize = isCritical ? '1.5rem' : '1rem';
        el.style.display = 'block';
        el.style.opacity = '1';

        document.body.appendChild(el);
        this.active.push(el);

        setTimeout(() => {
            this.release(el);
        }, 800);
    }

    private release(el: HTMLElement): void {
        el.style.display = 'none';
        el.remove();
        this.pool.push(el);
        const idx = this.active.indexOf(el);
        if (idx >= 0) this.active.splice(idx, 1);
    }
}

// For projectiles, we'll simplify and use the Pool pattern in the Game class for now 
// or implement a dedicated pool if requested specifically as a separate class.
// The Projectile class currently creates new meshes, let's optimize it.

export class ProjectilePool {
    private pool: THREE.Mesh[] = [];
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene, size: number = 50) {
        this.scene = scene;
        const geometry = new THREE.SphereGeometry(0.1, 4, 4);
        for (let i = 0; i < size; i++) {
            const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            this.scene.add(mesh);
            this.pool.push(mesh);
        }
    }

    public get(): THREE.Mesh | null {
        const mesh = this.pool.find(m => !m.visible);
        if (mesh) {
            mesh.visible = true;
            return mesh;
        }
        return null;
    }

    public release(mesh: THREE.Mesh): void {
        mesh.visible = false;
    }
}
