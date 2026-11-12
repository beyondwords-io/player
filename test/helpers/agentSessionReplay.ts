import RealAgentClient from "../../src/helpers/realAgentClient";

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

// Replays raw platform frames, as captured from a live session, through the
// SDK callbacks exactly as BaseConversation hands them on. SDK 1.17 (the one
// we ship) drops agent_response's response_id from onMessage; 1.26+ passes
// it on. configOf returns the current session's startSession config.
const replayFrames = async (client, configOf, frames, { sdk126 = false } = {}) => {
  for (const frame of frames) {
    if (frame.type === "user_message") {
      client.sendUserMessage(frame.text);
      await settle();
      continue;
    }

    const config = configOf();

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

// A text session's client after replaying a whole capture, with just enough
// SDK and auth service to reach the callbacks.
const replayedClient = async (frames, options = {}): Promise<RealAgentClient> => {
  const configs = [];
  const client = new RealAgentClient({
    agentId: "agent_123",
    authClient: {
      agentSession: async () => ({ connection_type: "websocket", signed_url: "wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=sig", expires_at: 1790597571 }),
    },
    loadSdk: async () => ({
      Conversation: {
        startSession: async (config) => {
          configs.push(config);
          return { sendUserMessage: () => {}, sendUserActivity: () => {}, setMicMuted: () => {}, endSession: async () => {} };
        },
      },
    }),
  });

  await replayFrames(client, () => configs.at(-1), frames, options);
  return client;
};

export { replayFrames, replayedClient };
