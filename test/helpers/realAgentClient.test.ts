import RealAgentClient from "../../src/helpers/realAgentClient";
import MockAgentClient from "../../src/helpers/agentClient";

// A fake with the SDK's exact surface: startSession resolves to a
// conversation, and the tests fire the callbacks the way the platform would.
const fakeSdk = () => {
  const calls = { configs: [], conversations: [] };

  const sdk = {
    Conversation: {
      startSession: async (config) => {
        const conversation = {
          config,
          sent: [],
          activityCount: 0,
          micMuted: null,
          ended: false,
          sendUserMessage: (text) => conversation.sent.push(text),
          sendUserActivity: () => { conversation.activityCount += 1; },
          setMicMuted: (muted) => { conversation.micMuted = muted; },
          endSession: async () => { conversation.ended = true; },

          emitStatus: (status) => config.onStatusChange?.({ status }),
          emitMode: (mode) => config.onModeChange?.({ mode }),
          emitMessage: (message, role, eventId = 1) => config.onMessage?.({ message, role, source: role === "agent" ? "ai" : "user", event_id: eventId }),
          emitPart: (type, text, eventId = 1) => config.onAgentChatResponsePart?.({ type, text, event_id: eventId }),
          emitCorrection: (corrected, eventId = 1, original = "x") => config.onAgentResponseCorrection?.({ original_agent_response: original, corrected_agent_response: corrected, event_id: eventId }),
          emitDisconnect: () => config.onDisconnect?.({ reason: "agent" }),
        };

        calls.configs.push(config);
        calls.conversations.push(conversation);
        return conversation;
      },
    },
  };

  return { sdk, calls };
};

const newClient = (overrides = {}) => {
  const { sdk, calls } = fakeSdk();

  const client = new RealAgentClient({
    agentId: "agent_123",
    loadSdk: async () => sdk,
    dynamicVariables: () => ({ project_id: 54044, content_id: "content-uuid", title: "A story", source_id: undefined }),
    ...overrides,
  });

  return { client, calls };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("realAgentClient", () => {
  it("has the same public surface as the mock client", () => {
    const real = new RealAgentClient({ agentId: "agent_123" });
    const mock = new MockAgentClient();

    for (const method of ["subscribe", "startSession", "sendUserMessage", "sendUserActivity", "setMicMuted", "interrupt", "endSession", "cancelConnect", "appendLocked"]) {
      expect(typeof real[method], method).toEqual("function");
      expect(typeof mock[method], method).toEqual("function");
    }

    expect(real.state).toEqual(mock.state);
    expect(real.canInterrupt).toEqual(false);
    expect(mock.canInterrupt).toEqual(true);
  });

  it("starts a text session on the first typed send and flushes the message once connected", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What happened?");

    // The rows appear immediately, before the session resolves.
    expect(client.state.kind).toEqual("text");
    expect(client.state.status).toEqual("idle");
    expect(client.state.thread.map((row) => row.role)).toEqual(["reader", "agent"]);
    expect(client.state.thread[1]).toMatchObject({ typing: true, streaming: true, spoken: false, citations: [] });

    await settle();

    expect(calls.configs).toHaveLength(1);
    expect(calls.configs[0]).toMatchObject({ agentId: "agent_123", textOnly: true });
    expect(calls.configs[0].dynamicVariables).toEqual({ project_id: 54044, content_id: "content-uuid", title: "A story" });
    expect(calls.conversations[0].sent).toEqual(["What happened?"]);
  });

  it("streams a text reply from response parts and ignores the duplicate whole message", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What happened?");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitPart("start", "", 7);
    conversation.emitPart("delta", "It ", 7);
    conversation.emitPart("delta", "launched.", 7);

    expect(client.state.thread[1]).toMatchObject({ text: "It launched.", typing: false, streaming: true });

    conversation.emitPart("stop", "", 7);
    conversation.emitMessage("It launched.", "agent", 7);

    expect(client.state.thread).toHaveLength(2);
    expect(client.state.thread[1]).toMatchObject({ text: "It launched.", streaming: false });
    expect(client.state.announced).toEqual("It launched.");
  });

  it("ignores the empty agent message sent while the platform's tools run", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What are today's top stories?");
    await settle();
    const conversation = calls.conversations[0];

    // Observed live: an empty agent_response arrives first, then the real
    // reply streams. The pending bubble must wait for the real one.
    conversation.emitMessage("", "agent");
    expect(client.state.thread[1]).toMatchObject({ text: "", streaming: true });

    conversation.emitPart("start", "", 2);
    conversation.emitPart("delta", "Here are the top stories.", 2);
    conversation.emitPart("stop", "", 2);

    expect(client.state.thread).toHaveLength(2);
    expect(client.state.thread[1]).toMatchObject({ text: "Here are the top stories.", streaming: false });
  });

  it("keeps the reply open through the platform's empty tool-call turn", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What are today's top stories?");
    await settle();
    const conversation = calls.conversations[0];

    // Observed live: start/stop with no deltas while tools run, then the
    // same event_id starts again with the real answer.
    conversation.emitPart("start", "", 2);
    conversation.emitPart("stop", "", 2);
    expect(client.state.thread).toHaveLength(2);
    expect(client.state.thread[1]).toMatchObject({ text: "", streaming: true });

    conversation.emitPart("start", "", 2);
    conversation.emitPart("delta", "Here are the top stories.", 2);
    conversation.emitPart("stop", "", 2);

    expect(client.state.thread).toHaveLength(2);
    expect(client.state.thread[1]).toMatchObject({ text: "Here are the top stories.", streaming: false });
    expect(client.state.announced).toEqual("Here are the top stories.");
  });

  it("drops an unanswered bubble when the reader asks again mid-turn", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("First question");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitPart("start", "", 2);
    conversation.emitPart("stop", "", 2);

    client.sendUserMessage("Second question");

    expect(client.state.thread.map((row) => [row.role, row.text])).toEqual([
      ["reader", "First question"],
      ["reader", "Second question"],
      ["agent", ""],
    ]);

    conversation.emitPart("start", "", 3);
    conversation.emitPart("delta", "Answering the second.", 3);
    conversation.emitPart("stop", "", 3);

    expect(client.state.thread[2]).toMatchObject({ text: "Answering the second.", streaming: false });
  });

  it("fills the pending reply from a whole message when the platform sends no parts", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What happened?");
    await settle();

    calls.conversations[0].emitMessage("It launched.", "agent");

    expect(client.state.thread).toHaveLength(2);
    expect(client.state.thread[1]).toMatchObject({ text: "It launched.", streaming: false, typing: false });
    expect(client.state.announced).toEqual("It launched.");
  });

  it("accepts a whole-message reply after an earlier turn used response parts", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("First question");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitPart("start", "", 1);
    conversation.emitPart("delta", "First answer.", 1);
    conversation.emitPart("stop", "", 1);

    client.sendUserMessage("Second question");
    conversation.emitMessage("Second answer.", "agent", 2);

    expect(client.state.thread.map((row) => [row.role, row.text])).toEqual([
      ["reader", "First question"],
      ["agent", "First answer."],
      ["reader", "Second question"],
      ["agent", "Second answer."],
    ]);
    expect(client.state.thread.at(-1)).toMatchObject({ streaming: false, typing: false });
    expect(client.state.announced).toEqual("Second answer.");
  });

  it("does not correlate reused event ids to a reply from an ended session", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("First session question");
    await settle();
    calls.conversations[0].emitPart("start", "", 1);
    calls.conversations[0].emitPart("delta", "First session answer.", 1);
    calls.conversations[0].emitPart("stop", "", 1);
    client.endSession();

    client.sendUserMessage("Second session question");
    await settle();
    calls.conversations[1].emitMessage("Second session answer.", "agent", 1);

    expect(client.state.thread.map((row) => [row.role, row.text])).toEqual([
      ["reader", "First session question"],
      ["agent", "First session answer."],
      ["reader", "Second session question"],
      ["agent", "Second session answer."],
    ]);
    expect(client.state.thread.at(-1)).toMatchObject({ streaming: false, typing: false });
  });

  it("runs a voice call through connecting, listening and talking", async () => {
    const { client, calls } = newClient();

    client.startSession();
    expect(client.state).toMatchObject({ kind: "voice", status: "connecting" });

    await settle();
    const conversation = calls.conversations[0];
    expect(conversation.config.textOnly).toBeUndefined();

    conversation.emitStatus("connected");
    expect(client.state.status).toEqual("listening");
    expect(client.state.thread).toHaveLength(0);

    conversation.emitMessage("What changed this week?", "user");
    expect(client.state.thread).toMatchObject([{ role: "reader", text: "What changed this week?" }]);

    conversation.emitMode("speaking");
    expect(client.state.status).toEqual("talking");

    conversation.emitMessage("Quite a lot.", "agent");
    expect(client.state.thread[1]).toMatchObject({ role: "agent", text: "Quite a lot.", spoken: true, streaming: false });

    conversation.emitMode("listening");
    expect(client.state.status).toEqual("listening");
  });

  it("keeps typed asks inside the call and marks the reply spoken", async () => {
    const { client, calls } = newClient();

    client.startSession();
    await settle();
    const conversation = calls.conversations[0];
    conversation.emitStatus("connected");

    client.setMicMuted(true);
    expect(conversation.micMuted).toEqual(true);
    expect(client.state.muted).toEqual(true);

    client.sendUserMessage("And in writing?");
    expect(client.state.kind).toEqual("voice");
    expect(conversation.sent).toEqual(["And in writing?"]);
    expect(client.state.thread[1]).toMatchObject({ role: "agent", spoken: true });
  });

  it("marks the break between conversations when switching kinds", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("Hello");
    await settle();

    client.startSession();
    await settle();

    expect(calls.conversations[0].ended).toEqual(true);

    calls.conversations[1].emitStatus("connected");
    const dividers = client.state.thread.filter((row) => row.role === "divider");
    expect(dividers).toMatchObject([{ text: "New voice chat — nothing carries over" }]);
  });

  it("ends the session on demand and marks where a call stopped", async () => {
    const { client, calls } = newClient();

    client.startSession();
    await settle();
    const conversation = calls.conversations[0];
    conversation.emitStatus("connected");

    client.endSession();

    expect(conversation.ended).toEqual(true);
    expect(client.state).toMatchObject({ kind: "none", status: "idle" });
    expect(client.state.thread.at(-1)).toMatchObject({ role: "divider", text: "Chat ended" });

    // Stale callbacks from the closed conversation change nothing.
    conversation.emitMode("speaking");
    expect(client.state.status).toEqual("idle");
  });

  it("does not mark ended text conversations", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("Hello");
    await settle();
    calls.conversations[0].emitPart("start", "", 1);
    calls.conversations[0].emitPart("stop", "", 1);

    client.endSession();

    expect(client.state.thread.filter((row) => row.role === "divider")).toHaveLength(0);
  });

  it("never opens a session when the connect is cancelled straight away", async () => {
    const { client, calls } = newClient();

    client.startSession();
    client.cancelConnect();

    expect(client.state).toMatchObject({ kind: "none", status: "idle" });

    await settle();

    expect(calls.configs).toHaveLength(0);
    expect(client.state.thread).toHaveLength(0);
  });

  it("closes a session that resolves after the connect was cancelled", async () => {
    let conversation;
    let resolveSession;

    const sdk = {
      Conversation: {
        startSession: (config) => new Promise((resolve) => {
          conversation = { config, ended: false, endSession: async () => { conversation.ended = true; } };
          resolveSession = () => resolve(conversation);
        }),
      },
    };

    const client = new RealAgentClient({ agentId: "agent_123", loadSdk: async () => sdk });

    client.startSession();
    await settle();
    client.cancelConnect();

    resolveSession();
    await settle();

    expect(conversation.ended).toEqual(true);
    expect(client.state).toMatchObject({ kind: "none", status: "idle" });
    expect(client.state.thread).toHaveLength(0);
  });

  it("recovers when the session cannot start", async () => {
    const failingSdk = { Conversation: { startSession: async () => { throw new Error("mic denied"); } } };
    const client = new RealAgentClient({ agentId: "agent_123", loadSdk: async () => failingSdk });

    client.startSession();
    await settle();

    expect(client.state).toMatchObject({ kind: "none", status: "idle" });
    expect(client.state.thread).toHaveLength(0);
  });

  it("keeps the question but drops the blank bubble when a text session fails", async () => {
    const failingSdk = { Conversation: { startSession: async () => { throw new Error("agent not found"); } } };
    const client = new RealAgentClient({ agentId: "agent_missing", loadSdk: async () => failingSdk });

    client.sendUserMessage("What happened?");
    await settle();

    expect(client.state).toMatchObject({ kind: "none", status: "idle" });
    expect(client.state.thread).toMatchObject([{ role: "reader", text: "What happened?" }]);
  });

  it("stops the local reveal on interrupt and drops the turn's late deltas", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What happened?");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitPart("start", "", 3);
    conversation.emitPart("delta", "It ", 3);

    client.interrupt();
    expect(client.state.thread[1]).toMatchObject({ text: "It ", streaming: false });

    conversation.emitPart("delta", "launched.", 3);
    expect(client.state.thread[1].text).toEqual("It ");
  });

  it("applies the agent's own corrections to the last reply", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What happened?");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitPart("start", "", 1);
    conversation.emitPart("delta", "It launched yesterday.", 1);
    conversation.emitPart("stop", "", 1);

    conversation.emitCorrection("It launched");
    expect(client.state.thread[1].text).toEqual("It launched");
    expect(client.state.announced).toEqual("It launched");
  });

  it("applies a delayed correction to its own turn instead of the next pending reply", async () => {
    const { client, calls } = newClient();

    client.startSession();
    await settle();
    const conversation = calls.conversations[0];
    conversation.emitStatus("connected");

    conversation.emitMessage("First question", "user", 10);
    conversation.emitMessage("A long first answer.", "agent", 11);

    client.sendUserMessage("Second question");
    conversation.emitCorrection("A short first answer.", 11, "A long first answer.");
    conversation.emitMessage("The second answer.", "agent", 12);

    expect(client.state.thread.map((row) => [row.role, row.text])).toEqual([
      ["reader", "First question"],
      ["agent", "A short first answer."],
      ["reader", "Second question"],
      ["agent", "The second answer."],
    ]);
    expect(client.state.thread.at(-1)).toMatchObject({ streaming: false, typing: false });
    expect(client.state.announced).toEqual("The second answer.");
  });

  it("marks the thread when the server ends the call", async () => {
    const { client, calls } = newClient();

    client.startSession();
    await settle();
    calls.conversations[0].emitStatus("connected");

    calls.conversations[0].emitDisconnect();

    expect(client.state).toMatchObject({ kind: "none", status: "idle" });
    expect(client.state.thread.at(-1)).toMatchObject({ role: "divider", text: "Chat ended" });
  });

  it("hangs up by itself when a call sits silent", async () => {
    const { client, calls } = newClient({ silenceTimeoutMs: 5 });

    client.startSession();
    await settle();
    calls.conversations[0].emitStatus("connected");

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(client.state.kind).toEqual("none");
    expect(client.state.thread.at(-1)).toMatchObject({ role: "divider", text: "Chat ended" });
  });

  it("answers locked questions with the offer and no session", async () => {
    const { client, calls } = newClient();

    client.appendLocked("What happened?");
    await settle();

    expect(calls.configs).toHaveLength(0);
    expect(client.state.thread).toMatchObject([{ role: "reader", text: "What happened?" }, { role: "locked" }]);
  });
});
