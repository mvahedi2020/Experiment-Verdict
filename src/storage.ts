import { initial, parseState, type State } from "./domain";
export const KEY = "experiment-verdict:v1";
export type Reading = {
  readable: boolean;
  raw: string | null;
  state: State | null;
};
export function read(storage?: Pick<Storage, "getItem">): Reading {
  try {
    const raw = (storage ?? window.localStorage).getItem(KEY);
    return {
      readable: true,
      raw,
      state: raw === null ? initial() : parseState(raw),
    };
  } catch {
    return { readable: false, raw: null, state: null };
  }
}
export function matches(a: Reading, b: Reading) {
  return a.readable && b.readable && a.raw === b.raw;
}
export function commit(
  bound: Reading,
  next: State,
  storage?: Pick<Storage, "getItem" | "setItem">,
) {
  const current = read(storage);
  if (!matches(bound, current))
    return { kind: "conflict" as const, reading: current };
  try {
    const raw = JSON.stringify(next);
    (storage ?? window.localStorage).setItem(KEY, raw);
    return {
      kind: "saved" as const,
      reading: { readable: true, raw, state: next },
    };
  } catch {
    return { kind: "memory" as const, reading: current };
  }
}
