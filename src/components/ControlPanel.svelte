<script>
  import("../helpers/loadTheStyles.ts");
  import { onMount, onDestroy } from "svelte";
  import settingsManifest, { groupOrder, findSetting } from "../helpers/settingsManifest";
  import { setSetting, resetSetting, resetAllSettings, reapplySettings, overriddenSettings } from "../helpers/settingOverrides";
  import { settingsUrl } from "../helpers/settingUrl";
  import SettingControl from "./control_panel/SettingControl.svelte";
  import Inspector from "./control_panel/Inspector.svelte";
  import EventLog from "./control_panel/EventLog.svelte";

  // A dev tool, rendered wherever the controlPanel setting points. Values are
  // read from the player itself rather than bound prop by prop, and every edit
  // is recorded as an override so the /player API cannot undo it.
  export let controlPanel = undefined;
  export let controller = undefined;

  const loaderKeys = ["projectId", "contentId", "playlistId", "sourceId", "sourceUrl", "previewToken", "playerApiUrl"];

  // Only the harness page owns its address bar; an integrator who sets
  // controlPanel on their own site should not have their URL rewritten.
  const isHarness = typeof window !== "undefined" && window.__beyondwordsHarness === true;

  let player;
  let snapshot = {};

  // Read on every refresh rather than in the markup: these are the player's own
  // props, and Svelte cannot know when another component's props change.
  let apiPayload;
  let apiProps;
  let apiRequestUrl;

  let overrides = [];
  let events = [];
  let loader = {};
  let listenerHandle;
  let refreshQueued = false;
  let showAdvanced = false;
  let showEvents = false;

  onMount(() => {
    showAdvanced = new URLSearchParams(window.location.search).get("advanced") === "true";
    listenerHandle = controller?.addEventListener("<any>", handleEvent);

    // controller.player is assigned just after the component mounts.
    queueMicrotask(attach);
  });

  onDestroy(() => listenerHandle && controller?.removeEventListener("<any>", listenerHandle));

  const attach = () => {
    player = controller?.player;
    if (!player) { return; }

    syncLoader();
    refreshNow();
  };

  const syncLoader = () => {
    loader = Object.fromEntries(loaderKeys.map((key) => [key, player[key] ?? ""]));
  };

  const handleEvent = (event) => {
    if (!player) { attach(); }
    if (!player) { return; }

    events = [{ type: event.type, changedProps: event.changedProps }, ...events].slice(0, 20);

    // A response applies the API's values around set() in a couple of places,
    // so put the overrides back afterwards.
    if (event.type === "ContentAvailable" || event.type === "NoContentAvailable") {
      reapplySettings(player);
      syncLoader();
    }

    refresh();
  };

  const refreshNow = () => {
    snapshot = player.properties();
    overrides = overriddenSettings(player);

    apiPayload = player.apiPayload;
    apiProps = player.apiProps;
    apiRequestUrl = player.apiRequestUrl;

    if (isHarness) { syncUrl(); }
  };

  // Coalesced: CurrentTimeUpdated arrives several times a second.
  const refresh = () => {
    if (refreshQueued || !player) { return; }
    refreshQueued = true;

    requestAnimationFrame(() => {
      refreshQueued = false;
      if (player) { refreshNow(); }
    });
  };

  const change = (key, value) => {
    setSetting(player, key, value);
    refreshNow();
  };

  const reset = (key) => {
    resetSetting(player, key);
    refreshNow();
  };

  const resetAll = () => {
    resetAllSettings(player);
    refreshNow();
  };

  // Applied together, so a request is never a mix of a new project id and a
  // stale playlist id, which is the failure that made the old panel confusing.
  const fetchContent = () => {
    loaderKeys.forEach((key) => {
      const value = `${loader[key] ?? ""}`.trim();
      setSetting(player, key, value === "" ? undefined : value);
    });

    events = [];
    refreshNow();
  };

  const clearContent = () => {
    loader = Object.fromEntries(loaderKeys.map((key) => [key, key === "playerApiUrl" ? loader.playerApiUrl : ""]));
    fetchContent();
  };

  const applyPreset = (event) => {
    const preset = presets[event.currentTarget.value];
    if (!preset) { return; }

    loader = { ...loader, projectId: "", contentId: "", playlistId: "", sourceId: "", sourceUrl: "", ...preset };
    fetchContent();
  };

  const presets = {
    "Video and a summary": { projectId: "53690", contentId: "8cdfb06b-68da-4adb-ba51-a91b917c6085" },
    "Access tiers": { projectId: "54044", contentId: "97e4a9df-336f-487b-8b1b-46f3dfb472cf" },
    "A playlist": { projectId: "26027", playlistId: "86791" },
  };

  // Anything left at its default is not worth carrying in a shared URL.
  const urlIdentifiers = () => Object.fromEntries(
    loaderKeys
      .filter((key) => loader[key] !== findSetting(key)?.default)
      .map((key) => [key, loader[key]])
  );

  const currentUrl = () => `${window.location.pathname}?${settingsUrl({
    identifiers: urlIdentifiers(),
    settings: Object.fromEntries(overrides.map((key) => [key, player.initialProps[key]])),
    extra: { advanced: showAdvanced ? "true" : "" },
  })}`;

  const syncUrl = () => window.history.replaceState(null, "", currentUrl());

  const copyUrl = () => navigator.clipboard?.writeText(`${window.location.origin}${currentUrl()}`);

  const reload = () => window.location.href = currentUrl();

  // Dim the settings the current player style cannot show, and offer the video
  // sizes the loaded content actually has.
  $: interfaceStyle = snapshot.playerStyle === "default" ? "default" : "legacy";
  $: ctx = {
    content: snapshot.content,
    adverts: snapshot.adverts,
    introsOutros: snapshot.introsOutros,
    videoSizes: [...new Set(
      (snapshot.content || [])
        .flatMap((item) => [...(item.video || []), ...(item.summarization?.video || [])])
        .map((media) => media.videoSize?.name)
        .filter((name) => name)
    )],
  };

  $: groups = groupOrder.map((group) => ({
    group,
    settings: settingsManifest.filter((setting) => (
      setting.group === group && !setting.loader && !setting.readOnly && (showAdvanced || !setting.advanced)
    )),
  })).filter(({ settings }) => settings.length);
</script>

<div class="control-panel">
  {#if !player}
    <strong>Player settings</strong>
    <div class="note">Waiting for the player.</div>
  {:else}
    <div class="heading">
      <strong>Player settings</strong>
      <a tabindex={-1} target="_blank" class="docs" href="https://docs.beyondwords.io/docs-and-guides/distribution/player/developer-guides/player-properties">docs</a>
    </div>

    <div class="note">
      {#if overrides.length}
        {overrides.length} changed here, so the API cannot change {overrides.length === 1 ? "it" : "them"} back:
        {overrides.join(", ")}
      {:else}
        Nothing changed here yet. Every edit below overrides the settings API.
      {/if}
    </div>

    <div class="buttons">
      <button tabindex={-1} type="button" on:click={resetAll} disabled={!overrides.length}>reset all</button>
      <button tabindex={-1} type="button" on:click={copyUrl}>copy URL</button>
      <button tabindex={-1} type="button" on:click={reload}>reload</button>
    </div>

    <br/>
    <strong>Content</strong>

    <div class="control">
      <span class="label">preset</span>
      <select tabindex={-1} value="" on:change={applyPreset}>
        <option value="">choose…</option>
        {#each Object.keys(presets) as name (name)}
          <option value={name}>{name}</option>
        {/each}
      </select>
    </div>

    {#each loaderKeys as key (key)}
      {#if key !== "playerApiUrl" || showAdvanced}
        <div class="control">
          <span class="label">{key}</span>
          <input tabindex={-1} type="text" placeholder={key === "projectId" ? "required" : "optional"} bind:value={loader[key]}>
        </div>
      {/if}
    {/each}

    <div class="buttons">
      <button tabindex={-1} type="button" on:click={fetchContent}>fetch</button>
      <button tabindex={-1} type="button" on:click={clearContent}>clear</button>
    </div>

    <br/>
    <strong>Loaded</strong>
    <Inspector {snapshot} {apiPayload} {apiRequestUrl} />

    {#each groups as { group, settings } (group)}
      <br/>
      <strong>{group}</strong>

      {#if group === "Colors"}
        <div class="note">Choose the active theme, then edit any CSS color or gradient below. Changes apply immediately; reset palette restores the API or built-in values.</div>
      {/if}

      {#each settings as setting (setting.key)}
        <SettingControl
          {setting}
          {ctx}
          value={snapshot[setting.key]}
          apiValue={apiProps?.[setting.key]}
          hasApiValue={!!apiProps && setting.key in apiProps}
          overridden={overrides.includes(setting.key)}
          inactive={!!setting.appliesTo && setting.appliesTo !== interfaceStyle}
          onChange={(value) => change(setting.key, value)}
          onReset={() => reset(setting.key)} />
      {/each}
    {/each}

    <br/>

    <div class="buttons">
      <button tabindex={-1} type="button" on:click={() => showEvents = !showEvents}>
        {showEvents ? "hide" : "show"} events
      </button>
      <button tabindex={-1} type="button" on:click={() => showAdvanced = !showAdvanced}>
        {showAdvanced ? "hide" : "show"} advanced
      </button>
    </div>

    {#if showEvents}
      <EventLog {events} />
    {/if}

    <div class="buttons">
      <a class="close" tabindex={-1} href="#_" on:click={() => controlPanel.remove()}>close</a>
    </div>
  {/if}
</div>

<style>
  .heading {
    display: flex;
  }

  .docs {
    text-align: right;
    text-decoration: underline;
  }

  .control {
    display: flex;
    align-items: center;
    column-gap: 8px;
    margin: 8px 0;
  }

  .label {
    flex: 1;
    min-width: 0;
  }

  .note {
    margin: 6px 0;
    opacity: 0.7;
    overflow-wrap: anywhere;
  }

  .buttons {
    display: flex;
    column-gap: 6px;
    margin: 8px 0;
  }

  button {
    padding: 2px 8px;
    border: 1px solid grey;
    border-radius: 2px;
    background: white;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  input {
    flex: 1;
    min-width: 0;
    border: 1px solid grey;
    border-radius: 2px;
    padding: 1px 4px;
    background: white;
  }

  select {
    flex: 1;
    min-width: 0;
  }

  strong {
    font-weight: bold;
  }

  .close {
    color: maroon;
    text-decoration: underline;
  }

  .control-panel, .heading, .note, .label, .buttons, strong, a, button, input, select {
    font-family: "InterVariable", sans-serif;
    font-size: 13px;
    color: black;
  }
</style>
