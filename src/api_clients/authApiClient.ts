import { postJson } from "../helpers/fetchJson";
import throwError from "../helpers/throwError";

type AgentSessionMode = "text" | "voice";

// What /agent/session returns: text sessions get a signed websocket url, voice
// sessions a WebRTC conversation token. Both are single-use and short-lived.
type AgentSession = {
  connection_type: "webrtc";
  conversation_token: string;
  expires_at: number;
} | {
  connection_type: "websocket";
  signed_url: string;
  expires_at: number;
};

class AuthApiClient {
  baseUrl: string;
  projectId: string | number;
  lastRequestUrl: string | undefined;

  constructor({
    authApiUrl,
    projectId,
  }: {
    authApiUrl: string;
    projectId: string | number;
  }) {
    this.baseUrl = authApiUrl;
    this.projectId = projectId;
  }

  async agentSession(mode: AgentSessionMode): Promise<AgentSession> {
    const session = await this.#postJson("agent/session", {
      // SDK integrations can supply a string, but auth requires a JSON number.
      project_id: Number(this.projectId),
      mode,
    });

    const credential = session?.connection_type === "webrtc" ? session.conversation_token
      : session?.connection_type === "websocket" ? session.signed_url
      : undefined;

    if (typeof credential !== "string" || !credential) {
      throwError(`The auth service returned no session credential for ${this.lastRequestUrl}`, { responseJson: session });
    }

    return session;
  }

  #postJson(path: string, data: Record<string, unknown>) {
    // Kept so tooling can show exactly which request produced the response.
    this.lastRequestUrl = `${this.baseUrl}/${path}`;

    return postJson(this.lastRequestUrl, data);
  }
}

export default AuthApiClient;
export type { AgentSessionMode, AgentSession };
