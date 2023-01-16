import validateEvent from "../helpers/validateEvent";
import throwError from "../helpers/throwError";
import chooseWidget from "../helpers/chooseWidget";
import { requestFullScreen, exitFullScreen, fullScreenElement } from "../helpers/fullScreen";

class RootController {
  constructor(player, PlayerClass) {
    this.player = player;
    this.PlayerClass = PlayerClass;
  }

  handleEvent(event) {
    validateEvent(event);
    const handler = this[`handle${event.type}`];

    if (handler) {
      handler.call(this, event);
    } else {
      throwError("No handler function for event.", event);
    }

    event.handledAt = new Date().toISOString();
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
    const availableSpeeds = [1, 1.25, 1.5, 1.75, 2, 0.25, 0.5, 0.75];

    const currentIndex = availableSpeeds.indexOf(this.player.playbackSpeed);
    const cycledIndex = (currentIndex + 1) % availableSpeeds.length;

    this.player.mediaElement.video.playbackRate = availableSpeeds[cycledIndex];
  }

  handlePressedPrevSegment() {
    if (this.player.activeAdvert) { return; }
    console.log("pressed previous segment");
  }

  handlePressedNextSegment() {
    if (this.player.activeAdvert) { return; }
    console.log("pressed next segment");
  }

  handlePressedSeekBack({ seconds }) {
    if (this.player.activeAdvert) { return; }
    this.player.mediaElement.video.currentTime -= seconds;
  }

  handlePressedSeekAhead({ seconds }) {
    if (this.player.activeAdvert) { return; }
    this.player.mediaElement.video.currentTime += seconds;
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
    if (this.player.activeAdvert) { return; }
    this.player.mediaElement.video.currentTime = ratio * this.player.mediaDuration;
  }

  handlePressedLeftOnProgressBar() {
    if (this.player.activeAdvert) { return; }
    this.player.mediaElement.video.currentTime -= 5;
  }

  handlePressedRightOnProgressBar() {
    if (this.player.activeAdvert) { return; }
    this.player.mediaElement.video.currentTime += 5;
  }

  handlePressedSpaceOnProgressBar() {
    this.#playOrPause();
  }

  handlePressedEnterOnProgressBar() {
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
    this.#setTrack(i => i + 1, { forcePlay: true });
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

  #playOrPause() {
    if (this.player.playbackState === "playing") {
      this.player.mediaElement.video.pause();
    } else {
      this.player.mediaElement.video.play();
    }
  }

  #setTrack(indexFn, { forcePlay } = {}) {
    const tryIndex = indexFn(this.player.playlistIndex);

    const outOfBounds = tryIndex < 0 || tryIndex >= this.player.playlist.length;
    const sameIndex = tryIndex === this.player.playlistIndex;
    const isPlaying = this.player.playbackState === "playing";

    if (outOfBounds) {
      this.player.mediaElement.video.load();
      this.player.playbackState = "stopped";
    } else if (sameIndex) {
      this.player.mediaElement.video.play();
    } else {
      this.player.playlistIndex = tryIndex;
      this.player.mediaElement.video.load();

      if (isPlaying || forcePlay) {
        this.player.mediaElement.video.play();
      }
    }
  }
}

export default RootController;
