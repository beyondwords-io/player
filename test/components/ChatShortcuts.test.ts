import ChatShortcuts from "../../src/components/default_player/ChatShortcuts.svelte";
import deriveTokens from "../../src/helpers/default_theme/deriveTokens";

describe("ChatShortcuts", () => {
  it("keeps a subtle resting bubble beneath neutral interaction effects", () => {
    const target = document.createElement("div");
    const tokens = deriveTokens({ palette: {
      textColor: "red",
      subtleColor: "rgba(10, 20, 30, 0.2)",
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

    expect(chip.style.getPropertyValue("--bg")).toEqual(tokens.subtle);
    expect(chip.style.getPropertyValue("--hover-bg")).toEqual(tokens.hover);
    expect(chip.style.getPropertyValue("--pressed-bg")).toEqual(tokens.pressed);
    component.$destroy();
  });
});
