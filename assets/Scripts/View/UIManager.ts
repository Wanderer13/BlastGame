const { ccclass, property } = cc._decorator;

@ccclass
export class UIManager extends cc.Component {
    @property({ type: cc.Label, displayName: "Score Label" })
    scoreLabel: cc.Label = null!;

    @property({ type: cc.Label, displayName: "Target Label" })
    targetLabel: cc.Label = null!;

    @property({ type: cc.Label, displayName: "Moves Label" })
    movesLabel: cc.Label = null!;

    updateScore(current: number, target: number): void {
        this.scoreLabel.string = current.toString();
        this.targetLabel.string = target.toString();
    }

    updateMoves(movesLeft: number): void {
        this.movesLabel.string = movesLeft.toString();
    }
}
