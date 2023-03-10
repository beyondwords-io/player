import fetchJson from "../helpers/fetchJson";
import { v4 as randomUuid } from "uuid";

class WebSocketClient {
  constructor(projectId, writeToken) {
    this.projectId = projectId;
    this.writeToken = writeToken;
  }

  async getWebSocketToken() {
    const headers = { Authorization: `Token token=${this.writeToken}` };
    const { token } = await fetchJson("https://app.staging-beyondwords.io/api/v4/token/ws", { headers });

    this.webSocketToken = token; // TODO: onError
  }

  async establishConnection(onMessage, onError) {
    const webSocketUrl = `wss://app.staging-beyondwords.io/cable?token=${this.webSocketToken}`;
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
}

export default WebSocketClient;
