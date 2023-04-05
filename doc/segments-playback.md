[< back to README](https://github.com/BeyondWords-io/player#readme)

## Segments Playback

The player supports a feature called 'Playback from Segments'. This lets you to click on a segment on your website (i.e. a paragraph) to begin playback from that segment. If the segment is already playing then it will be paused instead.

To support Playback from Segments, you need to add markers to elements on your page:

```html
<h1 data-beyondwords-marker="1af51b2a-72df-4b86-bb7c-87d057231ca0">
  This is the title.
</h1>

<p data-beyondwords-marker="5d2c6eba-f612-45c7-b987-00fde473d867">
  This is the first paragraph.
</p>

<p data-beyondwords-marker="d89257cd-ff53-476e-aef2-84dadcca1cc5">
  This is the second paragraph.
</p>
```

### Markers

The markers need to match the segments within the BeyondWords content or Playback from Segments won't work.

The easiest way to do this is to to supply the markers yourself when you create content in the [BeyondWords API](https://api.beyondwords.io/docs). You could then store these markers in your CMS and render them as data attributes on your published article.

Alternatively, if a segment marker is not provided, BeyondWords will generate one for you. You can retrieve these from the /player endpoint (see [example response](https://api.beyondwords.io/v1/projects/26027/player/by_content_id/6590099)) and add them to the HTML of your article.

It is recommended to generate UUIDs as markers to avoid duplicates, in case there are multiple players on the same page.

### How it works

Once the player script has loaded, it will add global listeners to your page to detect clicks and mousemove events.

If the player detects that you are hovering or have clicked on an element with the data-beyondwords-marker attribute, it checks if it matches one of the player's segments. If so, it emits HoveredSegmentUpdated and PressedSegment [events](./doc/player-events.md).

Additionally, when the currentTime of the media updates (i.e. by playing it), the player emits a CurrentSegmentUpdated event.

These events are then used to highlight segments on the page and to control playback, e.g. by setting its currentTime to the startTime of the segment that the user clicked on. The currentSegment and hoveredSegment props of the player are set.

To highlight segments, the player adds a `<mark>` element inside the segment on the page with some custom styles. All children of the segment are moved inside of the mark. The mark is removed again after highlighting has ended.

To avoid interfering with your page, highlighting and clicking on segments does not trigger if you are hovering over a link or other element with a 'click' or 'mousedown' handler. However, this does not apply to event listeners.

### Event listeners

Unfortunately, the player cannot detect event listeners that have been registered on elements within the segment.

For example, this button does not have an 'onclick' property and therefore playback will be affected when it is clicked.

```html
<p data-beyondwords-marker="5d2c6eba-f612-45c7-b987-00fde473d867">
  This is the first paragraph. <button id="my-button"></button>
</p>

<script>
  document.getElementById("my-button").addEventListener("click", event => {
    console.log("The button was clicked.");
  });
</script>
```

To avoid this, call `event.preventDefault()` at the top of the event listener:

```html
<script>
  document.getElementById("my-button").addEventListener("click", event => {
    event.preventDefault();
    console.log("The button was clicked.");
  });
</script>
```

The above code will prevent the player from changing its current time when the button is clicked.

### Player settings

Playback from Segments supports various [Player Settings](./player-settings.md):

- **segmentPlayback** can be used to disable this feature or only apply it to 'body' segments
- **highlightColor** can be used to change the highlight color of the active and hovered segments
- **highlightCurrent** can be used to decide whether to highlight the currently played segment
- **highlightHovered** can be used to decide whether to highlight the hovered segment
- **currentSegment** can be used to get the current segment (this is a read-only property)
- **hoveredSegment** can be used to get the hovered segment (this is a read-only property)

[< back to README](https://github.com/BeyondWords-io/player#readme)
