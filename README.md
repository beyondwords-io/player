## BeyondWords Player

BeyondWords is an AI voice and audio CMS that enables publishers to transform their content into natural-sounding and captivating audio experiences for their audiences.
This repository includes the BeyondWords player, which seamlessly integrates with the BeyondWords audio CMS and can be easily embedded into your website or app. You can create an account
[here](https://dash.beyondwords.io/auth/signup).


The easiest way to embed the BeyondWords player into your website is by copying
the player scripts inside the BeyondWords CMS. However, for those who wish to
customize the player further, this documentation provides helpful guides and a
detailed explanation for each of the player's settings. You can see a demo of
the player
[here](https://beyondwords-io.github.io/player-demo).

Please refer to our **[official documentation](https://docs.beyondwords.io/docs-and-guides/distribution/player/overview)** for more information.

## Development setup

We recommend you use nodenv for managing node versions. There is a `.nodenv`
file in the root of the repository. You will need to set this up first. Then,
run the following to install dependencies and start a server on port 8000:

```sh
./bin/setup
./bin/server
```

The player will live-reload when you make changes to the code.

## Testing

You can run the tests with:

```sh
./bin/test_units
./bin/test_screenshots
./bin/test_accessibility
./bin/lint
```

The screenshot and accessibility tests use Playwright and are Dockerized to
avoid test failures as a result of browser version differences. You will need
Docker installed to run these tests. These tests run automatically when pushing
to GitHub.

## Deployment

1. Update the version with `./bin/version <version>`
2. Commit the changes with `Release version <version>`
3. Push the changes and wait for CI to pass
4. Add a tag with the version: `git tag <version>`
5. Push the tag with `git push --tags`
6. Create a GitHub Release from the tag and wait for CD to pass
7. Run `./bin/purge_cache` or wait ~12 hours for the cache to expire

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
