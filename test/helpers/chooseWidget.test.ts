import chooseWidget from "../../src/helpers/chooseWidget";

describe("chooseWidget", () => {
  it("chooses players that are not currently visible and are above the viewport", () => {
    const mock = { userInterface: { isVisible: false, relativeY: -1 }, widgetStyle: "small" };

    chooseWidget({ instances: () => [mock] });

    expect(mock.showWidgetAtBottom).toEqual(true);
  });

  it("does not choose players with an unknown widget style", () => {
    const mock = { userInterface: { isVisible: false, relativeY: -1 }, widgetStyle: "closed-by-user" };

    chooseWidget({ instances: () => [mock] });

    expect(mock.showWidgetAtBottom).toEqual(false);
  });

  it("does not choose players that are visible", () => {
    const mock = { userInterface: { isVisible: true, relativeY: -1 }, widgetStyle: "small" };

    chooseWidget({ instances: () => [mock] });

    expect(mock.showWidgetAtBottom).toEqual(false);
  });

  it("does not choose players that are within/below the viewport", () => {
    const mock = { userInterface: { isVisible: false, relativeY: 0 }, widgetStyle: "small" };

    chooseWidget({ instances: () => [mock] });

    expect(mock.showWidgetAtBottom).toEqual(false);
  });

  it("prefers to choose players that are playing", () => {
    const mock1 = { playbackState: "paused", userInterface: { isVisible: false, relativeY: -1 }, widgetStyle: "small" };
    const mock2 = { playbackState: "playing", userInterface: { isVisible: false, relativeY: -1 }, widgetStyle: "small" };
    const mock3 = { playbackState: "stopped", userInterface: { isVisible: false, relativeY: -1 }, widgetStyle: "small" };

    chooseWidget({ instances: () => [mock1, mock2, mock3] });

    expect(mock1.showWidgetAtBottom).toEqual(false);
    expect(mock2.showWidgetAtBottom).toEqual(true);
    expect(mock3.showWidgetAtBottom).toEqual(false);
  });

  it("prefers to choose players that are paused if none are playing", () => {
    const mock1 = { playbackState: "stopped", userInterface: { isVisible: false, relativeY: -1 }, widgetStyle: "small" };
    const mock2 = { playbackState: "paused", userInterface: { isVisible: false, relativeY: -1 }, widgetStyle: "small" };
    const mock3 = { playbackState: "stopped", userInterface: { isVisible: false, relativeY: -1 }, widgetStyle: "small" };

    chooseWidget({ instances: () => [mock1, mock2, mock3] });

    expect(mock1.showWidgetAtBottom).toEqual(false);
    expect(mock2.showWidgetAtBottom).toEqual(true);
    expect(mock3.showWidgetAtBottom).toEqual(false);
  });

  it("prefers to choose players that are lower on the page", () => {
    const mock1 = { playbackState: "stopped", userInterface: { isVisible: false, relativeY: -1, absoluteY: 0 }, widgetStyle: "small" };
    const mock2 = { playbackState: "stopped", userInterface: { isVisible: false, relativeY: -1, absoluteY: 300 }, widgetStyle: "small" };
    const mock3 = { playbackState: "stopped", userInterface: { isVisible: false, relativeY: -1, absoluteY: 100 }, widgetStyle: "small" };

    chooseWidget({ instances: () => [mock1, mock2, mock3] });

    expect(mock1.showWidgetAtBottom).toEqual(false);
    expect(mock2.showWidgetAtBottom).toEqual(true);
    expect(mock3.showWidgetAtBottom).toEqual(false);
  });

  it("primarily chooses based on playbackState, and secondarily chooses based on absoluteY", () => {
    const mock1 = { playbackState: "stopped", userInterface: { isVisible: false, relativeY: -1, absoluteY: 0 }, widgetStyle: "small" };
    const mock2 = { playbackState: "stopped", userInterface: { isVisible: false, relativeY: -1, absoluteY: 300 }, widgetStyle: "small" };
    const mock3 = { playbackState: "playing", userInterface: { isVisible: false, relativeY: -1, absoluteY: 100 }, widgetStyle: "small" };

    chooseWidget({ instances: () => [mock1, mock2, mock3] });

    expect(mock1.showWidgetAtBottom).toEqual(false);
    expect(mock2.showWidgetAtBottom).toEqual(false);
    expect(mock3.showWidgetAtBottom).toEqual(true);
  });

  it("does not choose a player if any are visible and all above are stopped", () => {
    const mock1 = { playbackState: "stopped", userInterface: { isVisible: false, relativeY: -1, absoluteY: 0 }, widgetStyle: "small" };
    const mock2 = { playbackState: "stopped", userInterface: { isVisible: true, relativeY: -1, absoluteY: 300 }, widgetStyle: "small" };
    const mock3 = { playbackState: "playing", userInterface: { isVisible: false, relativeY: 1000, absoluteY: 1300 }, widgetStyle: "small" };

    chooseWidget({ instances: () => [mock1, mock2, mock3] });

    expect(mock1.showWidgetAtBottom).toEqual(false);
    expect(mock2.showWidgetAtBottom).toEqual(false);
    expect(mock3.showWidgetAtBottom).toEqual(false);
  });
});
