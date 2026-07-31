<script>
  import { optionsFor, optionValue, optionLabel, selectedOption } from "../../helpers/settingsManifest";

  // One setting, one write path. There are no two-way bindings here: every
  // change goes through onChange so it can be recorded as an override.
  export let setting;
  export let value = undefined;
  export let apiValue = undefined;
  export let hasApiValue = false;
  export let overridden = false;
  export let inactive = false;
  export let ctx = {};
  export let onChange = () => {};
  export let onReset = () => {};

  $: options = optionsFor(setting, ctx);
  $: selected = selectedOption(setting, value, ctx);
  $: text = asText(value);
  $: resetHint = hasApiValue ? `reset to the API's ${asText(apiValue) || "empty"}` : `reset to the default ${asText(setting.default) || "empty"}`;

  const asText = (raw) => {
    if (raw === null || raw === undefined) { return ""; }
    if (typeof raw === "object") { return JSON.stringify(raw); }

    return `${raw}`;
  };

  const change = (raw) => {
    if (setting.parse) { return onChange(setting.parse(raw)); }

    // Select options keep their own type: a boolean stays a boolean rather than
    // becoming the string "false".
    if (setting.control === "select") {
      return onChange(options.find((option) => optionValue(option) === raw));
    }

    if (setting.control === "json") {
      try { return onChange(raw === "" ? undefined : JSON.parse(raw)); } catch { return; }
    }

    return onChange(raw === "" ? undefined : raw);
  };
</script>

<div class="control" class:overridden class:inactive>
  <span class="label">
    {setting.key}{#if overridden}<span class="marker" title="changed here, so the API cannot change it back">*</span>{/if}
  </span>

  {#if setting.control === "select"}
    <!-- Re-rendered when content arrives, so options that depend on it apply. -->
    {#key options.join("|")}
      <select tabindex={-1} value={selected} on:change={(event) => change(event.currentTarget.value)}>
        {#if selected === undefined}
          <option value={undefined}>{text || "(not set)"}</option>
        {/if}

        {#each options as option, index (index)}
          <option value={optionValue(option)}>{optionLabel(setting, option, ctx)}</option>
        {/each}
      </select>
    {/key}
  {:else}
    <input
      tabindex={-1}
      type={setting.control === "number" ? "number" : "text"}
      placeholder={asText(setting.default) || "not set"}
      value={text}
      on:change={(event) => change(event.currentTarget.value)}>
  {/if}

  {#if overridden}
    <button tabindex={-1} type="button" class="reset" title={resetHint} on:click={onReset}>reset</button>
  {/if}
</div>

{#if overridden && hasApiValue}
  <div class="note">API: {asText(apiValue) || "empty"}</div>
{/if}

{#if setting.needs}
  <div class="note">needs {setting.needs}</div>
{/if}

<style>
  .control {
    display: flex;
    align-items: center;
    column-gap: 8px;
    margin: 8px 0;
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .overridden .label {
    font-weight: bold;
  }

  /* Dimmed rather than hidden: knowing a setting cannot apply right now is the
     answer to "why is this control doing nothing?". */
  .inactive {
    opacity: 0.45;
  }

  .marker {
    color: maroon;
  }

  .note {
    margin: -4px 0 8px 0;
    opacity: 0.6;
    font-size: 12px;
  }

  .reset {
    flex-shrink: 0;
    padding: 1px 6px;
    border: 1px solid grey;
    border-radius: 2px;
    background: white;
    cursor: pointer;
  }

  .control, .label, .note, input, select, .reset {
    font-family: "InterVariable", sans-serif;
    font-size: 13px;
    color: black;
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
</style>
