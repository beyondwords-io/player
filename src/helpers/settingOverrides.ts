import setPropsFromApi from "./setPropsFromApi";
import { findSetting } from "./settingsManifest";

// Changing a setting by hand should beat the /player API, the same way a value
// in the script tag does. That mechanism is initialProps: set() in
// setPropsFromApi skips any prop present there, and reads it fresh on every
// response, so recording a setting there makes the change survive refetches.
//
// Without this, an edit is silently undone by the next request, which happens
// on any identifier change, on an access tier change, and when continuous
// playback appends content.

// In initialProps, but describing how the player was booted rather than a
// setting somebody changed.
const bootKeys = new Set(["showUserInterface", "controlPanel", "onError"]);

// Writing any of these makes the player refetch by itself, so asking for a
// refetch as well would send the request twice.
const refetchedByPlayer = new Set([
  "projectId", "contentId", "playlistId", "sourceId", "sourceUrl", "playlist", "previewToken", "accessTier",
]);

// These public props are overlays on API-owned project state. Resetting means
// removing the overlay, not copying today's API value into a new SDK override.
const projectBackedOverrides = new Set(["theme", "lightTheme", "darkTheme", "videoTheme"]);

const overriddenKeys = (player) => Object.entries(player?.initialProps || {})
  .filter(([key, value]) => typeof value !== "undefined" && !bootKeys.has(key))
  .map(([key]) => key);

// The settings a user changed, i.e. not the identifiers that loaded the content.
const overriddenSettings = (player) => overriddenKeys(player)
  .filter((key) => findSetting(key) && !findSetting(key).loader);

const isOverridden = (player, key) => typeof player?.initialProps?.[key] !== "undefined";

const setSetting = (player, key, value) => {
  const setting = findSetting(key);

  // An undefined value cannot shadow the API (see set() in setPropsFromApi), so
  // an emptied control stores the setting's cleared value, null by default.
  const stored = typeof value === "undefined" ? setting?.cleared ?? null : value;

  // Playback state is applied but not recorded: it belongs to the player rather
  // than to the settings a page was configured with.
  if (!setting?.transient) {
    // A fresh object: assignment is what Svelte reacts to, and the panel reads
    // initialProps back through the same accessor.
    player.initialProps = { ...player.initialProps, [key]: stored };
  }

  applyValue(player, key, stored);
  refetchIfNeeded(player, key);
};

const resetSetting = (player, key) => {
  const rest = { ...player.initialProps };
  delete rest[key];

  player.initialProps = rest;

  applyValue(player, key, apiOrDefaultValue(player, key));
  refetchIfNeeded(player, key);
};

const resetAllSettings = (player) => {
  const keys = overriddenSettings(player);

  player.initialProps = Object.fromEntries(
    Object.entries(player.initialProps || {}).filter(([key]) => !keys.includes(key))
  );

  keys.forEach((key) => applyValue(player, key, apiOrDefaultValue(player, key)));

  // One request at the end, however many settings were reset.
  if (keys.some((key) => needsRefetch(key))) { setPropsFromApi(player); }
};

// Prefer what the API asked for over the built-in default, so a reset lands on
// the value the project is actually configured with.
const apiOrDefaultValue = (player, key) => (
  projectBackedOverrides.has(key) ? undefined
    : key in (player.apiProps || {}) ? player.apiProps[key]
    : findSetting(key)?.default
);

// Re-applies every override after a response. set() already respects them, but
// a few writes bypass it, such as sourceUrl falling back to the page URL when
// no identifiers are set.
const reapplySettings = (player) => {
  overriddenKeys(player).forEach((key) => {
    applyValue(player, key, player.initialProps[key], { silent: true });
  });
};

// private

const needsRefetch = (key) => !!findSetting(key)?.refetch && !refetchedByPlayer.has(key);

const refetchIfNeeded = (player, key) => {
  if (needsRefetch(key)) { setPropsFromApi(player); }
};

const applyValue = (player, key, value, { silent = false } = {}) => {
  // accessors: true means a prop can be written by name. accessTier is not a
  // plain prop: writing it bumps a revision that refetches, which would loop
  // when re-applying overrides after a response.
  if (key === "accessTier") {
    player.setAccessTier?.(value, !silent);
  } else {
    player[key] = value;
  }
};

export default setSetting;
export { setSetting, resetSetting, resetAllSettings, reapplySettings, overriddenSettings, isOverridden };
