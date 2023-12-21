[< back to README](https://github.com/BeyondWords-io/player#readme)

## Dev Setup

We recommend you use nodenv for managing node versions. There is a `.nodenv`
file in the root of the repository. You will need to set this up first. Then,
run the following to install dependencies and start a server on port 8000:
on port 8000.

```sh
./bin/setup
./bin/server
```

The player will live-reload when you make changes to the code.

### Tests

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

[< back to README](https://github.com/BeyondWords-io/player#readme)
