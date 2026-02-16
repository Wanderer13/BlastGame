import { Position } from "../Core/Position";

export interface FieldEvents {
    onTileClicked: (pos: Position) => void;
    onExplosionComplete: () => void;
    onTileDropped: () => void;

    onBombPlaced?: (pos: Position) => void;
    onTeleportReady?: (selection: { first: Position; second: Position }) => void;
}
