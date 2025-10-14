<script>
  // import("../helpers/loadTheStyles.ts");
  // import "@fontsource/inter/variable.css";
  // import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  // import ResizeObserver from "resize-observer-polyfill";
  import PlayPauseButton from "./buttons/PlayPauseButton.svelte";
  import PlaybackRateButton from "./buttons/PlaybackRateButton.svelte";
  import PrevButton from "./buttons/PrevButton.svelte";
  import NextButton from "./buttons/NextButton.svelte";
  import PlaylistButton from "./buttons/PlaylistButton.svelte";
  import SecondaryButtons from "./buttons/SecondaryButtons.svelte";
  import DownloadButton from "./buttons/DownloadButton.svelte";
  import MaximizeButton from "./buttons/MaximizeButton.svelte";
  import CloseWidgetButton from "./buttons/CloseWidgetButton.svelte";
  import VideoInWidget from "./svg_icons/VideoInWidget.svelte";
  import AdvertLink from "./external_links/AdvertLink.svelte";
  import AdvertButton from "./external_links/AdvertButton.svelte";
  import BeyondWords from "./external_links/BeyondWords.svelte";
  import SourceUrlButton from "./external_links/SourceUrlButton.svelte";
  import LargeImage from "./LargeImage.svelte";
  import PlayerTitle from "./titles/PlayerTitle.svelte";
  import ContentTitle from "./titles/ContentTitle.svelte";
  import ProgressBar from "./progress_bars/ProgressBar.svelte";
  import ProgressCircle from "./progress_bars/ProgressCircle.svelte";
  import TimeIndicator from "./time_indicators/TimeIndicator.svelte";
  import Playlist from "./Playlist.svelte";
  import Hoverable from "./helpers/Hoverable.svelte";
  import Visibility from "./helpers/Visibility.svelte";
  import belowBreakpoint from "../helpers/belowBreakpoint";
  import parseMargin from "../helpers/parseMargin";
  import controlsOrderFn from "../helpers/controlsOrder";
  import newEvent from "../helpers/newEvent";
  import translate from "../helpers/translate";
  import { canFullScreen } from "../helpers/fullScreen";

  export let playerStyle = "standard";
  export let callToAction = undefined;
  export let skipButtonStyle = "auto";
  export let playlistStyle = "auto-5-4";
  export let playlistToggle = "auto";
  export let downloadFormats = [];
  export let durationFormat = undefined;
  export let playerTitle = undefined;
  export let fixedPosition = undefined;
  export let fixedWidth = "auto";
  export let fixedMargin = "0";
  export let showClose = false;
  export let content = [];
  export let contentIndex = 0;
  export let summary = false;
  export let duration = 0;
  export let currentTime = 0;
  export let playbackState = "stopped";
  export let playbackRate = 1;
  export let playbackRates = [];
  export let activeAdvert = undefined;
  export let persistentAdvert = undefined;
  export let companionAdvert = undefined;
  export let analyticsId = undefined;
  export let textColor = "#111";
  export let backgroundColor = "#f5f5f5";
  export let iconColor = "black";
  export let videoTextColor = "white";
  export let videoBackgroundColor = "black";
  export let videoIconColor = "white";
  export let logoIconEnabled = true;
  export let logoImagePosition = undefined;
  export let maxImageSize = 0;
  export let onEvent = () => {};

  // These are set automatically.
  export let videoPosterImage = "";
  export let videoIsBehind = false;
  export let isFullScreen = false;
  export let isVisible = undefined;
  export let relativeY = undefined;
  export let absoluteY = undefined;
  export let playPauseButton = undefined;
  let element, width, isHovering, timeout;

  $: isSmall = playerStyle === "small";
  $: isStandard = playerStyle === "standard";
  $: isLarge = playerStyle === "large";
  $: isScreen = playerStyle === "screen";
  $: isVideo = playerStyle === "video";
  $: isPlaying = playbackState === "playing";
  $: isStopped = playbackState === "stopped";
  $: isAdvert = activeAdvert && !isStopped;
  $: isPlaylist = content.length > 1;
  $: isMobile = belowBreakpoint({ playerStyle, width });

  $: contentItem = content[contentIndex] || {};
  $: progress = currentTime / duration;

  $: nonVideoTextColor = isAdvert && activeAdvert.textColor || textColor;
  $: nonVideoBgColor = isAdvert && activeAdvert.backgroundColor || backgroundColor;
  $: nonVideoIconColor = isAdvert && activeAdvert.iconColor || iconColor;

  $: activeTextColor = isVideo ? (isAdvert && activeAdvert.videoTextColor || videoTextColor) : nonVideoTextColor;
  $: activeBgColor = isVideo ? (isAdvert && activeAdvert.videoBackgroundColor || videoBackgroundColor) : nonVideoBgColor;
  $: activeIconColor = isVideo ? (isAdvert && activeAdvert.videoIconColor || videoIconColor) : nonVideoIconColor;

  $: skipStyle = skipButtonStyle === "auto" ? (isPlaylist ? "tracks" : "segments") : skipButtonStyle;

  $: buttonScale = isSmall || isVideo && fixedPosition ? 0.8 : isScreen && !isMobile ? 2 : 1;
  $: playPauseScale = buttonScale * (isScreen ? 1.5 : isVideo && isStopped ? 1.6 : 1);
  $: playerTitleScale = isVideo && !fixedPosition ? 1.2 : 1;
  $: logoScale = isScreen && !isMobile ? 3 : isScreen ? 2 : isVideo && !isMobile ? 1.5 : 1;
  $: closeScale = isScreen && !isMobile ? 2.5 : isScreen ? 1.75 : isVideo && !isMobile ? 2 : isVideo ? 1.5 : 1;
  $: closeMargin = isScreen && !isMobile ? "12px 0" : isScreen ? "4px 0" : "auto";

  $: widthStyle = fixedWidth === "auto" ? (isSmall ? "fit-content" : "") : fixedWidth;
  $: position = fixedPosition === "auto" ? (isStandard ? "center" : "right") : fixedPosition;
  $: positionClasses = fixedPosition ? `fixed fixed-${position}` : "";
  $: flyWidget = (e) => fixedPosition && !window.disableAnimation && fly(e, { y: isSmall || isStandard ? 40 : 100 });

  $: margin = parseMargin(fixedMargin);
  $: marginWidth = `calc(${margin.left} + ${margin.right})`;

  $: controlsOrder = controlsOrderFn({ playerStyle, position, isMobile, isAdvert });

  $: advertImageUrl = companionAdvert?.imageUrl || activeAdvert?.imageUrl;
  $: advertClickThroughUrl = companionAdvert?.clickThroughUrl || activeAdvert?.clickThroughUrl;

  $: largeImage = isAdvert && advertImageUrl || !isStopped && persistentAdvert?.imageUrl ||  contentItem.imageUrl;
  $: largeImageHref = isAdvert && advertClickThroughUrl || !isStopped && persistentAdvert?.clickThroughUrl;
  $: imageSize = isMobile ? 80 : maxImageSize;

  $: collapsible = isSmall && fixedPosition && fixedWidth === "auto";
  $: forcedCollapsed = isSmall && (fixedWidth === 0 || fixedWidth === "0");
  $: collapsed = forcedCollapsed || collapsible && !isAdvert && !isStopped && !isHovering;

  $: showBeyondWords = logoIconEnabled && (!isAdvert || isScreen) && !(fixedPosition && isSmall) && !forcedCollapsed;

  $: playlistParts = playlistStyle.split("-");

  $: showPlaylist = (playlistParts[0] === "show" || playlistParts[0] === "auto" && isPlaylist) && !isSmall;
  $: showPlaylistToggle = (playlistToggle === "show" || playlistToggle === "auto" && isPlaylist) && !isSmall && !isFullScreen;

  $: downloadAudio = (summary ? contentItem.summarization.audio : contentItem.audio) || [];
  $: downloadVideo = (summary ? contentItem.summarization.video : contentItem.video) || [];

  $: classes = `user-interface ${playerStyle} ${playbackState} ${positionClasses} ${controlsOrder}`;
  $: fixedPosition && animate();

  const animate = () => { // TODO: extract?
    if (timeout) { clearTimeout(timeout); }
    timeout = setTimeout(() => timeout = null, 500);
  };

  const handleMouseDown = (event) => {
    if (!isVideo) { return; }

    const isLeftClick = event.button === 0;
    if (!isLeftClick) { return; }

    const clickedOnMain = event.target.classList.contains("main");
    if (!clickedOnMain) { return; }

    onEvent(newEvent({
      type: "PressedVideoBackground",
      description: "The video background was pressed.",
      initiatedBy: "user",
    }));
  };

  export const handleStateChange = () => {
    onEvent(
      newEvent({
        type: "RootStateChange",
        description: "The Root state changed.",
        initiatedBy: "browser",
        state: {
          isAdvert,
          isStopped,
          isPlaying,
          playbackState,
          callToAction,
          activeBgColor,
          activeTextColor,
          activeIconColor,
          videoBackgroundColor,
          nonVideoBgColor,
          largeImage,
          largeImageHref,
          imageSize,
        },
      }),
    );
  };

  $: isAdvert, isStopped, isPlaying, playbackState, callToAction, activeBgColor, activeTextColor, activeIconColor, videoBackgroundColor, nonVideoBgColor, largeImage, largeImageHref, imageSize, handleStateChange();

  // onMount(() => {
  //   const observer = new ResizeObserver(([entry]) => {
  //     width = entry.contentRect.width;
  //   });
  //   observer.observe(element);
  //   return () => observer.unobserve(element);
  // });
</script>
