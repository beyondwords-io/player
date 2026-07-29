<script>
  import("../helpers/loadTheStyles.ts");

  export let controlPanel;
  export let projectId;
  export let contentId;
  export let playlistId;
  export let sourceId;
  export let sourceUrl;
  export let summary;
  export let showUserInterface;
  export let playerStyle;
  export let playerTitle;
  export let callToAction;
  export let skipButtonStyle;
  export let playlistStyle;
  export let playlistToggle;
  export let mediaSession;
  export let content;
  export let contentIndex;
  export let introsOutros;
  export let introsOutrosIndex;
  export let adverts;
  export let advertIndex;
  export let persistentAdImage;
  export let persistentIndex;
  export let duration;
  export let currentTime;
  export let playbackState;
  export let playbackRate;
  export let widgetStyle;
  export let widgetPosition;
  export let widgetWidth;
  export let widgetMargin;
  export let widgetTarget;
  export let textColor;
  export let backgroundColor;
  export let iconColor;
  export let highlightColor;
  export let videoTextColor;
  export let videoIconColor;
  export let logoIconEnabled;
  export let wordHighlightsEnabled;
  export let wordHighlightColor;
  export let highlightSections;
  export let clickableSections;
  export let segmentWidgetSections;
  export let segmentWidgetPosition;
  export let advertConsent;
  export let analyticsConsent;
  export let analyticsCustomUrl;
  export let analyticsTag;
  export let video;
  export let embedMode;
  export let theme;
  export let radius;
  export let agentColor;
  export let agentAvatar;
  export let agentAccess;
  export let agentLimit;
  export let infoText;
  export let disclosureText;

  // The Load content section reloads the page with query params so the player
  // boots cleanly with the entered identifiers (production API by default).
  const initialParams = new URLSearchParams(window.location.search);

  let showAdvancedSettings = initialParams.get("advanced") === "true";
  let loadProjectId = initialParams.get("projectId") || "";
  let loadContentId = initialParams.get("contentId") || "";
  let loadPlaylistId = initialParams.get("playlistId") || "";
  let loadSourceUrl = initialParams.get("sourceUrl") || "";

  const loadContent = () => {
    const params = new URLSearchParams();

    const values = {
      projectId: loadProjectId,
      contentId: loadContentId,
      playlistId: loadPlaylistId,
      sourceUrl: loadSourceUrl,
      playerStyle,
      widgetStyle,
      embedMode,
      theme,
      video: video === true ? "true" : "",
    };

    for (const [key, value] of Object.entries(values)) {
      if (`${value ?? ""}`.trim() !== "") { params.set(key, `${value}`.trim()); }
    }

    if (showAdvancedSettings) { params.set("advanced", "true"); }

    window.location.search = params.toString();
  };

  const resetToDemo = () => window.location.search = "";
</script>

<div class="control-panel">
  <div class="heading">
    <strong>Player settings:</strong>

    <a tabindex={-1} target="_blank" class="docs" href="https://github.com/beyondwords-io/player/blob/main/doc/player-settings.md">
      view docs
    </a>
  </div>

  <br/>

  <strong>Content:</strong>

  <div class="control">
    projectId:
    <input tabindex={-1} type="text" placeholder="production project id" bind:value={loadProjectId}>
  </div>

  <div class="control">
    contentId:
    <input tabindex={-1} type="text" placeholder="optional" bind:value={loadContentId}>
  </div>

  <div class="control">
    playlistId:
    <input tabindex={-1} type="text" placeholder="optional" bind:value={loadPlaylistId}>
  </div>

  <div class="control">
    sourceUrl:
    <input tabindex={-1} type="text" placeholder="optional" bind:value={loadSourceUrl}>
  </div>

  <div class="control">
    <button tabindex={-1} type="button" on:click={loadContent}>Fetch content</button>
    <button tabindex={-1} type="button" on:click={resetToDemo}>Reset to demo</button>
  </div>

  <br/>
  <strong>Style:</strong>

  <div class="control">
    playerStyle:
    <select tabindex={-1} bind:value={playerStyle}>
      <option>default</option>
      <option>small</option>
      <option>standard</option>
      <option>large</option>
      <option>video</option>
    </select>
  </div>

  <div class="control">
    video:
    <select tabindex={-1} bind:value={video}>
      <option>{false}</option>
      <option>{true}</option>
    </select>
  </div>

  <div class="control">
    theme:
    <select tabindex={-1} bind:value={theme}>
      <option>light</option>
      <option>dark</option>
      <option>custom</option>
    </select>
  </div>

  <div class="control">
    radius:
    <input tabindex={-1} type="number" min="0" max="16" bind:value={radius}>
  </div>

  <div class="control">
    textColor:
    <input tabindex={-1} type="text" bind:value={textColor}>
  </div>

  <div class="control">
    backgroundColor:
    <input tabindex={-1} type="text" bind:value={backgroundColor}>
  </div>

  <div class="control">
    iconColor:
    <input tabindex={-1} type="text" bind:value={iconColor}>
  </div>

  <br/>
  <strong>Playback:</strong>

  <div class="control">
    playbackState:
    <select tabindex={-1} bind:value={playbackState}>
      <option>stopped</option>
      <option>playing</option>
      <option>paused</option>
    </select>
  </div>

  <div class="control">
    summary:
    <select tabindex={-1} bind:value={summary}>
      <option>{false}</option>
      <option>{true}</option>
    </select>
  </div>

  <div class="control">
    playerTitle:
    <input tabindex={-1} type="text" bind:value={playerTitle}>
  </div>

  <div class="control">
    callToAction:
    <input tabindex={-1} type="text" bind:value={callToAction}>
  </div>

  <div class="control">
    skipButtonStyle:
    <select tabindex={-1} bind:value={skipButtonStyle}>
      <option>auto</option>
      <option>segments</option>
      <option>seconds</option>
      <option>seconds-15</option>
      <option>seconds-15-30</option>
      <option>tracks</option>
    </select>
  </div>

  <div class="control">
    advertIndex:
    <select tabindex={-1} bind:value={advertIndex}>
      <option value={-1}>-1 (none)</option>
      {#each adverts as item, i (i)}
        <option value={i}>{i} ({item.placement})</option>
      {/each}
    </select>
  </div>

  <br/>
  <strong>Agent:</strong>

  <div class="control">
    embedMode:
    <select tabindex={-1} bind:value={embedMode}>
      <option>audio</option>
      <option>audio-agent</option>
      <option>agent</option>
    </select>
  </div>

  <div class="control">
    agentAccess:
    <select tabindex={-1} bind:value={agentAccess}>
      <option>full</option>
      <option>limited</option>
      <option>disabled</option>
      <option>off</option>
    </select>
  </div>

  <div class="control">
    agentLimit:
    <input tabindex={-1} type="text" placeholder="3 or 5:00" bind:value={agentLimit}>
  </div>

  <div class="control">
    agentColor:
    <input tabindex={-1} type="text" placeholder="#943bfc,#e23ad0" bind:value={agentColor}>
  </div>

  <div class="control">
    agentAvatar:
    <input tabindex={-1} type="text" placeholder="image URL" bind:value={agentAvatar}>
  </div>

  <br/>
  <strong>Playlist:</strong>

  <div class="control">
    playlistStyle:
    <select tabindex={-1} bind:value={playlistStyle}>
      <option>auto</option>
      <option>show</option>
      <option>show-3</option>
      <option>show-999</option>
      <option>hide</option>
    </select>
  </div>

  <div class="control">
    playlistToggle:
    <select tabindex={-1} bind:value={playlistToggle}>
      <option>auto</option>
      <option>show</option>
      <option>hide</option>
    </select>
  </div>

  <br/>
  <strong>Widget:</strong>

  <div class="control">
    widgetStyle:
    <select tabindex={-1} bind:value={widgetStyle}>
      <option>default</option>
      <option>small</option>
      <option>standard</option>
      <option>large</option>
      <option>video</option>
    </select>
  </div>

  <div class="control">
    widgetPosition:
    <select tabindex={-1} bind:value={widgetPosition}>
      <option>auto</option>
      <option>left</option>
      <option>center</option>
      <option>right</option>
    </select>
  </div>

  <div class="control">
    widgetWidth:
    <select tabindex={-1} bind:value={widgetWidth}>
      <option>auto</option>
      <option>400px</option>
      <option>30rem</option>
      <option>fit-content</option>
      <option>initial</option>
      <option>0</option>
    </select>
  </div>

  <div class="control">
    widgetMargin:
    <select tabindex={-1} bind:value={widgetMargin}>
      <option>16px</option>
      <option>32px</option>
      <option>32px 16px</option>
      <option>10px 20px 30px 40px</option>
    </select>
  </div>

  <br/>
  <strong>Highlighting:</strong>

  <div class="control">
    highlightColor:
    <input tabindex={-1} type="text" bind:value={highlightColor}>
  </div>

  <div class="control">
    wordHighlightsEnabled:
    <select tabindex={-1} bind:value={wordHighlightsEnabled}>
      <option>{false}</option>
      <option>{true}</option>
    </select>
  </div>

  <div class="control">
    wordHighlightColor:
    <input tabindex={-1} type="text" bind:value={wordHighlightColor}>
  </div>

  <div class="control">
    highlightSections:
    <select tabindex={-1} bind:value={highlightSections}>
      <option>all</option>
      <option>body</option>
      <option>none</option>
      <option>all-none</option>
      <option>none-all</option>
    </select>
  </div>

  <div class="control">
    clickableSections:
    <select tabindex={-1} bind:value={clickableSections}>
      <option>all</option>
      <option>body</option>
      <option>none</option>
      <option>all-none</option>
      <option>none-all</option>
    </select>
  </div>

  <br/>
  <strong>Attribution:</strong>

  <div class="control">
    infoText:
    <input tabindex={-1} type="text" bind:value={infoText}>
  </div>

  <div class="control">
    disclosureText:
    <input tabindex={-1} type="text" bind:value={disclosureText}>
  </div>

  {#if showAdvancedSettings}
    <br/>
    <strong>Advanced settings:</strong>
    <br/><br/>

    <div class="control">
      showUserInterface:
      <select tabindex={-1} bind:value={showUserInterface}>
        <option>{false}</option>
        <option>{true}</option>
      </select>
    </div>

    <div class="control">
      segmentWidgetSections:
      <select tabindex={-1} bind:value={segmentWidgetSections}>
        <option>all</option>
        <option>body</option>
        <option>none</option>
        <option>all-none</option>
        <option>none-all</option>
      </select>
    </div>

    <div class="control">
      segmentWidgetPosition:
      <select tabindex={-1} bind:value={segmentWidgetPosition}>
        {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as hour (hour)}
          <option>{hour}-oclock</option>
        {/each}
      </select>
    </div>

    <div class="control">
      videoTextColor:
      <input tabindex={-1} type="text" bind:value={videoTextColor}>
    </div>

    <div class="control">
      videoIconColor:
      <input tabindex={-1} type="text" bind:value={videoIconColor}>
    </div>

    <div class="control">
      mediaSession:
      <select tabindex={-1} bind:value={mediaSession}>
        <option>auto</option>
        <option>override</option>
        <option>none</option>
      </select>
    </div>

    <div class="control">
      contentIndex:
      <select tabindex={-1} bind:value={contentIndex}>
        {#each content as item, i (i)}
          <option value={i}>{i} ({item.title})</option>
        {/each}
      </select>
    </div>

    <div class="control">
      introsOutrosIndex:
      <select tabindex={-1} bind:value={introsOutrosIndex}>
        <option value={-1}>-1 (none)</option>
        {#each introsOutros as item, i (i)}
          <option value={i}>{i}: {item.placement}</option>
        {/each}
      </select>
    </div>

    <div class="control">
      persistentAdImage:
      <select tabindex={-1} bind:value={persistentAdImage}>
        <option>{false}</option>
        <option>{true}</option>
      </select>
    </div>

    <div class="control">
      persistentIndex:
      <select tabindex={-1} bind:value={persistentIndex}>
        <option value={-1}>-1 (none)</option>
        {#each adverts as item, i (i)}
          <option value={i}>{i}: {item.placement}</option>
        {/each}
      </select>
    </div>

    <div class="control">
      duration:
      <input tabindex={-1} type="text" bind:value={duration}>
    </div>

    <div class="control">
      currentTime:
      <input tabindex={-1} type="text" bind:value={currentTime}>
    </div>

    <div class="control">
      playbackRate:
      <input tabindex={-1} type="text" bind:value={playbackRate}>
    </div>

    <div class="control">
      widgetTarget:
      <input tabindex={-1} type="text" bind:value={widgetTarget}>
    </div>

    <div class="control">
      logoIconEnabled:
      <select tabindex={-1} bind:value={logoIconEnabled}>
        <option>{false}</option>
        <option>{true}</option>
      </select>
    </div>

    <div class="control">
      advertConsent:
      <select tabindex={-1} bind:value={advertConsent}>
        <option>personalized</option>
        <option>non-personalized</option>
        <option>under-the-age-of-consent</option>
      </select>
    </div>

    <div class="control">
      analyticsConsent:
      <select tabindex={-1} bind:value={analyticsConsent}>
        <option>allowed</option>
        <option>without-local-storage</option>
        <option>none</option>
      </select>
    </div>

    <div class="control">
      analyticsCustomUrl:
      <input tabindex={-1} type="text" bind:value={analyticsCustomUrl}>
    </div>

    <div class="control">
      analyticsTag:
      <input tabindex={-1} type="text" bind:value={analyticsTag}>
    </div>
  {/if}

  <br/>

  <div class="settings-toggle">
    {#if showAdvancedSettings}
      <a tabindex={-1} href="#_" on:click={() => showAdvancedSettings = false}>hide advanced settings</a>
    {:else}
      <a tabindex={-1} href="#_" on:click={() => showAdvancedSettings = true}>show advanced settings</a>
    {/if}

    <a class="close" tabindex={-1} href="#_" on:click={() => controlPanel.remove()}>close</a>
  </div>
</div>

<style>
  .heading {
    display: flex;
  }

  .docs {
    text-align: right;
  }

  .control {
    display: flex;
    column-gap: 8px;
    margin: 10px 0;
  }

  input[type="text"] {
    border: 1px solid grey;
    border-radius: 2px;
  }

  .control, input[type="text"], select, strong, a {
    font-family: "InterVariable", sans-serif;
    font-size: 14px;
    width: 100%;
  }

  strong {
    font-weight: bold;
  }

  a {
    text-decoration: underline;
  }

  .settings-toggle {
    display: flex;
  }

  .close {
    color: maroon;
    flex: 1;
  }
</style>
