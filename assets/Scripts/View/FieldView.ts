import { Board } from "../Core/Board";
import { TeleportModeState, TeleportState } from "../Core/Boosters/TeleportModeState";
import { Position } from "../Core/Position";
import { Tile } from "../Core/Tile";
import { TileMovement } from "../Core/TileMovement";
import { TileWithPos } from "../Core/TileWithPos";
import { FieldEvents } from "../Game/FieldEvents";
import { TeleportModeRenderer } from "./Boosters/TeleportModeRenderer";
import { TileView } from "./TileView";

const { ccclass, property } = cc._decorator;

@ccclass
export class FieldView extends cc.Component {
    @property({ type: cc.Prefab, displayName: "Tile Prefab" })
    tilePrefab: cc.Prefab = null!;

    @property({ type: cc.Node, displayName: "Tiles Container" })
    tilesContainer: cc.Node = null!;

    @property({ type: TeleportModeRenderer, displayName: "Teleport Renderer" })
    teleportRenderer: TeleportModeRenderer = null!;

    private tileViews: TileView[][] = [];
    private board: Board | null = null;
    private events: FieldEvents | null = null;
    private isProcessing: boolean = false;
    private _isBlocked: boolean = false;

    private bombModeActive: boolean = false;
    private teleportModeActive: boolean = false;
    private teleportModeState: TeleportModeState | null = null;

    isBlocked(): boolean {
        return this._isBlocked;
    }

    initialize(board: Board, events: FieldEvents): void {
        this.board = board;
        this.events = events;
        this.tileViews = Array.from({ length: board.rows }, () => []);

        if (this.teleportRenderer) {
            this.teleportRenderer.initialize(board.rows, board.cols, this.node.width / board.cols);
        }

        this.renderBoard();
    }

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_END, (event) => {
            event.stopPropagation();
        }, this);
    }

    onDestroy() {
        for (let row = 0; row < this.tileViews.length; row++) {
            for (let col = 0; col < (this.tileViews[row]?.length || 0); col++) {
                const tv = this.tileViews[row]?.[col];
                if (tv) {
                    tv.node.off(cc.Node.EventType.TOUCH_END, this.onTileClickDynamic, this);
                }
            }
        }
    }

    renderBoard(): void {
        this.clearAllTiles();

        const gridState = this.board!.getGridState();
        for (let row = 0; row < this.board!.rows; row++) {
            for (let col = 0; col < this.board!.cols; col++) {
                const tile = gridState[row][col];
                if (tile) {
                    this.createTileView(tile, { row, col });
                }
            }
        }
    }

    private createTileView(tile: Tile, pos: Position): TileView {
        if (!tile) {
            cc.error(`Cannot create view for null tile at [${pos.row},${pos.col}]`);
            return null!;
        }

        const tileNode = cc.instantiate(this.tilePrefab);
        tileNode.parent = this.tilesContainer;
        tileNode.name = `Tile_${pos.row}_${pos.col}`;
        tileNode.active = true;

        const cellSize = this.node.width / this.board!.cols;
        const tileSizeRatio = 0.1;
        const tileSize = cellSize * tileSizeRatio;

        tileNode.setContentSize(cc.size(tileSize, tileSize));
        tileNode.setAnchorPoint(cc.v2(0.5, 0.5));

        const halfWidth = this.node.width / 2;
        const halfHeight = this.node.height / 2;
        const x = -halfWidth + cellSize / 2 + pos.col * cellSize;
        const y = halfHeight - cellSize / 2 - pos.row * cellSize;

        tileNode.setPosition(x, y);
        tileNode.scale = 1.0;

        const tileView = tileNode.getComponent(TileView);
        if (!tileView) {
            cc.error(`Tile prefab missing TileView component at [${pos.row},${pos.col}]`);
            tileNode.destroy();
            return null!;
        }
        tileView.initialize(tile, pos);

        if (!this.tileViews[pos.row]) {
            this.tileViews[pos.row] = Array(this.board!.cols).fill(undefined);
        }
        this.tileViews[pos.row][pos.col] = tileView;

        this.setupClickHandler(tileView);

        return tileView;
    }

    private setupClickHandler(tileView: TileView): void {
        tileView.node.off(cc.Node.EventType.TOUCH_END, this.onTileClickDynamic, this);
        tileView.node.on(cc.Node.EventType.TOUCH_END, this.onTileClickDynamic, this);
    }

    private onTileClickDynamic(event: cc.Event.EventTouch): void {
        event.stopPropagation();

        if (this.isProcessing || this._isBlocked || !this.board) {
            return;
        }

        let clickedPos: Position | null = null;

        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                const tileView = this.tileViews[row]?.[col];
                if (tileView && tileView.node === event.target) {
                    clickedPos = { row, col };
                    break;
                }
            }
            if (clickedPos) {
                break;
            }
        }

        if (!clickedPos) {
            cc.warn("Clicked node not found in tileViews grid");
            return;
        }

        if (this.bombModeActive) {
            this.handleBombModeClick(clickedPos);
            return;
        }

        if (this.teleportModeActive && this.teleportModeState) {
            this.handleTeleportModeClick(clickedPos);
            return;
        }

        const tile = this.board.getTile(clickedPos);
        if (tile && this.events) {
            this.events.onTileClicked(clickedPos);
        }
    }

    animateExplosion(positions: Position[], onComplete?: Function): void {
        if (this._isBlocked || this.isProcessing) {
            onComplete?.();
            return;
        }

        if (positions.length === 0) {
            onComplete?.();
            return;
        }

        this.isProcessing = true;
        let completedCount = 0;

        const tileViewsToExplode: TileView[] = [];
        positions.forEach(pos => {
            const tileView = this.tileViews[pos.row]?.[pos.col];
            if (tileView) {
                this.tileViews[pos.row][pos.col] = undefined;
                tileViewsToExplode.push(tileView);
            }
        });

        const onTileExploded = () => {
            completedCount++;
            if (completedCount === tileViewsToExplode.length) {
                this.isProcessing = false;
                this.events?.onExplosionComplete();
                onComplete?.();
            }
        };

        tileViewsToExplode.forEach(tv => tv.animateExplosion(onTileExploded));
    }

    animateGravity(
        movements: TileMovement[],
        newTiles: TileWithPos[],
        onComplete?: Function
    ): void {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        const animations: Promise<void>[] = [];

        movements.forEach(movement => {
            const tileView = this.tileViews[movement.from.row]?.[movement.from.col];
            if (tileView) {
                this.tileViews[movement.from.row][movement.from.col] = undefined;
                this.tileViews[movement.to.row][movement.to.col] = tileView;

                tileView.updatePosition(movement.to);

                const promise = new Promise<void>(resolve => {
                    const cellSize = this.node.width / this.board!.cols;
                    const halfHeight = this.node.height / 2;
                    const targetY = halfHeight - cellSize / 2 - movement.to.row * cellSize;

                    const seq = cc.sequence(
                        cc.moveTo(0.3, tileView.node.x, targetY),
                        cc.callFunc(() => resolve())
                    );
                    tileView.node.stopAllActions();
                    tileView.node.runAction(seq);
                });
                animations.push(promise);
            }
        });

        newTiles.forEach(({ pos, tile }) => {
            const tileView = this.createTileView(tile, pos);

            const promise = new Promise<void>(resolve => {
                const cellSize = this.node.width / this.board!.cols;
                const halfHeight = this.node.height / 2;
                const targetY = halfHeight - cellSize / 2 - pos.row * cellSize;

                tileView.node.y = targetY + 400;
                tileView.node.opacity = 0;
                tileView.node.active = true;

                const seq = cc.sequence(
                    cc.spawn(
                        cc.moveTo(0.4, tileView.node.x, targetY),
                        cc.fadeIn(0.4)
                    ),
                    cc.callFunc(() => resolve())
                );
                tileView.node.runAction(seq);
            });
            animations.push(promise);
        });

        if (animations.length === 0) {
            this.isProcessing = false;
            this.events?.onTileDropped();
            onComplete?.();
            return;
        }

        Promise.all(animations).then(() => {
            this.isProcessing = false;
            this.events?.onTileDropped();
            onComplete?.();
        });
    }

    highlightGroup(positions: Position[], isHighlighted: boolean): void {
        positions.forEach(pos => {
            const tileView = this.tileViews[pos.row]?.[pos.col];
            if (tileView) {
                tileView.highlight(isHighlighted);
            }
        });
    }

    private clearAllTiles(): void {
        for (let i = this.tilesContainer.childrenCount - 1; i >= 0; i--) {
            this.tilesContainer.children[i].destroy();
        }
        this.tilesContainer.removeAllChildren();

        this.tileViews = Array.from({ length: this.board!.rows }, () =>
            Array(this.board!.cols).fill(undefined)
        );
    }

    isBusy(): boolean {
        return this.isProcessing;
    }

    blockInput(): void {
        this._isBlocked = true;
        this.node.opacity = 150;
    }

    unblockInput(): void {
        this._isBlocked = false;
        this.node.opacity = 255;
    }

    enterBombMode(): void {
        if (this._isBlocked || this.isProcessing) {
            return;
        }

        this.bombModeActive = true;
        this.teleportModeActive = false;

        this.node.color = cc.Color.YELLOW;
        this.node.opacity = 200;
    }

    exitBombMode(): void {
        this.bombModeActive = false;

        this.node.color = cc.Color.WHITE;
        this.node.opacity = 255;
    }

    enterTeleportMode(state: TeleportModeState): void {
        if (this._isBlocked || this.isProcessing) {
            return;
        }

        this.teleportModeActive = true;
        this.bombModeActive = false;
        this.teleportModeState = state;

        this.node.color = cc.Color.CYAN;
        this.node.opacity = 200;

        if (this.teleportRenderer) {
            this.teleportRenderer.node.active = true;
        }
    }

    exitTeleportMode(): void {
        this.teleportModeActive = false;

        if (this.teleportModeState) {
            this.teleportModeState.reset();
            this.teleportModeState = null;
        }

        this.node.color = cc.Color.WHITE;
        this.node.opacity = 255;

        if (this.teleportRenderer) {
            this.teleportRenderer.hide();
        }
    }

    private handleBombModeClick(pos: Position): void {
        this.exitBombMode();

        if (this.events?.onBombPlaced) {
            this.events.onBombPlaced(pos);
        }
    }

    private handleTeleportModeClick(pos: Position): void {
        if (!this.teleportModeState || !this.teleportRenderer) {
            return;
        }

        const currentState = this.teleportModeState.getState();

        if (currentState === TeleportState.WAITING_FIRST) {
            if (this.teleportModeState.selectFirst(pos)) {
                this.teleportRenderer.highlightSelection(pos, null);
            }
        }
        else if (currentState === TeleportState.WAITING_SECOND) {
            const firstTile = this.teleportModeState.getFirstTile();
            if (!firstTile) {
                cc.warn("No first tile found in WAITING_SECOND state");
                return;
            }

            if (!this.teleportModeState.selectSecond(pos)) {
                cc.warn("Failed to select second tile");
                return;
            }

            const selection = this.teleportModeState.getSelection();
            if (!selection) {
                cc.warn("No selection after second tile");
                return;
            }

            this.teleportRenderer.highlightSelection(selection.first, selection.second);

            if (this.events?.onTeleportReady) {
                this.events.onTeleportReady(selection);
            }

            this.scheduleOnce(() => {
                this.exitTeleportMode();
            }, 0.3);
        }
    }

    animateBombExplosion(positions: Position[], onComplete?: Function): void {
        if (this._isBlocked || this.isProcessing) {
            onComplete?.();
            return;
        }

        if (positions.length === 0) {
            onComplete?.();
            return;
        }

        this.isProcessing = true;
        let completedCount = 0;

        const tileViewsToExplode: TileView[] = [];
        positions.forEach(pos => {
            const tileView = this.tileViews[pos.row]?.[pos.col];
            if (tileView) {
                this.tileViews[pos.row][pos.col] = undefined;
                tileViewsToExplode.push(tileView);
            }
        });

        const onTileExploded = () => {
            completedCount++;
            if (completedCount === tileViewsToExplode.length) {
                this.isProcessing = false;
                onComplete?.();
            }
        };

        tileViewsToExplode.forEach((tv, idx) => {
            const delay = idx * 0.03;
            tv.node.runAction(cc.sequence(
                cc.delayTime(delay),
                cc.spawn(
                    cc.scaleTo(0.2, 1.5),
                    cc.fadeOut(0.2)
                ),
                cc.callFunc(() => {
                    tv.clear();
                    onTileExploded();
                })
            ));
        });
    }

    animateTileSwap(pos1: Position, pos2: Position, onComplete?: Function): void {
        if (this._isBlocked || this.isProcessing) {
            onComplete?.();
            return;
        }

        const tileView1 = this.tileViews[pos1.row]?.[pos1.col];
        const tileView2 = this.tileViews[pos2.row]?.[pos2.col];

        if (!tileView1 || !tileView2) {
            onComplete?.();
            return;
        }

        this.isProcessing = true;

        const cellSize = this.node.width / this.board!.cols;
        const halfWidth = this.node.width / 2;
        const halfHeight = this.node.height / 2;

        const targetPos1 = {
            x: -halfWidth + cellSize / 2 + pos1.col * cellSize,
            y: halfHeight - cellSize / 2 - pos1.row * cellSize
        };

        const targetPos2 = {
            x: -halfWidth + cellSize / 2 + pos2.col * cellSize,
            y: halfHeight - cellSize / 2 - pos2.row * cellSize
        };

        this.tileViews[pos1.row][pos1.col] = tileView2;
        this.tileViews[pos2.row][pos2.col] = tileView1;

        tileView1.updatePosition(pos2);
        tileView2.updatePosition(pos1);

        const duration = 0.3;

        const seq1 = cc.sequence(
            cc.moveTo(duration, targetPos2.x, targetPos2.y),
            cc.callFunc(() => {
                if (onComplete) onComplete();
            })
        );

        const seq2 = cc.sequence(
            cc.moveTo(duration, targetPos1.x, targetPos1.y),
            cc.callFunc(() => { })
        );

        tileView1.node.stopAllActions();
        tileView2.node.stopAllActions();

        tileView1.node.runAction(seq1);
        tileView2.node.runAction(seq2);

        this.scheduleOnce(() => {
            this.isProcessing = false;
        }, duration);
    }

    isBombModeActive(): boolean {
        return this.bombModeActive;
    }

    isTeleportModeActive(): boolean {
        return this.teleportModeActive;
    }
}
