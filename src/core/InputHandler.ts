import * as THREE from 'three';
import { TILE_SIZE, GRID_COLS, GRID_ROWS } from '../constants';

export class InputHandler {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private camera: THREE.Camera;
    private domElement: HTMLElement;
    
    public onGridClick: ((x: number, y: number) => void) | null = null;
    public onGridHover: ((x: number, y: number) => void) | null = null;

    constructor(camera: THREE.Camera, domElement: HTMLElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    private onMouseMove(event: MouseEvent): void {
        this.updateMousePos(event);
        const gridPos = this.getGridPosition();
        if (gridPos && this.onGridHover) {
            this.onGridHover(gridPos.x, gridPos.y);
        }
    }

    private onClick(event: MouseEvent): void {
        this.updateMousePos(event);
        const gridPos = this.getGridPosition();
        if (gridPos && this.onGridClick) {
            this.onGridClick(gridPos.x, gridPos.y);
        }
    }

    private updateMousePos(event: MouseEvent): void {
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    private getGridPosition(): { x: number, y: number } | null {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Raycast against a flat plane at y=0
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        
        if (this.raycaster.ray.intersectPlane(plane, intersectPoint)) {
            const x = Math.floor(intersectPoint.x / TILE_SIZE + GRID_COLS / 2);
            const y = Math.floor(intersectPoint.z / TILE_SIZE + GRID_ROWS / 2);
            
            if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS) {
                return { x, y };
            }
        }
        
        return null;
    }

    private onKeyDown(_event: KeyboardEvent): void {
        // Space to pause, ESC for menu, 1-5 for towers handled in Game.ts
    }
}
