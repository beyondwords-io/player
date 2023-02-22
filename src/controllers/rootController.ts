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

  handlePressedPrevSegment()           { console.log("pressed previous segment"); }
  handlePressedNextSegment()           { console.log("pressed next segment"); }
  handlePressedSeekBack({ seconds })   { this.#setTime(t => t - seconds); }
  handlePressedSeekAhead({ seconds })  { this.#setTime(t => t + seconds); }
  handlePressedPrevTrack()             { this.#setTrack(i => i - 1); }
  handlePressedNextTrack()             { this.#setTrack(i => i + 1); }

  handlePressedAdvertLink()            { /* Do nothing */ }
  handlePressedAdvertButton()          { /* Do nothing */ }
  handlePressedBeyondWords()           { /* Do nothing */ }
  handlePressedExternalUrl()           { /* Do nothing */ }

  handleDurationUpdated()              { /* Do nothing */ }
  handleCurrentTimeUpdated()           { /* Do nothing */ }
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
    this.preScrubState = this.player.playbackState;;
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
    if (this.preScrubState) { return; } // Don't skip to next track while scrubbing.

    if (this.player.activeAdvert) {
      this.player.activeAdvert = null;
      this.#setTrack(i => i); // TODO: test this
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
    return this.player.activeAdvert && (
      type.includes("ChangeSpeed") ||
      type.includes("PrevSegment") ||
      type.includes("NextSegment") ||
      type.includes("SeekBack") ||
      type.includes("SeekAhead") ||
      type.includes("Progress") && !type.includes("Space") && !type.includes("Enter")
    );
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

  #setTrack(indexFn) {
    const tryIndex = indexFn(this.player.contentIndex);

    const outOfBounds = tryIndex < 0 || tryIndex >= this.player.content.length;
    const hasChanged = tryIndex !== this.player.contentIndex;

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
}

export default RootController;
