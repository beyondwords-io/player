import { tick } from "svelte";
import ChatPanel from "../../src/components/default_player/ChatPanel.svelte";
import MockAgentClient from "../helpers/mockAgentClient";
import AgentFacade from "../../src/helpers/agentFacade";
import AgentAllowanceState from "../../src/helpers/agentAllowanceState";
import deriveTokens from "../../src/helpers/default_theme/deriveTokens";

// The panel reads one facade snapshot; quota, lock and metering enforcement
// all live in the facade, so these tests drive the allowance and the client
// directly and assert on what the panel renders.
const newAgent = (client = new MockAgentClient(), config = {}) => {
  const allowance = new AgentAllowanceState();
  const agent = new AgentFacade({ client, allowance });
  agent.updateContext({
    configured: true,
    embedMode: "all",
    widgetEmbedMode: "all",
    cta: null,
    config: { shortcuts: [], voiceEnabled: true, ...config },
  });
  return { agent, allowance, client };
};

describe("ChatPanel", () => {
  it("renders subsequent agent state notifications", async () => {
    vi.useFakeTimers();
    window.disableAnimation = true;
    const target = document.createElement("div");
    const agentClient = new MockAgentClient();
    const { agent } = newAgent(agentClient);
    const component = new ChatPanel({
      target,
      props: { tokens: { radius: {} }, agent },
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
    const { agent, allowance } = newAgent();
    const component = new ChatPanel({
      target,
      props: { tokens: { radius: {} }, agent },
    });

    allowance.configure({ identity: "a", questionsLimit: 1, voiceSecondsLimit: 60 });
    await tick();

    expect(target.querySelector(".voice")).not.toBeNull();
    expect(target.querySelector("input").disabled).toEqual(false);

    allowance.useQuestion();
    await tick();

    expect(target.querySelector(".voice")).not.toBeNull();
    expect(target.querySelector("input").disabled).toEqual(true);

    allowance.configure({ identity: "b", questionsLimit: 1, voiceSecondsLimit: 0 });
    allowance.useQuestion();
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
    const { agent } = newAgent();
    const component = new ChatPanel({
      target,
      props: { tokens, agent },
    });

    expect(target.querySelector(".voice path").getAttribute("stroke")).toEqual("red");
    expect(target.querySelector(".voice").style.background).toEqual(tokens.subtle);
    expect(target.querySelector(".send").style.background).toEqual("red");
    expect(target.querySelector(".send path").getAttribute("stroke")).toEqual("white");
    component.$destroy();
  });
});
