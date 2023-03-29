[< back to README](https://github.com/BeyondWords-io/player#readme)

## Custom Analytics

The player sends analytics events to BeyondWords which are used to track user engagement levels.

An aggregation of these events can be seen on the 'Analytics' tab in the BeyondWords dashboard or fetched via the BeyondWords API.

You can optionally provide your own analyticsCustomUrl to receive the same events.

The 'analyticsCustomUrl' can be set in the dashboard or as a [Player Setting](./player-settings.md). Also see 'analyticsConsent'.

You can inspect the events that are sent by finding them in the Network tab in your browser.

### Example event

```json
{
  "event_type": "play",
  "device_type": "desktop",
  "media_type": "content",
  "project_id": 123,
  "content_id": "3f57001d-cb30-42c1-ad6f-047e813c360f",
  "analytics_id": 333,
  "ad_id": null,
  "media_id": 555,
  "local_storage_id": "bef9218d-3871-450e-a7fa-5da65102f532",
  "listen_session_id": "839ff785-0cb8-4e74-a061-506f571c79ce",
  "duration": 123.45,
  "listen_length_seconds": 0.2,
  "listen_length_percent": 0.1620089105,
  "speed": 1,
  "location": "https://example.com",
  "referrer": "https://example.com"
}
```

### Event schema

Events are simple JSON objects with the following fields:

| Name                  | Type              | Explanation |
|-----------------------|-------------------|-------------|
| event_type            | string            | The type of analytics event. There are four types:<br/><br/>- **load**: content loaded successfully and the media's duration is known<br/>- **play**: the media started playing for the current content item<br/>- **play_progress**: playback reached the next 10% of the audio's duration<br/>- **ad_link_click**: the user clicked on the click-through URL for an advert
| device_type           | string            | The type of device that emitted the event. There are three types:<br/><br/>- **phone**: the width of the browser was between 0px and 499px<br/>- **tablet**: the width of the browser was between 500px and 999px<br/>- **desktop**: the width of the browser was 1000px or greater
| media_type            | string            | The type of media loaded in the player. There are two types:<br/><br/>- **content**: the event was emitted during content playback<br/>- **ad**: the event was emitted during advert playback
| project_id            | integer           | The numeric ID of the project whose content is loaded into the player. This field might be null if content wasn't fetched from the API and is instead set manually in the player.
| content_id            | string or integer | The string UUID or numeric ID of the content current loaded into the player. This field might be null if content wasn't fetched from the API and is instead set manually in the player.
| analytics_id          | integer           | A numeric ID used by BeyondWords for associating this event with your project. This field might be null if content wasn't fetched from the API and is instead set manually in the player.
| ad_id                 | integer           | The numeric ID of the advert that is currently loaded into the player. This field is null when an advert isn't playing, i.e. when content is playing.
| media_id              | integer           | The numeric ID of the content or advert media field that is currently loaded into the player. This field is null when VAST adverts are playing.
| local_storage_id      | string            | A string UUID associated with the current user that is stored in local storage in their browser under the 'beyondwords' key. This field is null if advertConsent is set to 'without-uuids'.
| listen_session_id     | string            | A string UUID associated with the current player instance. This ID changes after the page is reloaded. This field is null if advertConsent is set to 'without-uuids'.
| duration              | float             | The duration in seconds of the content or advert media currently loaded into the player.
| listen_length_seconds | float             | The duration in seconds that the user has listened to of the currently loaded media.
| listen_length_percent | float             | The percentage that the user has listened to of the currently loaded media.
| speed                 | float             | The speed at which the user is listening to the media, e.g. 0.5, 1 or 2.
| location              | string            | The value of window.location.href when the event was emitted.
| referrer              | string            | The value of document.referrer when the event was emitted.

[< back to README](https://github.com/BeyondWords-io/player#readme)
