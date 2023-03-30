import PlayerApiClient from "../api_clients/playerApiClient";
import snakeCaseKeys from "./snakeCaseKeys";
import resolveTheme from "./resolveTheme";

const setPropsFromApi = async (player) => {
  const client = new PlayerApiClient(player.playerApiUrl, player.projectId);
  if (!player.playerApiUrl || !player.projectId) { return; }

  const identifiers = identifiersArray(player);
  if (identifiers.length === 0) { return; }

  const data = await fetchData(client, identifiers);
  if (!data) { return; }

  // The player allows you to override props from the API by adding them in the script tag.
  // For example, you could add { backgroundCollor: "yellow" } to set a different color.
  //
  // If player.backgroundColor is changed again later and a new API request is made, this
  // change will only persist if it was initially overridden in the script tag.
  setProps(player, data);
};

const identifiersArray = (player) => {
  const identifiers = [];

  if (player.contentId)  { identifiers.push({ content_id: player.contentId }); }
  if (player.playlistId) { identifiers.push({ playlist_id: player.playlistId }); }
  if (player.sourceId)   { identifiers.push({ source_id: player.sourceId }); }
  if (player.sourceUrl)  { identifiers.push({ source_url: player.sourceUrl }); }
  if (player.playlist)   { identifiers.push(...snakeCaseKeys(player.playlist)); }

  return [...new Set(identifiers.map(JSON.stringify))].map(JSON.parse);
};

const fetchData = (client, identifiers) => {
  const identifier = identifiers[0];

  if (identifiers.length > 1) { return client.byIdentifiers(identifiers); }
  if (identifier.content_id)  { return client.byContentId(identifier.content_id); }
  if (identifier.playlist_id) { return client.byPlaylistId(identifier.playlist_id); }
  if (identifier.source_id)   { return client.bySourceId(identifier.source_id); }
  if (identifier.source_url)  { return client.bySourceUrl(identifier.source_url); }
};

const setProps = (player, data) => {
  const theme = resolveTheme(data.settings.theme);
  const colors = data.settings[`${theme}_theme`];

  // TODO: allow overriddable for some fields based on subscription
  //       e.g. logo_icon_enabled could be overridable if on a premium plan

  set(player, "analyticsUrl", data.settings.analytics_url);
  set(player, "playerStyle", data.settings.player_style);
  set(player, "playerTitle", data.playlist?.title || data.settings.player_title);
  set(player, "callToAction", data.settings.call_to_action);
  set(player, "textColor", colors.text_color);
  set(player, "backgroundColor", colors.background_color);
  set(player, "iconColor", colors.icon_color);
  // TODO: title_enabled
  // TODO: image_enabled
  set(player, "widgetStyle", data.settings.widget_style);
  set(player, "widgetPosition", data.settings.widget_position);
  // TODO: segment_playback_enabled
  set(player, "skipButtonStyle", data.settings.skip_button_style);
  // TODO: paywall_type
  // TODO: paywall_url
  // TODO: download_button_enabled
  // TODO: share_button_enabled
  // TODO: voice_icon_enabled
  set(player, "logoIconEnabled", data.settings.logo_icon_enabled, { overridable: false });
  set(player, "analyticsConsent", analyticsConsent(data.settings), { overridable: false });
  set(player, "analyticsCustomUrl", data.settings.analytics_custom_url);
  set(player, "analyticsId", data.settings.analytics_id, { overridable: false });
  set(player, "analyticsTag", data.settings.analytics_tag);

  set(player, "content", data.content.map((item) => ({
    id: item.id,
    title: item.title,
    imageUrl: data.playlist?.image_url || item.image_url,
    sourceUrl: item.source_url,
    adsEnabled: item.ads_enabled,
    duration: item.audio[0] ? item.audio[0].duration / 1000 : 0,
    media: [...item.video, ...item.audio].map((media) => ({
      id: media.id,
      url: media.url,
      contentType: media.content_type,
    })),
    segments: item.segments.map((segment) => ({
      marker: segment.marker,
      startTime: segment.start_time ? segment.start_time / 1000 : 0,
      duration: segment.duration ? segment.duration / 1000 : 0,
    })),
  })));

  set(player, "adverts", data.ads.map((item) => {
    const isVast = item.type === "vast";

    const theme = resolveTheme(item.theme);
    const colors = item[`${theme}_theme`];

    return {
      id: item.id,
      type: item.type,
      placement: item.placement,
      vastUrl: isVast ? item.vast_url : null,
      clickThroughUrl: !isVast ? item.click_through_url : null,
      textColor: colors?.text_color,
      backgroundColor: colors?.background_color,
      iconColor: colors?.icon_color,
      // TODO: imageUrl
      media: isVast ? [] : item.media.map((media) => ({
        id: media.id,
        url: media.url,
        contentType: media.content_type,
      })),
    };
  }));
};

const set = (player, propName, value, { overridable = true } = {}) => {
  const overriddenByScriptTag = typeof player.initialProps[propName] !== "undefined";
  if (overriddenByScriptTag && overridable) { return; }

  if (overriddenByScriptTag && !overridable) {
    console.error(`Property '${propName}' cannot be overridden. Please contact support@beyondwords.io.`); // TODO: extract and add context
  }

  player[propName] = value;
};

const analyticsConsent = ({ analytics_enabled, analytics_uuid_enabled }) => {
  if (!analytics_enabled)      { return "none"; }
  if (!analytics_uuid_enabled) { return "without-uuids"; }

  return "allowed";
};

export default setPropsFromApi;
export { identifiersArray, fetchData };
