const { ccclass, property } = cc._decorator;

@ccclass
export class LoseScreenView extends cc.Component {
    @property({ type: cc.Label, displayName: "Score Label" })
    scoreLabel: cc.Label = null!;

    @property({ type: cc.Button, displayName: "Retry Button" })
    retryButton: cc.Button = null!;

    private onRetryCallback: (() => void) | null = null;

    onLoad() {
        if (this.retryButton) {
            this.retryButton.node.on(cc.Node.EventType.TOUCH_END, this.onRetryClicked, this);
        }
    }

    show(score: number): void {
        this.scoreLabel.string = score.toString();
        this.node.active = true;
    }

    hide(): void {
        this.node.active = false;
    }

    setOnRetry(callback: () => void): void {
        this.onRetryCallback = callback;
    }

    private onRetryClicked(): void {
        this.onRetryCallback?.();
    }

    onDestroy() {
        if (this.retryButton) {
            this.retryButton.node.off(cc.Node.EventType.TOUCH_END, this.onRetryClicked, this);
        }
    }
}
