import newEvent from "./newEvent";

class ColorThemes {
  #themes = {};
  #prevStyle;

  onToggledVideo(playerStyle, onEvent) {
    const isVideo = playerStyle === "video";
    const wasVideo = this.#prevStyle === "video";

    const toggled = isVideo !== wasVideo;
    this.#prevStyle = playerStyle;

    if (toggled) {
      onEvent(newEvent({
        type: "ColorThemeUpdated",
        description: "The player's color theme was updated.",
        initiatedBy: "browser",
      }));
    }
  }

  reset() {
    this.#themes = {};
  }

  setTheme({ advertIndex, name, ...colors }) {
    this.#themes[advertIndex] ||= {};
    this.#themes[advertIndex][name] = colors;
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
