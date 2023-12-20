[< back to README](https://github.com/BeyondWords-io/player#readme)

## Segments Playback

The player supports a feature called 'Playback from Segments'. This lets you to click on a segment on your website (i.e. a paragraph) to begin playback from that segment. If the segment is already playing then it will be paused instead.

The player will also highlight the current segment as it is being read out so that the user can read along with the article if they wish. This feature can be enabled in the BeyondWords Dashboard under Player &gt; Settings.

The player should automatically identify segments and highlight them out-of-the-box without further integration work. However, this might not work 100% of the time, depending on the structure of your website.

We recommend you first try out this feature and see if it works out-of-the-box. If not, we recommend adding markers to elements of your page which will improve the quality of the detection:

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

If you do decide to add markers yourself, rather than rely on automatic detection, we recommend you set the markers to a randomly generated UUID. The UUID must be stable, that is to say, it must not change between page refreshes.

If you are using the [client-side integration](./client-side-integration.md), the markers will be automatically retrieved from your page when content is processed.

If you are sending HTML to the [BeyondWords API](https://api.beyondwords.io/docs), the markers will be automatically extracted from the HTML when content is processed.

If you are sending plaintext to the [BeyondWords API](https://api.beyondwords.io/docs), you will need to set the marker attribute on each segment alongside the text.

Alternatively, if a segment marker is not provided, BeyondWords will generate one for you. You can retrieve these from the `/content` endpoint and add them to the HTML of your article.

It is recommended to generate UUIDs as markers to avoid duplicates, in case there are multiple players on the same page.

### How it works

Once the player script has loaded, it will add global listeners to your page to detect clicks and mousemove events.

If the player detects that you are hovering or have clicked on an element, it will try to match that element against the segments using markers (see above), xpath or an MD5 fingerprint of the text content.

If a match is found, the player emits HoveredSegmentUpdated and PressedSegment [events](./doc/player-events.md).

Additionally, when the currentTime of the media updates (i.e. by playing it), the player emits a CurrentSegmentUpdated event.

These events are then used to highlight segments on the page and to control playback, e.g. by setting its currentTime to the startTime of the segment that the user clicked on. The currentSegment and hoveredSegment props of the player are set.

To highlight segments, the player adds a `<mark>` element inside the segment on the page with some custom styles. All children of the segment are moved inside of the mark. The mark is removed again after highlighting has ended.

To avoid interfering with your page, highlighting and clicking on segments does not trigger if you are hovering over a link or other element with a 'click' or 'mousedown' handler. However, this does not apply to event listeners (see below).

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

- **highlightColor** can be used to set a different highlight color for segments on the page
- **highlightSections** can be used to control which segments highlighting applies to (if any)
- **clickableSections** can be used to control which segments can be clicked on (if any)
- **segmentWidgetSections** can be used to control which segments the widget appears next to (if any)
- **segmentWidgetPosition** can be used to control which side the widget appears next to the segment
- **currentSegment** can be used to get the current segment (this is a read-only property)
- **hoveredSegment** can be used to get the hovered segment (this is a read-only property)

[< back to README](https://github.com/BeyondWords-io/player#readme)
