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

2) Embed the player on your web page and enable the clientSideIntegration:

```javascript
<script async defer src="https://proxy.beyondwords.io/npm/@beyondwords/player@latest/dist/umd.js"
  onload="new BeyondWords.Player({
    target: this,
    projectId: <ID>,
    clientSideIntegration: {
      enabled: true,
    },
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

The `clientSideIntegration` property supports additional parameters that allow
you to provide metadata about the article and to control whether it should be
published immediately or at a future date:

```javascript
clientSideIntegration: {
  enabled: true,
  contentAuthor: "Jane Doe",
  contentTitle: "My Article",
  publishDate: "2023-01-01 00:00:00Z",
  published: true,
  adsEnabled: true,
}
```

The schema is explained below:

- **enabled** &lt;boolean&gt;: Whether to import the current page's content, defaults to false
- **contentAuthor** &lt;string&gt;: The author to associate with the content, defaults to null
- **contentTitle** &lt;string&gt;: The title to associate with the content, defaults to the page &lt;title&gt;
- **publishDate** &lt;string&gt;: The date the content was published, defaults to the current date/time
- **published** &lt;string&gt;: Whether to publish the audio content for consumption, defaults to true
- **adsEnabled** &lt;string&gt;: Whether to enable monetization for the audio, defaults to true

In order for the player to load, the `publishDate` must have passed and the
`published` field must be set to true. If either condition isn't met, the
content will still be imported into the BeyondWords platform but the player will
be hidden from the page. The content can then be manually published from the
BeyondWords dashboard.

[< back to README](https://github.com/BeyondWords-io/player#readme)
