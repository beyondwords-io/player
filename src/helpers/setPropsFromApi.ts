import PlayerApiClient from "../api_clients/playerApiClient";
import snakeCaseKeys from "./snakeCaseKeys";
import resolveTheme from "./resolveTheme";
import newEvent from "./newEvent";

const setPropsFromApi = async (player) => {
  const client = new PlayerApiClient(player.playerApiUrl, player.projectId);
  if (!player.playerApiUrl || !player.projectId) { return; }

  const identifiers = identifiersArray(player);
  if (identifiers.length === 0) { return; }

  const data = await fetchData(client, identifiers).catch(() => {});
  if (!data?.content) { handleNoContent(player); return; }

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

const handleNoContent = (player) => {
  resetSomeProps(player);
  setContentProp(player);
  setAdvertsProp(player);

  player.onEvent(newEvent({
    type: "NoContentAvailable",
    description: "No published and processed content is available for the identifiers.",
    initiatedBy: "browser",
  }));
};

const setProps = (player, data) => {
  const theme = resolveTheme(data.settings.theme);
  const themeColors = data.settings[`${theme}_theme`];
  const videoColors = data.settings["video_theme"];

  resetSomeProps(player);
  setContentProp(player, data);
  setAdvertsProp(player, data);

  set(player, "playerStyle", data.settings.player_style);
  set(player, "playerTitle", data.playlist?.title || data.settings.player_title);
  set(player, "callToAction", data.settings.call_to_action === "Listen to this article" ? null : data.settings.call_to_action);
  set(player, "skipButtonStyle", data.settings.skip_button_style);
  set(player, "downloadFormats", data.settings.download_button_enabled ? ["mp3"] : []);
  set(player, "introsOutros", introsOutrosArray(data.settings));
  set(player, "persistentAdImage", data.settings.persistent_ad_image);
  set(player, "widgetStyle", data.settings.widget_style);
  set(player, "widgetPosition", data.settings.widget_position);
  set(player, "textColor", themeColors.text_color);
  set(player, "backgroundColor", themeColors.background_color);
  set(player, "iconColor", themeColors.icon_color);
  set(player, "highlightColor", themeColors.highlight_color);
  set(player, "videoTextColor", videoColors.text_color);
  set(player, "videoBackgroundColor", videoColors.background_color);
  set(player, "videoIconColor", videoColors.icon_color);
  set(player, "logoIconEnabled", data.settings.logo_icon_enabled);
  set(player, "highlightSections", data.settings.segment_playback_enabled ? "all" : "none");
  set(player, "clickableSections", data.settings.segment_playback_enabled ? "all" : "none");
  set(player, "segmentWidgetSections", data.settings.segment_playback_enabled ? "none" : "none"); // TODO: default to body?
  set(player, "analyticsConsent", analyticsConsent(data.settings));
  set(player, "analyticsCustomUrl", data.settings.analytics_custom_url);
  set(player, "analyticsTag", data.settings.analytics_tag);
  set(player, "analyticsUrl", data.settings.analytics_url);
  set(player, "analyticsId", data.settings.analytics_id);
  // TODO: add support for title_enabled
  // TODO: add support for paywall_type
  // TODO: add support for paywall_url
  // TODO: add support for share_button_enabled
  // TODO: add support for voice_icon_enabled
};

const resetSomeProps = (player) => {
  set(player, "contentIndex", 0);
  set(player, "introsOutrosIndex", -1);
  set(player, "advertIndex", -1);
  set(player, "persistentIndex", -1);
  set(player, "duration", 0);
  set(player, "currentTime", 0);
  set(player, "playbackState", "stopped");
  set(player, "currentSegment", undefined);
  set(player, "hoveredSegment", undefined);
};

const setContentProp = (player, data) => {
  const imageEnabled = data?.settings?.image_enabled;
  const contentArray = data?.content || [];

  set(player, "content", contentArray.map((item) => ({
    id: item.id,
    title: item.title,
    imageUrl: imageEnabled && (data.playlist?.image_url || data.settings.image_url || item.image_url),
    sourceId: item.source_id,
    sourceUrl: item.source_url,
    adsEnabled: item.ads_enabled,
    duration: item.audio[0] ? item.audio[0].duration / 1000 : 0,
    audio: item.audio.map((audio) => ({
      id: audio.id,
      url: audio.url,
      contentType: audio.content_type,
      duration: audio.duration ? audio.duration / 1000 : 0,
    })),
    video: item.video.map((video) => ({
      id: video.id,
      url: video.url,
      contentType: video.content_type,
      duration: video.duration ? video.duration / 1000 : 0,
    })),
    segments: item.segments.map((segment) => ({
      marker: segment.marker,
      section: segment.section,
      startTime: segment.start_time ? segment.start_time / 1000 : 0,
      duration: segment.duration ? segment.duration / 1000 : 0,
    })),
  })));
};

const setAdvertsProp = (player, data) => {
  const imageEnabled = data?.settings?.image_enabled;
  const advertsArray = data?.ads || [];

  set(player, "adverts", advertsArray.map((item) => {
    const isVast = item.type === "vast";
    const theme = resolveTheme(item.theme);
    const themeColors = item[`${theme}_theme`];
    const videoColors = item["video_theme"];

    return {
      id: item.id,
      type: item.type,
      placement: item.placement,
      vastUrl: isVast ? item.vast_url : null,
      clickThroughUrl: !isVast ? item.click_through_url : null,
      imageUrl: imageEnabled && item.image_url,
      textColor: themeColors?.text_color,
      backgroundColor: themeColors?.background_color,
      iconColor: themeColors?.icon_color,
      videoTextColor: videoColors?.text_color,
      videoBackgroundColor: videoColors?.background_color,
      videoIconColor: videoColors?.icon_color,
      audio: isVast ? [] : (item.audio || item.media).map((audio) => ({
        id: audio.id,
        url: audio.url,
        contentType: audio.content_type,
        duration: audio.duration ? audio.duration / 1000 : 0,
      })),
      video: isVast ? [] : (item.video || []).map((video) => ({
        id: video.id,
        url: video.url,
        contentType: video.content_type,
        duration: video.duration ? video.duration / 1000 : 0,
      })),
    };
  }));
};

const set = (player, propName, value) => {
  const overridden = typeof player.initialProps[propName] !== "undefined";
  if (!overridden) { player[propName] = value; }
};

const introsOutrosArray = ({ intro_outro_enabled, intro_url, outro_url }) => {
  if (!intro_outro_enabled) { return []; }
  const array = [];

  if (intro_url) { array.push({ placement: "pre-roll", audio: [{ url: intro_url }], video: [] }); }
  if (outro_url) { array.push({ placement: "post-roll", audio: [{ url: outro_url }], video: [] }); }

  return array;
};

const analyticsConsent = ({ analytics_enabled, analytics_uuid_enabled }) => {
  if (!analytics_enabled)      { return "none"; }
  if (!analytics_uuid_enabled) { return "without-local-storage"; }

  return "allowed";
};

export default setPropsFromApi;
export { identifiersArray, fetchData };
