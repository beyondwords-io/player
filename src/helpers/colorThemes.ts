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
}

export default ColorThemes;
