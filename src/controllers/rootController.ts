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

  handlePressedAdvertLink() {
    console.log("pressed advert link");
  }

  handlePressedAdvertButton() {
    console.log("pressed advert button");
  }

  handlePressedBeyondWords() {
    console.log("pressed beyondwords");
  }

  handlePressedMaximize() {
    console.log("pressed maximize");
  }

  handlePressedExternalUrl() {
    console.log("pressed external url");
  }

  handlePressedTogglePlaylist() {
    console.log("pressed toggle playlist");
  }

  handlePressedScrollToPlayer() {
    console.log("pressed scroll to player");
  }

  handlePressedCloseWidget() {
    console.log("pressed close widget");
  }

  handlePressedProgressBar({ ratio }) {
    console.log(`pressed progress bar at ratio ${ratio}`);
  }

  handlePressedLeftOnProgressBar() {
    console.log("pressed left on progress bar");
  }

  handlePressedRightOnProgressBar() {
    console.log("pressed right on progress bar");
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

  handlePlaybackTimeUpdated({ updatedTime }) {
    this.player.playbackTime = updatedTime;
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
