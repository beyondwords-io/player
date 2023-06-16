[< back to README](https://github.com/BeyondWords-io/player#readme)

## Player Events

The player emits various events that are processed by its
[RootController](https://github.com/BeyondWords-io/player/blob/main/src/controllers/rootController.ts). You can [listen to these events](./listening-to-events.md) after they are processed.

Events have a set of fields that are always present and some events contain additional fields.

### Example event

```javascript
{
  id: "51178a37-d5a7-4d75-9a12-a26eabfe7839",
  type: "PressedPlaylistItem",
  description: "A playlist item was pressed.",
  index: 3,
  initiatedBy: "user",
  emittedFrom: "inline-player",
  status: "handled",
  createdAt: "2023-01-01T12:00:00.000Z",
  processedAt: "2023-01-01T12:00:00.005Z",
  changedProps: {
    contentIndex: { previousValue: 0, currentValue: 3 },
  },
}
```

For the above example, the 'index' field additional and is specific to the PressedPlaylistItem event.

All of the other fields are present in every event. Their schema is explained below.

### Event schema

- **id**: a random UUID generated and assigned to the event at creation
- **type**: the type of event, see the table below for a listing of event types
- **description**: a short human-readable description of the event
- **initiatedBy**: who initiated the event, one of: { user, media, browser, media-session-api, google-ima-sdk, websocket }
- **emittedFrom**: which interface emitted the event, one of: { inline-player, bottom-widget, segment, segment-widget }
- **status**: the status of the event, one of: { handled, ignored-due-to-advert, ignored-due-to-scrubbing }
- **createdAt**: the time when the event was created in simplified extended ISO 8601 format
- **processedAt**: the time when the event was processed in simplified extended ISO 8601 format
- **changedProps**: an object listing the player properties that were changed by the event

It is recommended to not depend on `changedProps` and additional event fields
(e.g. index) since these might change.

Instead, please query the player props directly using the
[Player SDK](./player-sdk.md) when listening to events.

### Event types

The following table lists all event types emitted by the player.

Initiators denoted with a plus (+) can also be initiated by media-session-api, e.g. using playback controls on a phone lock screen.

Initiators denoted with a star (*) can also be initiated by google-ima-sdk when VAST adverts are playing.

To inspect the events further, it is recommended you [listen to "\<any\>" event](./listening-to-events.md) and console log them.

| Type                         | Initiator | Description |
|------------------------------|-----------|-------------|
| PressedPlay                  | user+     | The play button was pressed.
| PressedPause                 | user+     | The pause button was pressed.
| PressedChangeSpeed           | user      | The change speed button was pressed.
| PressedEnterOnChangeSpeed    | user      | The enter key was pressed while change speed was focussed.
| PressedSpaceOnChangeSpeed    | user      | The space key was pressed while change speed was focussed.
| PressedUpOnChangeSpeed       | user      | The up key was pressed while change speed was focussed.
| PressedRightOnChangeSpeed    | user      | The right key was pressed while change speed was focussed.
| PressedDownOnChangeSpeed     | user      | The down key was pressed while change speed was focussed.
| PressedLeftOnChangeSpeed     | user      | The left key was pressed while change speed was focussed.
| PressedPrevSegment           | user+     | The previous segment button was pressed.
| PressedNextSegment           | user+     | The next segment button was pressed.
| PressedSeekBack              | user+     | The seek backward button was pressed.
| PressedSeekAhead             | user+     | The seek ahead button was pressed.
| PressedPrevTrack             | user+     | The previous track button was pressed.
| PressedNextTrack             | user+     | The next track button was pressed.
| PressedAdvertLink            | user      | The advert link was pressed to open the click-through URL in a new tab.
| PressedAdvertButton          | user      | The advert button was pressed to open the click-through URL in a new tab.
| PressedAdvertImage           | user      | The advert image was pressed to open the advert in a new tab.
| PressedAdvertVideo           | user      | The video background was pressed to open the advert in a new tab.
| PressedBeyondWords           | user      | The BeyondWords logo was pressed to open the BeyondWords website in a new tab.
| PressedSourceUrl             | user      | The source URL button was pressed to open the source article in a new tab.
| VisibilityChanged            | user      | The player was scrolled into or out of view.
| PressedScrollToPlayer        | user      | The scroll to player button was pressed.
| PressedVideoBackground       | user      | The video background was pressed.
| PressedEnterOnProgressBar    | user      | The enter key was pressed while the progress bar was focussed.
| PressedSpaceOnProgressBar    | user      | The space key was pressed while the progress bar was focussed.
| PressedEnterOnProgressCircle | user      | The enter key was pressed while the progress circle was focussed.
| PressedSpaceOnProgressCircle | user      | The space key was pressed while the progress circle was focussed.
| PressedLeftOnProgressBar     | user      | The left key was pressed while the progress bar was focussed.
| PressedRightOnProgressBar    | user      | The right key was pressed while the progress bar was focussed.
| PressedLeftOnProgressCircle  | user      | The left key was pressed while the progress circle was focussed.
| PressedRightOnProgressCircle | user      | The right key was pressed while the progress circle was focussed.
| PressedProgressBar           | user      | The progress bar was pressed at some ratio.
| ScrubbedProgressBar          | user+     | The user pressed on the progress bar then dragged.
| FinishedScrubbingProgressBar | user      | The user let go after scrubbing the progress bar.
| PressedMaximize              | user      | The maximize button was pressed.
| PressedPlaylistItem          | user      | A playlist item was pressed.
| PressedDownload              | user      | The download button next to a playlist item was pressed.
| PressedTogglePlaylist        | user      | The toggle playlist button was pressed.
| PressedCloseWidget           | user      | The close widget button was pressed.
| PressedSegment               | user      | The user pressed on a segment in the article.
| HoveredSegmentUpdated        | user      | The user hovered over a different segment in the article.
| CurrentSegmentUpdated        | media     | The media's current segment was updated.
| MediaLoaded                  | media     | The media finished loading its first frame of data.
| DurationUpdated              | media*    | The media's duration was updated.
| CurrentTimeUpdated           | media     | The media's current time was updated.
| PlaybackPaused               | media*    | The media became paused at its current playback time.
| PlaybackRateUpdated          | media     | The media's playback rate was updated.
| PlaybackPlaying              | media     | The media began playing from its current playback time.
| PlaybackEnded                | media*    | The media finished playing because it reached the end.
| PlaybackErrored              | media*    | The media failed to play.
| IdentifiersChanged           | browser   | The Player's content identifiers changed.
| FullScreenModeUpdated        | browser   | The browser entered or exited full screen mode.
| ContentStatusChanged         | websocket | The processing status of a content item within the project changed.

[< back to README](https://github.com/BeyondWords-io/player#readme)
