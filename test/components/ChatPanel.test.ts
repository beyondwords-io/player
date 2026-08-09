import { tick } from "svelte";
import ChatPanel from "../../src/components/default_player/ChatPanel.svelte";
import MockAgentClient from "../../src/helpers/agentClient";

describe("ChatPanel", () => {
  it("offers voice for minute limits but not question limits", async () => {
    const target = document.createElement("div");
    const component = new ChatPanel({
      target,
      props: {
        tokens: { radius: {} },
        agentClient: new MockAgentClient(),
        agentAccess: "limited",
        agentLimit: "1",
        agentVoice: true,
      },
    });

    expect(target.querySelector(".voice")).toBeNull();

    component.$set({ agentLimit: "1:00" });
    await tick();

    expect(target.querySelector(".voice")).not.toBeNull();
    component.$destroy();
  });
});
