<script>
  export let projectId;
  export let contentId;
  export let playlistId;
  export let sourceId;
  export let sourceUrl;
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
  export let duration;
  export let currentTime;
  export let playbackState;
  export let playbackRate;
  export let widgetStyle;
  export let widgetPosition;
  export let widgetWidth;
  export let widgetTarget;
  export let textColor;
  export let backgroundColor;
  export let iconColor;
  export let highlightColor;
  export let logoIconEnabled;
  export let highlightSections;
  export let clickableSections;
  export let segmentWidgetSections;
  export let segmentWidgetPosition;
  export let advertConsent;
  export let analyticsConsent;
  export let analyticsCustomUrl;
  export let analyticsTag;

  let showAdvancedSettings = false;
</script>

<div class="control-panel">
  <div class="heading">
    <strong>Player settings:</strong>

    <a tabindex={-1} target="_blank" class="docs" href="https://github.com/beyondwords-io/player/blob/main/doc/player-settings.md">
      view docs
    </a>
  </div>

  <br/>

  <div class="control">
    playerStyle:
    <select tabindex={-1} bind:value={playerStyle}>
      <option>small</option>
      <option>standard</option>
      <option>large</option>
      <option>video</option>
    </select>
  </div>

  <div class="control">
    playbackState:
    <select tabindex={-1} bind:value={playbackState}>
      <option>stopped</option>
      <option>playing</option>
      <option>paused</option>
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

  <div class="control">
    advertIndex:
    <select tabindex={-1} bind:value={advertIndex}>
      <option value={-1}>-1 (none)</option>
      {#each adverts as item, i}
        <option value={i}>{i} ({item.placement})</option>
      {/each}
    </select>
  </div>

  <div class="control">
    widgetStyle:
    <select tabindex={-1} bind:value={widgetStyle}>
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

  <div class="control">
    highlightColor:
    <input tabindex={-1} type="text" bind:value={highlightColor}>
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
      {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as hour}
        <option>{hour}-oclock</option>
      {/each}
    </select>
  </div>

  {#if showAdvancedSettings}
    <br/>
    <strong>Advanced settings:</strong>
    <br/><br/>

    <div class="control">
      projectId:
      <input tabindex={-1} type="text" bind:value={projectId}>
    </div>

    <div class="control">
      contentId:
      <input tabindex={-1} type="text" bind:value={contentId}>
    </div>

    <div class="control">
      playlistId:
      <input tabindex={-1} type="text" bind:value={playlistId}>
    </div>

    <div class="control">
      sourceId:
      <input tabindex={-1} type="text" bind:value={sourceId}>
    </div>

    <div class="control">
      sourceUrl:
      <input tabindex={-1} type="text" bind:value={sourceUrl}>
    </div>

    <div class="control">
      showUserInterface:
      <select tabindex={-1} bind:value={showUserInterface}>
        <option>{true}</option>
        <option>{false}</option>
      </select>
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
        {#each content as item, i}
          <option value={i}>{i} ({item.title})</option>
        {/each}
      </select>
    </div>

    <div class="control">
      introsOutrosIndex:
      <select tabindex={-1} bind:value={introsOutrosIndex}>
        <option value={-1}>-1 (none)</option>
        {#each introsOutros as item, i}
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
        <option>{true}</option>
        <option>{false}</option>
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

  {#if showAdvancedSettings}
    <a tabindex={-1} href="#_" on:click={() => showAdvancedSettings = false}>hide advanced settings</a>
  {:else}
    <a tabindex={-1} href="#_" on:click={() => showAdvancedSettings = true}>show advanced settings</a>
  {/if}
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
</style>
