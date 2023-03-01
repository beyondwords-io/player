<script>
  import newEvent from "../helpers/newEvent";

  export let vastUrl;
  export let videoElement;
  export let playbackState;
  export let duration;
  export let currentTime;
  export let videoBehindWidget;
  export let videoBehindStatic;
  export let widgetPosition;
  export let widgetWidth;
  export let onEvent = () => {};

  // These are set automatically.
  export let adContainer = undefined;
  export let adDisplayContainer = undefined;
  export let adsLoader = undefined;
  export let adsRequest = undefined;
  export let adsManager = undefined;
  export let adsLoaded = false;

  $: adsManager && playbackState === "playing" && loadAds();
  $: adsManager, playbackState === "playing" ? adsManager?.resume() : adsManager?.pause();

  const initializeIMA = () => {
    adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, videoElement);

    adsLoader = new google.ima.AdsLoader(adDisplayContainer); // TODO: contentComplete
    adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded, false);
    adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);

    adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = vastUrl;
    adsRequest.linearAdSlotWidth = videoElement.clientWidth; // TODO: check this
    adsRequest.linearAdSlotHeight = videoElement.clientHeight;
    adsRequest.nonLinearAdSlotWidth = videoElement.clientWidth;
    adsRequest.nonLinearAdSlotHeight = videoElement.clientHeight / 3;

    adsLoader.requestAds(adsRequest);
  };

  const onAdsManagerLoaded = (adsManagerLoadedEvent) => {
    adsManager = adsManagerLoadedEvent.getAdsManager(videoElement);

    adsManager.addEventListener(google.ima.AdEvent.Type.AD_PROGRESS, onAdProgress);
    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);

    window.adsManager = adsManager;
  };

  const loadAds = () => {
    if (adsLoaded) { return; }
    adsLoaded = true;

    videoElement.pause();
    videoElement.load();
    adDisplayContainer.initialize();

    try {
      adsManager.init(videoElement.clientWidth, videoElement.clientHeight, google.ima.ViewMode.NORMAL);
      adsManager.start();
    } catch (adError) {
      console.log("AdsManager could not be started");
      videoElement.play(); // TODO: emit failed advert event (and add to MediaElement if no sources?)
    }
  };

  const onAdProgress = (adEvent) => {
    const adData = adEvent.getAdData();

    if (duration !== adData.duration) {
      duration = adData.duration;

      onEvent(newEvent({
        type: "DurationUpdated",
        description: "The media's duration was updated.",
        initiatedBy: "google-ima-sdk",
        fromWidget: videoBehindWidget,
      }));
    }

    if (currentTime !== adData.currentTime) {
      currentTime = adData.currentTime; // TODO: smooth currentTime?

      onEvent(newEvent({
        type: "CurrentTimeUpdated",
        description: "The media's current time was updated.",
        initiatedBy: "google-ima-sdk",
        fromWidget: videoBehindWidget,
      }));
    }
  };

  const onContentResumeRequested = () => {
    onEvent(newEvent({
      type: "PlaybackEnded", // TODO: different event?
      description: "The vast advert requested the content be resumed.",
      initiatedBy: "google-ima-sdk",
      fromWidget: videoBehindWidget,
    }));
  };

  const onAdError = (adErrorEvent) => {
    console.log(adErrorEvent.getError()); // TODO: what to do on error?
    adsManager?.destroy();
  };

  // TODO: window resize / position change
</script>

<svelte:head> <!-- TODO: load script sooner? -->
  <script on:load={initializeIMA} src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"></script>
</svelte:head>

<div class="vast-container" bind:this={adContainer}></div>
