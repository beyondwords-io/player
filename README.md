## BeyondWords Player

**DO NOT USE: This is an alpha version of the player and is not officially
released yet. We are testing the new player internally and will remove this
notice once it is ready.**

BeyondWords is an AI voice and audio CMS that enables publishers to transform
their content into natural-sounding and captivating audio experiences for their
audiences.  This repository includes the BeyondWords player, which seamlessly
integrates with the BeyondWords audio CMS and can be easily embedded into your
website or app. You can sign up for a free account
[here](https://dash.beyondwords.io/auth/signup).

The easiest way to embed the BeyondWords player into your website is by copying
the player scripts inside the BeyondWords CMS. However, for those who wish to
customize the player further, this documentation provides helpful guides and a
detailed explanation for each of the player's settings. You can see a demo of
the player
[here](https://beyondwords-io.github.io/playback-from-paragraphs-prototype/).

## Documentation

The [doc/](doc/) directory contains these useful resources:

1. [Getting started](./doc/getting-started.md): A guide for how
to embed the player on your website using a `<script>` tag.
2. [NPM package](./doc/npm-package.md): A guide for how to add the
player to your website using the NPM package.
3. [Player SDK](./doc/player-sdk.md): An explanation of how to control the
player programmatically by using the SDK.
4. [Player settings](./doc/player-settings.md): A list of all supported player
settings that can be set in the initializer or via the SDK.
5. [Listening to events](./doc/listening-to-events.md): How to register event
listeners that are called when player actions are performed.
6. [Player events](./doc/player-events.md): A list of all events emitted by
the player that can be listened to.
7. [Segments playback](./doc/segments-playback.md): How to add support for
the 'Playback from Segments' feature to your website.
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

We welcome contributions from our customers, and members of the public. Please
open a GitHub issue if you are having trouble using the player or something
isn't working as expected.

We'd prefer you didn't fork this repository and instead
[contact us](mailto:support@beyondwords.io) if you have a requirement that is
not met by the current player. Note that it is possible to build a custom
user-interface on top of the existing player.

## License

Copyright (c) 2023 Lstn Ltd (trading as BeyondWords). All rights reserved.

This repository and its contents, including but not limited to source code, documentation, and assets, are the sole property of BeyondWords and are protected by applicable copyright, trademark, and other intellectual property laws.

You are granted permission to use the player embed, SDK and the provided NPM package for your projects. No part of this repository may be otherwise reproduced, distributed, modified, or transmitted in any form or by any means, electronic or mechanical, without the prior written permission of BeyondWords, except for the purpose of submitting pull requests and contributing to the project.

Contributions in the form of pull requests are welcome; however, BeyondWords reserves the right to review, approve, or reject any modifications to the code.

For inquiries and permission requests, please contact support@beyondwords.io.