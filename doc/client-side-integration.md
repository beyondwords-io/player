[< back to README](https://github.com/BeyondWords-io/player#readme)

## Client-Side Integration

In order to create audio content in the BeyondWords platform you must use one of
our CMS integrations. The client-side integration allows you to create audio
content in the BeyondWords platform by embedding the player on your web page.
BeyondWords will handle the extraction and delivery of audio content
automatically.

## Setup Instructions

1) Enable and configure the client-side integration for your project in the
[BeyondWords platform](https://dash.beyondwords.io). For example, you will need
to set the list of allowed domains on which the integration is allowed to run.

2) Embed the player on your web page and enable the client-side integration:

```javascript
<script async defer src="https://proxy.beyondwords.io/npm/@beyondwords/player@latest/dist/umd.js"
  onload="new BeyondWords.Player({
    target: this,
    projectId: <ID>,
    clientSideEnabled: true,
  })">
</script>
```

Note: You will need to replace `<ID>` with your BeyondWords project ID in the snippet above.

3) Visit the web page that contains the embedded player in your browser. This
will send a request to the BeyondWords platform to generate the audio. This
might take a minute or two to complete. During this time the player will be
hidden. Afterwards, subsequent visits to the page will load the player with the
audio.

## Content Identifiers

The client-side integration can be used with any of the following identifiers:

- **sourceUrl**: the URL of the current web page, i.e. the source of the content
- **sourceId**: an arbitrary string ID assigned by you when the content is first created
- **contentId**: a random UUID assigned by the BeyondWords platform for your content item

If no identifier is specified, the player will set the **sourceUrl** to
window.location.href for convenience. This ties the BeyondWords audio content to
the address of your web page and is the simplest of the three approaches.

Alternatively, you may wish to set your own **sourceId** based on some internal
identifier that you are using. This would allow you to embed the same player on
multiple pages and make it easier to update your page URLs later.

Finally, you may wish to set the **contentId** from the BeyondWords ID for your
content if it has already been created (e.g. via the API). This would allow the
audio to be updated in the future if the content changes on your web page.
However, this workflow is experimental at this time so please
[contact us](mailto:support@beyondwords.io) if you have this requirement.

## Content Updates

BeyondWords will monitor your web page and automatically reprocess the audio
when it changes. When this happens, we only regenerate the audio for paragraphs
that have actually changed rather than the entire article. This minimizes that
amount of credit that is used on your account and is faster to process.

## Bypassing Paywalls

If your website uses a paywall, the BeyondWords platform won't be able to
extract the content from your web page. To handle this scenario, the client-side
integration can be configured in the BeyondWords platform to provide arbitrary
HTTP headers when it extracts the content from your website.

For example, you could configure a `X-Paywall-Token` header and set it to a
shared secret of your choosing. You would then need to detect the presence of
this header in the backend of your website and render the full, un-paywalled
article so that BeyondWords can see the full content of your web page.

## Additional Parameters

TODO: document how to set the following properties via data attributes:

```
contentAuthor: "Jane Doe",
contentTitle: "My Article",
publishDate: "2023-01-01 00:00:00Z",
published: true,
adsEnabled: true,
```

[< back to README](https://github.com/BeyondWords-io/player#readme)
