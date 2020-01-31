# Octomments renderer

The default UI of Octomments.

## Setup

```html
<link rel="stylesheet" href="https://unpkg.com/octomments/build/ocs-ui.min.css" />
<script src="https://unpkg.com/octomments/build/ocs-ui.min.js"></script>
```

or 

```html
> npm i octomments-renderer
```

## Usage

```js
import Octomments from 'octomments';
import Renderer from 'octomments-renderer';

const comments = Octomments({
  debug: true,
  github: {
    owner: 'krasimir',
    repo: 'octomments',
  },
  number: 1,
  renderer: [Renderer, '#container']
});

comments.init();
```


