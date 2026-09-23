import ChatShortcuts from "../../src/components/default_player/ChatShortcuts.svelte";
import deriveTokens from "../../src/helpers/default_theme/deriveTokens";

describe("ChatShortcuts", () => {
  it("uses the user-bubble pair beneath neutral interaction effects", () => {
    const target = document.createElement("div");
    const tokens = deriveTokens({ palette: {
      textColor: "red",
      subtleColor: "rgba(10, 20, 30, 0.2)",
      accentColor: "rgb(40, 50, 60)",
      accentTextColor: "rgb(240, 230, 220)",
    } });
    const component = new ChatShortcuts({
      target,
      props: {
        empty: true,
        open: true,
        questions: ["What are the headlines?"],
        tokens,
        onSelect: () => undefined,
      },
    });
    const chip = target.querySelector(".chip");

    expect(chip.style.getPropertyValue("--bg")).toEqual(tokens.bubbleBackground);
    expect(chip.style.getPropertyValue("--hover-bg")).toEqual(tokens.hover);
    expect(chip.style.getPropertyValue("--pressed-bg")).toEqual(tokens.pressed);
    expect(chip.style.color).toEqual(tokens.bubbleText);
    component.$destroy();
  });
});
