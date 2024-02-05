import { validateEventBeforeProcessing, validateEventAfterProcessing } from "../helpers/eventValidation";
import { requestFullScreen, exitFullScreen, fullScreenElement } from "../helpers/fullScreen";
import { v4 as randomUuid } from "uuid";
import { EPSILON } from "../helpers/timeFragment";
import waitUntil from "../helpers/waitUntil";
import throwError from "../helpers/throwError";
import setPropsFromApi from "../helpers/setPropsFromApi";
import findSegmentIndex from "../helpers/findSegmentIndex";
import diffObject from "../helpers/diffObject";
import sectionEnabled from "../helpers/sectionEnabled";
import downloadFile from "../helpers/downloadFile";
import chooseAdvert from "../helpers/chooseAdvert";
import choosePersistentAdvert from "../helpers/choosePersistentAdvert";
import chooseIntroOutro from "../helpers/chooseIntroOutro";
import chooseMediaSession from "../helpers/chooseMediaSession";
import chooseWidget from "../helpers/chooseWidget";

class RootController {
  constructor(player, PlayerClass) {
    this.player = player;
    this.PlayerClass = PlayerClass;
    this.eventListeners = { "<any>": {} };
  }

  addEventListener(eventType, callback) {
    const knownType = eventType === "<any>" || this[`handle${eventType}`];
    if (!knownType) { throwError(`Cannot add listener for unknown event type '${eventType}'.`); }

    const listenerHandle = `listener-handle-${randomUuid()}`;

    this.eventListeners[eventType] = this.eventListeners[eventType] || {};
    this.eventListeners[eventType][listenerHandle] = callback;

    return listenerHandle;
  }

  removeEventListener(eventType, listenerHandle) {
    this.eventListeners[eventType] = this.eventListeners[eventType] || {};
    delete this.eventListeners[eventType][listenerHandle];
  }

  async processEvent(event) {
    await waitUntil(() => this.player);
    validateEventBeforeProcessing(event);

    const handler = this[`handle${event.type}`];
    const propsBefore = this.player.properties();

    if (this.#ignoreDueToAdvert(event)) {
      event.status = "ignored-due-to-advert";
    } else if (this.#ignoreDueToScrubbing(event)) {
      event.status = "ignored-due-to-scrubbing";
    } else if (this.#ignoreDueToPrecedence(event)) {
      event.status = "ignored-due-to-precedence";
    } else if (handler) {
      await handler.call(this, event);

      // Defer playback of intros/outros/adverts until the user presses play so
      // that the user interface shows the content rather than the interstitial.
      this.#playDeferredIntroOutro();
      this.#playDeferredAdvert();

      event.status = "handled";
    } else {
      throwError("No handler function for event.", event);
    }

    const propsAfter = this.player.properties();

    event.changedProps = diffObject(propsBefore, propsAfter);
    event.processedAt = new Date().toISOString();

    validateEventAfterProcessing(event);

    this.#sendEventToListeners(event.type, event);
    this.#sendEventToListeners("<any>", event);
  }

  // Please document all events and keep in-sync with /doc/player-events.md

  handlePressedChangeRate()             { this.#setRate(i => i + 1, { cycle: true }); }
  handlePressedEnterOnChangeRate()      { this.#setRate(i => i + 1, { cycle: true }); }
  handlePressedSpaceOnChangeRate()      { this.#setRate(i => i + 1, { cycle: true }); }
  handlePressedUpOnChangeRate()         { this.#setRate(i => i + 1); }
  handlePressedRightOnChangeRate()      { this.#setRate(i => i + 1); }
  handlePressedDownOnChangeRate()       { this.#setRate(i => i - 1); }
  handlePressedLeftOnChangeRate()       { this.#setRate(i => i - 1); }

  handlePressedPrevSegment()            { this.#setSegment(i => i - 1); }
  handlePressedNextSegment()            { this.#setSegment(i => i + 1); }

  handlePressedSeekBack({ seconds })    { this.#setTime(t => t - seconds); }
  handlePressedSeekAhead({ seconds })   { this.#setTime(t => t + seconds); }
  handlePressedPrevTrack()              { this.#setTrack(i => i - 1); }
  handlePressedNextTrack()              { this.#setTrack(i => i + 1); }

  handlePressedAdvertLink()             { /* Do nothing */ }
  handlePressedAdvertButton()           { /* Do nothing */ }
  handlePressedAdvertImage()            { /* Do nothing */ }
  handlePressedAdvertVideo()            { /* Do nothing */ }
  handlePressedBeyondWords()            { /* Do nothing */ }
  handlePressedSourceUrl()              { /* Do nothing */ }

  handleContentAvailable()              { /* Do nothing. */ }
  handleDurationUpdated()               { /* Do nothing */ }
  handleMetadataLoaded({ loadedMedia }) { this.player.loadedMedia = loadedMedia; }
  handleMediaLoaded({ loadedMedia })    { this.player.loadedMedia = loadedMedia; }
  handleMediaSeeked()                   { /* Do nothing */ }
  handlePlaybackRateUpdated()           { /* Do nothing */ }

  handleVisibilityChanged()             { chooseWidget(this.PlayerClass); }

  handlePressedVideoBackground()        { this.#playOrPause(); }
  handlePressedEnterOnProgressBar()     { this.#playOrPause(); }
  handlePressedSpaceOnProgressBar()     { this.#playOrPause(); }
  handlePressedEnterOnProgressCircle()  { this.#playOrPause(); }
  handlePressedSpaceOnProgressCircle()  { this.#playOrPause(); }

  handlePressedLeftOnProgressBar()      { this.#setTime(t => t - 5); }
  handlePressedRightOnProgressBar()     { this.#setTime(t => t + 5); }
  handlePressedLeftOnProgressCircle()   { this.#setTime(t => t - 5); }
  handlePressedRightOnProgressCircle()  { this.#setTime(t => t + 5); }

  handlePressedProgressBar({ ratio }) {
    this.preScrubState = this.player.playbackState;
    this.pauseTimeout = setTimeout(() => this.#pauseIfPlaying(), 100);
    this.#setTime((_, duration) => ratio * duration);
    if (ratio !== 0) { this.segmentPlayed = true; }
  }

  handleScrubbedProgressBar({ ratio }) {
    this.#setTime((_, duration) => ratio * duration - 0.01);
    if (ratio !== 0) { this.segmentPlayed = true; }
  }

  handleFinishedScrubbingProgressBar() {
    clearTimeout(this.pauseTimeout);
    this.player.playbackState = this.preScrubState;
    delete this.preScrubState;
  }

  handleIdentifiersChanged() {
    setPropsFromApi(this.player).then(() => {
      this.#chooseAndSetIntroOutro({ atTheStart: true });
      this.#chooseAndSetAdvert({ atTheStart: true });
    });
  }

  handleNoContentAvailable({ description }) {
    console.warn(`BeyondWords.Player: ${description}`);
  }

  handlePressedPlay({ emittedFrom, widgetSegment, widgetIsCurrent }) {
    if (emittedFrom === "segment-widget" && !widgetIsCurrent) {
      this.#playFromSegment(widgetSegment);
    } else {
      this.player.playbackState = "playing";
    }
  }

  handlePressedPause() {
    this.player.playbackState = "paused";
  }

  handlePlaybackPlaying() {
    const otherPlayers = this.PlayerClass.instances().filter(p => p !== this.player);
    const playingPlayers = otherPlayers.filter(p => p.playbackState === "playing");

    playingPlayers.forEach(p => p.playbackState = "paused");
    chooseMediaSession(this.PlayerClass);
  }

  handlePlaybackPaused() {
    const isPlaying = this.player.playbackState === "playing";
    const atTheEnd = this.player.currentTime >= this.player.duration - 0.5;

    // If you bypass the player SDK and call video.pause() on the HTML element,
    // update the state so the UI is correct. This can happen when a phone call.
    if (isPlaying && !atTheEnd && !this.preScrubState) { this.player.playbackState = "paused"; }
  }

  handleCurrentTimeUpdated() {
    if (!this.midrollPlayed) { this.#chooseAndSetAdvert(); }

    const atTheStart = this.player.currentTime <= EPSILON;
    const atTheEnd = this.player.currentTime >= this.player.duration;
    const videoPaused = this.player.mediaElement.video.paused || this.#isVastAdvert();

    if (!atTheStart && !atTheEnd && !videoPaused) { this.player.playbackState = "playing"; }
  }

  handlePlaybackEnded() {
    if (this.#isMidrollAdvert()) { this.midrollPlayed = true; }
    this.segmentPlayed = false;

    const wasIntro = this.#isIntro();
    const wasAdvert = this.#isAdvert();

    this.#chooseAndSetAdvert({ atTheEnd: true, wasIntro });
    if (wasAdvert) { return; } // Don't skip track because the content hasn't played yet.

    this.#chooseAndSetIntroOutro({ atTheEnd: true });
    if (wasIntro) { return; } // Don't skip track because the content/advert hasn't played yet.

    if (this.#isOutro() || this.#isAdvert()) { return; } // Don't skip track until post-roll has played.

    this.#setTrack(i => i + 1);
  }

  handlePlaybackNotAllowed({ description }) {
    console.warn(`BeyondWords.Player: ${description}`);

    const atTheStart = this.player.contentIndex <= 0 && this.player.currentTime <= EPSILON;
    this.player.playbackState = atTheStart ? "stopped" : "paused";
  }

  handlePlaybackErrored({ mediaType, preloading, errorMessage }) {
    console.warn(`BeyondWords.Player: ${mediaType} playback error: ${errorMessage}`);

    if (this.#isIntro() || this.#isOutro()) {
      this.#chooseAndSetIntroOutro({ errored: true }); // TODO: how to pass atTheStart, atTheEnd?
    } else if (this.#isAdvert() || (preloading && mediaType === "VAST")) {
      this.#chooseAndSetAdvert({ errored: true }); // TODO: how to pass atTheStart, atTheEnd?
    } else {
      this.handlePlaybackEnded();
    }
  }

  handleCompanionAdvertChanged({ clickThroughUrl, imageUrl }) {
    this.player.companionAdvert = { clickThroughUrl, imageUrl };
  }

  handlePressedMaximize() {
    if (fullScreenElement()) {
      exitFullScreen();
    } else {
      requestFullScreen(this.player.target);
    }
  }

  handleFullScreenModeUpdated() {
    const isFullScreen = fullScreenElement() === this.player.target;
    const addOrRemove = isFullScreen ? "add" : "remove";

    this.player.isFullScreen = isFullScreen;
    this.player.target.classList[addOrRemove]("maximized");
  }

  handlePressedPlaylistItem({ index }) {
    this.#setTrack(() => index);
    this.player.playbackState = "playing";
  }

  handlePressedTogglePlaylist() {
    const parts = this.player.playlistStyle.split("-");

    const isPlaylist = this.player.content.length > 1;
    const isShowing = parts[0] === "show" || parts[0] === "auto" && isPlaylist;

    parts[0] = isShowing ? "hide" : "show";
    this.player.playlistStyle = parts.join("-");
  }

  handlePressedDownload({ contentIndex, audioIndex, videoIndex }) {
    const contentItem = this.player.content[contentIndex];

    const audioItem = contentItem.audio?.[audioIndex];
    const videoItem = contentItem.video?.[videoIndex];

    const mediaUrl = (audioItem || videoItem).url;

    const extension = mediaUrl.split(".").pop();
    const filename = `${contentItem.title}.${extension}`;

    return downloadFile(mediaUrl, filename);
  }

  handlePressedCloseWidget() {
    for (const player of this.PlayerClass.instances()) {
      player.playbackState = "paused";
      player.widgetStyle = "closed-by-user";
    }
  }

  handleContentStatusChanged({ contentId, legacyId, sourceId, sourceUrl, contentStatus }) {
    if (contentStatus !== "processed") { return; }

    // Only reload if listening hasn't started yet so that audio isn't interrupted.
    if (this.player.playbackState !== "stopped") { return; }
    if (this.player.contentIndex !== 0) { return; }
    if (this.player.currentTime !== 0) { return; }

    // The websocket sends status changes for all content in the project so check
    // that this event is for a content item that is one of the player's identifiers.
    if (!this.#matchesIdentifiers({ contentId, legacyId, sourceId, sourceUrl })) { return; }

    setPropsFromApi(this.player).then(() => {
      this.#chooseAndSetIntroOutro({ atTheStart: true });
      this.#chooseAndSetAdvert({ atTheStart: true });
    });
  }

  handleCurrentSegmentUpdated({ segment, contentIndex, segmentIndex, segmentElement }) {
    if (this.#isContent()) {
      this.player.currentSegment = { ...segment, contentIndex, segmentIndex, segmentElement };
    } else if (!this.segmentPlayed) {
      this.player.segmentContainers?.reset();
      this.player.currentSegment = null;
    }
  }

  handleHoveredSegmentUpdated({ segment, contentIndex, segmentIndex, segmentElement }) {
    if (segment) {
      this.player.hoveredSegment = { ...segment, contentIndex, segmentIndex, segmentElement };
    } else {
      this.player.hoveredSegment = null;
    }
  }

  handlePressedSegment({ segment, contentIndex, segmentIndex, segmentElement }) {
    const enabled = sectionEnabled("hovered", segment, this.player.clickableSections);
    if (!enabled) { return; }

    const hasChanged = this.#currentSegmentChanged({ contentIndex, segmentIndex });
    if (!hasChanged && !this.#isAdvert()) { this.#playOrPause(); return; }

    const changeTrack = contentIndex !== this.player.contentIndex;
    if (changeTrack) { this.#setTrack(() => contentIndex); }

    this.#playFromSegment({ contentIndex, segmentIndex, segmentElement, ...segment });
  }

  // private

  #ignoreDueToAdvert({ type }) {
    return this.#isAdvert() && (
      type.includes("ChangeRate") ||
      type.includes("PrevSegment") ||
      type.includes("NextSegment") ||
      type.includes("SeekBack") ||
      type.includes("SeekAhead") ||
      type.includes("Progress") && !type.includes("Space") && !type.includes("Enter")
    );
  }

  #ignoreDueToScrubbing({ type }) {
    return this.preScrubState && (
      type.includes("CurrentTimeUpdated") ||
      type.includes("PlaybackEnded")
    );
  }

  #ignoreDueToPrecedence({ type, precedence }) {
    return type.includes("PressedSegment") && precedence > 0;
  }

  #sendEventToListeners(eventType, event) {
    const typeListeners = this.eventListeners[eventType] || {};
    Object.values(typeListeners).forEach(f => f(event));
  }

  #hasIntro() {
    return this.player.introsOutros.some(o => o.placement === "pre-roll");
  }

  #hasOutro() {
    return this.player.introsOutros.some(o => o.placement === "post-roll");
  }

  #isIntro(index = this.player.introsOutrosIndex) {
    return this.player?.introsOutros?.[index]?.placement === "pre-roll";
  }

  #isOutro(index = this.player.introsOutrosIndex) {
    return this.player?.introsOutros?.[index]?.placement === "post-roll";
  }

  #isAdvert() {
    return this.player.advertIndex !== -1;
  }

  #isMidrollAdvert() {
    return this.player.adverts[this.player.advertIndex]?.placement === "mid-roll";
  }

  #isVastAdvert() {
    return !!this.player.adverts[this.player.advertIndex]?.vastUrl;
  }

  #isContent() {
    return !this.#isIntro() && !this.#isOutro() && !this.#isAdvert();
  }

  #playOrPause() {
    if (this.player.playbackState === "playing") {
      this.player.playbackState = "paused";
    } else {
      this.player.playbackState = "playing";
    }
  }

  #pauseIfPlaying() {
    if (this.player.playbackState === "playing") {
      this.player.playbackState = "paused";
    }
  }

  #playFromSegment({ contentIndex, segmentIndex, segmentElement, ...segment }) {
    this.#setTime(() => segment.startTime, contentIndex);
    this.player.currentSegment = { contentIndex, segmentIndex, segmentElement, ...segment };
    this.player.playbackState = "playing";
    this.segmentPlayed = true;
  }

  #setRate(indexFn, { cycle } = {}) {
    const playbackRates = this.player.playbackRates;
    const maxIndex = playbackRates.length - 1;

    const currentIndex = playbackRates.indexOf(this.player.playbackRate);
    const tryIndex = indexFn(currentIndex);

    let updatedIndex;

    if (cycle) {
      updatedIndex = tryIndex % playbackRates.length;
    } else {
      updatedIndex = Math.max(0, Math.min(maxIndex, tryIndex));
    }

    this.player.playbackRate = playbackRates[updatedIndex] || 1;
  }

  #setSegment(indexFn) {
    const segments = this.player.content[this.player.contentIndex].segments;

    const currentIndex = findSegmentIndex(segments, this.player.currentTime);
    const tryIndex = indexFn(currentIndex);

    // If the user clicks next during the intro, skip to the content.
    if (this.#isIntro() && tryIndex >= 0) {
      this.handlePlaybackEnded();

    // If the user clicks previous during the outro, skip back to the last segment.
    // Set 0.01 to ensure the intro doesn't play again if there are no segments.
    } else if (this.#isOutro() && tryIndex < 0) {
      this.#setIntroOutro(-1);
      this.#setTime(() => segments[segments.length - 1]?.startTime || 0.01);
      this.player.playbackState = "playing";

    // If the user clicks previous on the first segment, skip back to the intro.
    } else if (this.#isContent() && tryIndex < 0 && this.#hasIntro()) {
      this.#setTime(() => 0);
      this.#chooseAndSetIntroOutro({ atTheStart: true });

    // If the user clicks next on the last segment, play the outro.
    } else if (this.#isContent() && tryIndex === segments.length && this.#hasOutro()) {
      this.#setTime(() => this.player.duration - 0.01);

    // Otherwise, set the time to the startTime of the segment.
    } else if (this.#isContent() && tryIndex >= 0 && tryIndex < segments.length) {
      this.#setTime(() => segments[tryIndex].startTime);
    }
  }

  #setTrack(indexFn) {
    const tryIndex = indexFn(this.player.contentIndex);
    const outOfBounds = tryIndex < 0 || tryIndex >= this.player.content.length;

    if (outOfBounds) {
      this.player.playbackState = "stopped";
      this.#setTime(() => 0);
    } else {
      this.player.contentIndex = tryIndex;

      if (!this.#isAdvert()) {
        this.#setTime(() => 0);
        this.midrollPlayed = false;
      }
    }

    this.#setIntroOutro(-1);
    this.#chooseAndSetIntroOutro({ atTheStart: true });

    // Avoid playing back-to-back adverts: post-roll at the end of content
    // followed by pre-roll at the start when content is replayed by the user.
    if (!outOfBounds) {
      this.#chooseAndSetAdvert({ atTheStart: true });
    }
  }

  #setTime(timeFn, contentIndex) {
    if (this.#isAdvert()) {
      this.prevTime = timeFn();
      this.prevContent = contentIndex;
    } else {
      const duration = this.player.duration || 0;
      this.player.currentTime = timeFn(this.player.currentTime, duration);
    }
  }

  #chooseAndSetIntroOutro({ atTheStart, atTheEnd, errored } = {}) {
    const { content, introsOutros, currentTime } = this.player;

    const introsOutrosIndex = typeof this.nextIntroOutro !== "undefined" ? this.nextIntroOutro : this.player.introsOutrosIndex;
    const advertIndex = typeof this.nextAdvert !== "undefined" ? this.nextAdvert : this.player.advertIndex;
    const contentIndex = typeof this.prevContent !== "undefined" ? this.prevContent : this.player.contentIndex;

    this.#setIntroOutro(chooseIntroOutro({ introsOutros, introsOutrosIndex, advertIndex, content, contentIndex, currentTime, atTheStart, atTheEnd, errored }));
  }

  #chooseAndSetAdvert({ atTheStart, atTheEnd, wasIntro, errored } = {}) {
    const { adverts, content, currentTime, minDurationForMidroll, minTimeUntilEndForMidroll } = this.player;

    let introsOutrosIndex = typeof this.nextIntroOutro !== "undefined" ? this.nextIntroOutro : this.player.introsOutrosIndex;
    const advertIndex = typeof this.nextAdvert !== "undefined" ? this.nextAdvert : this.player.advertIndex;
    const contentIndex = typeof this.prevContent !== "undefined" ? this.prevContent : this.player.contentIndex;

    if (wasIntro) { atTheStart = true; atTheEnd = false; introsOutrosIndex = -1; } // Choose from pre-roll advert placements after the intro.
    this.#setAdvert(chooseAdvert({ introsOutrosIndex, adverts, advertIndex, content, contentIndex, currentTime, atTheStart, atTheEnd, errored, minDurationForMidroll, minTimeUntilEndForMidroll }));
    if (!this.#isAdvert()) {
      this.player.preloadAdvertIndex = chooseAdvert({ introsOutrosIndex, adverts, advertIndex, content, contentIndex, currentTime: currentTime + 5, atTheStart, atTheEnd, errored, minDurationForMidroll, minTimeUntilEndForMidroll });
    } else {
      this.player.preloadAdvertIndex = -1;
    }

    const persistentAdImage = this.player.persistentAdImage;
    const persistentIndex = this.player.persistentIndex;

    this.player.persistentIndex = choosePersistentAdvert(persistentAdImage, persistentIndex, advertIndex, adverts);
  }

  #playDeferredIntroOutro() {
    if (this.player.playbackState !== "playing") { return; }
    if (typeof this.nextIntroOutro === "undefined") { return; }

    this.#setIntroOutro(this.nextIntroOutro);
    delete this.nextIntroOutro;
  }

  #playDeferredAdvert() {
    if (this.player.playbackState !== "playing") { return; }
    if (typeof this.nextAdvert === "undefined") { return; }

    this.#setAdvert(this.nextAdvert);
    delete this.nextAdvert;
  }

  #setIntroOutro(index) {
    const defer = this.player.playbackState !== "playing" && index !== -1;
    if (defer) { this.nextIntroOutro = index; return; } else { delete this.nextIntroOutro; }

    const atTheStart = this.player.contentIndex <= 0 && this.player.currentTime <= EPSILON;
    const skippedIntro = !atTheStart && this.#isIntro(index);

    // We were at the start and were going to play an intro but the user skipped
    // past it so clear the index and check if an advert should now play.
    if (skippedIntro) {
      this.player.introsOutrosIndex = -1;
      this.#chooseAndSetAdvert({ atTheStart: true });
      return;
    }

    const wasIntro = this.#isIntro();
    const wasOutro = this.#isOutro();

    this.player.introsOutrosIndex = index;

    const introFinished = wasIntro && !this.#isIntro();
    const outroFinished = wasOutro && !this.#isOutro();

    if (introFinished) { this.player.currentTime = 0; }
    if (outroFinished) { this.#setTrack(() => Infinity); }
  }

  #setAdvert(index) {
    const defer = this.player.playbackState !== "playing" && index !== -1;
    if (defer) { this.nextAdvert = index; return; } else { delete this.nextAdvert; }

    const wasAdvert = this.#isAdvert();
    const isAdvert = index !== -1;

    const advertsStarted = !wasAdvert && isAdvert;
    const advertsFinished = wasAdvert && !isAdvert;

    if (advertsStarted)   { this.#overridePlayerState(); }

    this.player.advertIndex = index;

    if (advertsFinished)  { this.#restorePlayerState(); }
  }

  #overridePlayerState() {
    if (!this.#isIntro()) { this.prevTime = this.player.currentTime; }

    this.prevRate = this.player.playbackRate;
    this.prevContent = this.player.contentIndex;

    this.player.currentTime = 0;
    this.player.playbackRate = 1;
  }

  #restorePlayerState() {
    this.player.playbackRate = this.prevRate || 1;

    const trackChanged = this.player.contentIndex !== this.prevContent;
    if (!trackChanged) { this.player.currentTime = this.prevTime; }

    delete this.prevTime;
    delete this.prevRate;
    delete this.prevContent;
  }

  #matchesIdentifiers({ contentId, legacyId, sourceId, sourceUrl }) {
    return this.player.contentId === contentId ||
      this.player.contentId === legacyId ||
      this.player.sourceId === sourceId ||
      this.player.sourceUrl === sourceUrl ||
      this.player.playlist?.some(o => o.contentId === contentId) ||
      this.player.playlist?.some(o => o.contentId === legacyId) ||
      this.player.playlist?.some(o => o.sourceId === sourceId) ||
      this.player.playlist?.some(o => o.sourceUrl === sourceUrl);
  }

  #currentSegmentChanged({ contentIndex, segmentIndex }) {
    return (
      this.player.currentSegment?.contentIndex !== contentIndex ||
      this.player.currentSegment?.segmentIndex !== segmentIndex
    );
  }
}

export default RootController;
