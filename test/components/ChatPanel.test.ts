import { tick } from "svelte";
import ChatPanel from "../../src/components/default_player/ChatPanel.svelte";
import MockAgentClient from "../../src/helpers/agentClient";

describe("ChatPanel", () => {
  it("applies text and voice allowances independently", async () => {
    const target = document.createElement("div");
    const component = new ChatPanel({
      target,
      props: {
        tokens: { radius: {} },
        agentClient: new MockAgentClient(),
        agentQuestionsLimit: 1,
        agentVoiceSecondsLimit: 60,
        agentQuestionsRemaining: 1,
        agentVoiceSecondsRemaining: 60,
        agentVoice: true,
      },
    });

    expect(target.querySelector(".voice")).not.toBeNull();
    expect(target.querySelector("input").disabled).toEqual(false);

    component.$set({ agentQuestionsRemaining: 0 });
    await tick();

    expect(target.querySelector(".voice")).not.toBeNull();
    expect(target.querySelector("input").disabled).toEqual(true);

    component.$set({ agentVoiceSecondsRemaining: 0 });
    await tick();

    expect(target.querySelector(".voice")).toBeNull();
    expect(target.querySelector(".composer.spent")).not.toBeNull();
    component.$destroy();
  });
});
