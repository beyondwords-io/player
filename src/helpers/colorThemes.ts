class ColorThemes {
  #themes = {};

  reset() {
    this.#themes = {};
  }

  setTheme({ advertIndex, name, textColor, backgroundColor, iconColor, highlightColor }) {
    this.#themes[advertIndex] ||= {};
    this.#themes[advertIndex][name] = { textColor, backgroundColor, iconColor, highlightColor };
  }

  setMode({ advertIndex, mode }) {
    this.#themes[advertIndex] ||= {};
    this.#themes[advertIndex].mode = mode;
  }

  resolve({ advertIndex }) {
    const themes = this.#themes[advertIndex];
    const mode = this.#resolveMode(themes.mode);

    return themes[mode];
  }

  #resolveMode(mode) {
    if (mode === "dark") {
      return "dark";
    } else if (mode === "auto" && this.#isBrowserDarkMode()) {
      return "dark";
    } else {
      return "light";
    }
  }

  #isBrowserDarkMode() {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  }
}

export default ColorThemes;
