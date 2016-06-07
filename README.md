## vscode-uri

This module contains the URI implementation that is used by VS Code and its extensions. 
It has support for parsing a string into `scheme`, `authority`, `path`, `query`, and
`fragment` URI components as defined in: http://tools.ietf.org/html/rfc3986

```
  foo://example.com:8042/over/there?name=ferret#nose
  \_/   \______________/\_________/ \_________/ \__/
   |           |            |            |        |
scheme     authority       path        query   fragment
   |   _____________________|__
  / \ /                        \
  urn:example:animal:ferret:nose
```

## Usage

```js
import Uri from ('vscode-uri')

// parse an Uri from string

let uri = Uri.parse('https://code.visualstudio.com/docs/extensions/overview#frag')

assert.ok(uri.scheme === 'https');
assert.ok(uri.authority === 'code.visualstudio.com');
assert.ok(uri.path === '/docs/extensions/overview');
assert.ok(uri.query === '');
assert.ok(uri.fragment === 'frag');


// create an Uri from a fs path

let uri = Uri.file('/users/me/c#-projects/');

assert.ok(uri.scheme === 'file');
assert.ok(uri.authority === '');
assert.ok(uri.path === '/users/me/c#-projects/');
assert.ok(uri.query === '');
assert.ok(uri.fragment === '');
```