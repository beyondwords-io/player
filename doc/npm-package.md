## NPM package

If you have a build pipeline, you may wish to add the NPM package as a
dependency, instead:

```sh
npm add @beyondwords/player
```

Then, add a div to your page:

```html
<div id='something'></div>
```

And initialize the player with:

```javascript
import BeyondWords from '@beyondwords/player';

new BeyondWords.Player({ target: '#something', projectID: <ID>, contentId: '<ID>' });
```

See the `target` documentation for more information about supported types. For
example, it supports DOM nodes which allows you to use the player with `useRef`
hooks in a React application.
