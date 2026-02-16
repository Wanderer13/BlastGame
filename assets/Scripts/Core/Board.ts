import { Position } from "./Position";
import { Tile } from "./Tile";
import { TileMovement } from "./TileMovement";

export class Board {
    private grid: (Tile | null)[][];
    readonly rows: number;
    readonly cols: number;

    constructor(rows: number, cols: number, initialGrid?: (Tile | null)[][]) {
        this.rows = rows;
        this.cols = cols;
        if (initialGrid) {
            this.grid = initialGrid.map(row => [...row]);
        } else {
            this.grid = Array.from({ length: rows }, () =>
                Array(cols).fill(null)
            );
        }
    }

    getTile(pos: Position): Tile | null {
        if (this.isValidPosition(pos)) {
            return this.grid[pos.row][pos.col];
        }
        return null;
    }

    setTile(pos: Position, tile: Tile | null): void {
        if (this.isValidPosition(pos)) {
            this.grid[pos.row][pos.col] = tile;
        }
    }

    getConnectedGroup(startPos: Position): Position[] {
        const startTile = this.getTile(startPos);
        if (!startTile || startPos.row < 0 || startPos.col < 0) return [];

        const visited = Array.from({ length: this.rows }, () =>
            Array(this.cols).fill(false)
        );

        const group: Position[] = [];
        const queue: Position[] = [startPos];

        visited[startPos.row][startPos.col] = true;

        while (queue.length > 0) {
            const current = queue.shift()!;
            group.push(current);

            const neighbors: Position[] = [
                { row: current.row - 1, col: current.col },
                { row: current.row + 1, col: current.col },
                { row: current.row, col: current.col - 1 },
                { row: current.row, col: current.col + 1 }
            ];

            for (const nb of neighbors) {
                if (this.isValidPosition(nb) &&
                    !visited[nb.row][nb.col] &&
                    this.getTile(nb)?.equals(startTile)
                ) {
                    visited[nb.row][nb.col] = true;
                    queue.push(nb);
                }
            }
        }

        let result = group.length >= 2 ? group : [];
        return result;
    }

    processExplosion(positions: Position[]): {
        removedPositions: Position[];
        movements: TileMovement[];
        emptyPositions: Position[]
    } {
        const removedPositions = [...positions];

        const affectedColumns = new Set<number>();
        positions.forEach(pos => {
            this.setTile(pos, null);
            affectedColumns.add(pos.col);
        });

        const movements: TileMovement[] = [];
        const emptyPositions: Position[] = [];

        affectedColumns.forEach(col => {
            const columnTiles: { tile: Tile; originalRow: number }[] = [];
            for (let row = this.rows - 1; row >= 0; row--) {
                const tile = this.grid[row][col];
                if (tile) {
                    columnTiles.push({ tile, originalRow: row });
                }
            }

            let filledCount = 0;
            for (let row = this.rows - 1; row >= 0; row--) {
                if (filledCount < columnTiles.length) {
                    const { tile, originalRow } = columnTiles[filledCount];
                    if (originalRow !== row) {
                        movements.push({
                            tile,
                            from: { row: originalRow, col },
                            to: { row, col }
                        });
                    }
                    this.grid[row][col] = tile;
                    filledCount++;
                } else {
                    this.grid[row][col] = null;
                    emptyPositions.push({ row, col });
                }
            }
        });

        return { removedPositions, movements, emptyPositions };
    }

    hasValidMove(): boolean {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.grid[row][col];
                if (tile && this.getConnectedGroup({ row, col }).length >= 2) {
                    return true;
                }
            }
        }
        return false;
    }

    private isValidPosition(pos: Position): boolean {
        return pos.row >= 0 && pos.row < this.rows &&
            pos.col >= 0 && pos.col < this.cols;
    }

    getGridState(): (Tile | null)[][] {
        return this.grid.map(row => [...row]);
    }
}
