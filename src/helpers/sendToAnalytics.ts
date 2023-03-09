import AnalyticsClient from "../api_clients/analyticsClient";
import { validateAnalyticsEvent } from "../helpers/eventValidation";
import { v4 as randomUuid } from "uuid";

const sendToAnalytics = (player, playerEvent) => {
  const eventType = analyticsEventType(player, playerEvent.type);
  if (!eventType) { return; }

  const analyticsEvent = eventFromProps(player, eventType);
  validateAnalyticsEvent(analyticsEvent);

  if (player.analyticsUrl && player.analyticsConsent !== "none") {
    const client = new AnalyticsClient(player.analyticsUrl);
    client.sendToCustomAnalytics(analyticsEvent);
  }

  // TODO: add customAnalyticsUrl to player_settings ?

  if (player.analyticsTag) {
    const client = new AnalyticsClient(player.analyticsTag);
    client.sendToGoogleAnalytics(gaEventName(analyticsEvent), analyticsEvent);
  }
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

  // Emit an 'ad_link_click' event when you press on an advert link/button/video.
  if (playerEventType.startsWith("PressedAdvert")) { return "ad_link_click"; }
};

const eventFromProps = (player, analyticsEventType) => {
  player.listenSessionId = player.listenSessionId || randomUuid();
  localStorage.beyondwords = localStorage.beyondwords || JSON.stringify(randomUuid());

  const activeAdvert = player.adverts[player.advertIndex];
  const contentItem = player.content[player.contentIndex];
  const percentage = (player.currentTime / player.duration) * 100;
  const withoutUuids = player.analyticsConsent === "without-uuids";

  return {
    event_type: analyticsEventType,
    device_type: deviceType(),
    media_type: activeAdvert ? "ad" : "content",
    project_id: player.projectId,
    content_id: contentItem?.id,
    analytics_id: player.analyticsId,
    ad_id: activeAdvert?.id,
    media_id: (activeAdvert || contentItem)?.media[0]?.id,
    local_storage_id: withoutUuids ? null : JSON.parse(localStorage.beyondwords),
    listen_session_id: withoutUuids ? null : player.listenSessionId,
    duration: player.duration,
    listen_length_seconds: player.currentTime,
    listen_length_percent: Math.max(0, Math.min(100, percentage)),
    speed: player.playbackRate,
    location: window.location.href,
    referrer: document.referrer,
  };
};

const gaEventName = ({ event_type, listen_length_percent }) => {
  const percentage = Math.floor(listen_length_percent / 10) * 10;

  if (event_type === "load") { return "Load"; }
  if (event_type === "play") { return "Play"; }
  if (event_type === "play_progress" && percentage === 100) { return "Complete"; }
  if (event_type === "play_progress") { return `${percentage}% listened`; }
  if (event_type === "ad_link_click") { return "Advert Click"; }
};

const isNextPercentage = (player) => {
  const nextPercentage = player.prevPercentage + 10;
  const currentPercentage = (player.currentTime / player.duration) * 100;

  if (currentPercentage >= nextPercentage) {
    player.prevPercentage = nextPercentage;
    return true;
  }
};

const deviceType = () => {
  if (maxDeviceWidth(499)) { return "phone"; }  // Return 'phone' for 0 <= width < 499
  if (maxDeviceWidth(999)) { return "tablet"; } // Return 'tablet' for 500 <= width < 1000

  return "desktop";                             // Return 'desktop' for 1000 <= width
};

const maxDeviceWidth = (pixels) => (
  window.matchMedia && window.matchMedia(`only screen and (max-device-width: ${pixels}px)`).matches
);

export default sendToAnalytics;
