import validateEvent from "../helpers/validateEvent";
import throwError from "../helpers/throwError";
import chooseWidget from "../helpers/chooseWidget";

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
    console.log("pressed change speed");
  }

  handlePressedPrevSegment() {
    console.log("pressed previous segment");
  }

  handlePressedNextSegment() {
    console.log("pressed next segment");
  }

  handlePressedSeekBack({ seconds }) {
    console.log(`pressed seek back with ${seconds} seconds`);
  }

  handlePressedSeekAhead({ seconds }) {
    console.log(`pressed seek ahead with ${seconds} seconds`);
  }

  handlePressedNextTrack() {
    console.log("pressed next track");
  }

  handlePressedPrevTrack() {
    console.log("pressed prev track");
  }

  handlePressedMaximize() {
    console.log("pressed maximize");
  }

  handlePressedTogglePlaylist() {
    const parts = this.player.playlistStyle.split("-");

    const isPlaylist = this.player.playlist.length > 1;
    const isShowing = parts[0] === "show" || parts[0] === "auto" && isPlaylist;

    parts[0] = isShowing ? "hide" : "show";
    this.player.playlistStyle = parts.join("-");
  }

  handlePressedScrollToPlayer() {
    console.log("pressed scroll to player");
  }

  handlePressedCloseWidget() {
    console.log("pressed close widget");
  }

  handlePressedProgressBar({ ratio }) {
    if (this.player.activeAdvert) { return; }

    const playlistItem = this.player.playlist[this.player.playlistIndex];
    this.player.mediaElement.video.currentTime = ratio * playlistItem.duration;
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
    console.log(`pressed playlist item ${itemIndex}`);
  }

  handlePressedVideoBackground() {
    this.#playOrPause();
  }

  handlePlaybackStarted() {
    this.player.playbackState = "playing";
  }

  handlePlaybackPaused() {
    this.player.playbackState = "paused";
  }

  handlePlaybackTimeUpdated() {
    this.player.playbackTime = this.player.mediaElement.video.currentTime;
  }

  handlePressedAdvertLink() {
    // Do nothing since the anchor already opens in a new tab.
  }

  handlePressedAdvertButton() {
    // Do nothing since the anchor already opens in a new tab.
  }

  handlePressedBeyondWords() {
    // Do nothing since the anchor already opens in a new tab.
  }

  handlePressedExternalUrl() {
    // Do nothing since the anchor already opens in a new tab.
  }

  // private

  #playOrPause() {
    if (this.player.playbackState === "playing") {
      this.player.mediaElement.video.pause();
    } else {
      this.player.mediaElement.video.play();
    }
  }
}

export default RootController;
