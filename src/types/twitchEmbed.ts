export interface TwitchPlayer {
    play: () => void;
    pause: () => void;
    destroy: () => void;
    // Add any other properties or methods that you need
}
export type SetPlayerFn = (player: TwitchPlayer | null) => void;