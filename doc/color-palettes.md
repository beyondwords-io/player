[< back to README](../README.md)

## Default player colour palettes

The default player exposes complete Light, Dark, and Video palettes. Palette
values are literal CSS strings: the player does not normalize, validate, or
contrast-adjust them.

```javascript
const player = new BeyondWords.Player({
  projectId: 123,
  contentId: "content-id",
  theme: "auto",
  lightTheme: {
    backgroundColor: "#f5f5f5",
    textColor: "#212121",
    secondaryTextColor: "#6d6d6d",
    iconColor: "#212121",
    subtleColor: "rgba(33, 33, 33, 0.1)",
    linkColor: "#8d38ef",
    highlightColor: "rgba(164, 255, 0, 0.2)",
    wordHighlightColor: "rgba(164, 255, 0, 0.8)",
    agentColor: "linear-gradient(100deg, #943bfc, #e23ad0)",
    accentColor: "#ffffff",
    accentTextColor: "#212121",
  },
});
```

`theme` accepts `light`, `dark`, or `auto` and can be changed without loading
content again. Assigning `null` or `undefined` restores the project theme.
Palette objects can be replaced or changed by field and the active player
rerenders immediately.

```javascript
player.theme = "dark";
player.darkTheme.linkColor = "rebeccapurple";
player.theme = undefined;
```

The old flat colour properties remain supported for one compatibility release,
but are deprecated. This includes `textColor`, `backgroundColor`, `iconColor`,
`highlightColor`, `wordHighlightColor`, `videoTextColor`,
`videoBackgroundColor`, `videoIconColor`, `agentColor`, `accentColor`, and
`accentTextColor`. The old `custom` theme is a deprecated alias for `light`, and
comma-separated `agentColor` gradients are translated to CSS gradients.

The authenticated `GET` and `PUT /v1/projects/{project_id}/player_settings`
contracts, and the `settings` object returned by `/player`, use `theme`,
`light_theme`, `dark_theme`, and `video_theme`. All palettes returned by either
endpoint must be complete. Their snake-case fields are mapped in
`src/helpers/default_theme/palettes.ts`, which also materializes approved preset
values for partial older projects and applies legacy top-level agent/accent
fields only when nested fields are absent.
