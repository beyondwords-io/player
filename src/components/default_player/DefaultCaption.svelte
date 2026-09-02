<script lang="ts">
  import translate from "../../helpers/translate";

  export let attributionHref: string;
  export let color: string;
  export let linkColor: string = color;
  export let disclosureLink: string | undefined = undefined;
  export let disclosureText: string | undefined = undefined;
  export let hoverColor: string;
  export let logoIconEnabled = true;
</script>

<div class="caption outside">
  <span class="caption-left">
    {#if disclosureText && disclosureLink}
      <a class="caption-link" href={disclosureLink} target="_blank" rel="noopener noreferrer" style="color: {linkColor}; border-bottom-color: {linkColor}; outline-color: {linkColor}; --hover-color: {hoverColor}">{disclosureText}</a>
    {:else if disclosureText}
      <span class="caption-text" style="color: {color}">{disclosureText}</span>
    {/if}
  </span>
  {#if logoIconEnabled}
    <a class="caption-link" href={attributionHref} target="_blank" rel="noopener" style="color: {color}; border-bottom-color: {color}; outline-color: {color}; --hover-color: {hoverColor}" aria-label={translate("visitBeyondWords")}>{translate("poweredByBeyondWords")}</a>
  {/if}
</div>

<style>
  :global(.beyondwords-player.maximized) .caption.outside { display: none; }

  .caption {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .caption.outside { padding: 6px 8px 0; }

  .caption-left {
    display: flex;
    min-width: 0;
  }

  .caption-text,
  .caption-link {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .caption-link {
    text-decoration: none;
    border-bottom-width: 1px;
    border-bottom-style: dotted;
    cursor: pointer;
  }

  @media (hover: hover) and (pointer: fine) {
    .caption-link:hover {
      color: var(--hover-color);
      border-bottom-color: var(--hover-color);
    }
  }

  .caption-link:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }
</style>
