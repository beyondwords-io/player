// Boots the player for the harness page. Nothing is loaded by default: the URL
// or the control panel says which content to fetch, so it is always clear what
// is being tested.

import decodeUrlState from "./urlState.js";
import rebuildArticle from "./article.js";

const harness = { errors: [], boot, player: undefined };

window.BeyondWordsHarness = harness;

function boot() {
  if (harness.player) { return harness.player; }

  const { identifiers, settings } = decodeUrlState(window.location.search);

  const player = new window.BeyondWords.Player({
    target: "#player",
    controlPanel: ".control-panel",

    // The harness is for the new player; switch playerStyle in the panel to
    // compare against the legacy styles.
    playerStyle: "default",

    ...identifiers,
    ...settings,

    onError: (error) => {
      harness.errors.push(error);
      console.error(error);
    },
  });

  harness.player = player;

  const container = document.querySelector("#article");
  const rebuild = () => rebuildArticle(player, container);

  rebuild();

  // Only when the content itself changes: rebuilding on every event would throw
  // away the word highlight overlays and the matched elements the player caches.
  let loaded;

  player.addEventListener("<any>", (event) => {
    const item = player.content?.[player.contentIndex];
    const current = `${player.content?.length || 0}:${player.contentIndex}:${item?.id || ""}`;

    if (event.type === "NoContentAvailable" || current !== loaded) {
      loaded = current;
      rebuild();
    }
  });

  return player;
}

// The SDK script and this module load independently, so whichever arrives last
// starts the player.
if (window.BeyondWords?.Player) { boot(); }
