[< back to README](https://github.com/BeyondWords-io/player#readme)

## Deployment

1. Ensure you have no local changes: `git checkout . && git clean -df`
2. Update the version in `package.json`
3. Run `npm install` to update `package-lock.json`
4. Update the player version in index.html
5. Commit the changes with `Release version <version>`
6. Push the changes and wait for CI to pass
7. Create a GitHub Release with `<version>`

It might take up to 12 hours for the jsdelivr CDN cache to expire. Speak to the
Rails backend developers if you need to expire that cache sooner than this.

[< back to README](https://github.com/BeyondWords-io/player#readme)
