import * as THREE from 'three';
import { GRID_COLS, GRID_ROWS, TILE_SIZE, COLORS, MAPS } from '../constants';
import { TileType, type Position } from '../types';
import { Pathfinder } from './Pathfinder';

export class Grid {
    public cells: number[][];
    private cellMeshes: THREE.Mesh[][];
    public scene: THREE.Scene;
    private pathfinder: Pathfinder;
    public currentPath: Position[] = [];
    private placementRangeCircle: THREE.Mesh | null = null;
    private currentMapIndex: number = 0;
    private mapStart: Position = { x: 0, y: 0 };
    private mapEnd: Position = { x: 0, y: 0 };

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.cells = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));
        this.cellMeshes = [];
        this.pathfinder = new Pathfinder();
        
        this.loadMap(0);
    }

    public loadMap(index: number): void {
        this.currentMapIndex = index;
        const map = MAPS[this.currentMapIndex % MAPS.length];
        this.mapStart = map.start;
        this.mapEnd = map.end;

        // Reset cells
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                this.cells[y][x] = TileType.BUILDABLE;
            }
        }

        // Set path cells from MAPS data
        map.path.forEach(pos => {
            this.cells[pos.y][pos.x] = TileType.PATH;
        });
        this.cells[this.mapStart.y][this.mapStart.x] = TileType.START;
        this.cells[this.mapEnd.y][this.mapEnd.x] = TileType.END;

        if (this.cellMeshes.length === 0) {
            this.initGrid();
        } else {
            this.updateGridVisuals();
        }
        this.calculatePath();
    }

    private updateGridVisuals(): void {
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                const type = this.cells[y][x];
                const mesh = this.cellMeshes[y][x];
                const mat = mesh.material as THREE.MeshStandardMaterial;
                
                const color = this.getColorForType(type);
                mat.color.set(color);
                mat.emissive.set(color);
                
                if (type === TileType.PATH || type === TileType.START || type === TileType.END) {
                    mat.opacity = 0.9;
                    mat.emissiveIntensity = 0.5;
                } else if (type === TileType.TOWER) {
                    mat.opacity = 0.8;
                    mat.emissiveIntensity = 0.3;
                } else {
                    mat.opacity = 0.2;
                    mat.emissiveIntensity = 0;
                }
            }
        }
    }

    private initGrid(): void {
        const geometry = new THREE.BoxGeometry(TILE_SIZE - 0.1, 0.2, TILE_SIZE - 0.1);
        
        for (let y = 0; y < GRID_ROWS; y++) {
            this.cellMeshes[y] = [];
            for (let x = 0; x < GRID_COLS; x++) {
                const type = this.cells[y][x];
                const color = this.getColorForType(type);
                
                const material = new THREE.MeshStandardMaterial({
                    color: color,
                    transparent: true,
                    opacity: type === TileType.BUILDABLE ? 0.2 : 0.9,
                    emissive: color,
                    emissiveIntensity: (type === TileType.PATH || type === TileType.START || type === TileType.END) ? 0.5 : 0,
                    metalness: 0.5,
                    roughness: 0.2
                });

                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(
                    (x - GRID_COLS / 2 + 0.5) * TILE_SIZE,
                    0,
                    (y - GRID_ROWS / 2 + 0.5) * TILE_SIZE
                );
                
                this.scene.add(mesh);
                this.cellMeshes[y][x] = mesh;
            }
        }
    }

    private getColorForType(type: number): number {
        switch (type) {
            case TileType.PATH: return COLORS.PATH;
            case TileType.START: return COLORS.GREEN;
            case TileType.END: return COLORS.RED;
            case TileType.BLOCKED: return 0x222222;
            case TileType.TOWER: return COLORS.BLUE;
            default: return COLORS.GRID;
        }
    }

    public calculatePath(): boolean {
        const path = this.pathfinder.findPath(this.cells, this.mapStart, this.mapEnd);
        if (path) {
            this.currentPath = path;
            this.updatePathVisuals();
            return true;
        }
        return false;
    }

    private updatePathVisuals(): void {
        // Reset path cell highlights (non-static)
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                if (this.cells[y][x] === TileType.PATH) {
                    const mat = this.cellMeshes[y][x].material as THREE.MeshStandardMaterial;
                    mat.emissiveIntensity = 0.4;
                }
            }
        }

        // Highlight current active path
        this.currentPath.forEach(pos => {
            const mesh = this.cellMeshes[pos.y][pos.x];
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 0.8;
        });
    }

    public isPlaceable(x: number, y: number): boolean {
        if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
        return this.cells[y][x] === TileType.BUILDABLE;
    }

    public placeTower(x: number, y: number): boolean {
        if (!this.isPlaceable(x, y)) return false;

        const oldType = this.cells[y][x];
        this.cells[y][x] = TileType.TOWER;
        if (this.calculatePath()) {
            const mesh = this.cellMeshes[y][x];
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.opacity = 0.8;
            mat.color.set(COLORS.BLUE);
            mat.emissive.set(COLORS.BLUE);
            mat.emissiveIntensity = 0.3;
            return true;
        } else {
            this.cells[y][x] = oldType;
            this.calculatePath();
            return false;
        }
    }

    public removeTower(x: number, y: number): void {
        this.cells[y][x] = TileType.BUILDABLE;
        const mesh = this.cellMeshes[y][x];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.2;
        mat.color.set(COLORS.GRID);
        mat.emissive.set(COLORS.GRID);
        mat.emissiveIntensity = 0;
        this.calculatePath();
    }

    public getWorldPosition(x: number, y: number): THREE.Vector3 {
        return new THREE.Vector3(
            (x - GRID_COLS / 2 + 0.5) * TILE_SIZE,
            0.5,
            (y - GRID_ROWS / 2 + 0.5) * TILE_SIZE
        );
    }

    public highlightCell(x: number, y: number, color: number | null): void {
        for (let j = 0; j < GRID_ROWS; j++) {
            for (let i = 0; i < GRID_COLS; i++) {
                if (this.cells[j][i] === TileType.BUILDABLE) {
                    const mat = this.cellMeshes[j][i].material as THREE.MeshStandardMaterial;
                    mat.emissive.set(0x000000);
                    mat.emissiveIntensity = 0;
                }
            }
        }

        if (color !== null && x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS) {
            const mat = this.cellMeshes[y][x].material as THREE.MeshStandardMaterial;
            mat.emissive.set(color);
            mat.emissiveIntensity = 0.6;
        }
    }

    public showPlacementRange(x: number, y: number, range: number, color: number): void {
        if (!this.placementRangeCircle) {
            const geometry = new THREE.RingGeometry(range - 0.05, range + 0.05, 64);
            const material = new THREE.MeshBasicMaterial({ 
                color: color, 
                transparent: true, 
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            this.placementRangeCircle = new THREE.Mesh(geometry, material);
            this.placementRangeCircle.rotation.x = -Math.PI / 2;
            this.placementRangeCircle.position.y = 0.2;
            this.scene.add(this.placementRangeCircle);
        }

        const worldPos = this.getWorldPosition(x, y);
        this.placementRangeCircle.position.set(worldPos.x, 0.2, worldPos.z);
    }

    public hidePlacementRange(): void {
        if (this.placementRangeCircle) {
            this.scene.remove(this.placementRangeCircle);
            this.placementRangeCircle.geometry.dispose();
            this.placementRangeCircle = null;
        }
    }
}
