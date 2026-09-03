import { tick } from "svelte";
import SettingControl from "../../src/components/control_panel/SettingControl.svelte";
import { PLAYER_COLOR_PRESETS } from "../../src/helpers/default_theme/palettes";

describe("SettingControl palette editor", () => {
  let component;
  let target;

  beforeEach(() => {
    target = document.createElement("div");
    document.body.appendChild(target);
  });

  afterEach(() => {
    component?.$destroy();
    target.remove();
  });

  const setting = {
    key: "lightTheme",
    label: "Light palette",
    control: "palette",
    fields: [
      { key: "textColor", label: "Primary text", description: "Main copy" },
      { key: "agentColor", label: "Agent", description: "Agent orb" },
    ],
    default: PLAYER_COLOR_PRESETS.light,
    presets: { "built-in Light": PLAYER_COLOR_PRESETS.light },
  };

  it("renders a labelled input and swatch for each color role", () => {
    component = new SettingControl({
      target,
      props: { setting, value: PLAYER_COLOR_PRESETS.light },
    });

    expect(target.querySelector('input[aria-label="Light palette: Primary text"]').value).toEqual("#212121");
    expect(target.querySelector('input[aria-label="Light palette: Agent"]').value).toEqual("linear-gradient(100deg, #943bfc, #e23ad0)");
    expect(target.querySelectorAll(".swatch")).toHaveLength(2);
    expect(target.textContent).toContain("textColor");
    expect(target.textContent).toContain("agentColor");
  });

  it("applies every keystroke and preserves the exact opaque string", async () => {
    const onChange = vi.fn();
    component = new SettingControl({
      target,
      props: { setting, value: PLAYER_COLOR_PRESETS.light, onChange },
    });
    const input = target.querySelector('input[aria-label="Light palette: Agent"]');
    const raw = "not-yet-valid(css ";

    input.value = raw;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();

    expect(onChange).toHaveBeenCalledWith({ ...PLAYER_COLOR_PRESETS.light, agentColor: raw });
  });

  it("resets the complete palette instead of one field", () => {
    const onReset = vi.fn();
    component = new SettingControl({
      target,
      props: { setting, value: PLAYER_COLOR_PRESETS.light, overridden: true, onReset },
    });

    target.querySelector("button.reset").click();

    expect(onReset).toHaveBeenCalledOnce();
    expect(target.textContent).toContain("reset palette");
  });
});
