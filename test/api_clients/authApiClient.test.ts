import AuthApiClient from "../../src/api_clients/authApiClient";

const mocks = vi.hoisted(() => ({ postJson: vi.fn() }));
vi.mock("../../src/helpers/fetchJson", () => ({ default: vi.fn(), postJson: mocks.postJson }));

describe("AuthApiClient", () => {
  beforeEach(() => mocks.postJson.mockReset());

  it("posts the project id and mode to the agent session endpoint", async () => {
    const json = { connection_type: "websocket", signed_url: "wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=sig", expires_at: 1790597571 };
    mocks.postJson.mockResolvedValue(json);
    const client = new AuthApiClient({ authApiUrl: "https://auth.example.com", projectId: 2476 });

    const result = await client.agentSession({ mode: "text" });

    expect(result).toEqual(json);
    expect(mocks.postJson).toHaveBeenCalledWith("https://auth.example.com/agent/session", { project_id: 2476, mode: "text" });
    expect(Object.keys(mocks.postJson.mock.calls[0][1]), "an anonymous reader sends no credential fields").toEqual(["project_id", "mode"]);
    expect(client.lastRequestUrl).toEqual("https://auth.example.com/agent/session");
  });

  it("sends the reader's credentials with the agent session request", async () => {
    mocks.postJson.mockResolvedValue({ connection_type: "websocket", signed_url: "wss://example.com/agent", expires_at: 1790597571 });
    const client = new AuthApiClient({ authApiUrl: "https://auth.example.com", projectId: 2476 });

    await client.agentSession({ mode: "text", integrationType: "ghost", sessionToken: "ghost_session_token" });

    expect(mocks.postJson).toHaveBeenCalledWith("https://auth.example.com/agent/session", { project_id: 2476, mode: "text", integration_type: "ghost", session_token: "ghost_session_token" });
  });

  it("drops the credentials unless both parts are present", async () => {
    mocks.postJson.mockResolvedValue({ connection_type: "websocket", signed_url: "wss://example.com/agent", expires_at: 1790597571 });
    const client = new AuthApiClient({ authApiUrl: "https://auth.example.com", projectId: 2476 });

    await client.agentSession({ mode: "text", integrationType: "ghost" });
    await client.agentSession({ mode: "text", sessionToken: "ghost_session_token" });

    for (const [, body] of mocks.postJson.mock.calls) {
      expect(Object.keys(body)).toEqual(["project_id", "mode"]);
    }
  });

  it("supports voice sessions", async () => {
    mocks.postJson.mockResolvedValue({ connection_type: "webrtc", conversation_token: "eyJ.token", expires_at: 1790606290 });
    const client = new AuthApiClient({ authApiUrl: "https://auth.example.com", projectId: 2476 });

    const result = await client.agentSession({ mode: "voice" });

    expect(mocks.postJson).toHaveBeenCalledWith("https://auth.example.com/agent/session", { project_id: 2476, mode: "voice" });
    expect(result).toMatchObject({ connection_type: "webrtc", conversation_token: "eyJ.token" });
  });

  it("rejects a response that carries no credential for its connection type", async () => {
    const client = new AuthApiClient({ authApiUrl: "https://auth.example.com", projectId: 2476 });

    for (const json of [
      { connection_type: "websocket", expires_at: 1 },
      { connection_type: "webrtc", signed_url: "wss://example", expires_at: 1 },
      { connection_type: "carrier-pigeon", signed_url: "wss://example", expires_at: 1 },
      { connection_type: "websocket", signed_url: "", expires_at: 1 },
      null,
    ]) {
      mocks.postJson.mockResolvedValueOnce(json);
      await expect(client.agentSession({ mode: "text" }), JSON.stringify(json)).rejects.toThrow(/returned no agent session credentials/);
    }
  });
});
