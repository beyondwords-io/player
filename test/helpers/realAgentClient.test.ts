import RealAgentClient from "../../src/helpers/realAgentClient";
import { formatAgentAnswer } from "../../src/helpers/agentCitations";
import MockAgentClient from "./mockAgentClient";
import session53997 from "../fixtures/agentSession53997.json";

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
          // SDK 1.26+ passes a whole message's response_id on; 1.17 drops it.
          emitMessage: (message, role, eventId = 1, responseId = undefined) => config.onMessage?.({ message, role, source: role === "agent" ? "ai" : "user", event_id: eventId, ...(responseId ? { response_id: responseId } : {}) }),
          emitPart: (type, text, eventId = 1, responseId = undefined) => config.onAgentChatResponsePart?.({ type, text, event_id: eventId, ...(responseId ? { response_id: responseId } : {}) }),
          emitCorrection: (corrected, eventId = 1, original = "x") => config.onAgentResponseCorrection?.({ original_agent_response: original, corrected_agent_response: corrected, event_id: eventId }),
          emitMCPToolCall: (payload) => config.onMCPToolCall?.(payload),
          emitAgentToolResponse: (payload) => config.onAgentToolResponse?.(payload),
          emitDisconnect: (details = { reason: "agent" }) => config.onDisconnect?.(details),
        };

        calls.configs.push(config);
        calls.conversations.push(conversation);
        return conversation;
      },
    },
  };

  return { sdk, calls };
};

// A fake AuthApiClient with the auth service's two answers: a signed websocket
// url for text, a WebRTC token for voice. Each call returns a distinct
// credential, as the real one does.
const fakeAuthClient = (calls = { modes: [] }) => ({
  agentSession: async (mode) => {
    calls.modes.push(mode);
    const n = calls.modes.length;

    return mode === "voice"
      ? { connection_type: "webrtc", conversation_token: `token_${n}`, expires_at: 1790597571 }
      : { connection_type: "websocket", signed_url: `wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=sig_${n}`, expires_at: 1790597571 };
  },
});

const newClient = (overrides = {}) => {
  const { sdk, calls } = fakeSdk();
  calls.modes = [];

  const client = new RealAgentClient({
    agentId: "agent_123",
    authClient: fakeAuthClient(calls),
    loadSdk: async () => sdk,
    dynamicVariables: () => ({ project_id: 54044, content_id: "content-uuid", title: "A story", source_id: undefined }),
    ...overrides,
  });

  return { client, calls };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

// Replays raw platform frames through the stub SDK's callbacks exactly as
// BaseConversation hands them on. SDK 1.17 (the one we ship) drops
// agent_response's response_id from onMessage; 1.26+ passes it on.
const replay = async (client, calls, frames, { sdk126 = false } = {}) => {
  for (const frame of frames) {
    if (frame.type === "user_message") {
      client.sendUserMessage(frame.text);
      await settle();
      continue;
    }

    const { config } = calls.conversations.at(-1);

    if (frame.type === "agent_response") {
      const event = frame.agent_response_event;
      config.onMessage?.({
        source: "ai",
        role: "agent",
        message: event.agent_response,
        event_id: event.event_id,
        ...(sdk126 && event.response_id ? { response_id: event.response_id } : {}),
      });
    } else if (frame.type === "agent_chat_response_part") {
      config.onAgentChatResponsePart?.(frame.text_response_part);
    } else if (frame.type === "mcp_tool_call") {
      config.onMCPToolCall?.(frame.mcp_tool_call);
    } else if (frame.type === "agent_tool_response") {
      config.onAgentToolResponse?.(frame.agent_tool_response);
    } else {
      throw new Error(`no replay for a ${frame.type} frame`);
    }
  }
};

// The live capture: "What are the headlines?" gets a bridge, get_latest and a
// verbatim five-headline rundown; "Which consultations are open now?" gets a
// bridge, search_articles and a paraphrase naming three stories it found and
// two that turn 1 found.
const [bridge1, answer1, bridge2, answer2] = session53997
  .filter((frame) => frame.type === "agent_response")
  .map((frame) => frame.agent_response_event);

const [latestArticles, searchArticles] = session53997
  .filter((frame) => frame.type === "mcp_tool_call" && frame.mcp_tool_call.state === "success")
  .map((frame) => JSON.parse(frame.mcp_tool_call.result[0].text).articles);

const articleUrl = (titlePart) => [...latestArticles, ...searchArticles].find(({ title }) => title.includes(titlePart)).sourceUrl;

const mcpResult = (articles) => [{ type: "text", text: JSON.stringify({ articles }) }];

// Each inline citation with the text it sits right after.
const citedAfter = ({ layout }) => layout.segments.flatMap(({ text, citations }) => (
  citations.map(({ url }) => [url, text.trimEnd()])
));

const inlineCitations = ({ layout }) => layout.segments.flatMap(({ citations }) => citations);

const endingWith = (text) => expect.stringMatching(new RegExp(`${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));

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

  it("does not load the SDK or create placeholder replies without an agent id", async () => {
    const loadSdk = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = new RealAgentClient({ loadSdk });

    client.sendUserMessage("Anyone there?");
    await client.startSession();

    expect(loadSdk).not.toHaveBeenCalled();
    expect(client.state).toMatchObject({ kind: "none", status: "idle", thread: [] });
    expect(warn).toHaveBeenCalledTimes(2);
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
    expect(calls.modes, "a text credential was requested").toEqual(["text"]);
    expect(calls.configs[0]).toMatchObject({ connectionType: "websocket", signedUrl: "wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=sig_1", textOnly: true });
    expect(calls.configs[0].agentId, "the agent id never reaches the SDK").toBeUndefined();
    expect(calls.configs[0].dynamicVariables).toEqual({ project_id: 54044, content_id: "content-uuid", title: "A story" });
    expect(calls.conversations[0].sent).toEqual(["What happened?"]);
  });

  it("opens a voice call with the WebRTC token from the auth service", async () => {
    const { client, calls } = newClient();

    await client.startSession();

    expect(calls.modes).toEqual(["voice"]);
    expect(calls.configs[0]).toMatchObject({ connectionType: "webrtc", conversationToken: "token_1" });
    expect(calls.configs[0].signedUrl).toBeUndefined();
    expect(calls.configs[0].textOnly).toBeUndefined();
  });

  it("asks for a fresh credential on every session, since each is single-use", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("First?");
    await settle();
    client.endSession();
    client.sendUserMessage("Second?");
    await settle();

    expect(calls.modes).toEqual(["text", "text"]);
    expect(calls.configs.map((config) => config.signedUrl)).toEqual([
      "wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=sig_1",
      "wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=sig_2",
    ]);
  });

  it("treats a refused auth request as a failed connect", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const authClient = { agentSession: async () => { throw new Error("Failed to fetch https://auth.example.com/agent/session"); } };

    const text = newClient({ authClient });
    text.client.sendUserMessage("What happened?");
    await settle();

    expect(text.calls.configs, "the SDK was never asked to connect").toHaveLength(0);
    expect(text.client.state).toMatchObject({ kind: "none", status: "idle" });
    expect(text.client.state.thread, "the question stays, the blank bubble goes").toMatchObject([{ role: "reader", text: "What happened?" }]);

    const voice = newClient({ authClient });
    await voice.client.startSession();

    expect(voice.calls.configs).toHaveLength(0);
    expect(voice.client.state).toMatchObject({ kind: "none", status: "idle" });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("never connects when the connect is cancelled while auth is still answering", async () => {
    let resolveAuth;
    const authClient = { agentSession: () => new Promise((resolve) => { resolveAuth = resolve; }) };
    const { client, calls } = newClient({ authClient });

    client.startSession();
    await settle();
    client.cancelConnect();

    resolveAuth({ connection_type: "webrtc", conversation_token: "token_late" });
    await settle();

    expect(calls.configs).toHaveLength(0);
    expect(client.state).toMatchObject({ kind: "none", status: "idle" });
  });

  it("passes the API-provided agent overrides supported by the SDK", async () => {
    const sessionConfig = {
      firstMessage: "Hello from Zoe",
      model: "gemini-2.0-flash",
      systemPrompt: "Answer from the article",
      language: "fr",
      voiceId: "voice_123",
      voiceModelId: "eleven_turbo_v2",
    };

    const text = newClient({ sessionConfig });
    text.client.sendUserMessage("Que s'est-il passé ?");
    await settle();

    expect(text.calls.configs[0].overrides).toEqual({
      agent: {
        prompt: { prompt: "Answer from the article", llm: "gemini-2.0-flash" },
        firstMessage: "",
        language: "fr",
      },
      tts: { voiceId: "voice_123" },
    });

    const voice = newClient({ sessionConfig });
    await voice.client.startSession();

    expect(voice.calls.configs[0].overrides.agent.firstMessage).toEqual("Hello from Zoe");
    expect(voice.calls.configs[0].overrides.tts).toEqual({ voiceId: "voice_123" });
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

  it("turns successful MCP article results into citations for the matching answer", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What are today's top stories?");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitMCPToolCall({
      state: "success",
      result: [{
        type: "text",
        text: JSON.stringify({ articles: [
          { title: "First story", sourceUrl: "https://news.example/first" },
          { title: "Second story", sourceUrl: "https://news.example/second" },
        ] }),
      }],
    });
    conversation.emitPart("start", "", 12);
    conversation.emitPart("delta", "The Second story has the latest details.", 12);
    conversation.emitPart("stop", "", 12);

    expect(client.state.thread[1]).toMatchObject({
      citations: [{ title: "Second story", url: "https://news.example/second" }],
      streaming: false,
    });
  });

  it("accepts the full ElevenLabs tool payload and deduplicates repeated events", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("Send the article");
    await settle();
    const conversation = calls.conversations[0];
    const event = {
      event_id: 14,
      is_error: false,
      full_tool_result: JSON.stringify({
        content: [{
          type: "text",
          text: JSON.stringify({ title: "The article", sourceUrl: "https://news.example/article" }),
        }],
      }),
    };

    conversation.emitPart("start", "", 14);
    conversation.emitAgentToolResponse(event);
    conversation.emitAgentToolResponse(event);
    conversation.emitPart("delta", "Here is the article.", 14);
    conversation.emitPart("stop", "", 14);

    expect(client.state.thread[1].citations).toEqual([
      { title: "The article", url: "https://news.example/article" },
    ]);
  });

  it("replays a live session as one bridge and one answer per turn", async () => {
    const { client, calls } = newClient();

    await replay(client, calls, session53997);

    const thread = client.state.thread;
    expect(thread.map((row) => [row.role, row.text, row.bridge ?? false])).toEqual([
      ["reader", "What are the headlines?", false],
      ["agent", bridge1.agent_response, true],
      ["agent", answer1.agent_response, false],
      ["reader", "Which consultations are open now?", false],
      ["agent", bridge2.agent_response, true],
      ["agent", answer2.agent_response, false],
    ]);

    // Each bridge's own stream was recognised as the whole message already
    // on screen, and every reply knows its generation.
    expect(thread.map((row) => row.responseId)).toEqual([
      undefined, bridge1.response_id, answer1.response_id, undefined, bridge2.response_id, answer2.response_id,
    ]);

    for (const bridge of [thread[1], thread[4]]) {
      expect(bridge).toMatchObject({ streaming: false, typing: false, citations: [] });
      expect(inlineCitations(bridge)).toEqual([]);
      expect(bridge.layout.trailing).toEqual([]);
    }

    for (const answer of [thread[2], thread[5]]) {
      expect(answer).toMatchObject({ streaming: false, typing: false });
      expect(answer.layout.segments.map(({ text }) => text).join(""), "the segments are the displayed answer").toEqual(formatAgentAnswer(answer.text));
      expect(answer.citations, "inline citations first, in display order").toEqual([...inlineCitations(answer), ...answer.layout.trailing]);
    }

    expect(client.state.announced).toEqual(answer2.agent_response);
  });

  it("cites each headline of a verbatim rundown right after it", async () => {
    const { client, calls } = newClient();

    await replay(client, calls, session53997.slice(0, 12));

    const answer = client.state.thread[2];
    expect(answer.citations.map(({ url }) => url)).toEqual(latestArticles.map(({ sourceUrl }) => sourceUrl));
    expect(citedAfter(answer)).toEqual(latestArticles.map(({ sourceUrl, title }) => [sourceUrl, endingWith(title)]));
    expect(answer.layout.trailing).toEqual([]);
  });

  it("cites a paraphrased answer's stories, including ones an earlier turn found", async () => {
    const { client, calls } = newClient();

    await replay(client, calls, session53997);

    const answer = client.state.thread[5];
    expect(citedAfter(answer)).toEqual([
      [articleUrl("CP26/32"), endingWith("so it's open for just a few more days.")],
      [articleUrl("CP26/30"), endingWith("also still open.")],
      [articleUrl("CP26/20"), endingWith("so that one's shut.")],
      // Turn 1's get_latest found these two.
      [articleUrl("CP26/35"), endingWith("both published this month.")],
      [articleUrl("CP26/34"), endingWith("both published this month.")],
    ]);
    expect(answer.layout.trailing, "nothing hangs off the closing question").toEqual([]);
  });

  it("replays the same session from SDK 1.26, which passes whole messages' response ids", async () => {
    const { client, calls } = newClient();

    await replay(client, calls, session53997, { sdk126: true });

    // The bridges' own streams repeat replies already on screen by id: ignored.
    expect(client.state.thread.map((row) => [row.role, row.text, row.bridge ?? false, row.responseId])).toEqual([
      ["reader", "What are the headlines?", false, undefined],
      ["agent", bridge1.agent_response, true, bridge1.response_id],
      ["agent", answer1.agent_response, false, answer1.response_id],
      ["reader", "Which consultations are open now?", false, undefined],
      ["agent", bridge2.agent_response, true, bridge2.response_id],
      ["agent", answer2.agent_response, false, answer2.response_id],
    ]);
    expect(client.state.thread[2].citations.map(({ url }) => url)).toEqual(latestArticles.map(({ sourceUrl }) => sourceUrl));
  });

  it("keeps every bridge of a multi-tool turn and pools each batch of results for the answer", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("Which consultations are open now?");
    await settle();
    const conversation = calls.conversations[0];

    const equity = { title: "Equity market transparency changes", sourceUrl: "https://news.example/equity" };
    const nurs = { title: "Minimum redemption terms for NURS funds", sourceUrl: "https://news.example/nurs" };
    const reporting = { title: "Transaction reporting guidance", sourceUrl: "https://news.example/reporting" };

    const stream = (text, responseId) => {
      conversation.emitPart("start", "", 3, responseId);
      conversation.emitPart("delta", text, 3, responseId);
      conversation.emitPart("stop", "", 3, responseId);
    };
    const search = (articles) => {
      conversation.emitMCPToolCall({ state: "loading", tool_name: "search_articles" });
      return () => conversation.emitMCPToolCall({ state: "success", tool_name: "search_articles", result: mcpResult(articles) });
    };

    // The first bridge's whole message lands before its call and its own
    // stream, as observed live...
    const first = "I'll check the latest coverage on open consultations for you.";
    conversation.emitMessage(first, "agent", 3);
    let finish = search([]);
    stream(first, "r1");
    finish();

    // ...and a later one's arrives before its own stream too, under the same
    // event_id: it is a new reply, not the first bridge rewritten.
    const second = "Let me broaden that search a bit.";
    conversation.emitMessage(second, "agent", 3);
    finish = search([equity]);
    stream(second, "r2");
    finish();

    expect(client.state.thread.map((row) => row.text)).toEqual(["Which consultations are open now?", first, second]);

    // A bridge can also stream first. This one names an article already
    // found, and still cites nothing once its tool call starts.
    const third = "Equity market transparency changes is one. Let me look for newer ones.";
    stream(third, "r3");
    conversation.emitMessage(third, "agent", 3);
    finish = search([nurs, reporting]);
    finish();

    const answer = "Equity market transparency changes closes 16 October.\n\nMinimum redemption terms for NURS funds is the newest.";
    stream(answer, "r4");
    conversation.emitMessage(answer, "agent", 3);

    const thread = client.state.thread;
    expect(thread.map((row) => [row.text, row.bridge ?? false])).toEqual([
      ["Which consultations are open now?", false],
      [first, true],
      [second, true],
      [third, true],
      [answer, false],
    ]);
    expect(thread.slice(1, 4).map((row) => row.citations)).toEqual([[], [], []]);
    expect(thread[3].layout.segments.flatMap(({ citations }) => citations)).toEqual([]);

    // Every batch reaches the answer, not just the last one.
    expect(thread[4].citations).toHaveLength(2);
    expect(thread[4].citations).toEqual(expect.arrayContaining([
      { title: equity.title, url: equity.sourceUrl },
      { title: nurs.title, url: nurs.sourceUrl },
    ]));
  });

  it("follows a stream out of sight while it repeats the reply on screen", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What are the headlines?");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitMessage("Here are the latest headlines:", "agent", 2);
    conversation.emitPart("start", "", 2, "r1");
    conversation.emitPart("delta", "## Here are the ", 2, "r1");
    expect(client.state.thread).toHaveLength(2);

    // The platform strips Markdown from whole messages, not from parts.
    conversation.emitPart("delta", "**latest** headlines:", 2, "r1");
    conversation.emitPart("stop", "", 2, "r1");

    expect(client.state.thread).toHaveLength(2);
    expect(client.state.thread[1]).toMatchObject({ text: "Here are the latest headlines:", streaming: false, responseId: "r1", fromParts: true });
  });

  it("shows a stream as its own reply once its words part from the reply on screen", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What's new?");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitMessage("Let me look that up.", "agent", 4);
    conversation.emitPart("start", "", 4, "r2");
    conversation.emitPart("delta", "Let me ", 4, "r2");
    expect(client.state.thread).toHaveLength(2);

    conversation.emitPart("delta", "see what I can find.", 4, "r2");
    expect(client.state.thread).toHaveLength(3);
    expect(client.state.thread[2]).toMatchObject({ text: "Let me see what I can find.", streaming: true, typing: false, responseId: "r2", eventId: 4 });
    expect(client.state.thread[2].layout, "a streaming reply has no layout yet").toBeUndefined();

    conversation.emitPart("stop", "", 4, "r2");
    conversation.emitMessage("Let me see what I can find.", "agent", 4);

    expect(client.state.thread.map((row) => row.text)).toEqual(["What's new?", "Let me look that up.", "Let me see what I can find."]);
    expect(client.state.thread[2]).toMatchObject({ streaming: false, responseId: "r2" });
  });

  it("cites articles an earlier turn's tools found", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What are today's top stories?");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitMCPToolCall({ state: "success", result: mcpResult([
      { title: "First story", sourceUrl: "https://news.example/first" },
      { title: "Second story", sourceUrl: "https://news.example/second" },
    ]) });
    conversation.emitPart("start", "", 1);
    conversation.emitPart("delta", "There are two today.", 1);
    conversation.emitPart("stop", "", 1);

    // Two articles and neither named: nothing to cite.
    expect(client.state.thread[1].citations).toEqual([]);

    client.sendUserMessage("Tell me about the second");
    conversation.emitPart("start", "", 2);
    conversation.emitPart("delta", "The Second story has the latest details.", 2);
    conversation.emitPart("stop", "", 2);

    expect(client.state.thread[3].citations).toEqual([{ title: "Second story", url: "https://news.example/second" }]);
  });

  it("shows the one article a turn's tools returned under an answer that does not name it", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("Tell me more about the redemption one");
    await settle();
    const conversation = calls.conversations[0];

    const article = { title: "CP26/35: FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets", url: "https://news.example/cp26-35" };

    // No bridge this time: the waiting bubble is never marked as one.
    conversation.emitMCPToolCall({ state: "loading", tool_name: "get_article" });
    expect(client.state.thread[1].bridge).toBeUndefined();

    conversation.emitMCPToolCall({
      state: "success",
      tool_name: "get_article",
      result: [{ type: "text", text: JSON.stringify({ article: { id: "4f41", title: article.title, sourceUrl: article.url, summary: null } }) }],
    });
    conversation.emitPart("start", "", 6, "r1");
    conversation.emitPart("delta", "It sets a notice period before investors can take their money out. Comments are open until January.", 6, "r1");
    conversation.emitPart("stop", "", 6, "r1");

    const reply = client.state.thread[1];
    expect(reply.bridge).toBeUndefined();
    expect(inlineCitations(reply)).toEqual([]);
    expect(reply.layout.trailing).toEqual([article]);
    expect(reply.citations).toEqual([article]);
  });

  it("keeps no citations on a reply cut short", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What are today's top stories?");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitMCPToolCall({ state: "success", result: mcpResult([
      { title: "First story", sourceUrl: "https://news.example/first" },
      { title: "Second story", sourceUrl: "https://news.example/second" },
    ]) });
    conversation.emitPart("start", "", 5, "r1");
    conversation.emitPart("delta", "The Second story has ", 5, "r1");
    client.interrupt();

    expect(client.state.thread[1]).toMatchObject({ text: "The Second story has ", interrupted: true, citations: [] });
    expect(inlineCitations(client.state.thread[1])).toEqual([]);
    expect(client.state.thread[1].layout.trailing).toEqual([]);

    // Asking again over a reply cuts it short the same way.
    client.sendUserMessage("And the first?");
    conversation.emitPart("start", "", 6, "r2");
    conversation.emitPart("delta", "The First story was ", 6, "r2");
    client.sendUserMessage("Never mind");

    expect(client.state.thread[3]).toMatchObject({ text: "The First story was ", interrupted: true, citations: [] });
    expect(inlineCitations(client.state.thread[3])).toEqual([]);
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

    const client = new RealAgentClient({ agentId: "agent_123", authClient: fakeAuthClient(), loadSdk: async () => sdk });

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
    const client = new RealAgentClient({ agentId: "agent_123", authClient: fakeAuthClient(), loadSdk: async () => failingSdk });

    client.startSession();
    await settle();

    expect(client.state).toMatchObject({ kind: "none", status: "idle" });
    expect(client.state.thread).toHaveLength(0);
  });

  it("keeps the question but drops the blank bubble when a text session fails", async () => {
    const failingSdk = { Conversation: { startSession: async () => { throw new Error("agent not found"); } } };
    const client = new RealAgentClient({ agentId: "agent_missing", authClient: fakeAuthClient(), loadSdk: async () => failingSdk });

    client.sendUserMessage("What happened?");
    await settle();

    expect(client.state).toMatchObject({ kind: "none", status: "idle" });
    expect(client.state.thread).toMatchObject([{ role: "reader", text: "What happened?" }]);
  });

  it("stops the local reveal and ignores every later event from that turn", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What happened?");
    await settle();
    const conversation = calls.conversations[0];

    conversation.emitPart("start", "", 3);
    conversation.emitPart("delta", "It ", 3);

    client.interrupt();
    expect(client.state.thread[1]).toMatchObject({ text: "It ", streaming: false });

    conversation.emitPart("delta", "launched.", 3);
    conversation.emitMessage("It launched.", "agent", 3);
    conversation.emitCorrection("It launched after all.", 3, "It launched.");
    expect(client.state.thread[1].text).toEqual("It ");
  });

  it("drops a blank interrupted reply and suppresses its turn once it starts", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What happened?");
    await settle();
    const conversation = calls.conversations[0];

    client.interrupt();
    expect(client.state.thread.map((row) => row.role)).toEqual(["reader"]);

    conversation.emitPart("start", "", 3);
    conversation.emitPart("delta", "It launched.", 3);
    conversation.emitPart("stop", "", 3);
    conversation.emitMessage("It launched.", "agent", 3);
    expect(client.state.thread.map((row) => row.role)).toEqual(["reader"]);

    client.sendUserMessage("What happened next?");
    conversation.emitPart("start", "", 4);
    conversation.emitPart("delta", "It landed.", 4);
    conversation.emitPart("stop", "", 4);

    expect(client.state.thread.map((row) => [row.role, row.text])).toEqual([
      ["reader", "What happened?"],
      ["reader", "What happened next?"],
      ["agent", "It landed."],
    ]);
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

  it("suppresses the configured greeting for text sessions but not for calls", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What happened?");
    await settle();

    expect(calls.configs[0].overrides).toEqual({ agent: { firstMessage: "" } });

    client.startSession();
    await settle();

    expect(calls.configs[1].textOnly).toBeUndefined();
    expect(calls.configs[1].overrides).toBeUndefined();
  });

  it("reconnects without the override when the agent's settings refuse it", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What happened?");
    await settle();

    // Observed live: the session connects, then the platform closes it.
    calls.conversations[0].emitStatus("connected");
    calls.conversations[0].emitDisconnect({
      reason: "error",
      message: "Override for field 'first_message' is not allowed by config.",
      context: { type: "close", code: 1008 },
    });
    await settle();

    expect(calls.configs).toHaveLength(2);
    expect(calls.configs[1].overrides).toBeUndefined();
    expect(calls.configs[1].signedUrl, "the retry used a fresh credential").not.toEqual(calls.configs[0].signedUrl);
    expect(calls.conversations[1].sent, "the question is replayed").toEqual(["What happened?"]);

    // The reader's bubble survived the reconnect, and the reply lands in it.
    expect(client.state.thread.map((row) => row.role)).toEqual(["reader", "agent"]);

    calls.conversations[1].emitPart("start", "", 1);
    calls.conversations[1].emitPart("delta", "It launched.", 1);
    calls.conversations[1].emitPart("stop", "", 1);

    expect(client.state.thread).toHaveLength(2);
    expect(client.state.thread[1]).toMatchObject({ text: "It launched.", streaming: false });

    // The refusal is remembered: later sessions skip the override outright.
    client.endSession();
    client.sendUserMessage("And another thing?");
    await settle();

    expect(calls.configs).toHaveLength(3);
    expect(calls.configs[2].overrides).toBeUndefined();
  });

  it("treats other error disconnects normally, without a retry", async () => {
    const { client, calls } = newClient();

    client.sendUserMessage("What happened?");
    await settle();
    calls.conversations[0].emitDisconnect({ reason: "error", message: "The connection dropped." });
    await settle();

    expect(calls.configs).toHaveLength(1);
    expect(client.state).toMatchObject({ kind: "none", status: "idle" });
    expect(client.state.thread.map((row) => row.role), "no blank bubble stays behind").toEqual(["reader"]);
  });

  it("answers locked questions with the offer and no session", async () => {
    const { client, calls } = newClient();

    client.appendLocked("What happened?");
    await settle();

    expect(calls.configs).toHaveLength(0);
    expect(client.state.thread).toMatchObject([{ role: "reader", text: "What happened?" }, { role: "locked" }]);
  });
});
