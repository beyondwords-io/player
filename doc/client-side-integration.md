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

You will need to replace `<ID>` with your BeyondWords project ID in the snippet
above. You can also use the client-side integration with the [NPM package install](./npm-package.md)
by setting the same `clientSideEnabled: true` parameter.

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
the address of your web page and is the simplest of the three approaches. Any
query parameters (e.g. `?utm=source`) or anchors (e.g. `#heading`) are ignored
in the URL.

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

To avoid creating unnecessary churn on our systems, we limit how often the
content is allowed to update. We use some heuristics for this such as how
recently the content was published and how recently it was updated.

## Bypassing Paywalls

If your website uses a paywall, the BeyondWords platform won't be able to
extract the content from your web page. To handle this scenario, the client-side
integration can be configured in the BeyondWords platform to provide arbitrary
HTTP headers when it extracts the content from your website.

For example, you could configure a `X-Paywall-Token` header and set it to a
shared secret of your choosing. You would then need to detect the presence of
this header in the backend of your website and render the full, un-paywalled
article so that BeyondWords can see the full content of your web page.

When requesting content, the User-Agent will be set to `BeyondWords Importer`.

## Data Attributes

The client-side integration will automatically extract relevant data from your
web page such as the title, author and publish date. However, if you wish to
explicitly set these fields, rather than rely on our auto-extraction you may do
so using the following data attributes. These can be included anywhere in the
HTML page, for example:

```html
<html>
  <head>
    <title>This title won't be used</title>
  </head>
  <body data-beyondwords-title="My Title"
    data-beyondwords-author="Jane Doe"
    data-beyondwords-publish-date="2023-01-01T:12:00:00Z"
    data-beyondwords-published="false"
    data-beyondwords-ads-enabled="false">
  </body>
</html>
```

In the example above, the data attributes have been added to the `body` tag but
they can be added anywhere into the page, such as on the `article` tag or split
across multiple tags. Use whatever is most convenient for you.

### Feature Image

You can specify which image should be used as the feature image by adding the
following attribute to an `img` tag:

```html
<img data-beyondwords-feature-image="true" src="https://example.com/image.jpeg" />
```

The image is shown in the `large` and `video` [playerStyle](./player-settings.md)
if video generation is enabled for your project.

### Voice ID

You can override the voice that should be used by adding the following attribute
to a `p` tag or a container:


```html
<p data-beyondwords-voice-id="784">
  This paragraph will be voiced by Joe.
</p>

<div data-beyondwords-voice-id="2194">
  <p>This paragraph will be voiced by Eddie.</p>
  <p>This one, too.</p>
</div>
```

If not specified, the article will be read out using the default voices for
title and body configured for your project. You can retrieve a list of available
voices for your account from
[our API](https://developers.beyondwords.io/reference/organizationvoicesindex).


[< back to README](https://github.com/BeyondWords-io/player#readme)
