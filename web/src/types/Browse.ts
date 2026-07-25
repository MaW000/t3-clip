/**
 * The four windows the browse page ranks liked moments over. `sec` reads the
 * `second` column, the other three are named after their own column.
 */
export type TimeRange = "sec" | "minute" | "day" | "week";

export type SetTimeFunction = (time: TimeRange) => void;
