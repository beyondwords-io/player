import WebSocketClient from "../api_clients/webSocketClient";
import newEvent from "../helpers/newEvent";
import throwError from "../helpers/throwError";

let client;

const onStatusChange = async (playerApiUrl, projectId, writeToken, onEvent) => {
  if (!playerApiUrl || !projectId || !writeToken) { return; }

  client?.destroy();
  client = new WebSocketClient(playerApiUrl, projectId, writeToken);

  await client.getWebSocketToken();
  await client.establishConnection(handleMessage(onEvent), handleError);
  await client.subscribeToStatusChanges();
};

const handleMessage = (onEvent) => (webSocketEvent) => {
  const isStatusChange = webSocketEvent?.message?.result?.action === "podcast_state_updated";
  if (isStatusChange) { handleStatusChange(webSocketEvent, onEvent); }

  const isRejection = webSocketEvent.type === "reject_subscription";
  if (isRejection) { handleRejection(webSocketEvent); }
};

const handleStatusChange = (webSocketEvent, onEvent) => {
  const result = webSocketEvent.message.result;

  onEvent(newEvent({
    type: "ContentStatusChanged",
    description: "The processing status of a content item within the project changed.",
    initiatedBy: "websocket",
    contentId: result.content_id,
    legacyId: result.legacy_id,
    sourceId: result.source_id,
    sourceUrl: result.source_url,
    contentStatus: result.state,
  }));
};

const handleRejection = (webSocketEvent) => {
  throwError("The WebSocket status change subscription was rejected.", { webSocketEvent });
};

const handleError = (error) => {
  throwError("Unexpected WebSocket error.", { error });
};

export default onStatusChange;
