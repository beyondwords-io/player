<svelte:options
  customElement={{
    tag: "bw-play-pause-button",
    shadow: "open",
    extend: (customElementConstructor) => {
      return class extends customElementConstructor {
        constructor() {
          super();
          this.host = this;
        }
      };
    },
  }}
/>

<script>
  import { onMount } from "svelte";
  import Play from "../svg_icons/Play.svelte";
  import Pause from "../svg_icons/Pause.svelte";
  import newEvent from "../../helpers/newEvent";
  import blurElement from "../../helpers/blurElement";
  import translate from "../../helpers/translate";

  export let host = undefined;
  export let controller = undefined;
  export let emittedFrom = undefined;
  export let isPlaying = false;
  export let scale = 1;
  export let color = "#323232";

  const onEvent = (e) => controller.processEvent({ emittedFrom, ...e });

  $: ariaLabel = isPlaying ? translate("pauseAudio") : translate("playAudio");

  const handleClick = (event) => {
    event.preventDefault();
    const name = isPlaying ? "Pause" : "Play";

    onEvent(
      newEvent({
        type: `Pressed${name}`,
        description: `The ${name.toLowerCase()} button was pressed.`,
        initiatedBy: "user",
      }),
    );
  };

  onMount(() => {
    const bwUserInterfaceElement = host?.closest("bw-user-interface");
    if (bwUserInterfaceElement) {
      controller = bwUserInterfaceElement.controller;
      emittedFrom = bwUserInterfaceElement.emittedFrom;
      bwUserInterfaceElement.isPlaying.subscribe((value) => {
        isPlaying = value;
      });
      bwUserInterfaceElement.playPauseScale.subscribe((value) => {
        scale = value;
      });
      bwUserInterfaceElement.activeIconColor.subscribe((value) => {
        color = value;
      });
    }
  });
</script>

<button
  type="button"
  class="play-pause-button"
  tabindex="0"
  on:click={handleClick}
  on:mouseup={blurElement}
  style="outline-offset: {3.2 * scale}px"
  aria-label={ariaLabel}
>
  {#if isPlaying}
    <Pause {scale} {color} />
  {:else}
    <Play {scale} {color} />
  {/if}
</button>

<style>
  .play-pause-button {
    display: flex;
    cursor: pointer;
    position: relative;

    background: none;
    border: none;
    margin: 0;
    padding: 0;
  }

  @media (hover: hover) and (pointer: fine) {
    .play-pause-button:hover {
      opacity: 0.8;
    }
  }
</style>
