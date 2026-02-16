import { Position } from "../Position";

export class BombBooster {
    constructor(private readonly radius: number = 1) { }

    getExplosionArea(center: Position, rows: number, cols: number): Position[] {
        const positions: Position[] = [];
        for (let row = center.row - this.radius; row <= center.row + this.radius; row++) {
            for (let col = center.col - this.radius; col <= center.col + this.radius; col++) {
                const dist = Math.abs(row - center.row) + Math.abs(col - center.col);
                if (dist <= this.radius && row >= 0 && row < rows && col >= 0 && col < cols) {
                    positions.push({ row, col });
                }
            }
        }
        return positions;
    }
}
