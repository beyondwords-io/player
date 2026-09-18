interface CompatibleMediaQueryList {
  matches: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
  addListener?: (listener: () => void) => void;
  removeListener?: (listener: () => void) => void;
}

type MatchMedia = (query: string) => CompatibleMediaQueryList;

const mediaQueryMatches = (query: string, matchMediaFn: MatchMedia | undefined = globalThis.matchMedia): boolean => (
  typeof matchMediaFn === "function" && matchMediaFn(query).matches
);

const subscribeMediaQuery = (
  query: string,
  run: (matches: boolean) => void,
  matchMediaFn: MatchMedia | undefined = globalThis.matchMedia
): (() => void) => {
  if (typeof matchMediaFn !== "function") {
    run(false);
    return () => {};
  }

  const mediaQuery = matchMediaFn(query);
  const update = () => run(mediaQuery.matches);
  update();

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener?.("change", update);
  }

  mediaQuery.addListener?.(update);
  return () => mediaQuery.removeListener?.(update);
};

export { mediaQueryMatches, subscribeMediaQuery };
export type { CompatibleMediaQueryList, MatchMedia };
