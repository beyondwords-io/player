import AnalyticsClient from "../api_clients/analyticsClient";
import { validateAnalyticsEvent } from "../helpers/eventValidation";
import { v4 as randomUuid } from "uuid";

const sendToAnalytics = (player, playerEvent) => {
  const client = new AnalyticsClient(player.analyticsUrl);
  if (!player.analyticsUrl) { return; }

  const eventType = analyticsEventType(playerEvent.type);
  if (!eventType) { return; }

  const alreadyLoaded = !!player.listenSessionId;
  if (eventType === "load" && alreadyLoaded) { return; }

  const analyticsEvent = eventFromProps(player, eventType);
  validateAnalyticsEvent(analyticsEvent);

  return client.sendEvent(analyticsEvent);
};

const analyticsEventType = (playerEventType) => (
  playerEventType === "DurationUpdated" ? "load" : null
);

const eventFromProps = (player, eventType) => {
  player.listenSessionId = player.listenSessionId || randomUuid();
  localStorage.userId = localStorage.userId || JSON.stringify(randomUuid());

  const activeAdvert = player.adverts[player.advertIndex];
  const contentItem = player.content[player.contentIndex];

  return {
    event_type: eventType,
    device_type: "desktop", // TODO
    media_type: activeAdvert ? "ad" : "content",
    project_id: player.projectId,
    content_id: contentItem?.id,
    publisher_id: null, // TODO
    ad_id: activeAdvert?.id,
    media_id: (activeAdvert || contentItem)?.media[0]?.id, // TODO: reorder content/advert media based on player style?
    user_id: JSON.parse(localStorage.userId),
    listen_session_id: player.listenSessionId,
    duration: player.duration,
    listen_length_seconds: player.currentTime,
    listen_length_percent: player.currentTime / player.duration,
    speed: player.playbackRate,
    location: window.location.href,
    referrer: document.referrer,
  };
};

export default sendToAnalytics;
