import { Position } from "../Position";

export enum TeleportState {
    INACTIVE = 'inactive',
    WAITING_FIRST = 'waiting_first',
    WAITING_SECOND = 'waiting_second',
    COMPLETED = 'completed'
}

export class TeleportModeState {
    private state: TeleportState = TeleportState.INACTIVE;
    private first: Position | null = null;
    private second: Position | null = null;

    getState(): TeleportState {
        return this.state;
    }

    activate(): boolean {
        if (this.state !== TeleportState.INACTIVE) {
            return false;
        }
        this.state = TeleportState.WAITING_FIRST;
        this.first = this.second = null;
        return true;
    }

    selectFirst(pos: Position): boolean {
        if (this.state !== TeleportState.WAITING_FIRST) {
            return false;
        }
        this.first = pos;
        this.state = TeleportState.WAITING_SECOND;
        return true;
    }

    selectSecond(pos: Position): boolean {
        if (this.state !== TeleportState.WAITING_SECOND) {
            return false;
        }
        this.second = pos;
        this.state = TeleportState.COMPLETED;
        return true;
    }

    isReady(): boolean {
        return this.state === TeleportState.COMPLETED &&
            this.first !== null && this.second !== null;
    }

    getSelection(): { first: Position; second: Position } | null {
        return this.isReady() ? { first: this.first!, second: this.second! } : null;
    }

    getFirstTile(): Position {
        return this.first;
    }

    reset(): void {
        this.state = TeleportState.INACTIVE;
        this.first = this.second = null;
    }
}
