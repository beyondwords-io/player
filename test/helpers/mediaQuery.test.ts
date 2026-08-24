import { mediaQueryMatches, subscribeMediaQuery } from "../../src/helpers/mediaQuery";

describe("media query compatibility", () => {
  it("subscribes through the modern event API", () => {
    let listener;
    let removed;
    const query = {
      matches: false,
      addEventListener: (_type, value) => { listener = value; },
      removeEventListener: (_type, value) => { removed = value; },
    };
    const values = [];
    const unsubscribe = subscribeMediaQuery("(max-width: 640px)", (value) => values.push(value), () => query);

    query.matches = true;
    listener();
    unsubscribe();
    expect(values).toEqual([false, true]);
    expect(removed).toBe(listener);
  });

  it("falls back to the legacy listener API used by older webviews", () => {
    let listener;
    let removed;
    const query = {
      matches: true,
      addListener: (value) => { listener = value; },
      removeListener: (value) => { removed = value; },
    };
    const values = [];
    const unsubscribe = subscribeMediaQuery("(max-width: 640px)", (value) => values.push(value), () => query);

    query.matches = false;
    listener();
    unsubscribe();
    expect(values).toEqual([true, false]);
    expect(removed).toBe(listener);
  });

  it("returns a stable false value when matchMedia is unavailable", () => {
    const values = [];
    subscribeMediaQuery("(prefers-reduced-motion: reduce)", (value) => values.push(value), undefined)();
    expect(values).toEqual([false]);
    expect(mediaQueryMatches("x", undefined)).toEqual(false);
  });
});
