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
    private pulseState: { material: THREE.MeshStandardMaterial; elapsed: number } | null = null;
    private rangeCircleFade: { elapsed: number } | null = null;
    private currentMapIndex: number = 0;
    private mapStart: Position = { x: 0, y: 0 };
    private mapEnd: Position = { x: 0, y: 0 };
    private hoveredCell: Position | null = null;

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

        // Set path cells from MAPS data (interpolate between waypoints)
        map.path.forEach(pos => {
            this.cells[pos.y][pos.x] = TileType.PATH;
        });
        // Interpolate between consecutive waypoints to fill gaps
        for (let i = 0; i < map.path.length - 1; i++) {
            const a = map.path[i];
            const b = map.path[i + 1];
            const dx = Math.sign(b.x - a.x);
            const dy = Math.sign(b.y - a.y);
            let cx = a.x;
            let cy = a.y;
            while (cx !== b.x || cy !== b.y) {
                this.cells[cy][cx] = TileType.PATH;
                cx += dx;
                cy += dy;
            }
        }
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
                
                if (type === TileType.PATH) {
                    mat.opacity = 0.9;
                    mat.emissiveIntensity = 0.5;
                } else if (type === TileType.START || type === TileType.END) {
                    mat.opacity = 1.0;
                    mat.emissiveIntensity = 0.8;
                } else if (type === TileType.TOWER) {
                    mat.opacity = 0.6;
                    mat.emissiveIntensity = 0.3;
                } else {
                    mat.opacity = 0.4;
                    mat.emissiveIntensity = 0.05;
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
                const isPath = type === TileType.PATH || type === TileType.START || type === TileType.END;
                const isTower = type === TileType.TOWER;

                const material = new THREE.MeshStandardMaterial({
                    color: color,
                    transparent: true,
                    opacity: isPath ? 0.85 : (isTower ? 0.6 : 0.55),
                    emissive: color,
                    emissiveIntensity: isPath ? 0.5 : (isTower ? 0.3 : 0.12),
                    metalness: 0.4,
                    roughness: 0.3
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
            mat.opacity = 0.6;
            mat.color.set(COLORS.GRID);
            mat.emissive.set(COLORS.GRID);
            mat.emissiveIntensity = 0.3;
            return true;
        } else {
            // Tower blocks the path — revert
            this.cells[y][x] = oldType;
            this.calculatePath();
            return false;
        }
    }

    public removeTower(x: number, y: number): void {
        this._removeTowerCell(x, y);
        this.calculatePath();
    }

    /** Remove tower cell without recalculating path — use for batch operations. Caller must call calculatePath once after all removals. */
    public removeTowerSilent(x: number, y: number): void {
        this._removeTowerCell(x, y);
    }

    private _removeTowerCell(x: number, y: number): void {
        this.cells[y][x] = TileType.BUILDABLE;
        const mesh = this.cellMeshes[y][x];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.2;
        mat.color.set(COLORS.GRID);
        mat.emissive.set(COLORS.GRID);
        mat.emissiveIntensity = 0;
    }

    public getWorldPosition(x: number, y: number): THREE.Vector3 {
        return new THREE.Vector3(
            (x - GRID_COLS / 2 + 0.5) * TILE_SIZE,
            0.5,
            (y - GRID_ROWS / 2 + 0.5) * TILE_SIZE
        );
    }

    /* Reset hover highlight */
    public clearHover(): void {
        if (this.hoveredCell) {
            const { x, y } = this.hoveredCell;
            const type = this.cells[y][x];
            const mesh = this.cellMeshes[y][x];
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.emissive.set(this.getColorForType(type));
            mat.emissiveIntensity = this.getBaseEmissive(type);
            this.hoveredCell = null;
        }
    }

    private getBaseEmissive(type: number): number {
        switch (type) {
            case TileType.PATH: return 0.5;
            case TileType.START:
            case TileType.END: return 0.8;
            case TileType.TOWER: return 0.3;
            default: return 0.05;
        }
    }

    public highlightCell(x: number, y: number, color: number | null): void {
        this.clearHover();
        if (color !== null && this.isInBounds(x, y)) {
            const mesh = this.cellMeshes[y][x];
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.emissive.set(color);
            mat.emissiveIntensity = 0.8;
            this.hoveredCell = { x, y };
            // Start pulse animation on hovered cell
            this.pulseState = { material: mat, elapsed: 0 };
        }
    }

    private isInBounds(x: number, y: number): boolean {
        return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
    }

    public showPlacementRange(x: number, y: number, range: number, color: number): void {
        const worldPos = this.getWorldPosition(x, y);

        if (!this.placementRangeCircle) {
            const geometry = new THREE.RingGeometry(range - 0.05, range + 0.05, 64);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });
            this.placementRangeCircle = new THREE.Mesh(geometry, material);
            this.placementRangeCircle.rotation.x = -Math.PI / 2;
            this.placementRangeCircle.position.set(worldPos.x, 0.2, worldPos.z);
            this.scene.add(this.placementRangeCircle);
            this.rangeCircleFade = { elapsed: 0 };
        } else {
            // Update existing range circle with new range and color
            this.placementRangeCircle.geometry.dispose();
            this.placementRangeCircle.geometry = new THREE.RingGeometry(range - 0.05, range + 0.05, 64);
            (this.placementRangeCircle.material as THREE.MeshBasicMaterial).color.setHex(color);
            this.placementRangeCircle.position.set(worldPos.x, 0.2, worldPos.z);
            this.rangeCircleFade = { elapsed: 0 };
        }
    }

    public hidePlacementRange(): void {
        this.clearHover();
        this.rangeCircleFade = null;
        if (this.placementRangeCircle) {
            this.scene.remove(this.placementRangeCircle);
            this.placementRangeCircle.geometry.dispose();
            this.placementRangeCircle = null;
        }
    }

    /** Advance pulse animation — call each frame from Game.loop. */
    public update(delta: number): void {
        if (this.pulseState) {
            this.pulseState.elapsed += delta;
            const cycle = 0.6; // 600ms loop
            const t = (this.pulseState.elapsed % cycle) / cycle;
            const pulse = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
            const intensity = 0.2 + pulse * 0.3; // 0.2→0.5→0.2
            this.pulseState.material.emissiveIntensity = intensity;
            if (this.pulseState.elapsed > 3) {
                this.pulseState.material.emissiveIntensity = 0.12;
                this.pulseState = null;
            }
        }

        if (this.rangeCircleFade) {
            this.rangeCircleFade.elapsed += delta;
            const progress = Math.min(this.rangeCircleFade.elapsed / 0.15, 1); // 150ms fade-in
            const mat = this.placementRangeCircle!.material as THREE.MeshBasicMaterial;
            mat.opacity = progress * 0.4;
            if (progress >= 1) this.rangeCircleFade = null;
        }
    }

    /** Spawn expanding ring animation at world position — called on tower place. */
    public spawnPlacementRing(worldPos: THREE.Vector3, color: number): void {
        const geometry = new THREE.RingGeometry(0.1, 0.3, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(worldPos.x, 0.3, worldPos.z);
        this.scene.add(ring);

        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > 0.3) {
                this.scene.remove(ring);
                ring.geometry.dispose();
                material.dispose();
                return;
            }
            const progress = elapsed / 0.3;
            const scale = 1 + progress * (3 - 1);
            ring.scale.set(scale, scale, scale);
            material.opacity = 0.8 * (1 - progress);
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}
