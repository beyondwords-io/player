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

type AccessSession = {
  access_token: string;
  expires_at: number;
};

class AuthApiClient {
  baseUrl: string;
  projectId: number;
  lastRequestUrl: string | undefined;

  constructor({
    authApiUrl,
    projectId,
  }: {
    authApiUrl: string;
    projectId: number;
  }) {
    this.baseUrl = authApiUrl;
    this.projectId = projectId;
  }

  async agentSession({
    mode,
    integrationType,
    sessionToken,
  }: {
    mode: AgentSessionMode;
    integrationType?: string;
    sessionToken?: string;
  }): Promise<AgentSession> {
    const session = await this.#postJson("agent/session", {
      project_id: this.projectId,
      mode,
      integration_type: integrationType,
      session_token: sessionToken,
    });

    const credential = session?.connection_type === "webrtc" ? session.conversation_token
      : session?.connection_type === "websocket" ? session.signed_url
      : undefined;

    if (typeof credential !== "string" || !credential) {
      throwError(`The auth service returned no agent session credentials`, { responseJson: session });
    }

    return session;
  }

  async verify({ integrationType, sessionToken }: { integrationType: string; sessionToken: string }): Promise<AccessSession> {
    const session = await this.#postJson("verify", {
      project_id: this.projectId,
      integration_type: integrationType,
      session_token: sessionToken,
    });

    if (typeof session?.access_token !== "string" || !session.access_token) {
      throwError(`The auth service returned no access session credentials`, { responseJson: session });
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
export type { AgentSessionMode, AgentSession, AccessSession };
