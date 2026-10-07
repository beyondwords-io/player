<script>
  // The events the player emitted, newest first, with what each one changed.
  // Reading "PressedPlay -> playbackState: stopped to playing" is usually the
  // fastest way to see whether an interaction did what it looks like it did.
  export let events = [];

  const interesting = (changedProps) => Object.entries(changedProps || {})
    .filter(([key]) => key !== "initialProps" && key !== "transitions")
    .map(([key, { previousValue, currentValue }]) => `${key}: ${short(previousValue)} to ${short(currentValue)}`);

  const short = (value) => {
    if (value === undefined) { return "unset"; }
    if (value === null) { return "null"; }
    if (Array.isArray(value)) { return `[${value.length}]`; }
    if (typeof value === "object") { return value.marker || value.id || "{...}"; }

    return `${value}`;
  };
</script>

<div class="events">
  {#each events as event, index (index)}
    <div class="event">
      <span class="type">{event.type}</span>
      {#each interesting(event.changedProps) as change (change)}
        <span class="change">{change}</span>
      {/each}
    </div>
  {/each}

  {#if !events.length}
    <div class="change">No events yet.</div>
  {/if}
</div>

<style>
  .events {
    margin: 8px 0;
  }

  .event {
    display: flex;
    flex-direction: column;
    margin: 4px 0;
  }

  .type {
    font-weight: bold;
  }

  .change {
    opacity: 0.7;
    overflow-wrap: anywhere;
  }

  .events, .event, .type, .change {
    font-family: "InterVariable", sans-serif;
    font-size: 11px;
    color: black;
  }
</style>
