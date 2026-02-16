import { Position } from "../../Core/Position";

const { ccclass, property } = cc._decorator;

@ccclass
export class TeleportModeRenderer extends cc.Component {
    private graphics: cc.Graphics | null = null;
    private cellSize: number = 80;

    initialize(rows: number, cols: number, cellSize: number): void {
        this.cellSize = cellSize;
        this.createGraphics();
    }

    private createGraphics(): void {
        const node = new cc.Node('TeleportPreview');
        node.parent = this.node;
        node.zIndex = 999;
        this.graphics = node.addComponent(cc.Graphics);
        this.graphics.node.active = false;
    }

    highlightSelection(first: Position, second: Position | null): void {
        if (!this.graphics) return;
        this.graphics.clear();
        this.graphics.node.active = true;

        this.drawHighlight(first, cc.Color.YELLOW, 1);

        if (second) {
            this.drawHighlight(second, cc.Color.GREEN, 2);
            this.drawArrow(first, second);
        }
    }

    private drawHighlight(pos: Position, color: cc.Color, label: number): void {
        const { x, y } = this.getTilePosition(pos);
        this.graphics!.fillColor = color;
        this.graphics!.strokeColor = cc.Color.BLACK;
        this.graphics!.lineWidth = 3;
        this.graphics!.rect(x - this.cellSize / 2 + 2, y - this.cellSize / 2 + 2, this.cellSize - 4, this.cellSize - 4);
        this.graphics!.fill();
        this.graphics!.stroke();

        const labelNode = new cc.Node();
        labelNode.addComponent(cc.Label);
        const lbl = labelNode.getComponent(cc.Label)!;
        lbl.string = label.toString();
        lbl.fontSize = 40;
        lbl.node.parent = this.graphics!.node;
        lbl.node.setPosition(cc.v2(x, y));
        lbl.node.color = cc.Color.BLACK;
    }

    private drawArrow(from: Position, to: Position): void {
        const fromPos = this.getTilePosition(from);
        const toPos = this.getTilePosition(to);
        this.graphics!.strokeColor = cc.Color.WHITE;
        this.graphics!.lineWidth = 8;
        this.graphics!.moveTo(fromPos.x, fromPos.y);
        this.graphics!.lineTo(toPos.x, toPos.y);
        this.graphics!.stroke();
    }

    private getTilePosition(pos: Position): { x: number; y: number } {
        const hw = this.node.width / 2, hh = this.node.height / 2;
        return {
            x: -hw + this.cellSize / 2 + pos.col * this.cellSize,
            y: hh - this.cellSize / 2 - pos.row * this.cellSize
        };
    }

    hide(): void {
        if (this.graphics) {
            this.graphics.clear();
            this.graphics.node.active = false;
        }
    }
}
