import Player from "../../src/components/Player.svelte";

describe("Player", () => {
  it("can show the user interface", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    new Player({ target: div, props: { showUserInterface: true } });
    expect(div.innerHTML).toContain("showing user interface");
  });
});
