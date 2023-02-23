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

  setProps(player, data); // TODO: override initialProps
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

  if (identifiers.length > 1) { return client.byRequestBody(identifiers); }
  if (identifier.content_id)  { return client.byContentId(identifier.content_id); }
  if (identifier.playlist_id) { return client.byPlaylistId(identifier.playlist_id); }
  if (identifier.source_id)   { return client.bySourceId(identifier.source_id); }
  if (identifier.source_url)  { return client.bySourceUrl(identifier.source_url); }
};

const setProps = (player, data) => {
  const theme = resolveTheme(data.settings.theme);
  const colors = data.settings[`${theme}_theme`];

  player.playerStyle = data.settings.player_style;
  player.playerTitle = data.playlist?.title || data.settings.player_title;
  player.callToAction = data.settings.call_to_action;
  player.textColor = colors.text_color;
  player.backgroundColor = colors.background_color;
  player.iconColor = colors.icon_color;
  // TODO: title_enabled
  // TODO: image_enabled
  player.widgetStyle = data.settings.widget_style;
  player.widgetPosition = data.settings.widget_position;
  // TODO: segment_playback_enabled
  player.skipButtonStyle = data.settings.skip_button_style;
  // TODO: paywall_type
  // TODO: paywall_url
  // TODO: download_button_enabled
  // TODO: share_button_enabled
  // TODO: voice_icon_enabled
  // TODO: logo_icon_enabled

  player.content = data.content.map((item) => ({
    title: item.title,
    imageUrl: data.playlist?.image_url || item.image_url,
    sourceUrl: item.source_url,
    duration: item.audio[0] ? item.audio[0].duration / 1000 : 0,
    media: [...item.video, ...item.audio].map((media) => ({
      url: media.url,
      contentType: media.content_type,
    })),
  }));

  player.adverts = data.ads.map((item) => ({
    type: item.type,
    placement: item.placement,
    vastUrl: item.vast_url,
    clickThroughUrl: item.click_through_url,
    media: item.media.map((media) => ({
      url: media.url,
      contentType: media.content_type,
    })),
  }));

  // TODO: segments + skip behaviour
};

export default setPropsFromApi;
export { identifiersArray, fetchData };
