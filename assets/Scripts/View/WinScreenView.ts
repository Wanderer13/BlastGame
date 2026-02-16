const { ccclass, property } = cc._decorator;

@ccclass
export class WinScreenView extends cc.Component {
    @property({ type: cc.Label, displayName: "Score Label" })
    scoreLabel: cc.Label = null!;

    @property({ type: cc.Button, displayName: "Play Again Button" })
    playAgainButton: cc.Button = null!;

    private onPlayAgainCallback: (() => void) | null = null;

    onLoad() {
        if (this.playAgainButton) {
            this.playAgainButton.node.on(cc.Node.EventType.TOUCH_END, this.onPlayAgainClicked, this);
        }
    }

    show(score: number): void {
        this.scoreLabel.string = score.toString();
        this.node.active = true;
    }

    hide(): void {
        this.node.active = false;
    }

    setOnPlayAgain(callback: () => void): void {
        this.onPlayAgainCallback = callback;
    }

    private onPlayAgainClicked(): void {
        this.onPlayAgainCallback?.();
    }

    onDestroy() {
        if (this.playAgainButton) {
            this.playAgainButton.node.off(cc.Node.EventType.TOUCH_END, this.onPlayAgainClicked, this);
        }
    }
}
