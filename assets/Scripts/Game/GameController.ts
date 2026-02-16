import { Board } from "../Core/Board";
import { BombBooster } from "../Core/Boosters/BombBooster";
import { TeleportBooster } from "../Core/Boosters/TeleportBooster";
import { TeleportModeState, TeleportState } from "../Core/Boosters/TeleportModeState";
import { GameConfig } from "../Core/GameConfig";
import { GameRules } from "../Core/GameRules";
import { Position } from "../Core/Position";
import { Tile } from "../Core/Tile";
import { TileWithPos } from "../Core/TileWithPos";
import { BombBoosterPanelView } from "../View/Boosters/BombBoosterPanelView";
import { TeleportBoosterPanelView } from "../View/Boosters/TeleportBoosterPanelView";
import { TeleportModeRenderer } from "../View/Boosters/TeleportModeRenderer";
import { FieldView } from "../View/FieldView";
import { LoseScreenView } from "../View/LoseScreenView";
import { UIManager } from "../View/UIManager";
import { WinScreenView } from "../View/WinScreenView";
import { FieldEvents } from "./FieldEvents";

const { ccclass, property } = cc._decorator;

@ccclass
export class GameController extends cc.Component {

    @property({ type: cc.Integer, displayName: "Rows", min: 4, max: 12 })
    rows: number = 8;

    @property({ type: cc.Integer, displayName: "Columns", min: 4, max: 12 })
    cols: number = 8;

    @property({ type: cc.Integer, displayName: "Target Score", min: 50, max: 500 })
    targetScore: number = 200;

    @property({ type: cc.Integer, displayName: "Max Moves", min: 5, max: 50 })
    maxMoves: number = 20;

    @property({ type: FieldView, displayName: "Field View" })
    fieldView: FieldView = null!;

    @property({ type: UIManager, displayName: "UI Manager" })
    uiManager: UIManager = null!;

    @property({ type: WinScreenView, displayName: "Win Screen View" })
    winScreenView: WinScreenView = null!;

    @property({ type: LoseScreenView, displayName: "Lose Screen View" })
    loseScreenView: LoseScreenView = null!;

    @property({ type: cc.Integer, displayName: "Bomb Booster" })
    bombBoosterCount: number = 3;

    @property({ type: cc.Integer, displayName: "Teleport Booster" })
    teleportBoosterCount: number = 3;

    @property({ type: BombBoosterPanelView })
    bombBoosterPanel: BombBoosterPanelView = null!;

    @property({ type: TeleportBoosterPanelView })
    teleportBoosterPanel: TeleportBoosterPanelView = null!;

    @property({ type: TeleportModeRenderer })
    teleportModeRenderer: TeleportModeRenderer = null!;

    private board: Board | null = null;
    private gameRules: GameRules | null = null;
    private selectedGroup: Position[] = [];
    private isProcessingAction: boolean = false;

    private bombBooster: BombBooster = new BombBooster(1);
    private teleportBooster: TeleportBooster = new TeleportBooster();
    private teleportModeState: TeleportModeState = new TeleportModeState();

    private bombCount: number = 0;
    private teleportCount: number = 0;

    onLoad() {
        this.initializeGame();
    }

    private initializeGame(): void {

        this.winScreenView.hide();
        this.loseScreenView.hide();
        this.fieldView.unblockInput();

        this.bombCount = this.bombBoosterCount;
        this.teleportCount = this.teleportBoosterCount;

        this.setBoostersInteractable(false);

        const config: GameConfig = {
            rows: this.rows,
            cols: this.cols,
            targetScore: this.targetScore,
            maxMoves: this.maxMoves,
            bombBoosterCount: this.bombBoosterCount,
            teleportBoosterCount: this.teleportBoosterCount,
        };

        this.board = new Board(this.rows, this.cols);
        this.gameRules = new GameRules(config);
        this.fillBoardRandomly();

        const fieldEvents: FieldEvents = {
            onTileClicked: this.onTileClicked.bind(this),
            onExplosionComplete: this.onExplosionComplete.bind(this),
            onTileDropped: this.onTileDropped.bind(this),
            onBombPlaced: this.onBombPlaced.bind(this),
            onTeleportReady: this.onTeleportReady.bind(this),
        };
        this.fieldView.initialize(this.board, fieldEvents);

        this.winScreenView.setOnPlayAgain(() => this.restartGame());
        this.loseScreenView.setOnRetry(() => this.restartGame());

        this.bombBoosterPanel.setOnUse(() => this.activateBombMode());
        this.teleportBoosterPanel.setOnUse(() => this.activateTeleportMode());

        this.updateUI();
        this.updateBoosterUI();
        this.setBoostersInteractable(true);
    }

    private fillBoardRandomly(): void {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = Tile.createRandom();
                this.board!.setTile({ row, col }, tile);
            }
        }

        if (!this.board!.hasValidMove()) {
            this.fillBoardRandomly();
        }
    }

    private onTileClicked(pos: Position): void {
        if (!this.board || !this.gameRules || this.fieldView.isBusy() || this.isProcessingAction) {
            return;
        }

        const group = this.board.getConnectedGroup(pos);
        if (group.length < 2) {
            return;
        }

        this.selectedGroup = group;
        this.fieldView.highlightGroup(group, true);

        this.fieldView.animateExplosion(group, () => {
            this.processExplosionLogic();
        });
    }

    private processExplosionLogic(): void {
        if (!this.board || !this.gameRules || this.selectedGroup.length === 0) {
            return;
        }

        this.gameRules.processValidExplosion(this.selectedGroup.length);

        const { movements, emptyPositions } = this.board.processExplosion(this.selectedGroup);
        this.selectedGroup = [];

        const newTiles: { pos: Position; tile: Tile }[] = [];
        emptyPositions.forEach(pos => {
            const newTile = Tile.createRandom();
            this.board!.setTile(pos, newTile);
            newTiles.push({ pos, tile: newTile });
        });

        this.updateUI();

        this.fieldView.animateGravity(movements, newTiles, () => {
            this.checkGameStateAfterAction();
        });
    }

    private onExplosionComplete(): void {
    }

    private onTileDropped(): void {
    }

    private checkGameStateAfterAction(): void {
        if (!this.gameRules || !this.board || this.fieldView.isBlocked()) {
            return;
        }

        if (this.gameRules.isWinCondition()) {
            this.fieldView.blockInput();
            this.winScreenView.show(this.gameRules.getScore());
            return;
        }

        if (this.gameRules.isLoseCondition(this.board.hasValidMove())) {
            this.fieldView.blockInput();
            this.loseScreenView.show(this.gameRules.getScore());
            return;
        }

        this.setBoostersInteractable(true);
    }

    private updateUI(): void {
        if (!this.gameRules || !this.uiManager) {
            return;
        }

        this.uiManager.updateScore(
            this.gameRules.getScore(),
            this.gameRules.getTargetScore()
        );
        this.uiManager.updateMoves(this.gameRules.getMovesLeft());
    }

    private updateBoosterUI(): void {
        this.bombBoosterPanel.updateCount(this.bombCount);
        this.teleportBoosterPanel.updateCount(this.teleportCount);
    }

    private restartGame(): void {
        this.winScreenView.hide();
        this.loseScreenView.hide();

        this.fieldView.unblockInput();
        this.fieldView.exitBombMode();
        this.fieldView.exitTeleportMode();

        this.teleportModeRenderer.hide();
        this.teleportModeState.reset();

        this.isProcessingAction = false;
        this.selectedGroup = [];

        this.gameRules.reset();

        this.initializeGame();
    }

    private activateBombMode(): void {
        if (this.fieldView.isBombModeActive?.() || this.fieldView.isTeleportModeActive?.()) {
            return;
        }

        if (this.isProcessingAction || this.fieldView.isBlocked() || this.bombCount <= 0) {
            return;
        }

        this.setBoostersInteractable(false);

        this.bombCount--;
        this.updateBoosterUI();

        this.fieldView.enterBombMode();
    }

    private onBombPlaced(pos: Position): void {
        if (!this.board || !this.gameRules || this.isProcessingAction) {
            return;
        }

        this.isProcessingAction = true;

        const explosionArea = this.bombBooster.getExplosionArea(
            pos,
            this.board.rows,
            this.board.cols
        );

        const validPositions = explosionArea.filter(p => this.board!.getTile(p) !== null);

        if (validPositions.length === 0) {
            this.gameRules.processValidExplosion(0);
            this.updateUI();
            this.isProcessingAction = false;
            this.checkGameStateAfterAction();
            this.setBoostersInteractable(true);
            return;
        }

        this.fieldView.animateBombExplosion(validPositions, () => {
            this.processBombExplosion(validPositions);
        });
    }

    private processBombExplosion(positions: Position[]): void {
        if (!this.board || !this.gameRules) {
            this.isProcessingAction = false;
            this.setBoostersInteractable(true);
            return;
        }

        const tileCount = positions.length;
        this.gameRules.processValidExplosion(tileCount);
        this.updateUI();

        const { movements, emptyPositions } = this.board.processExplosion(positions);

        const newTiles: TileWithPos[] = [];
        emptyPositions.forEach(p => {
            const newTile = Tile.createRandom();
            this.board!.setTile(p, newTile);
            newTiles.push({ pos: p, tile: newTile });
        });

        this.fieldView.animateGravity(movements, newTiles, () => {
            this.isProcessingAction = false;
            this.checkGameStateAfterAction();
            this.setBoostersInteractable(true);
        });
    }

    private activateTeleportMode(): void {
        if (this.fieldView.isTeleportModeActive?.() || this.fieldView.isBombModeActive?.()) {
            return;
        }

        if (this.isProcessingAction || this.fieldView.isBlocked() || this.teleportCount <= 0) {
            return;
        }

        this.setBoostersInteractable(false);

        this.teleportCount--;
        this.updateBoosterUI();

        this.teleportModeState = new TeleportModeState();
        this.teleportModeState.activate();

        this.fieldView.enterTeleportMode(this.teleportModeState!);
    }

    private executeTeleportSwap(pos1: Position, pos2: Position): void {
        if (!this.board || !this.gameRules || this.isProcessingAction) {
            this.setBoostersInteractable(true);
            return;
        }

        this.isProcessingAction = true;

        if (!this.teleportBooster.isValidSwap(pos1, pos2, this.board.rows, this.board.cols)) {
            this.isProcessingAction = false;
            this.setBoostersInteractable(true);
            return;
        }

        const tile1 = this.board.getTile(pos1);
        const tile2 = this.board.getTile(pos2);

        if (!tile1 || !tile2) {
            cc.warn("Cannot swap: one or both positions are empty");
            this.isProcessingAction = false;
            this.setBoostersInteractable(true);
            return;
        }

        this.board.setTile(pos1, tile2);
        this.board.setTile(pos2, tile1);

        this.fieldView.animateTileSwap(pos1, pos2, () => {
            this.gameRules!.processValidExplosion(0);
            this.updateUI();

            const group1 = this.board!.getConnectedGroup(pos1);
            const group2 = this.board!.getConnectedGroup(pos2);
            const hasValidGroup = group1.length >= 2 || group2.length >= 2;

            this.isProcessingAction = false;
            this.checkGameStateAfterAction();
            this.setBoostersInteractable(true);
        });
    }

    private onTeleportReady(selection: { first: Position; second: Position }): void {
        if (!this.board || !this.gameRules || this.isProcessingAction) {
            return;
        }

        this.scheduleOnce(() => {
            this.executeTeleportSwap(selection.first, selection.second);
        }, 0.2);
    }

    private setBoostersInteractable(interactable: boolean): void {
        const canUseBoosters = interactable &&
            !this.fieldView.isBlocked() &&
            !this.isProcessingAction;

        this.bombBoosterPanel.setInteractable(canUseBoosters);
        this.teleportBoosterPanel.setInteractable(canUseBoosters);
    }
}
