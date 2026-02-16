import { GameConfig } from "./GameConfig";

export class GameRules {
    private readonly config: GameConfig;

    private score: number = 0;
    private movesLeft: number = 0;

    private bombBoosterCount: number = 0;
    private teleportBoosterCount: number = 0;

    constructor(config: GameConfig) {
        this.config = config;
        this.movesLeft = config.maxMoves;

        this.bombBoosterCount = config.bombBoosterCount;
        this.teleportBoosterCount = config.teleportBoosterCount;
    }

    processValidExplosion(tileCount: number): void {
        this.score += tileCount;
        this.movesLeft--;
    }

    getScore(): number {
        return this.score;
    }

    getMovesLeft(): number {
        return this.movesLeft;
    }

    getTargetScore(): number {
        return this.config.targetScore;
    }

    isWinCondition(): boolean {
        return this.score >= this.config.targetScore;
    }

    isLoseCondition(hasValidMoves: boolean): boolean {
        return this.movesLeft <= 0 || !hasValidMoves;
    }

    reset(): void {
        this.score = 0;
        this.movesLeft = this.config.maxMoves;

        this.bombBoosterCount = this.config.bombBoosterCount;
        this.teleportBoosterCount = this.config.teleportBoosterCount;
    }
}
