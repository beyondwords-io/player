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
  $: palette = value && typeof value === "object" ? value : {};
  // A setting that knows how to render itself wins over raw JSON.
  $: text = setting.format ? setting.format(value, ctx) : asText(value);
  $: resetHint = setting.control === "palette"
    ? hasApiValue ? "reset the whole palette to the API values" : "reset the whole palette to its built-in preset"
    : hasApiValue ? `reset to the API's ${asText(apiValue) || "empty"}` : `reset to the default ${asText(setting.default) || "empty"}`;

  const asText = (raw) => {
    if (raw === null || raw === undefined) { return ""; }
    if (typeof raw === "object") { return JSON.stringify(raw); }

    return `${raw}`;
  };

  const choosePreset = (name) => {
    if (name in setting.presets) { onChange(setting.presets[name]); }
  };

  const paletteFieldValue = (key) => palette[key] ?? setting.default?.[key] ?? "";

  // Keep the raw string exactly as typed. A half-entered gradient or invalid
  // CSS value is useful when testing the literal-color contract, so the panel
  // must not validate, trim, normalize, or replace it.
  const changePaletteField = (key, raw) => onChange({ ...palette, [key]: raw });

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

{#if setting.control === "palette"}
  <div class="palette" class:overridden class:inactive>
    <div class="palette-heading">
      <span class="label">
        {setting.label || setting.key}{#if overridden}<span class="marker" title="changed here, so the API cannot change it back">*</span>{/if}
      </span>

      {#if overridden}
        <button tabindex={-1} type="button" class="reset" title={resetHint} on:click={onReset}>reset palette</button>
      {/if}
    </div>

    <div class="palette-fields">
      {#each setting.fields as field (field.key)}
        <label class="palette-field" title={field.description}>
          <span class="field-copy">
            <span class="field-label">{field.label}</span>
            <span class="field-key">{field.key}</span>
          </span>
          <span class="field-value">
            <span class="swatch" aria-hidden="true">
              <span class="swatch-paint" style="background: {paletteFieldValue(field.key)}"></span>
            </span>
            <input
              tabindex={-1}
              type="text"
              aria-label="{setting.label || setting.key}: {field.label}"
              value={paletteFieldValue(field.key)}
              on:input={(event) => changePaletteField(field.key, event.currentTarget.value)}>
          </span>
        </label>
      {/each}
    </div>
  </div>
{:else}
  <div class="control" class:overridden class:inactive>
    <span class="label">
      {setting.label || setting.key}{#if overridden}<span class="marker" title="changed here, so the API cannot change it back">*</span>{/if}
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
{/if}

{#if setting.presets}
  <!-- Somewhere to start from, for settings you would otherwise have to type
       out by hand. Choosing one fills the field above. -->
  <div class="control preset">
    <span class="label">from a preset</span>
    <select tabindex={-1} value="" on:change={(event) => choosePreset(event.currentTarget.value)}>
      <option value="">choose…</option>
      {#each Object.keys(setting.presets) as name (name)}
        <option value={name}>{name}</option>
      {/each}
    </select>
  </div>
{/if}

{#if overridden && hasApiValue}
  <div class="note">{setting.control === "palette" ? "Reset palette uses the values returned by the API." : `API: ${asText(apiValue) || "empty"}`}</div>
{/if}

{#if setting.needs}
  <div class="note">needs {setting.needs}</div>
{/if}

<style>
  .control,
  .palette-heading,
  .palette-field,
  .field-value {
    display: flex;
    align-items: center;
    column-gap: 8px;
  }

  .control {
    margin: 8px 0;
  }

  .palette {
    margin: 10px 0 8px;
    padding: 8px;
    border: 1px solid #c7c7c7;
    border-radius: 4px;
    background: #f8f8f8;
  }

  .palette-heading {
    margin-bottom: 8px;
  }

  .palette-fields {
    display: grid;
    row-gap: 7px;
  }

  .palette-field {
    cursor: text;
  }

  .field-copy {
    display: flex;
    flex: 0 0 42%;
    min-width: 0;
    flex-direction: column;
    line-height: 1.2;
  }

  .field-label,
  .field-key {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .field-key {
    margin-top: 2px;
    opacity: 0.55;
    font-size: 10px;
  }

  .field-value {
    flex: 1;
    min-width: 0;
    column-gap: 6px;
  }

  .swatch {
    position: relative;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    overflow: hidden;
    box-sizing: border-box;
    border: 1px solid #8c8c8c;
    border-radius: 3px;
    background-color: white;
    background-image:
      linear-gradient(45deg, #d8d8d8 25%, transparent 25%),
      linear-gradient(-45deg, #d8d8d8 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #d8d8d8 75%),
      linear-gradient(-45deg, transparent 75%, #d8d8d8 75%);
    background-position: 0 0, 0 5px, 5px -5px, -5px 0;
    background-size: 10px 10px;
  }

  .swatch-paint {
    position: absolute;
    inset: 0;
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .overridden > .label,
  .overridden .palette-heading .label {
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

  .control.preset {
    margin: -4px 0 8px 0;
    opacity: 0.75;
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

  .control, .palette, .label, .note, input, select, .reset {
    font-family: "InterVariable", sans-serif;
    font-size: 13px;
    color: black;
  }

  input {
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid grey;
    border-radius: 2px;
    padding: 3px 4px;
    background: white;
  }

  select {
    flex: 1;
    min-width: 0;
  }
</style>
