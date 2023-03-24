import fetchJson from "../helpers/fetchJson";
import { v4 as randomUuid } from "uuid";

class WebSocketClient {
  constructor(playerApiUrl, projectId, writeToken) {
    this.baseUrl = this.#resolveBaseUrl(playerApiUrl);
    this.projectId = projectId;
    this.writeToken = writeToken;
  }

  async getWebSocketToken() {
    const headers = { Authorization: `Token token=${this.writeToken}` };
    const { token } = await fetchJson(`https://${this.baseUrl}/api/v4/token/ws`, { headers });
    this.webSocketToken = token;
  }

  async establishConnection(onMessage, onError) {
    const webSocketUrl = `wss://${this.baseUrl}/cable?token=${this.webSocketToken}`;
    const protocol = "actioncable-v1-json";

    this.webSocket = new WebSocket(webSocketUrl, protocol);
    this.webSocket.onmessage = e => onMessage(JSON.parse(e.data));
    this.webSocket.onerror = onError;

    await new Promise(resolve => this.webSocket.onopen = resolve);
  }

  subscribeToStatusChanges() {
    const identifier = JSON.stringify({ channel: "Api::V1::ProjectChannel", id: this.projectId });
    const jsonData = JSON.stringify({ command: "subscribe", identifier });

    this.webSocket.send(jsonData);
  }

  destroy() {
    this.webSocketToken = null;
    if (!this.webSocket) { return; }

    this.webSocket.onmessage = () => {};
    this.webSocket.onerror = () => {};
    this.webSocket.close();
    this.webSocket = null;
  }

  // private

  #resolveBaseUrl(playerApiUrl) {
    if (playerApiUrl.includes("staging")) {
      return "app.staging-beyondwords.io";
    } else {
      return "app.beyondwords.io";
    }
  }
}

export default WebSocketClient;
