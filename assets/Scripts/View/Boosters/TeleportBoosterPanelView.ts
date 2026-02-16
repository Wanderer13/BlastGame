const { ccclass, property } = cc._decorator;

@ccclass
export class TeleportBoosterPanelView extends cc.Component {
    @property({ type: cc.Button, displayName: "Teleport Button" })
    teleportButton: cc.Button = null!;

    @property({ type: cc.Label, displayName: "Teleport Count Label" })
    teleportCountLabel: cc.Label = null!;

    @property({ type: cc.Sprite, displayName: "Teleport Icon" })
    teleportIcon: cc.Sprite = null!;

    private onUseCallback: (() => void) | null = null;
    private teleportCount: number = 0;
    private _isInteractable: boolean = true;

    onLoad() {
        if (this.teleportButton) {
            this.teleportButton.node.on(cc.Node.EventType.TOUCH_END, this.onTeleportClicked, this);
        }
    }

    setInteractable(interactable: boolean): void {
        this._isInteractable = interactable;
        if (this.teleportButton) {
            this.teleportButton.interactable = interactable && this.teleportCount > 0;
        }
    }

    isInteractable(): boolean {
        return this._isInteractable;
    }

    updateCount(count: number): void {
        this.teleportCount = count;
        this.teleportCountLabel.string = count.toString();

        if (this.teleportButton) {
            this.teleportButton.interactable = this._isInteractable && count > 0;
        }
    }

    setOnUse(callback: () => void): void {
        this.onUseCallback = callback;
    }

    private onTeleportClicked(): void {
        if (this._isInteractable && this.teleportCount > 0) {
            this.onUseCallback?.();
        }
    }

    onDestroy() {
        if (this.teleportButton) {
            this.teleportButton.node.off(cc.Node.EventType.TOUCH_END, this.onTeleportClicked, this);
        }
    }
}
