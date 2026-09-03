import PlayerApiClient from "../api_clients/playerApiClient";
import snakeCaseKeys from "./snakeCaseKeys";
import resolveTheme from "./resolveTheme";
import { normalizeThemePreference, palettesFromApi } from "./default_theme/palettes";
import newEvent from "./newEvent";
import rewriteMediaUrl from "./rewriteMediaUrl";

const appendContinuousPlaybackContentFromApi = async (player) => {
  const client = new PlayerApiClient({
    playerApiUrl: player.playerApiUrl,
    accessTier: player.accessTier,
    projectId: player.projectId,
    summary: player.summary,
    mediaFormat: player.playerStyle === "video" ? "video" : undefined,
    videoSize: player.videoSizes?.[0],
    initialContentId: player.initialProps?.contentId,
    initialSourceId: player.initialProps?.sourceId,
    initialSourceUrl: player.initialProps?.sourceUrl,
    clientSideEnabled: player.clientSideEnabled,
    previewToken: player.previewToken,
    continuousPlaybackMode: player.continuousPlaybackMode,
    wordHighlightsEnabled: player.wordHighlightsEnabled,
  });
  if (!player.playerApiUrl || !player.projectId) { return; }
  if (player.continuousPlaybackMode === "none" || !player.content || player.content.length >= 99 || player.contentIndex !== player.content.length - 1) { return; }

  const contentItem = player.content[player.content.length - 1];
  if (!contentItem || !contentItem.continuousPlaybackContentId || player.content.some(({ id }) => id === contentItem.continuousPlaybackContentId)) { return; }

  if (player.pendingContinuousPlaybackContentId) { return; }
  player.pendingContinuousPlaybackContentId = contentItem.continuousPlaybackContentId;

  const identifiers = [{ content_id: contentItem.continuousPlaybackContentId }];

  const data = await fetchData(client, identifiers).catch(() => {});
  delete player.pendingContinuousPlaybackContentId;

  if (!data?.content) { return; }

  appendContentProp(player, data);

  set(player, "playlistToggle", "hide");
  set(player, "playlistStyle", "hide");
};

const setPropsFromApi = async (player) => {
  const client = new PlayerApiClient({
    playerApiUrl: player.playerApiUrl,
    accessTier: player.accessTier,
    projectId: player.projectId,
    summary: player.summary,
    mediaFormat: player.playerStyle === "video" ? "video" : undefined,
    videoSize: player.videoSizes?.[0],
    initialContentId: player.initialProps?.contentId,
    initialSourceId: player.initialProps?.sourceId,
    initialSourceUrl: player.initialProps?.sourceUrl,
    clientSideEnabled: player.clientSideEnabled,
    previewToken: player.previewToken,
    continuousPlaybackMode: player.continuousPlaybackMode,
    wordHighlightsEnabled: player.wordHighlightsEnabled,
  });
  if (!player.playerApiUrl || !player.projectId) { return; }

  const identifiers = identifiersArray(player);

  // If no identifiers have been set then identify the content using the page URL.
  if (identifiers.length === 0) {
    player.sourceUrl = window.location.href;
    return;
  }

  const data = await fetchData(client, identifiers).catch(() => {});

  // Kept for tooling (see the control panel): the response verbatim, the URL it
  // came from, and every value the API tried to set. Also set when no content
  // came back, so a 404 or an empty response is still inspectable.
  player.apiPayload = data;
  player.apiRequestUrl = client.lastRequestUrl;
  player.apiProps = {};

  if (!data?.content) { handleNoContent(player); return; }

  // The player allows you to override props from the API by adding them in the script tag.
  // For example, you could add { backgroundCollor: "yellow" } to set a different color.
  //
  // If player.backgroundColor is changed again later and a new API request is made, this
  // change will only persist if it was initially overridden in the script tag.
  setProps(player, data);
  handleContent(player);
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
  set(player, "agentId", undefined);
  set(player, "agentName", undefined);
  set(player, "agentSessionConfig", {});
  set(player, "accessCtaText", undefined);
  set(player, "accessCtaUrl", undefined);
  set(player, "agentCtaText", undefined);
  set(player, "agentCtaUrl", undefined);
  set(player, "agentQuestionsLimit", null);
  set(player, "agentVoiceSecondsLimit", null);

  player.onEvent?.(newEvent({
    type: "NoContentAvailable",
    description: "No published and processed content is available for the identifiers.",
    initiatedBy: "browser",
  }));
};

const handleContent = (player) => {
  player.onEvent?.(newEvent({
    type: "ContentAvailable",
    description: "Content was loaded into the player and is ready to be played.",
    initiatedBy: "browser",
  }));
};

const setProps = (player, data) => {
  const settings = data.settings;
  const apiPalettes = palettesFromApi(settings);
  const selectedTheme = resolveTheme(settings.theme);
  const themeColors = selectedTheme === "dark" ? apiPalettes.darkTheme : apiPalettes.lightTheme;
  const videoColors = apiPalettes.videoTheme;

  resetSomeProps(player);
  setContentProp(player, data);
  setAdvertsProp(player, data);

  const content = player.content[player.contentIndex];

  set(player, "playerStyle", settings.player_style);
  set(player, "playerTitle", data.playlist?.title || settings.player_title);
  set(player, "titleEnabled", settings.title_enabled);
  set(player, "callToAction", settings.call_to_action === "Listen to this article" ? null : settings.call_to_action);
  set(player, "skipButtonStyle", settings.skip_button_style);
  set(player, "downloadFormats", settings.download_button_enabled ? ["mp3"] : []);
  set(player, "introsOutros", rewriteIntrosOutrosUrls(settings.intros_outros, player.mediaCustomUrl));
  set(player, "outroPlaybackMode", settings.outro_playback_mode);
  set(player, "persistentAdImage", settings.persistent_ad_image);
  set(player, "duration", player.summary ? content?.summarization?.audio?.[0]?.duration : content?.audio?.[0]?.duration);
  set(player, "widgetStyle", settings.widget_style);
  set(player, "widgetPosition", settings.widget_position);
  set(player, "projectTheme", normalizeThemePreference(settings.theme));
  set(player, "apiLightTheme", apiPalettes.lightTheme);
  set(player, "apiDarkTheme", apiPalettes.darkTheme);
  set(player, "apiVideoTheme", apiPalettes.videoTheme);
  // Public aliases make the effective management contract visible to tooling
  // and let resetSetting restore API palettes without another request.
  player.apiProps.theme = normalizeThemePreference(settings.theme);
  player.apiProps.lightTheme = apiPalettes.lightTheme;
  player.apiProps.darkTheme = apiPalettes.darkTheme;
  player.apiProps.videoTheme = apiPalettes.videoTheme;
  // Flat props remain populated for legacy player styles and integrations.
  set(player, "textColor", themeColors.textColor);
  set(player, "backgroundColor", themeColors.backgroundColor);
  set(player, "iconColor", themeColors.iconColor);
  set(player, "highlightColor", themeColors.highlightColor);
  set(player, "videoTextColor", videoColors.textColor);
  set(player, "videoBackgroundColor", videoColors.backgroundColor);
  set(player, "videoIconColor", videoColors.iconColor);
  set(player, "logoIconEnabled", settings.logo_icon_enabled);
  set(player, "logoImagePosition", data.video_settings.logo_image_position);
  set(player, "wordHighlightsEnabled", settings.word_highlights_enabled);
  set(player, "wordHighlightColor", themeColors.wordHighlightColor);
  set(player, "highlightSections", settings.segment_highlights_enabled ? "all" : "none");
  set(player, "clickableSections", settings.segment_playback_enabled ? "all" : "none");
  set(player, "segmentWidgetSections", "none");
  set(player, "analyticsConsent", analyticsConsent(settings));
  set(player, "analyticsCustomUrl", settings.analytics_custom_url);
  set(player, "analyticsTag", settings.analytics_tag);
  set(player, "analyticsUrl", settings.analytics_url);
  set(player, "analyticsId", settings.analytics_id);
  set(player, "segmentLimit", data.access_tier?.segment_limit);
  set(player, "contentLanguage", data.language);

  set(player, "radius", settings.radius);
  set(player, "accentColor", themeColors.accentColor);
  set(player, "accentTextColor", themeColors.accentTextColor);
  set(player, "disclosureText", settings.disclosure_text);
  set(player, "disclosureLink", settings.disclosure_link);
  set(player, "agentColor", themeColors.agentColor);
  set(player, "agentAvatar", settings.agent_avatar_url);
  set(player, "agentPlaceholder", settings.agent_placeholder);
  set(player, "shortcuts", settings.agent_shortcuts);
  set(player, "infoText", settings.info_text);
  set(player, "agentVoice", settings.agent_voice_enabled);
  set(player, "variants", settings.variants);
  set(player, "embedMode", settings.embed_mode);
  set(player, "widgetEmbedMode", settings.widget_embed_mode);

  const accessTier = data.access_tier;
  const playerAgent = accessTier?.player_agent;
  set(player, "accessCtaText", accessTier?.cta_text);
  set(player, "accessCtaUrl", accessTier?.cta_url);
  set(player, "agentCtaText", playerAgent?.cta_text);
  set(player, "agentCtaUrl", playerAgent?.cta_url);
  set(player, "agentQuestionsLimit", playerAgent?.questions_limit);
  set(player, "agentVoiceSecondsLimit", playerAgent?.seconds_limit);

  // Key always present; the id only when the project's agent is enabled.
  set(player, "agentId", data.conversational_agent?.elevenlabs_agent_id ?? undefined);
  set(player, "agentName", data.conversational_agent?.name);
  set(player, "agentSessionConfig", agentSessionConfig(data.conversational_agent));
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

const appendContentProp = (player, data) => {
  set(player, "content", [
    ...(player.content ?? []), 
    ...mapContentProp(player, data)
  ]);
};

const setContentProp = (player, data) => {
  set(player, "content", mapContentProp(player, data));
};

const mapContentProp = (player, data) => {
  const contentArray = data?.content || [];
  const { mediaCustomUrl } = player;

  return contentArray.map((item) => ({
    id: item.id,
    continuousPlaybackContentId: data.continuous_playback_content_id,
    title: item.title,
    imageUrl: data.playlist?.image_url || data.settings?.image_url || item.image_url,
    sourceId: item.source_id,
    sourceUrl: item.source_url,
    adsEnabled: item.ads_enabled,
    duration: item.audio[0] ? item.audio[0].duration / 1000 : 0,
    audio: item.audio.map((audio) => ({
      id: audio.id,
      url: localOrRemoteUrl(rewriteMediaUrl(audio.url, mediaCustomUrl), audio.base64_file, audio.content_type),
      contentType: audio.content_type,
      duration: audio.duration ? audio.duration / 1000 : 0,
    })),
    video: item.video.map((video) => ({
      id: video.id,
      url: localOrRemoteUrl(rewriteMediaUrl(video.url, mediaCustomUrl), video.base64_file, video.content_type),
      contentType: video.content_type,
      duration: video.duration ? video.duration / 1000 : 0,
      videoSize: video.video_size,
    })),
    summarization: {
      audio: (item.summarization?.audio || []).map((audio) => ({
        id: audio.id,
        url: localOrRemoteUrl(rewriteMediaUrl(audio.url, mediaCustomUrl), audio.base64_file, audio.content_type),
        contentType: audio.content_type,
        duration: audio.duration ? audio.duration / 1000 : 0,
      })) ?? [],
      video: (item.summarization?.video || []).map((video) => ({
        id: video.id,
        url: localOrRemoteUrl(rewriteMediaUrl(video.url, mediaCustomUrl), video.base64_file, video.content_type),
        contentType: video.content_type,
        duration: video.duration ? video.duration / 1000 : 0,
        videoSize: video.video_size,
      })),
    },
    segments: item.segments.map((segment) => ({
      text: segment.text,
      marker: segment.marker,
      xpath: segment.xpath,
      md5: segment.md5,
      section: segment.section,
      startTime: typeof segment.start_time === "number" ? segment.start_time / 1000 : null,
      duration: typeof segment.duration === "number" ? segment.duration / 1000 : null,
      words: (segment.words || []).map((word) => ({
        text: word.text,
        startTime: typeof word.start_time === "number" ? word.start_time / 1000 : 0,
        duration: typeof word.duration === "number" ? word.duration / 1000 : 0,
      })),
    })),
  }));
};

const setAdvertsProp = (player, data) => {
  const advertsArray = data?.ads || [];
  const { mediaCustomUrl } = player;

  set(player, "adverts", advertsArray.map((item) => {
    const isVast = item.type === "vast";
    const palettes = palettesFromApi(item);
    const theme = normalizeThemePreference(item.theme);
    const resolvedTheme = resolveTheme(theme);
    const themeColors = resolvedTheme === "dark" ? palettes.darkTheme : palettes.lightTheme;
    const videoColors = palettes.videoTheme;

    return {
      id: item.id,
      type: item.type,
      placement: item.placement,
      vastUrl: isVast ? item.vast_url : null,
      clickThroughUrl: !isVast ? item.click_through_url : null,
      imageUrl: item.image_url,
      theme,
      lightTheme: palettes.lightTheme,
      darkTheme: palettes.darkTheme,
      videoTheme: palettes.videoTheme,
      textColor: themeColors.textColor,
      backgroundColor: themeColors.backgroundColor,
      iconColor: themeColors.iconColor,
      videoTextColor: videoColors.textColor,
      videoBackgroundColor: videoColors.backgroundColor,
      videoIconColor: videoColors.iconColor,
      audio: isVast ? [] : (item.audio || item.media).map((audio) => ({
        id: audio.id,
        url: localOrRemoteUrl(rewriteMediaUrl(audio.url, mediaCustomUrl), audio.base64_file, audio.content_type),
        contentType: audio.content_type,
        duration: audio.duration ? audio.duration / 1000 : 0,
      })),
      video: isVast ? [] : (item.video || []).map((video) => ({
        id: video.id,
        url: localOrRemoteUrl(rewriteMediaUrl(video.url, mediaCustomUrl), video.base64_file, video.content_type),
        contentType: video.content_type,
        duration: video.duration ? video.duration / 1000 : 0,
        videoSize: video.video_size,
      })),
    };
  }));
};

const agentSessionConfig = (agent) => {
  if (!agent) { return {}; }

  return {
    firstMessage: agent.first_message,
    model: agent.model,
    systemPrompt: agent.system_prompt,
    language: agent.language?.code,
    voiceId: agent.voice?.voice_id,
    voiceModelId: agent.voice?.model_id,
  };
};

const rewriteIntrosOutrosUrls = (introsOutros, mediaCustomUrl) => {
  if (!introsOutros || !mediaCustomUrl) { return introsOutros; }

  return introsOutros.map((item) => ({
    ...item,
    audio: (item.audio || []).map((audio) => ({ ...audio, url: rewriteMediaUrl(audio.url, mediaCustomUrl) })),
    video: (item.video || []).map((video) => ({ ...video, url: rewriteMediaUrl(video.url, mediaCustomUrl) })),
  }));
};

const set = (player, propName, value) => {
  // Record what the API asked for, even when an override stops it being
  // applied, so tooling can show both values and restore the API's one.
  if (player.apiProps) { player.apiProps[propName] = value; }

  // `video: true` historically aliases to playerStyle: "video", but in the
  // default style it is a boolean preference. When no playerStyle was supplied
  // explicitly, let the API disambiguate while retaining the legacy fallback
  // for every non-default API style.
  const videoPlayerStyleAlias = player.videoPlayerStyleAlias;
  const playerStyleWasOverridden = typeof player.initialProps?.playerStyle !== "undefined";
  if (propName === "playerStyle" && videoPlayerStyleAlias && !playerStyleWasOverridden) {
    player[propName] = value === "default" ? value : videoPlayerStyleAlias;
    return;
  }

  const overridden = typeof player.initialProps?.[propName] !== "undefined";
  if (!overridden) { player[propName] = value; }
};

const analyticsConsent = ({ analytics_enabled, analytics_uuid_enabled }) => {
  if (!analytics_enabled)      { return "none"; }
  if (!analytics_uuid_enabled) { return "without-local-storage"; }

  return "allowed";
};

const localOrRemoteUrl = (remoteUrl, base64, contentType) => {
  if (!base64) { return remoteUrl; }

  try {
    const absolutePath = remoteUrl.replace(/\.m3u8$/, "");
    const relativePath = absolutePath.split("/").pop();

    const originalM3u8 = atob(base64);
    const replacedM3u8 = originalM3u8.replaceAll(relativePath, absolutePath);

    const m3u8Blob = new Blob([replacedM3u8], { type: contentType });
    const localUrl = URL.createObjectURL(m3u8Blob);

    return localUrl;
  } catch (error) {
    console.warn(`BeyondWords.Player: ${error}`);
    return remoteUrl;
  }
};

export default setPropsFromApi;
export { identifiersArray, fetchData, appendContinuousPlaybackContentFromApi };
