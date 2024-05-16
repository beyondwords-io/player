<script>
  import newEvent from "../helpers/newEvent";
  import withQueryParams from "../helpers/withQueryParams";
  import vastUrlParams from "../helpers/vastUrlParams";
  import elementIsVisible from "../helpers/elementIsVisible";

  export let vastUrl;
  export let preloading;
  export let placement;
  export let advertConsent;
  export let maxImageSize;
  export let projectId;
  export let playlistId;
  export let contentId;
  export let contentLanguage;
  export let platform;
  export let vendorIdentifier;
  export let bundleIdentifier;
  export let video;
  export let playbackState;
  export let duration;
  export let currentTime;
  export let onEvent = () => {};

  let adContainer;
  let adDisplayContainer;
  let adsLoader;
  let adsRequest;
  let adsManager;
  let adsLoaded;
  let adData;

  $: adParams = vastUrlParams(vastUrl, placement, advertConsent, maxImageSize, projectId, playlistId, contentId, contentLanguage, platform, vendorIdentifier, bundleIdentifier, elementIsVisible(video));
  $: adTagUrl = withQueryParams(vastUrl, adParams);

  $: adsManager && !preloading && playbackState === "playing" && loadAds();
  $: adsManager, !preloading && (playbackState === "playing" ? adsManager?.resume() : adsManager?.pause());

  const initializeIMA = () => {
    google.ima.settings.setDisableCustomPlaybackForIOS10Plus(true);

    adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, video);

    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded, false);
    adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);

    adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = adTagUrl;
    adsRequest.linearAdSlotWidth = video.clientWidth;
    adsRequest.linearAdSlotHeight = video.clientHeight;

    adsLoader.requestAds(adsRequest);
  };

  const onAdsManagerLoaded = (adsManagerLoadedEvent) => {
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.enablePreloading = true;

    adsManager = adsManagerLoadedEvent.getAdsManager(video, adsRenderingSettings);

    adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onStarted);
    adsManager.addEventListener(google.ima.AdEvent.Type.AD_PROGRESS, onAdProgress);
    adsManager.addEventListener(google.ima.AdEvent.Type.CLICK, onClick);
    adsManager.addEventListener(google.ima.AdEvent.Type.PAUSED, onPaused);
    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
  };

  const loadAds = () => {
    if (adsLoaded) { return; }
    adsLoaded = true;

    video.pause();
    video.load();
    adDisplayContainer.initialize();

    try {
      adsManager.init(video.clientWidth, video.clientHeight, google.ima.ViewMode.NORMAL);
      adsManager.start();
      makeStylesImportant();
      onAnimationFrame();
    } catch (adError) {
      onAdError(null, adError);
    }
  };

  const onStarted = (adEvent) => {
    const settings = new google.ima.CompanionAdSelectionSettings();

    settings.resourceType = google.ima.CompanionAdSelectionSettings.ResourceType.STATIC;
    settings.creativeType = google.ima.CompanionAdSelectionSettings.CreativeType.IMAGE;
    settings.sizeCriteria = google.ima.CompanionAdSelectionSettings.SizeCriteria.IGNORE;

    const companionAds = adEvent.getAd().getCompanionAds(0, 0, settings);
    const companionData = companionAds[0]?.data;

    if (!companionData) { return; }

    const div = document.createElement("div");
    div.innerHTML = companionData.content;

    const clickThroughUrl = div.firstChild?.getAttribute("href");
    const imageUrl = companionData.resourceValue;

    onEvent(newEvent({
      type: "CompanionAdvertChanged",
      description: "The companion advert associated with the VAST advert changed.",
      initiatedBy: "google-ima-sdk",
      clickThroughUrl,
      imageUrl,
    }));
  };

  const onAdProgress = (adEvent) => {
    adData = adEvent.getAdData();
    adData.updatedAt = Date.now();
    adData.minDuration = minDuration(adData);

    onEvent(newEvent({
      type: "CurrentTimeUpdated",
      description: "The media's current time was updated.",
      initiatedBy: "media",
    }));

    if (duration === adData.minDuration) { return; }
    duration = adData.minDuration;

    onEvent(newEvent({
      type: "DurationUpdated",
      description: "The media's duration was updated.",
      initiatedBy: "google-ima-sdk",
    }));
  };

  const minDuration = ({ duration, adBreakDuration }) => {
    const min = Math.min(duration || Infinity, adBreakDuration || Infinity);
    return min === Infinity ? 0 : min;
  };

  const onClick = () => {
    onEvent(newEvent({
      type: "PressedAdvertVideo",
      description: "The video background was pressed to open the advert in a new tab.",
      initiatedBy: "user",
    }));
  };

  const onPaused = () => {
    if (playbackState === "paused") { return; }
    playbackState = "paused";

    onEvent(newEvent({
      type: "PlaybackPaused",
      description: "The media became paused at its current playback time.",
      initiatedBy: "google-ima-sdk",
    }));
  };

  const onContentResumeRequested = () => {
    onEvent(newEvent({
      type: "PlaybackEnded",
      description: "The media finished playing because it reached the end.",
      initiatedBy: "google-ima-sdk",
    }));

    onEvent(newEvent({
      type: "CompanionAdvertChanged",
      description: "The companion advert associated with the VAST advert changed.",
      initiatedBy: "google-ima-sdk",
      clickThroughUrl: null,
      imageUrl: null,
    }));
  };

  const onAdError = (adEvent, adError) => {
    adError = adError || adEvent.getError();
    adsManager?.destroy();

    onEvent(newEvent({
      type: "PlaybackErrored",
      description: "The media failed to play.",
      initiatedBy: "google-ima-sdk",
      mediaType: "VAST",
      mediaUrl: adTagUrl,
      preloading,
      errorMessage: `${adError.getMessage()} (code=${adError.getErrorCode()})`,
    }));
  };

  const onScriptError = () => {
    onEvent(newEvent({
      type: "PlaybackErrored",
      description: "The media failed to play.",
      initiatedBy: "browser",
      mediaType: "VAST",
      mediaUrl: adTagUrl,
      preloading,
      errorMessage: "The ima3.js script was blocked.",
    }));
  };

  const makeStylesImportant = () => {
    const walker = document.createTreeWalker(adContainer);
    let node;

    while ((node = walker.nextNode())) {
      const cssRegex = /;(?!([^()]*\([^()]*\))*[^()]*\))/; // Match semicolons not inside parentheses.

      const rules = node.style.cssText.split(cssRegex).filter(s => s);
      const styles = rules.map(s => s.includes("!important") ? s : `${s} !important`);

      node.style.cssText = styles.join(";");
    }
  };

  const onAnimationFrame = () => {
    if (!adContainer) { return; }

    currentTime = smoothedCurrentTime();
    adsManager.resize(video.clientWidth, video.clientHeight, google.ima.ViewMode.NORMAL);
    requestAnimationFrame(onAnimationFrame);
  };

  const smoothedCurrentTime = () => {
    if (!adData) { return 0; }

    if (playbackState === "playing") {
      const elapsed = (Date.now() - adData.updatedAt) / 1000;
      return adData.currentTime + elapsed;
    } else {
      adData.updatedAt = Date.now();
      return currentTime;
    }
  };
</script>

<svelte:head>
  <script on:load={initializeIMA} on:error={onScriptError} src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"></script>
</svelte:head>

<div class="vast-container" bind:this={adContainer}></div>
