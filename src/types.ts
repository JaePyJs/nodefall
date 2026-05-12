import * as THREE from 'three';

export interface Position {
    x: number;
    y: number;
}

export const TileType = {
    BUILDABLE: 0,
    PATH: 1,
    START: 2,
    END: 3,
    BLOCKED: 4,
    TOWER: 5
} as const;
export type TileType = typeof TileType[keyof typeof TileType];

export const GameStatus = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY'
} as const;
export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

export type TowerType = 'FIREWALL' | 'ENCRYPTION' | 'OVERLOAD' | 'EMP' | 'ICE';
export type EnemyType = 'DATA_PACKET' | 'WORM_PROCESS' | 'DAEMON_THREAD' | 'ROOTKIT' | 'KERNEL_BOSS';

export interface Renderable {
    mesh: THREE.Object3D;
}

export interface Updatable {
    update(delta: number, context?: any): void;
}

export interface UpgradeData {
    damage: number;
    range: number;
    fireRate: number;
    cost: number;
}
