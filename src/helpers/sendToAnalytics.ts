import AnalyticsClient from "../api_clients/analyticsClient";
import { validateAnalyticsEvent } from "../helpers/eventValidation";
import { v4 as randomUuid } from "uuid";

const sendToAnalytics = (player, playerEvent) => {
  const client = new AnalyticsClient(player.analyticsUrl);
  if (!player.analyticsUrl) { return; }

  const eventType = analyticsEventType(player, playerEvent.type);
  if (!eventType) { return; }

  const alreadyLoaded = !!player.listenSessionId;
  if (eventType === "load" && alreadyLoaded) { return; }

  const analyticsEvent = eventFromProps(player, eventType);
  validateAnalyticsEvent(analyticsEvent);

  return client.sendEvent(analyticsEvent);
};

const analyticsEventType = (player, playerEventType) => {
  // Emit a 'load' event once only. Wait for the media duration to be known.
  if (!player.listenSessionId && player.duration) { return "load"; }

  // Emit a 'play' event after 'PlaybackPlaying' followed by 'CurrentTimeUpdated'.
  // This ensures player.duration has been updated from the media.
  if (playerEventType === "PlaybackPlaying") { player.emitPlayEvent = "CurrentTimeUpdated"; }
  if (playerEventType === player.emitPlayEvent) { delete player.emitPlayEvent; return "play"; }

  // Emit a 'play_progress' event for each 10%, 20%, ..., 100% of playback reached.
  if (playerEventType === "CurrentTimeUpdated" && isNextPercentage(player)) { return "play_progress"; }

  // TODO: advert click
  // TODO: make sure works for vast ads
};

const eventFromProps = (player, analyticsEventType) => {
  player.listenSessionId = player.listenSessionId || randomUuid();
  localStorage.userId = localStorage.userId || JSON.stringify(randomUuid());

  const activeAdvert = player.adverts[player.advertIndex];
  const contentItem = player.content[player.contentIndex];
  const percentage = (player.currentTime / player.duration) * 100;

  return {
    event_type: analyticsEventType,
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
    listen_length_percent: Math.max(0, Math.min(100, percentage)),
    speed: player.playbackRate,
    location: window.location.href,
    referrer: document.referrer,
  };
};

const isNextPercentage = (player) => {
  const nextPercentage = player.prevPercentage + 10;
  const currentPercentage = (player.currentTime / player.duration) * 100;

  if (currentPercentage >= nextPercentage) {
    player.prevPercentage = nextPercentage;
    return true;
  }
};

export default sendToAnalytics;
