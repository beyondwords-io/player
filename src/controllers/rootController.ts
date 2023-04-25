import { validateEventBeforeProcessing, validateEventAfterProcessing } from "../helpers/eventValidation";
import { requestFullScreen, exitFullScreen, fullScreenElement } from "../helpers/fullScreen";
import { v4 as randomUuid } from "uuid";
import waitUntil from "../helpers/waitUntil";
import throwError from "../helpers/throwError";
import setPropsFromApi from "../helpers/setPropsFromApi";
import findSegmentIndex from "../helpers/findSegmentIndex";
import settableProps from "../helpers/settableProps";
import diffObject from "../helpers/diffObject";
import sectionEnabled from "../helpers/sectionEnabled";
import chooseAdvert from "../helpers/chooseAdvert";
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
    const propsBefore = settableProps(this.player);

    if (this.#ignoreDueToAdvert(event)) {
      event.status = "ignored-due-to-advert";
    } else if (this.#ignoreDueToScrubbing(event)) {
      event.status = "ignored-due-to-scrubbing";
    } else if (handler) {
      await handler.call(this, event);
      this.#playDeferredInterstitial();
      event.status = "handled";
    } else {
      throwError("No handler function for event.", event);
    }

    const propsAfter = settableProps(this.player);

    event.changedProps = diffObject(propsBefore, propsAfter);
    event.processedAt = new Date().toISOString();

    validateEventAfterProcessing(event);

    this.#sendEventToListeners(event.type, event);
    this.#sendEventToListeners("<any>", event);
  }

  // Please document all events and keep in-sync with /doc/player-events.md

  handlePressedChangeSpeed()           { this.#setSpeed(i => i + 1, { cycle: true }); }
  handlePressedEnterOnChangeSpeed()    { this.#setSpeed(i => i + 1, { cycle: true }); }
  handlePressedSpaceOnChangeSpeed()    { this.#setSpeed(i => i + 1, { cycle: true }); }
  handlePressedUpOnChangeSpeed()       { this.#setSpeed(i => i + 1); }
  handlePressedRightOnChangeSpeed()    { this.#setSpeed(i => i + 1); }
  handlePressedDownOnChangeSpeed()     { this.#setSpeed(i => i - 1); }
  handlePressedLeftOnChangeSpeed()     { this.#setSpeed(i => i - 1); }

  handlePressedPrevSegment()           { this.#setSegment(i => i - 1); }
  handlePressedNextSegment()           { this.#setSegment(i => i + 1); }

  handlePressedSeekBack({ seconds })   { this.#setTime(t => t - seconds); }
  handlePressedSeekAhead({ seconds })  { this.#setTime(t => t + seconds); }
  handlePressedPrevTrack()             { this.#setTrack(i => i - 1); }
  handlePressedNextTrack()             { this.#setTrack(i => i + 1); }

  handlePressedAdvertLink()            { /* Do nothing */ }
  handlePressedAdvertButton()          { /* Do nothing */ }
  handlePressedAdvertVideo()           { /* Do nothing */ }
  handlePressedBeyondWords()           { /* Do nothing */ }
  handlePressedSourceUrl()             { /* Do nothing */ }

  handleDurationUpdated()              { /* Do nothing */ }
  handleCurrentTimeUpdated()           { !this.midrollPlayed && this.#setInterstitial(); }
  handlePlaybackPaused()               { /* Do nothing */ }
  handlePlaybackRateUpdated()          { /* Do nothing */ }

  handleVisibilityChanged()            { chooseWidget(this.PlayerClass); }
  handlePressedScrollToPlayer()        { this.player.target.scrollIntoView(); }

  handlePressedVideoBackground()       { this.#playOrPause(); }
  handlePressedEnterOnProgressBar()    { this.#playOrPause(); }
  handlePressedSpaceOnProgressBar()    { this.#playOrPause(); }
  handlePressedEnterOnProgressCircle() { this.#playOrPause(); }
  handlePressedSpaceOnProgressCircle() { this.#playOrPause(); }

  handlePressedLeftOnProgressBar()     { this.#setTime(t => t - 5); }
  handlePressedRightOnProgressBar()    { this.#setTime(t => t + 5); }
  handlePressedLeftOnProgressCircle()  { this.#setTime(t => t - 5); }
  handlePressedRightOnProgressCircle() { this.#setTime(t => t + 5); }

  handlePressedProgressBar({ ratio }) {
    this.preScrubState = this.player.playbackState;
    this.#pauseIfPlaying();
    this.#setTime((_, duration) => ratio * duration);
  }

  handleScrubbedProgressBar({ ratio }) {
    this.#setTime((_, duration) => ratio * duration);
  }

  handleFinishedScrubbingProgressBar() {
    this.player.playbackState = this.preScrubState;
    delete this.preScrubState;
  }

  handleIdentifiersChanged() {
    setPropsFromApi(this.player).then(() => {
      this.#setInterstitial({ atTheStart: true });
    });
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

  handlePlaybackEnded() {
    if (this.#isMidrollAdvert()) { this.midrollPlayed = true; }

    const wasInterstitial = this.#isInterstitial();
    this.#setInterstitial({ atTheEnd: true });

    if (wasInterstitial) { return; } // Don't skip track because the content hasn't played yet.
    if (this.#isInterstitial()) { return; } // Don't skip track until post-roll has played.

    this.#setTrack(i => i + 1);
  }

  handlePlaybackErrored({ mediaType, mediaUrl, errorMessage }) {
    console.error(`${mediaType} playback error: ${errorMessage} (requesting ${mediaUrl})`);

    if (this.#isInterstitial()) {
      this.#setInterstitial({ errored: true }); // TODO: how to pass atTheStart, atTheEnd?
    } else {
      this.handlePlaybackEnded();
    }
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
      this.#setInterstitial({ atTheStart: true });
    });
  }

  handleCurrentSegmentUpdated({ segment, segmentIndex, contentIndex }) {
    if (this.#isAdvert() && !this.segmentPlayed) {
      this.player.segmentContainers.reset();
      this.player.currentSegment = null;
    } else if (!this.#isAdvert()) {
      this.player.currentSegment = { ...segment, segmentIndex, contentIndex };
    }
  }

  handleHoveredSegmentUpdated({ segment, segmentIndex, contentIndex }) {
    if (segment) {
      this.player.hoveredSegment = { ...segment, segmentIndex, contentIndex };
    } else {
      this.player.hoveredSegment = null;
    }
  }

  handlePressedSegment({ segment, segmentIndex, contentIndex }) {
    const enabled = sectionEnabled("hovered", segment, this.player.clickableSections);
    if (!enabled) { return; }

    const hasChanged = this.#currentSegmentChanged({ contentIndex, segmentIndex });
    if (!hasChanged && !this.#isAdvert()) { this.#playOrPause(); return; }

    const changeTrack = contentIndex !== this.player.contentIndex;
    if (changeTrack) { this.#setTrack(() => contentIndex); }

    this.#playFromSegment({ segmentIndex, contentIndex, ...segment });
  }

  // private

  #ignoreDueToAdvert({ type }) {
    return this.#isAdvert() && (
      type.includes("ChangeSpeed") ||
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

  #sendEventToListeners(eventType, event) {
    const typeListeners = this.eventListeners[eventType] || {};
    Object.values(typeListeners).forEach(f => f(event));
  }

  #isInterstitial() {
    return this.#isIntroOutro() || this.#isAdvert();
  }

  #isIntroOutro() {
    return this.player.introsOutrosIndex !== -1;
  }

  #isAdvert() {
    return this.player.advertIndex !== -1;
  }

  #isMidrollAdvert() {
    return this.player.adverts[this.player.advertIndex]?.placement === "mid-roll";
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

  #playFromSegment({ segmentIndex, contentIndex, ...segment }) {
    this.#setTime(() => segment.startTime, contentIndex);
    this.player.currentSegment = { segmentIndex, contentIndex, ...segment };
    this.player.playbackState = "playing";
    this.segmentPlayed = true;
  }

  #setSpeed(indexFn, { cycle } = {}) {
    const availableSpeeds = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 2, 2.5, 3];
    const maxIndex = availableSpeeds.length - 1;

    const currentIndex = availableSpeeds.indexOf(this.player.playbackRate);
    const tryIndex = indexFn(currentIndex);

    let updatedIndex;

    if (cycle) {
      updatedIndex = tryIndex % availableSpeeds.length;
    } else {
      updatedIndex = Math.max(0, Math.min(maxIndex, tryIndex));
    }

    this.player.playbackRate = availableSpeeds[updatedIndex] || 1;
  }

  #setSegment(indexFn) {
    const segments = this.player.content[this.player.contentIndex].segments;

    const currentIndex = findSegmentIndex(segments, this.player.currentTime);
    const tryIndex = indexFn(currentIndex);

    const outOfBounds = tryIndex < 0 || tryIndex >= segments.length;
    if (outOfBounds) { return; }

    this.#setTime(() => segments[tryIndex].startTime);
  }

  #setTrack(indexFn) {
    const tryIndex = indexFn(this.player.contentIndex);
    const outOfBounds = tryIndex < 0 || tryIndex >= this.player.content.length;

    if (outOfBounds) {
      this.player.playbackState = "stopped";
      this.#setTime(() => 0);
    } else {
      this.player.contentIndex = tryIndex;

      if (!this.#isInterstitial()) {
        this.#setTime(() => 0);
        this.midrollPlayed = false;
        this.segmentPlayed = false;
      }

      this.#setInterstitial({ atTheStart: true });
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

  #setInterstitial({ atTheStart, atTheEnd, errored } = {}) {
    const { adverts, content, introsOutros, currentTime } = this.player;

    let introsOutrosIndex = typeof this.nextIntroOutro !== "undefined" ? this.nextIntroOutro : this.player.introsOutrosIndex;
    const advertIndex = typeof this.nextAdvert !== "undefined" ? this.nextAdvert : this.player.advertIndex;
    const contentIndex = typeof this.prevContent !== "undefined" ? this.prevContent : this.player.contentIndex;

    const atTheEndOfIntro = atTheEnd && introsOutrosIndex !== -1 && contentIndex === 0;

    this.#setIntroOutro(chooseIntroOutro({ introsOutros, introsOutrosIndex, advertIndex, content, contentIndex, currentTime, atTheStart, atTheEnd, errored }));
    introsOutrosIndex = typeof this.nextIntroOutro !== "undefined" ? this.nextIntroOutro : this.player.introsOutrosIndex;

    if (atTheEndOfIntro) { atTheStart = true; atTheEnd = false; } // Choose from pre-roll advert placements after the intro.
    this.#setAdvert(chooseAdvert({ introsOutrosIndex, adverts, advertIndex, content, contentIndex, currentTime, atTheStart, atTheEnd, errored }));
  }

  // Defer playback of intros/outros/adverts until the user presses play so that
  // we show the duration/colors for the content rather than the interstitial.
  #playDeferredInterstitial() {
    if (this.player.playbackState !== "playing") { return; }

    if (typeof this.nextIntroOutro !== "undefined") {
      this.#setIntroOutro(this.nextIntroOutro);
      delete this.nextIntroOutro;

    } else if (typeof this.nextAdvert !== "undefined") {
      this.#setAdvert(this.nextAdvert);
      delete this.nextAdvert;
    }
  }

  #setIntroOutro(index) {
    const defer = this.player.playbackState !== "playing" && index !== -1;
    if (defer) { this.nextIntroOutro = index; return; } else { delete this.nextIntroOutro; }

    const wasIntroOutro = this.#isIntroOutro();
    this.player.introsOutrosIndex = index;

    const introOutroFinished = wasIntroOutro && !this.#isIntroOutro();
    if (introOutroFinished) { this.player.currentTime = 0; }
  }

  #setAdvert(index) {
    const defer = this.player.playbackState !== "playing" && index !== -1;
    if (defer) { this.nextAdvert = index; return; } else { delete this.nextAdvert; }

    const wasAdvert = this.#isAdvert();
    this.player.advertIndex = index;

    const advertsStarted = !wasAdvert && this.#isAdvert();
    const advertsFinished = wasAdvert && !this.#isAdvert();

    if (advertsStarted)   { this.#overridePlayerState(); }
    if (advertsFinished)  { this.#restorePlayerState(); }
  }

  #overridePlayerState() {
    this.prevTime = this.player.currentTime;
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
