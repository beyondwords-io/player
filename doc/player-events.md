[< back to README](https://github.com/BeyondWords-io/player#readme)

## Player Events

### Events

| Type                         | Initiator | Description |
|------------------------------|-----------|-------------|
| PressedPlay                  | user      | The play button was pressed.
| PressedPause                 | user      | The pause button was pressed.
| PressedChangeSpeed           | user      | The change speed button was pressed.
| PressedEnterOnChangeSpeed    | user      | The enter key was pressed while change speed was focussed.
| PressedSpaceOnChangeSpeed    | user      | The space key was pressed while change speed was focussed.
| PressedUpOnChangeSpeed       | user      | The up key was pressed while change speed was focussed.
| PressedRightOnChangeSpeed    | user      | The right key was pressed while change speed was focussed.
| PressedDownOnChangeSpeed     | user      | The down key was pressed while change speed was focussed.
| PressedLeftOnChangeSpeed     | user      | The left key was pressed while change speed was focussed.
| PressedPrevSegment           | user      | The previous segment button was pressed.
| PressedNextSegment           | user      | The next segment button was pressed.
| PressedSeekBack              | user      | The seek backward button was pressed.
| PressedSeekAhead             | user      | The seek ahead button was pressed.
| PressedPrevTrack             | user      | The previous track button was pressed.
| PressedNextTrack             | user      | The next track button was pressed.
| PressedAdvertLink            | user      | The advert link was pressed to open the click-through URL in a new tab.
| PressedAdvertButton          | user      | The advert button was pressed to open the click-through URL in a new tab.
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
| ScrubbedProgressBar          | user      | The mouse was pressed on the progress bar then dragged.
| FinishedScrubbingProgressBar | user      | The mouse was released after scrubbing the progress bar.
| PressedMaximize              | user      | The maximize button was pressed.
| PressedPlaylistItem          | user      | A playlist item was pressed.
| PressedTogglePlaylist        | user      | The toggle playlist button was pressed.
| PressedCloseWidget           | user      | The close widget button was pressed.
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

Initiators denoted with a star (*) can also be initiated by 'google-ima-sdk' when VAST adverts are playing.

For example, the video is automatically paused when you click on the video background to open the click-through URL.

[< back to README](https://github.com/BeyondWords-io/player#readme)
