
# reds

  reds (red-s) is a light-weight Redis search for node.js. This module was originally developed to provide search capabilities for [Kue](http://learnboost.github.com/kue) a priority job queue, however it is very much a light general purpose search library that could be integrated into a blog, a documentation server, etc.

## Installation

      $ npm install reds

## Example

 reds acts against arbitrary numeric or string based ids, so you could utilize this library with essentially anything you wish. The following example just uses an array for our "database", containing some strings, which we add to reds by calling `reds.add()` padding the body of text and an id of some kind, in this case the index.

```js
var strs = [];
strs.push('Tobi wants four dollars');
strs.push('Tobi only wants $4');
strs.push('Loki is really fat');
strs.push('Loki, Jane, and Tobi are ferrets');
strs.push('Manny is a cat');
strs.push('Luna is a cat');
strs.push('Mustachio is a cat');

strs.forEach(function(str, i){ reds.add(str, i); });
```

 To perform a query against reds simply invoke `reds.search()` with a string, and pass a callback, which receives an array of ids when present, or an empty array otherwise.

```js
reds.search(query = 'Tobi dollars', function(err, ids){
  if (err) throw err;
  console.log('Search results for "%s":', query);
  ids.forEach(function(id){
    console.log('  - %s', strs[id]);
  });
  process.exit();
});
```

 By default reds performs a union of the search words, the previous example would yield the following output:

```
Search results for "Tobi dollars":
  - Tobi wants four dollars
  - Tobi only wants $4
  - Loki, Jane, and Tobi are ferrets
```

 We can tweak reds to intersect by passing either "intersect" or "and" to `reds.search()` after the callback, indicating that _all_ the constants computed must be present for the id to match.

```js
reds.search(query = 'tobi dollars', function(err, ids){
  if (err) throw err;
  console.log('Search results for "%s":', query);
  ids.forEach(function(id){
    console.log('  - %s', strs[id]);
  });
  process.exit();
}, 'and');
```

 The intersection would yield the following since only one string contains both "Tobi" _and_ "dollars".

```
Search results for "tobi dollars":
  - Tobi wants four dollars
```

## License 

(The MIT License)

Copyright (c) 2011 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.