import { Position } from "../Core/Position";
import { Tile } from "../Core/Tile";
import { TileColor } from "../Core/TileColor";

const { ccclass, property } = cc._decorator;

@ccclass
export class TileView extends cc.Component {
    @property({ type: cc.SpriteFrame, displayName: "Red Sprite" })
    spriteRed: cc.SpriteFrame = null!;

    @property({ type: cc.SpriteFrame, displayName: "Blue Sprite" })
    spriteBlue: cc.SpriteFrame = null!;

    @property({ type: cc.SpriteFrame, displayName: "Green Sprite" })
    spriteGreen: cc.SpriteFrame = null!;

    @property({ type: cc.SpriteFrame, displayName: "Yellow Sprite" })
    spriteYellow: cc.SpriteFrame = null!;

    @property({ type: cc.SpriteFrame, displayName: "Purple Sprite" })
    spritePurple: cc.SpriteFrame = null!;

    private sprite: cc.Sprite = null!;
    private tileData: Tile | null = null;
    private position: Position = { row: -1, col: -1 };

    onLoad() {
        this.sprite = this.getComponent(cc.Sprite)!;
    }

    initialize(tile: Tile, pos: Position): void {
        this.tileData = tile;
        this.position = pos;
        this.updateAppearance();
    }

    updatePosition(pos: Position): void {
        this.position = pos;
    }

    private updateAppearance(): void {
        if (!this.tileData) {
            return;
        }

        const spriteMap: { [key in TileColor]: cc.SpriteFrame | null } = {
            [TileColor.RED]: this.spriteRed,
            [TileColor.BLUE]: this.spriteBlue,
            [TileColor.GREEN]: this.spriteGreen,
            [TileColor.YELLOW]: this.spriteYellow,
            [TileColor.PURPLE]: this.spritePurple,
        };

        const frame = spriteMap[this.tileData.color];
        if (frame) {
            this.sprite.spriteFrame = frame;
        }
    }

    getPosition(): Position {
        return this.position;
    }

    getTile(): Tile | null {
        return this.tileData;
    }

    clear(): void {
        this.tileData = null;
        this.sprite.spriteFrame = null;
        this.node.active = false;
    }

    highlight(isHighlighted: boolean): void {
        if (!this.tileData) {
            return;
        }

        if (isHighlighted) {
            this.node.scale = 1.1;
            this.node.color = cc.Color.YELLOW;
        } else {
            this.node.scale = 1.0;
            this.node.color = cc.Color.WHITE;
        }
    }

    animateExplosion(callback?: Function): void {
        const seq = cc.sequence(
            cc.scaleTo(0.1, 1.3),
            cc.fadeOut(0.15),
            cc.callFunc(() => {
                this.clear();
                callback?.();
            })
        );
        this.resetAnimation();
        this.node.runAction(seq);
    }

    animateDrop(targetY: number, duration: number = 0.3, callback?: Function): void {
        this.node.y = targetY + 300;
        this.node.opacity = 0;
        this.node.active = true;

        const seq = cc.sequence(
            cc.spawn(
                cc.moveTo(duration, this.node.x, targetY),
                cc.fadeIn(duration)
            ),
            cc.callFunc(() => callback?.())
        );
        this.node.runAction(seq);
    }

    resetAnimation(): void {
        this.node.stopAllActions();
        this.node.scale = 1.0;
        this.node.color = cc.Color.WHITE;
        this.node.opacity = 255;
    }
}
