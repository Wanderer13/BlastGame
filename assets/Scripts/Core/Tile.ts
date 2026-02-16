import { TileColor } from "./TileColor";

export class Tile {
    constructor(
        public readonly color: TileColor,
    ) { }

    static createRandom(): Tile {
        const colors = Object.values(TileColor);
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        return new Tile(randomColor as TileColor);
    }

    equals(other: Tile): boolean {
        return this.color === other.color;
    }
}
