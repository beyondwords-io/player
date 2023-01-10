import chooseWidget from "../helpers/chooseWidget";

class RootController {
  constructor(player, PlayerClass) {
    this.player = player;
    this.PlayerClass = PlayerClass;
  }

  handleEvent(event) {
    if (event.type === "visibility-changed") {
      chooseWidget(this.PlayerClass);
    }

    event.handledAt = new Date().toISOString();
  }
}

export default RootController;
