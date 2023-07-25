import newEvent from "./newEvent";
import { set } from "./setPropsFromApi";

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

  applyTheme(player) {
    const playerStyle = player.playerStyle;
    const colors = this.resolve({ advertIndex: null, playerStyle });

    set(player, "textColor", colors.textColor);
    set(player, "backgroundColor", colors.backgroundColor);
    set(player, "iconColor", colors.iconColor);

    for (const [advertIndex, advert] of player.adverts.entries()) {
      const colors = this.resolve({ advertIndex, playerStyle });

      advert.textColor = colors?.textColor;
      advert.backgroundColor = colors?.backgroundColor;
      advert.iconColor = colors?.iconColor;
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

  resolve({ advertIndex, playerStyle }) {
    const themes = this.#themes[advertIndex];
    const mode = this.#resolveMode(themes.mode, playerStyle);

    return themes[mode];
  }

  #resolveMode(mode, playerStyle) {
    if (playerStyle === "video") {
      return "video";
    } else if (mode === "dark") {
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
