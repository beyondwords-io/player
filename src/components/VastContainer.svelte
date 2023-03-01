<script>
  import newEvent from "../helpers/newEvent";
  import withQueryParams from "../helpers/withQueryParams";
  import googleAdTagParams from "../helpers/googleAdTagParams";

  export let vastUrl;
  export let advertConsent;
  export let video;
  export let playbackState;
  export let duration;
  export let currentTime;
  export let videoBehindWidget;
  export let onEvent = () => {};

  let adContainer;
  let adDisplayContainer;
  let adsLoader;
  let adsRequest;
  let adsManager;
  let adsLoaded;
  let adData;

  $: adTagUrl = withQueryParams(vastUrl, googleAdTagParams(advertConsent));

  $: adsManager && playbackState === "playing" && loadAds();
  $: adsManager, playbackState === "playing" ? adsManager?.resume() : adsManager?.pause();

  const initializeIMA = () => {
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
    adsManager = adsManagerLoadedEvent.getAdsManager(video);

    adsManager.addEventListener(google.ima.AdEvent.Type.AD_PROGRESS, onAdProgress);
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
      onAnimationFrame();
    } catch (adError) {
      console.log("AdsManager could not be started");
      video.play(); // TODO: emit failed advert event (and add to MediaElement if no sources?)
    }
  };

  const onAdProgress = (adEvent) => {
    adData = adEvent.getAdData();
    adData.updatedAt = Date.now();

    if (duration === adData.duration) { return; }
    duration = adData.duration;

    onEvent(newEvent({
      type: "DurationUpdated",
      description: "The media's duration was updated.",
      initiatedBy: "google-ima-sdk",
      fromWidget: videoBehindWidget,
    }));
  };

  const onContentResumeRequested = () => {
    onEvent(newEvent({
      type: "ContentResumeRequested",
      description: "The vast advert requested the content be resumed.",
      initiatedBy: "google-ima-sdk",
      fromWidget: videoBehindWidget,
    }));
  };

  const onAdError = (adErrorEvent) => {
    console.log(adErrorEvent.getError()); // TODO: what to do on error?
    adsManager?.destroy();
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

<svelte:head> <!-- TODO: load script sooner? -->
  <script on:load={initializeIMA} src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"></script>
</svelte:head>

<div class="vast-container" bind:this={adContainer}></div>
