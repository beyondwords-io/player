import AnalyticsClient from "../api_clients/analyticsClient";
import { validateAnalyticsEvent } from "../helpers/eventValidation";

const sendToAnalytics = (player, playerEvent) => {
  const client = new AnalyticsClient(player.analyticsUrl);
  if (!player.analyticsUrl) { return; }

  const mappedEvent = mapToAnalyticsEvent(playerEvent);
  if (!mappedEvent) { return; }

  validateAnalyticsEvent(mappedEvent);
  return client.sendEvent(mappedEvent);
};

import { v4 as randomUuid } from "uuid";

const mapToAnalyticsEvent = (playerEvent) => {
  return;

  return {
    event_type: "load",
    device_type: "desktop",
    media_type: "podcast",
    podcast_id: null,
    project_id: null,
    publisher_id: null,
    campaign_id: null,
    media_id: null,
    user_id: null,
    listen_session_id: randomUuid(),
    created_at_date: null,
    created_at_datetime: null,
    duration: null,
    listen_length_percent: null,
    listen_length_seconds: null,
    listen_from_start_length_seconds: null,
    speed: null,
    location: window.location.href,
    referrer: "",
  };
};

export default sendToAnalytics;
