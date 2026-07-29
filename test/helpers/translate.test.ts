import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import translate, { setLocale } from "../../src/helpers/translate";

describe("translate", () => {
  const originalLanguages = navigator.languages;

  beforeEach(() => {
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      get: () => ["en-US", "en"],
    });
    setLocale(undefined);
  });

  afterEach(() => {
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      get: () => originalLanguages,
    });
    setLocale(undefined);
    vi.restoreAllMocks();
  });

  it("defaults to browser preference then English", () => {
    expect(translate("listenToThisArticle")).toEqual("Listen to this article");
  });

  it("uses playerLanguage override via setLocale", () => {
    setLocale("de");
    expect(translate("listenToThisArticle")).toEqual("Hören Sie sich diesen Artikel an");
    expect(translate("minutesSingularOrPlural")).toEqual("{n} Min");
  });

  it("prefers exact locale variants when available", () => {
    setLocale("zh-TW");
    expect(translate("listenToThisArticle")).toEqual("聽這篇文章");
  });

  it("supports newly added voice languages", () => {
    setLocale("ceb");
    expect(translate("listenToThisArticle")).toEqual("Paminawa kini nga artikulo");

    setLocale("ny");
    expect(translate("listenToThisArticle")).toEqual("Mvetserani nkhani iyi");

    setLocale("jv");
    expect(translate("listenToThisArticle")).toEqual("Rungokna artikel iki");

    setLocale("sd");
    expect(translate("listenToThisArticle")).toEqual("هي مضمون ٻڌو");
  });

  it("ignores unsupported languages with a console warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    setLocale("eo");

    expect(warn).toHaveBeenCalledWith(
      "BeyondWords player: 'eo' is not a supported language, falling back to browser preference."
    );
    expect(translate("listenToThisArticle")).toEqual("Listen to this article");
  });

  it("clears the override when setLocale is called with undefined", () => {
    setLocale("de");
    expect(translate("listenToThisArticle")).toEqual("Hören Sie sich diesen Artikel an");

    setLocale(undefined);
    expect(translate("listenToThisArticle")).toEqual("Listen to this article");
  });

  it("lets an explicit translate locale argument take precedence over the override", () => {
    setLocale("de");
    expect(translate("listenToThisArticle", { locale: "fr" })).toEqual("Écoutez cet article");
  });

  it("follows browser preference when no override is set", () => {
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      get: () => ["fr"],
    });

    expect(translate("listenToThisArticle")).toEqual("Écoutez cet article");
  });
});
