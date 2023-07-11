import AnalyticsClient from "../api_clients/analyticsClient";
import { validateAnalyticsEvent } from "../helpers/eventValidation";
import { v4 as randomUuid } from "uuid";
import { version } from "../../package.json";

const sendToAnalytics = (player, playerEvent) => {
  const eventType = analyticsEventType(player, playerEvent.type);
  if (!eventType) { return; }

  const analyticsEvent = eventFromProps(player, eventType);
  validateAnalyticsEvent(analyticsEvent);

  if (player.analyticsUrl && player.analyticsConsent !== "none") {
    const client = new AnalyticsClient(player.analyticsUrl);
    client.sendToCustomAnalytics(analyticsEvent);
  }

  if (player.analyticsCustomUrl && player.analyticsConsent !== "none") {
    const client = new AnalyticsClient(player.analyticsCustomUrl);
    client.sendToCustomAnalytics(analyticsEvent);
  }

  if (player.analyticsTag) {
    const client = new AnalyticsClient(player.analyticsTag);
    client.sendToGoogleAnalytics(gaEventName(analyticsEvent), analyticsEvent);
  }
};

const analyticsEventType = (player, playerEventType) => {
  // Emit a 'load' event once only. Wait for the media duration to be known.
  if (!player.listenSessionId && player.duration) { return "load"; }

  // Emit a 'play' event after 'PlaybackPlaying' followed by 'CurrentTimeUpdated'.
  // Only emit for new listens, i.e. if the content/advert changed from what it was previously.
  if (playerEventType === "PlaybackPlaying" && isNewListen(player)) { player.isNewListen = true; }
  if (playerEventType === "CurrentTimeUpdated" && player.isNewListen) { player.isNewListen = false; return "play"; }

  // Emit a 'play_progress' event for each 10%, 20%, ..., 100% of playback reached.
  if (playerEventType === "CurrentTimeUpdated" && isNextPercentage(player)) { return "play_progress"; }

  // Emit an 'ad_link_click' event when you press on an advert link/button/image/video.
  if (playerEventType.startsWith("PressedAdvert")) { return "ad_link_click"; }
};

const eventFromProps = (player, analyticsEventType) => {
  player.listenSessionId ||= randomUuid();
  player.sessionCreatedAt ||= Date.now();

  const withoutStorage = ["without-local-storage", "none"].includes(player.analyticsConsent);
  if (!withoutStorage) { localStorage.beyondwords ||= JSON.stringify(randomUuid()); }

  const activeAdvert = player.adverts[player.advertIndex];
  const contentItem = player.content[player.contentIndex];
  const percentage = player.duration ? (player.currentTime / player.duration) * 100 : 0;

  return {
    event_type: analyticsEventType,
    device_type: deviceType(),
    media_type: activeAdvert ? "ad" : "content",
    project_id: player.projectId,
    content_id: contentItem?.id,
    source_id: contentItem?.sourceId,
    analytics_id: player.analyticsId,
    ad_id: activeAdvert?.id,
    media_id: player.loadedMedia?.id,
    local_storage_id: withoutStorage ? null : JSON.parse(localStorage.beyondwords),
    listen_session_id: player.listenSessionId,
    session_created_at: player.sessionCreatedAt,
    duration: player.duration,
    listen_length_seconds: player.currentTime,
    listen_length_percent: Math.max(0, Math.min(100, percentage)),
    speed: player.playbackRate,
    location: window.location.href,
    referrer: document.referrer,
    player_version: "1",
    player_npm_version: version,
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

const isNewListen = (player) => {
  let changed = false;

  // Handle content/adverts separately so that we don't consider it a new listen
  // after mid-roll adverts, or if the same advert is played twice in a row.
  const isAdvert = player.advertIndex !== -1;

  if (isAdvert) {
    const advertId = player.adverts[player.advertIndex]?.id || player.advertIndex;
    changed = advertId !== player.prevAdvertId;
    player.prevAdvertId = advertId;
  } else {
    const contentId = player.content[player.contentIndex]?.id || player.contentIndex;
    changed = contentId !== player.prevContentId;
    player.prevContentId = contentId;
  }

  return changed;
};

const isNextPercentage = (player) => {
  // We send 'play' events with media_type: 'content' when the intro is played
  // but we should not send 'play_progress' events during the intro/outro.
  if (player.introsOutrosIndex !== -1) { return; }

  const nextPercentage = player.prevPercentage + 10;
  const currentPercentage = (player.currentTime / player.duration) * 100;

  if (currentPercentage >= nextPercentage) {
    player.prevPercentage = Math.floor(currentPercentage / 10) * 10;
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
