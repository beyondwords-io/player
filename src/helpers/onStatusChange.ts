import WebSocketClient from "../api_clients/webSocketClient";
import newEvent from "../helpers/newEvent";
import throwError from "../helpers/throwError";

// TODO: this function should not keep being called when Player props change
const onStatusChange = async (projectId, writeToken, onEvent) => {
  if (!projectId || !writeToken) { return; }

  const client = new WebSocketClient(projectId, writeToken);

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
  const contentId = webSocketEvent.message.result.content_id;
  const legacyId = webSocketEvent.message.result.legacy_id;
  const contentStatus = webSocketEvent.message.result.state;
  // TODO: also send sourceId and sourceUrl so we can match on those, too?

  onEvent(newEvent({
    type: "ContentStatusChanged",
    description: "The processing status of a content item within the project changed.",
    initiatedBy: "websocket",
    fromWidget: false,
    contentId,
    legacyId,
    contentStatus,
  }));
};

const handleRejection = (webSocketEvent) => {
  throwError("The WebSocket status change subscription was rejected.", { webSocketEvent });
};

const handleError = (error) => {
  throwError("Unexpected WebSocket error.", { error });
};

export default onStatusChange;
