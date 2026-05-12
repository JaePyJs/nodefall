import * as THREE from 'three';
import { Tower } from './Tower';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { TOWER_STATS, COLORS } from '../constants';
import type { UpgradeData } from '../types';

export class FirewallTower extends Tower {
    constructor(scene: THREE.Scene, x: number, y: number, pos: THREE.Vector3) {
        super(scene, x, y, pos);
        const stats = TOWER_STATS.FIREWALL;
        this.damage = stats.damage;
        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.cost = stats.cost;

        const geo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.6;
        this.mesh.add(mesh);
    }

    public get color(): number { return COLORS.BLUE; }
    public get name(): string { return "Firewall"; }
    public get upgradeStats(): UpgradeData {
        return {
            damage: this.damage * 1.5,
            range: this.range * 1.1,
            fireRate: this.fireRate * 1.2,
            cost: Math.floor(this.cost * 1.5)
        };
    }

    public upgrade(): boolean {
        if (super.upgrade()) {
            const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 });
            const part = new THREE.Mesh(geo, mat);
            part.position.y = 1.2;
            this.mesh.add(part);
            return true;
        }
        return false;
    }

    public update(delta: number, enemies: Enemy[]): Projectile | null {
        this.cooldown -= delta;
        if (this.cooldown <= 0) {
            const target = this.findTarget(enemies);
            if (target) {
                this.cooldown = 1 / this.fireRate;
                this.mesh.lookAt(target.mesh.position);
                return new Projectile(this.scene, this.position, target, this.damage, this.color);
            }
        }
        return null;
    }
}

export class EncryptionNode extends Tower {
    constructor(scene: THREE.Scene, x: number, y: number, pos: THREE.Vector3) {
        super(scene, x, y, pos);
        const stats = TOWER_STATS.ENCRYPTION;
        this.damage = stats.damage;
        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.cost = stats.cost;

        const geo = new THREE.CylinderGeometry(0.4, 0.6, 1.5, 6);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.75;
        this.mesh.add(mesh);
    }

    public get color(): number { return COLORS.PURPLE; }
    public get name(): string { return "Encryption Node"; }
    public get upgradeStats(): UpgradeData {
        return {
            damage: this.damage * 1.2,
            range: this.range * 1.2,
            fireRate: this.fireRate * 1.3,
            cost: Math.floor(this.cost * 1.5)
        };
    }

    public upgrade(): boolean {
        if (super.upgrade()) {
            const geo = new THREE.SphereGeometry(0.2, 8, 8);
            const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 });
            const part = new THREE.Mesh(geo, mat);
            part.position.y = 1.6;
            this.mesh.add(part);
            return true;
        }
        return false;
    }

    public update(delta: number, enemies: Enemy[]): Projectile | null {
        this.cooldown -= delta;
        if (this.cooldown <= 0) {
            const target = this.findTarget(enemies);
            if (target) {
                this.cooldown = 1 / this.fireRate;
                this.mesh.lookAt(target.mesh.position);
                const p = new Projectile(this.scene, this.position, target, this.damage, this.color);
                p.effect = { type: 'slow', duration: 2, value: 0.5 };
                return p;
            }
        }
        return null;
    }
}

export class OverloadCannon extends Tower {
    constructor(scene: THREE.Scene, x: number, y: number, pos: THREE.Vector3) {
        super(scene, x, y, pos);
        const stats = TOWER_STATS.OVERLOAD;
        this.damage = stats.damage;
        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.cost = stats.cost;

        const geo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.4;
        this.mesh.add(mesh);
    }

    public get color(): number { return COLORS.RED; }
    public get name(): string { return "Overload Cannon"; }
    public get upgradeStats(): UpgradeData {
        return {
            damage: this.damage * 2,
            range: this.range * 1.1,
            fireRate: this.fireRate * 1.1,
            cost: Math.floor(this.cost * 1.5)
        };
    }

    public upgrade(): boolean {
        if (super.upgrade()) {
            const geo = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
            const mat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
            const part = new THREE.Mesh(geo, mat);
            part.rotation.x = Math.PI / 2;
            part.position.y = 0.8;
            this.mesh.add(part);
            return true;
        }
        return false;
    }

    public update(delta: number, enemies: Enemy[]): Projectile | null {
        this.cooldown -= delta;
        if (this.cooldown <= 0) {
            const target = this.findTarget(enemies);
            if (target) {
                this.cooldown = 1 / this.fireRate;
                this.mesh.lookAt(target.mesh.position);
                return new Projectile(this.scene, this.position, target, this.damage, this.color);
            }
        }
        return null;
    }
}

export class EMPTower extends Tower {
    constructor(scene: THREE.Scene, x: number, y: number, pos: THREE.Vector3) {
        super(scene, x, y, pos);
        const stats = TOWER_STATS.EMP;
        this.damage = stats.damage;
        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.cost = stats.cost;

        const geo = new THREE.SphereGeometry(0.6, 8, 8);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 1.0;
        this.mesh.add(mesh);
    }

    public get color(): number { return COLORS.YELLOW; }
    public get name(): string { return "EMP Tower"; }
    public get upgradeStats(): UpgradeData {
        return {
            damage: this.damage * 1.4,
            range: this.range * 1.2,
            fireRate: this.fireRate * 1.2,
            cost: Math.floor(this.cost * 1.5)
        };
    }

    public upgrade(): boolean {
        if (super.upgrade()) {
            const geo = new THREE.TorusGeometry(0.5, 0.05, 8, 24);
            const mat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.5 });
            const part = new THREE.Mesh(geo, mat);
            part.rotation.x = Math.PI / 2;
            part.position.y = 1.0;
            this.mesh.add(part);
            return true;
        }
        return false;
    }

    public update(delta: number, enemies: Enemy[]): Projectile[] | null {
        this.cooldown -= delta;
        if (this.cooldown <= 0) {
            const targets = enemies.filter(e => this.position.distanceTo(e.mesh.position) < this.range);
            if (targets.length > 0) {
                this.cooldown = 1 / this.fireRate;
                this.mesh.rotation.y += Math.PI / 4; // Spin animation per burst
                return targets.map(t => new Projectile(this.scene, this.position, t, this.damage, this.color));
            }
        }
        return null;
    }
}

export class IceNode extends Tower {
    constructor(scene: THREE.Scene, x: number, y: number, pos: THREE.Vector3) {
        super(scene, x, y, pos);
        const stats = TOWER_STATS.ICE;
        this.damage = stats.damage;
        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.cost = stats.cost;

        const geo = new THREE.IcosahedronGeometry(0.6);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.8;
        this.mesh.add(mesh);
    }

    public get color(): number { return COLORS.ICE; }
    public get name(): string { return "Ice Node"; }
    public get upgradeStats(): UpgradeData {
        return {
            damage: this.damage * 1.2,
            range: this.range * 1.1,
            fireRate: this.fireRate * 1.4,
            cost: Math.floor(this.cost * 1.5)
        };
    }

    public upgrade(): boolean {
        if (super.upgrade()) {
            const geo = new THREE.OctahedronGeometry(0.3);
            const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 });
            const part = new THREE.Mesh(geo, mat);
            part.position.y = 1.5;
            this.mesh.add(part);
            return true;
        }
        return false;
    }

    public update(delta: number, enemies: Enemy[]): Projectile | null {
        this.cooldown -= delta;
        if (this.cooldown <= 0) {
            const target = this.findTarget(enemies);
            if (target) {
                this.cooldown = 1 / this.fireRate;
                this.mesh.lookAt(target.mesh.position);
                const p = new Projectile(this.scene, this.position, target, this.damage, this.color);
                p.effect = { type: 'freeze', duration: 0.5, value: 0 };
                return p;
            }
        }
        return null;
    }
}
