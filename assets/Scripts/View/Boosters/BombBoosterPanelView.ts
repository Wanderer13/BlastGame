const { ccclass, property } = cc._decorator;

@ccclass
export class BombBoosterPanelView extends cc.Component {
    @property({ type: cc.Button, displayName: "Bomb Button" })
    bombButton: cc.Button = null!;

    @property({ type: cc.Label, displayName: "Bomb Count Label" })
    bombCountLabel: cc.Label = null!;

    @property({ type: cc.Sprite, displayName: "Bomb Icon" })
    bombIcon: cc.Sprite = null!;

    private onUseCallback: (() => void) | null = null;
    private bombCount: number = 0;
    private _isInteractable: boolean = true;

    onLoad() {
        if (this.bombButton) {
            this.bombButton.node.on(cc.Node.EventType.TOUCH_END, this.onBombClicked, this);
        }
    }

    setInteractable(interactable: boolean): void {
        this._isInteractable = interactable;
        if (this.bombButton) {
            this.bombButton.interactable = interactable && this.bombCount > 0;
        }
    }

    isInteractable(): boolean {
        return this._isInteractable;
    }

    updateCount(count: number): void {
        this.bombCount = count;
        this.bombCountLabel.string = count.toString();

        if (this.bombButton) {
            this.bombButton.interactable = this._isInteractable && count > 0;
        }
    }

    setOnUse(callback: () => void): void {
        this.onUseCallback = callback;
    }

    private onBombClicked(): void {
        if (this._isInteractable && this.bombCount > 0) {
            this.onUseCallback?.();
        }
    }

    onDestroy() {
        if (this.bombButton) {
            this.bombButton.node.off(cc.Node.EventType.TOUCH_END, this.onBombClicked, this);
        }
    }
}
