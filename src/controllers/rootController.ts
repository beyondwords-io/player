import { validatePreEvent, validatePostEvent } from "../helpers/eventValidation";
import { requestFullScreen, exitFullScreen, fullScreenElement } from "../helpers/fullScreen";
import throwError from "../helpers/throwError";
import setPropsFromApi from "../helpers/setPropsFromApi";
import chooseWidget from "../helpers/chooseWidget";

class RootController {
  constructor(player, PlayerClass) {
    this.player = player;
    this.PlayerClass = PlayerClass;
  }

  processEvent(event) {
    validatePreEvent(event);
    const handler = this[`handle${event.type}`];

    if (this.#ignoreDueToAdvert(event)) {
      event.status = "ignored";
    } else if (handler) {
      handler.call(this, event);
      event.status = "handled";
    } else {
      throwError("No handler function for event.", event);
    }

    event.processedAt = new Date().toISOString();
    validatePostEvent(event);
  }

  handlePressedPlay()                  { this.player.playbackState = "playing"; }
  handlePressedPause()                 { this.player.playbackState = "paused"; }

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
  handlePressedBeyondWords()           { /* Do nothing */ }
  handlePressedExternalUrl()           { /* Do nothing */ }

  handleDurationUpdated()              { /* Do nothing */ }
  #adPlayed = false;
  handleCurrentTimeUpdated()           { if (!this.#adPlayed && this.player.currentTime > 1.5) { this.#setAdvert(0); this.#adPlayed = true } } // TODO

  handlePlaybackRateUpdated()          { /* Do nothing */ }
  handlePlaybackPaused()               { /* Do nothing */ }

  handleIdentifiersChanged()           { setPropsFromApi(this.player); }
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
    this.#setTime((_, duration) => ratio * duration);
  }

  handleScrubbedProgressBar({ ratio }) {
    if (this.player.playbackState === "playing") {
      this.player.playbackState = "paused";
    }

    this.#setTime((_, duration) => ratio * duration);
  }

  handleFinishedScrubbingProgressBar() {
    this.player.playbackState = this.preScrubState;
    delete this.preScrubState;
  }

  handlePlaybackStarted() {
    const otherPlayers = this.PlayerClass.instances().filter(p => p !== this.player);
    otherPlayers.forEach(p => p.playbackState = "paused");
  }

  handlePlaybackEnded() {
    if (this.preScrubState) {
      return; // Don't skip track while scrubbing.
    } else if (this.#isAdvert()) {
      this.#setAdvert(-1);
    } else {
      this.#setTrack(i => i + 1);
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

  #isAdvert() {
    return this.player.advertIndex !== -1;
  }

  #playOrPause() {
    if (this.player.playbackState === "playing") {
      this.player.playbackState = "paused";
    } else {
      this.player.playbackState = "playing";
    }
  }

  #setSpeed(indexFn, { cycle } = {}) {
    const availableSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
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

    const time = this.player.currentTime;
    const currentIndex = segments.findIndex(s => s.startTime <= time && time < s.startTime + s.duration);

    const tryIndex = indexFn(currentIndex);
    const underBounds = tryIndex < 0;
    const overBounds = tryIndex >= segments.length;

    if (underBounds) {
      this.#setTrack(i => i - 1);
    } else if (overBounds) {
      this.#setTrack(i => i + 1);
    } else {
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
    }
  }

  #setTime(timeFn) {
    this.player.currentTime = timeFn(this.player.currentTime, this.player.duration || 0);
  }

  #setAdvert(index) {
    const wasAdvert = this.#isAdvert();
    this.player.advertIndex = index;

    const advertsStarted = !wasAdvert && this.#isAdvert();
    const advertsFinished = wasAdvert && !this.#isAdvert();

    if (advertsStarted)   { this.#backupPlayerState(); }
    if (this.#isAdvert()) { this.#overridePlayerState(); }
    if (advertsFinished)  { this.#restorePlayerState(); }
  }

  #backupPlayerState() {
    this.prevTime = this.player.currentTime;
    this.prevRate = this.player.playbackRate;
    this.prevIndex = this.player.contentIndex;
  }

  #overridePlayerState() {
    this.player.playbackRate = 1;
  }

  #restorePlayerState() {
    this.player.playbackRate = this.prevRate;

    const trackChanged = this.player.contentIndex !== this.prevIndex;
    if (!trackChanged) { this.player.currentTime = this.prevTime; }
  }
}

export default RootController;
