[< back to README](https://github.com/BeyondWords-io/player#readme)

## Deployment

1. Update the version with `./bin/version <version>`
2. Commit the changes with `Release version <version>`
3. Push the changes and wait for CI to pass
4. Create a GitHub Release with `<version>` and wait for CD to pass

It might take up to 12 hours for the jsdelivr CDN cache to expire. Speak to the
Rails backend developers if you need to expire that cache sooner than this.

[< back to README](https://github.com/BeyondWords-io/player#readme)
