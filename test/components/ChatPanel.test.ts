import { tick } from "svelte";
import ChatPanel from "../../src/components/default_player/ChatPanel.svelte";
import MockAgentClient from "../../src/helpers/agentClient";
import deriveTokens from "../../src/helpers/default_theme/deriveTokens";

describe("ChatPanel", () => {
  it("renders subsequent agent state notifications", async () => {
    vi.useFakeTimers();
    window.disableAnimation = true;
    const target = document.createElement("div");
    const agentClient = new MockAgentClient();
    const component = new ChatPanel({
      target,
      props: {
        tokens: { radius: {} },
        agentClient,
        agentQuestionsLimit: null,
        agentVoiceSecondsLimit: null,
        agentQuestionsRemaining: null,
        agentVoiceSecondsRemaining: null,
      },
    });

    agentClient.startSession();
    await vi.advanceTimersByTimeAsync(0);
    await tick();

    expect(target.querySelector(".strip")?.textContent).toContain("Listening");
    component.$destroy();
    delete window.disableAnimation;
    vi.useRealTimers();
  });

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

  it("uses the icon color for voice and submit controls", () => {
    const target = document.createElement("div");
    const tokens = deriveTokens({ palette: {
      backgroundColor: "white",
      textColor: "blue",
      iconColor: "red",
    } });
    const component = new ChatPanel({
      target,
      props: {
        tokens,
        agentClient: new MockAgentClient(),
      },
    });

    expect(target.querySelector(".voice path").getAttribute("stroke")).toEqual("red");
    expect(target.querySelector(".send").style.background).toEqual("red");
    expect(target.querySelector(".send path").getAttribute("stroke")).toEqual("white");
    component.$destroy();
  });
});
