import { Position } from "../Position";

export class TeleportBooster {
    isValidSwap(pos1: Position, pos2: Position, rows: number, cols: number): boolean {
        return !(pos1.row === pos2.row && pos1.col === pos2.col) &&
            pos1.row >= 0 && pos1.row < rows && pos1.col >= 0 && pos1.col < cols &&
            pos2.row >= 0 && pos2.row < rows && pos2.col >= 0 && pos2.col < cols;
    }
}
