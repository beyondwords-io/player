[< back to README](https://github.com/BeyondWords-io/player#readme)

## Deployment

1. Update the version with `./bin/version <version>`
2. Commit the changes with `Release version <version>`
3. Push the changes and wait for CI to pass
4. Add a tag with the version: `git tag <version>`
5. Push the tag with `git push --tags`
6. Create a GitHub Release from the tag and wait for CD to pass
7. Run ./bin/purge_cache or wait ~12 hours for the cache to expire

It might take up to 12 hours for the jsdelivr CDN cache to expire. Speak to the
Rails backend developers if you need to expire that cache sooner than this.

[< back to README](https://github.com/BeyondWords-io/player#readme)
