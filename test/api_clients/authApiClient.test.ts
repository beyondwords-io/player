import AuthApiClient from "../../src/api_clients/authApiClient";

const fetchMock = vi.fn();

const respondWith = (json) => {
  fetchMock.mockResolvedValueOnce({ status: 200, json: async () => json });
};

describe("AuthApiClient", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each([2476, "2476"])("posts project id %j as a JSON number for text sessions", async (projectId) => {
    const json = { connection_type: "websocket", signed_url: "wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=sig", expires_at: 1790597571 };
    respondWith(json);
    const client = new AuthApiClient({ authApiUrl: "https://auth.example.com", projectId });

    const result = await client.agentSession("text");

    expect(result).toEqual(json);
    expect(fetchMock).toHaveBeenCalledWith("https://auth.example.com/agent/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: 2476, mode: "text" }),
    });
    expect(client.lastRequestUrl).toEqual("https://auth.example.com/agent/session");
    expect(client.projectId).toBe(projectId);
  });

  it.each([2476, "2476"])("posts project id %j as a JSON number for voice sessions", async (projectId) => {
    respondWith({ connection_type: "webrtc", conversation_token: "eyJ.token", expires_at: 1790606290 });
    const client = new AuthApiClient({ authApiUrl: "https://auth.example.com", projectId });

    const result = await client.agentSession("voice");

    expect(fetchMock).toHaveBeenCalledWith("https://auth.example.com/agent/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: 2476, mode: "voice" }),
    });
    expect(result).toMatchObject({ connection_type: "webrtc", conversation_token: "eyJ.token" });
    expect(client.projectId).toBe(projectId);
  });

  it("rejects a response that carries no credential for its connection type", async () => {
    const client = new AuthApiClient({ authApiUrl: "https://auth.example.com", projectId: "2476" });

    for (const json of [
      { connection_type: "websocket", expires_at: 1 },
      { connection_type: "webrtc", signed_url: "wss://example", expires_at: 1 },
      { connection_type: "carrier-pigeon", signed_url: "wss://example", expires_at: 1 },
      { connection_type: "websocket", signed_url: "", expires_at: 1 },
      null,
    ]) {
      respondWith(json);
      await expect(client.agentSession("text"), JSON.stringify(json)).rejects.toThrow(/returned no session credential/);
    }
  });
});
