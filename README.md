## BeyondWords Player

With BeyondWords, you and your team can convert text into engaging audio. This
repository contains our proprietary player, that can be embedded on your website
to provide a tailored listening experience for your users. The player integrates
with the BeyondWords CMS. You can sign up for a free account
[here](https://dash.beyondwords.io/auth/signup).

The easiest way to embed the player on your site is by copying the code snippets
inside the BeyondWords CMS. However, for those who wish to customize the
player further, this documentation provides helpful guides and a detailed
explanation for each of the player's settings. You can see a demo of the player
[here](https://beyondwords-io.github.io/playback-from-paragraphs-prototype/).

## Documentation

The [doc/](doc/) directory contains these useful resources:

1. [Screenshots](./doc/screenshots.md): Some screenshots demonstrating the core
features and functionality of the player.
2. [Getting started](./doc/getting-started.md): A guide for how
to embed the player on your website using a `<script>` tag.
3. [NPM package](./doc/npm-package.md): A guide for how to add the
player to your website using the NPM package.
4. [Player SDK](./doc/player-sdk.md): An explanation of how to control the
player programmatically by using the SDK.
5. [Player settings](./doc/player-settings.md): A list of all supported player
settings that can be set in the initializer or via the SDK.
6. [Listening to events](./doc/listening-to-events.md): How to register event
listeners that are called when player actions are performed.
7. [Player events](./doc/player-events.md): A list of all events emitted by
the player that can be listened to.
8. [Custom analytics](./doc/custom-analytics.md): How to send player analytics
events to a custom URL of your choosing.
9. [Building your own UI](./doc/building-your-own-ui.md): How to build your own
user-interface on top of the BeyondWords player.
10. [How it works](./doc/how-it-works.md): A technical overview of how the
player works, including API calls that are made.
11. [Dev setup](./doc/dev-setup.md): How to run this project locally, e.g. if
you are a developer at BeyondWords.
12. [Dev workflow](./doc/dev-workflow.md): Useful advice for working on the
player, including what all the [./bin](bin/) scripts do.
13. [Code layout](./doc/code-layout.md): An explanation of the layout of code in
the player. Each major subdirectory is listed.
14. [Deployment](./doc/deployment.md): How to release a new version of the player
to the public and some things to consider.

## Contribution

We welcome contributions from our partners and members of the public. Please
open a GitHub issue if you are having trouble using the player or something
isn't working as expected.

We'd prefer you didn't fork this repository and instead
[contact us](mailto:support@beyondwords.io) if you have a requirement that is
not met by the current player. Note that it is possible to build a custom
user-interface on top of the existing player.

## License

All code in this repository is Copyright, BeyondWords, 2023.

You may embed the player in your project and use the NPM package provided it is
not modified.
