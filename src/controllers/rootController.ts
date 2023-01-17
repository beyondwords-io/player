import { validatePreEvent, validatePostEvent } from "../helpers/eventValidation";
import { requestFullScreen, exitFullScreen, fullScreenElement } from "../helpers/fullScreen";
import throwError from "../helpers/throwError";
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

  handleVisibilityChanged() {
    chooseWidget(this.PlayerClass);
  }

  handlePressedPlay() {
    this.player.mediaElement.video.play();
  }

  handlePressedPause() {
    this.player.mediaElement.video.pause();
  }

  handlePressedChangeSpeed() {
    this.#setSpeed(i => i + 1, { cycle: true });
  }

  handlePressedLeftOnChangeSpeed() {
    this.#setSpeed(i => i - 1);
  }

  handlePressedRightOnChangeSpeed() {
    this.#setSpeed(i => i + 1);
  }

  handlePressedDownOnChangeSpeed() {
    this.#setSpeed(i => i - 1);
  }

  handlePressedUpOnChangeSpeed() {
    this.#setSpeed(i => i + 1);
  }

  handlePressedSpaceOnChangeSpeed() {
    this.#setSpeed(i => i + 1, { cycle: true });
  }

  handlePressedEnterOnChangeSpeed() {
    this.#setSpeed(i => i + 1, { cycle: true });
  }

  handlePressedPrevSegment() {
    console.log("pressed previous segment");
  }

  handlePressedNextSegment() {
    console.log("pressed next segment");
  }

  handlePressedSeekBack({ seconds }) {
    this.#setTime(t => t - seconds);
  }

  handlePressedSeekAhead({ seconds }) {
    this.#setTime(t => t + seconds);
  }

  handlePressedPrevTrack() {
    this.#setTrack(i => i - 1);
  }

  handlePressedNextTrack() {
    this.#setTrack(i => i + 1);
  }

  handlePressedMaximize() {
    if (fullScreenElement()) {
      exitFullScreen();
    } else {
      requestFullScreen(this.player.target);
    }
  }

  handlePressedTogglePlaylist() {
    const parts = this.player.playlistStyle.split("-");

    const isPlaylist = this.player.playlist.length > 1;
    const isShowing = parts[0] === "show" || parts[0] === "auto" && isPlaylist;

    parts[0] = isShowing ? "hide" : "show";
    this.player.playlistStyle = parts.join("-");
  }

  handlePressedScrollToPlayer() {
    this.player.target.scrollIntoView();
  }

  handlePressedCloseWidget() {
    for (const player of this.PlayerClass.instances()) {
      player.mediaElement.video.pause();
      player.widgetStyle = "closed-by-user";
    }
  }

  handlePressedProgressBar({ ratio }) {
    this.wasPlayingBeforeScrubbing = this.player.playbackState === "playing";
    this.#setTime((_, duration) => ratio * duration);
  }

  handleScrubbedProgressBar({ ratio }) {
    this.player.mediaElement.video.pause();
    this.#setTime((_, duration) => ratio * duration);
  }

  handleFinishedScrubbingProgressBar() {
    if (!this.wasPlayingBeforeScrubbing) { return; }
    this.player.mediaElement.video.play();
  }

  handlePressedLeftOnProgressBar() {
    this.#setTime(t => t - 5);
  }

  handlePressedRightOnProgressBar() {
    this.#setTime(t => t + 5);
  }

  handlePressedSpaceOnProgressBar() {
    this.#playOrPause();
  }

  handlePressedEnterOnProgressBar() {
    this.#playOrPause();
  }

  handlePressedLeftOnProgressCircle() {
    this.#setTime(t => t - 5);
  }

  handlePressedRightOnProgressCircle() {
    this.#setTime(t => t + 5);
  }

  handlePressedSpaceOnProgressCircle() {
    this.#playOrPause();
  }

  handlePressedEnterOnProgressCircle() {
    this.#playOrPause();
  }

  handlePressedPlaylistItem({ itemIndex }) {
    this.#setTrack(() => itemIndex, { forcePlay: true });
  }

  handlePressedVideoBackground() {
    this.#playOrPause();
  }

  // These methods respond to events emitted by the video element.
  // We shouldn't assume the methods above will succeed, e.g. video.play()
  handlePlaybackStarted() {
    this.player.playbackState = "playing";

    const otherPlayers = this.PlayerClass.instances().filter(p => p !== this.player);
    otherPlayers.forEach(p => p.mediaElement.video.pause());
  }

  handlePlaybackPaused() {
    this.player.playbackState = "paused";
  }

  handlePlaybackEnded() {
    if (this.player.activeAdvert) {
      this.player.activeAdvert = null;
      this.#setTrack(i => i, { forceLoad: true, forcePlay: true });
    } else {
      this.#setTrack(i => i + 1, { forcePlay: true });
    }
  }

  handleMediaDurationUpdated() {
    this.player.mediaDuration = this.player.mediaElement.video.duration;
  }

  handlePlaybackTimeUpdated() {
    this.player.playbackTime = this.player.mediaElement.video.currentTime;
  }

  handlePlaybackSpeedUpdated() {
    this.player.playbackSpeed = this.player.mediaElement.video.playbackRate;
  }

  handleFullScreenModeUpdated() {
    const playerIsFullScreen = fullScreenElement() === this.player.target;
    const addOrRemove = playerIsFullScreen ? "add" : "remove";

    this.player.userInterface.videoIsMaximized = playerIsFullScreen;
    this.player.mediaElement.videoIsMaximized = playerIsFullScreen;
    this.player.target.classList[addOrRemove]("maximized");
  }

  // These methods do nothing since the anchors already open a new tab.
  handlePressedAdvertLink() { }
  handlePressedAdvertButton() { }
  handlePressedBeyondWords() { }
  handlePressedExternalUrl() { }

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
      this.player.mediaElement.video.pause();
    } else {
      this.player.mediaElement.video.play();
    }
  }

  #setSpeed(indexFn, { cycle } = {}) {
    const availableSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const maxIndex = availableSpeeds.length - 1;

    const currentIndex = availableSpeeds.indexOf(this.player.playbackSpeed);
    const tryIndex = indexFn(currentIndex);

    let updatedIndex;

    if (cycle) {
      updatedIndex = tryIndex % availableSpeeds.length;
    } else {
      updatedIndex = Math.max(0, Math.min(maxIndex, tryIndex));
    }

    this.player.mediaElement.video.playbackRate = availableSpeeds[updatedIndex] || 1;
  }

  #setTime(timeFn) {
    const currentTime = this.player.mediaElement.video.currentTime;
    const duration = this.player.mediaElement.video.duration || 0;

    // Workaround a bug in HLS.js which emits 'ended' events if you set currentTime
    // past the duration while the media is paused. A regular video or audio tag
    // doesn't emit that event. See https://github.com/video-dev/hls.js/issues/5168
    const updatedTime = Math.min(timeFn(currentTime, duration), duration - 0.01);

    this.player.mediaElement.video.currentTime = updatedTime;

    // Normally, we'd wait for the timeupdate event from the video tag but in this
    // case we want to immediately update the progress bar to feel more responsive.
    this.player.playbackTime = updatedTime;
  }

  #setTrack(indexFn, { forceLoad, forcePlay } = {}) {
    const tryIndex = indexFn(this.player.playlistIndex);

    const outOfBounds = tryIndex < 0 || tryIndex >= this.player.playlist.length;
    const hasChanged = tryIndex !== this.player.playlistIndex;

    const isAdvert = this.player.activeAdvert;
    const isPlaying = this.player.playbackState === "playing";

    if (outOfBounds) {
      this.#loadMedia();
      this.player.playbackState = "stopped";
    } else {
      this.player.playlistIndex = tryIndex;

      if (forceLoad || hasChanged && !isAdvert) {
        this.#loadMedia();
      }

      if (forcePlay || isPlaying) {
        this.player.mediaElement.video.play();
      }
    }
  }

  #loadMedia() {
    this.player.mediaElement.video.load();
    this.player.mediaElement.video.playbackRate = this.player.playbackSpeed;
  }
}

export default RootController;
