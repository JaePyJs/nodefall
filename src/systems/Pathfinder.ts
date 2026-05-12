import type { Position } from '../types';

interface Node {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent: Node | null;
}

export class Pathfinder {
    public findPath(grid: number[][], start: Position, end: Position): Position[] | null {
        const openList: Node[] = [];
        const closedList: Set<string> = new Set();

        const startNode: Node = {
            x: start.x,
            y: start.y,
            g: 0,
            h: this.heuristic(start, end),
            f: 0,
            parent: null
        };
        startNode.f = startNode.g + startNode.h;
        openList.push(startNode);

        while (openList.length > 0) {
            openList.sort((a, b) => a.f - b.f);
            const currentNode = openList.shift()!;

            if (currentNode.x === end.x && currentNode.y === end.y) {
                return this.reconstructPath(currentNode);
            }

            closedList.add(`${currentNode.x},${currentNode.y}`);

            const neighbors = this.getNeighbors(currentNode, grid);
            for (const neighbor of neighbors) {
                if (closedList.has(`${neighbor.x},${neighbor.y}`)) continue;

                // 0: BUILDABLE, 1: PATH, 2: START, 3: END, 4: BLOCKED, 5: TOWER
                const cellType = grid[neighbor.y][neighbor.x];
                
                // PATH, START, END have cost 1. BUILDABLE has cost 100 to discourage taking shortcuts.
                const movementCost = (cellType === 1 || cellType === 2 || cellType === 3) ? 1 : 100;
                const gScore = currentNode.g + movementCost;
                
                let neighborNode = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);

                if (!neighborNode) {
                    neighborNode = {
                        x: neighbor.x,
                        y: neighbor.y,
                        g: gScore,
                        h: this.heuristic(neighbor, end),
                        f: 0,
                        parent: currentNode
                    };
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openList.push(neighborNode);
                } else if (gScore < neighborNode.g) {
                    neighborNode.g = gScore;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    neighborNode.parent = currentNode;
                }
            }
        }

        return null;
    }

    private heuristic(a: Position, b: Position): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    private getNeighbors(node: Node, grid: number[][]): Position[] {
        const neighbors: Position[] = [];
        const dirs = [
            { x: 0, y: 1 }, { x: 0, y: -1 },
            { x: 1, y: 0 }, { x: -1, y: 0 }
        ];

        for (const dir of dirs) {
            const nx = node.x + dir.x;
            const ny = node.y + dir.y;

            if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
                const cellType = grid[ny][nx];
                // BLOCKED and TOWER are impassable
                if (cellType !== 4 && cellType !== 5) {
                    neighbors.push({ x: nx, y: ny });
                }
            }
        }

        return neighbors;
    }

    private reconstructPath(node: Node): Position[] {
        const path: Position[] = [];
        let curr: Node | null = node;
        while (curr) {
            path.push({ x: curr.x, y: curr.y });
            curr = curr.parent;
        }
        return path.reverse();
    }
}
