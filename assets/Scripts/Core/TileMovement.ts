import { Position } from "./Position";
import { Tile } from "./Tile";

export interface TileMovement {
    tile: Tile;
    from: Position;
    to: Position;
}
