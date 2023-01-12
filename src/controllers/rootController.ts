import throwError from "../helpers/throwError";
import chooseWidget from "../helpers/chooseWidget";

class RootController {
  constructor(player, PlayerClass) {
    this.player = player;
    this.PlayerClass = PlayerClass;
  }

  handleEvent(event) {
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
    console.log("pressed play");
  }

  handlePressedPause() {
    console.log("pressed pause");
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
    console.log("pressed space on progress bar");
  }

  handlePressedEnterOnProgressBar() {
    console.log("pressed enter on progress bar");
  }

  handlePressedPlaylistItem({ itemIndex }) {
    console.log(`pressed playlist item ${itemIndex}`);
  };

  handlePressedVideoBackground() {
    console.log("pressed video background");
  }
}

export default RootController;
