import * as THREE from 'three';

export class ParticleSystem {
    private scene: THREE.Scene;
    private particles: { mesh: THREE.Mesh, velocity: THREE.Vector3, life: number }[] = [];
    // Shared geometry + material to avoid per-explosion GPU allocation
    private sharedGeometry: THREE.BufferGeometry;
    private particleMaterials: Map<string, THREE.MeshStandardMaterial> = new Map();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.sharedGeometry = new THREE.SphereGeometry(0.08, 4, 4);
    }

    private getOrCreateMaterial(color: number): THREE.MeshStandardMaterial {
        const key = color.toString(16);
        if (!this.particleMaterials.has(key)) {
            this.particleMaterials.set(key, new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.9
            }));
        }
        return this.particleMaterials.get(key)!;
    }

    public spawnExplosion(position: THREE.Vector3, color: number, count: number = 10): void {
        const material = this.getOrCreateMaterial(color);

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.sharedGeometry, material);
            mesh.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5 + 1,
                (Math.random() - 0.5) * 5
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                life: 1.0,
            });
        }
    }

    public update(delta: number): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta * 1.5;
            
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
                continue;
            }

            p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y -= 9.8 * delta; // Gravity
            p.mesh.scale.setScalar(p.life);
            p.mesh.rotation.x += delta * 5;
            p.mesh.rotation.y += delta * 5;
        }
    }

    public dispose(): void {
        this.sharedGeometry.dispose();
        this.particleMaterials.forEach(m => m.dispose());
        this.particleMaterials.clear();
        // Dispose remaining particles
        for (const p of this.particles) {
            this.scene.remove(p.mesh);
        }
        this.particles = [];
    }
}
