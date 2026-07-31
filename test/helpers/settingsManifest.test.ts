import fs from "node:fs";
import BeyondWords from "../../src/index";
import settingsManifest, { findSetting, optionsFor, optionValue, optionLabel, parseOption, selectedOption } from "../../src/helpers/settingsManifest";

// The manifest is what the control panel renders, so anything that drifts from
// Player.svelte shows up as a control that does nothing. These tests are the
// reason the panel can be a loop over data.
describe("settingsManifest", () => {
  let player;

  beforeEach(() => {
    HTMLMediaElement.prototype.pause = () => {};
    HTMLMediaElement.prototype.load = () => {};
    BeyondWords.Player.destroyAll();

    const target = document.createElement("div");
    document.body.appendChild(target);

    player = new BeyondWords.Player({ target });
  });

  it("only describes props the player actually has", () => {
    const props = player.properties();

    settingsManifest.forEach(({ key }) => {
      expect(props, `${key} is not a player prop`).toHaveProperty(key);
    });
  });

  it("records the same default as the player, so a reset restores it", () => {
    settingsManifest.forEach(({ key, default: dflt }) => {
      expect(player[key], `${key} default`).toEqual(dflt);
    });
  });

  it("describes each setting exactly once", () => {
    const keys = settingsManifest.map(({ key }) => key);
    expect(keys).toEqual([...new Set(keys)]);
  });

  it("covers every documented setting in Player.svelte", () => {
    // Not settings: an error callback, internal transition state, and the
    // panel's own host element.
    const notASetting = ["onError", "transitions", "controlPanel"];

    const source = fs.readFileSync("src/components/Player.svelte", "utf8");
    const documented = source
      .split("// Please document all settings")[1]
      .split("export const addEventListener")[0]
      .matchAll(/export let (\w+)/g);

    [...documented].map(([, key]) => key).forEach((key) => {
      if (notASetting.includes(key)) { return; }

      expect(findSetting(key), `${key} has no control in the settings manifest`).toBeTruthy();
    });
  });

  // A dropdown whose current value matches none of its options renders blank,
  // which reads as "this setting is broken".
  it("offers an option for the value each select starts with", () => {
    settingsManifest.forEach((setting) => {
      if (setting.control !== "select" || typeof setting.options === "function") { return; }

      expect(selectedOption(setting, setting.default), `${setting.key}: ${setting.default} is not one of its options`).toBeDefined();
    });
  });

  it("can select every option it offers", () => {
    settingsManifest.forEach((setting) => {
      if (setting.control !== "select" || typeof setting.options === "function") { return; }

      optionsFor(setting).forEach((option) => {
        const value = parseOption(setting, option);

        expect(selectedOption(setting, value), `${setting.key}: choosing ${optionValue(option)} selects nothing`).toEqual(optionValue(option));
        expect(optionLabel(setting, option), `${setting.key}: ${optionValue(option)} has no label`).toBeTruthy();
      });
    });
  });
});
