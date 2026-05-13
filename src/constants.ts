import type { TowerType } from './types';

export const TILE_SIZE = 2;
export const GRID_COLS = 20;
export const GRID_ROWS = 14;

export const INITIAL_GOLD = 200;
export const INITIAL_LIVES = 3;

export const COLORS = {
    BG: 0x020208,
    GRID: 0x0a1628,
    PATH: 0x00f5ff, // Ultra-bright cyan
    PRIMARY: 0x00f5ff,
    BLUE: 0x0088ff,  // Firewall blue
    PURPLE: 0xbf00ff, // Encryption purple
    RED: 0xff3300,    // Overload red-orange
    YELLOW: 0xffcc00, // EMP yellow
    ICE: 0x44eeff,    // Ice blue
    GREEN: 0x00ff88,  // Enemy/Start
    GOLD: 0xffe600,
    FOG: 0x020208,
    CORE_GLOW: 0x00f5ff
};

export const TOWER_STATS = {
    FIREWALL: {
        name: 'Firewall',
        description: 'Single target, balanced network protection.',
        damage: 25,
        range: 3.5,
        fireRate: 1.2,
        cost: 100,
        color: COLORS.BLUE
    },
    ENCRYPTION: {
        name: 'Encryption Node',
        description: 'Applies SLOW effect to corrupted packets.',
        damage: 10,
        range: 5.0,
        fireRate: 2.0,
        cost: 150,
        color: COLORS.PURPLE
    },
    OVERLOAD: {
        name: 'Overload Cannon',
        description: 'High DMG, slow fire rate. Heavy hardware.',
        damage: 80,
        range: 2.5,
        fireRate: 0.4,
        cost: 200,
        color: COLORS.RED
    },
    EMP: {
        name: 'EMP Tower',
        description: 'AoE burst. Hits all nearby threats.',
        damage: 15,
        range: 3.0,
        fireRate: 0.5,
        cost: 250,
        color: COLORS.YELLOW
    },
    ICE: {
        name: 'Ice Node',
        description: 'Applies FREEZE effect. Stops threats briefly.',
        damage: 8,
        range: 3.5,
        fireRate: 1.8,
        cost: 175,
        color: COLORS.ICE
    }
};

// Tower tier unlocks — wave-gated availability
export const TIER_UNLOCKS: Record<TowerType, number> = {
    FIREWALL: 1,     // Available from wave 1
    ENCRYPTION: 4,   // Unlocks at wave 4
    OVERLOAD: 8,     // Unlocks at wave 8
    EMP: 12,         // Unlocks at wave 12
    ICE: 16,         // Unlocks at wave 16
};

export const ENEMY_STATS = {
    DATA_PACKET: { hp: 60, speed: 2.0, reward: 10, color: COLORS.GREEN },
    WORM_PROCESS: { hp: 120, speed: 1.5, reward: 20, color: 0x33ff00 },
    DAEMON_THREAD: { hp: 300, speed: 0.8, reward: 35, color: 0x00ccff },
    ROOTKIT: { hp: 150, speed: 2.5, reward: 30, color: 0xff00cc },
    KERNEL_BOSS: { hp: 3000, speed: 0.5, reward: 500, color: 0xff1100 }
};

export const MAPS = [
    // Map 1: Simple snake
    {
        start: { x: 0, y: 3 },
        end: { x: 19, y: 10 },
        path: [
            {x: 0, y: 3}, {x: 1, y: 3}, {x: 2, y: 3}, {x: 3, y: 3},
            {x: 3, y: 4}, {x: 3, y: 5}, {x: 4, y: 5}, {x: 5, y: 5},
            {x: 5, y: 6}, {x: 5, y: 7}, {x: 6, y: 7}, {x: 7, y: 7},
            {x: 8, y: 7}, {x: 9, y: 7}, {x: 9, y: 8}, {x: 9, y: 9},
            {x: 10, y: 9}, {x: 11, y: 9}, {x: 12, y: 9}, {x: 13, y: 9},
            {x: 13, y: 10}, {x: 14, y: 10}, {x: 15, y: 10}, {x: 16, y: 10},
            {x: 17, y: 10}, {x: 18, y: 10}, {x: 19, y: 10}
        ]
    },
    // Map 2: Zigzag
    {
        start: { x: 0, y: 1 },
        end: { x: 19, y: 12 },
        path: [
            {x: 0, y: 1}, {x: 5, y: 1}, {x: 5, y: 5}, {x: 10, y: 5},
            {x: 10, y: 10}, {x: 15, y: 10}, {x: 15, y: 12}, {x: 19, y: 12}
        ]
    },
    // Map 3: Loop-de-loop
    {
        start: { x: 0, y: 7 },
        end: { x: 19, y: 7 },
        path: [
            {x: 0, y: 7}, {x: 5, y: 7}, {x: 5, y: 2}, {x: 15, y: 2},
            {x: 15, y: 12}, {x: 5, y: 12}, {x: 5, y: 7}, {x: 19, y: 7}
        ]
    },
    // Map 4: Spiral
    {
        start: { x: 0, y: 0 },
        end: { x: 10, y: 7 },
        path: [
            {x: 0, y: 0}, {x: 19, y: 0}, {x: 19, y: 13}, {x: 0, y: 13},
            {x: 0, y: 3}, {x: 16, y: 3}, {x: 16, y: 10}, {x: 3, y: 10},
            {x: 3, y: 7}, {x: 10, y: 7}
        ]
    }
];

export const PATH_LAYOUT = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));
