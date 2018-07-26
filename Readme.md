# RedRediSearch

  RedRediSearch is a Node.js wrapper library for the [RediSearch](http://redisearch.io/) Redis module. It is more-or-less syntactically compatible with [Reds](https://github.com/tj/reds), another Node.js search library. RedRediSearch and RediSearch can provide full-text searching that is much faster than the original Reds library (see Benchmarks).
  
   
## Upgrading

If you are upgrading from Reds, you'll need to make your `createSearch` asynchronous and re-index your data. Otherwise, your app-level logic and code should be compatible.

## Installation

      $ npm install redredisearch

## Example

The first thing you'll want to do is create a `Search` instance, which allows you to pass a `key`, used for namespacing within RediSearch so that you may have several searches in the same Redis database. You may specify your own [node_redis](https://github.com/NodeRedis/node_redis) instance with the `redredisearch.setClient` function.

```js
redredisearch.createSearch('pets',{}, function(err, search) {
  /* ... */
});
```

You can then add items to the index with the `Search#index` function.

```js
var strs = [];
strs.push('Tobi wants four dollars');
strs.push('Tobi only wants $4');
strs.push('Loki is really fat');
strs.push('Loki, Jane, and Tobi are ferrets');
strs.push('Manny is a cat');
strs.push('Luna is a cat');
strs.push('Mustachio is a cat');

redredisearch.createSearch('pets',{}, function(err,search) {
  strs.forEach(function(str, i){ search.index(str, i); });
});
```

 To perform a query against the index simply invoke `Search#query()` with a string, and pass a callback, which receives an array of ids when present, or an empty array otherwise.

```js
search
  .query(query = 'Tobi dollars')
  .end(function(err, ids){
    if (err) throw err;
    console.log('Search results for "%s":', query);
    ids.forEach(function(id){
      console.log('  - %s', strs[id]);
    });
  });
  ```

 By default, queries are an intersection of the search words. The previous example would yield the following output since only one string contains both "Tobi" _and_ "dollars":

```
Search results for "Tobi dollars":
  - Tobi wants four dollars
```

 We can tweak the query to perform a union by passing either "union" or "or" to `Search#type()` in `redredisearch.search()` between `Search#query()` and `Search#end()`, indicating that _any_ of the constants computed may be present for the `id` to match.

```js
search
  .query('tobi dollars')
  .type('or')
  .end(function(err, ids){
    if (err) throw err;
    console.log('Search results for "%s":', query);
    ids.forEach(function(id){
      console.log('  - %s', strs[id]);
    });
  });
```

 The union search would yield the following since three strings contain either "Tobi" _or_ "dollars":

```
Search results for "tobi dollars":
  - Tobi wants four dollars
  - Tobi only wants $4
  - Loki, Jane, and Tobi are ferrets
```

RediSearch has an advanced query syntax that can be used by using the 'direct' search type. See the [RediSearch documentation](http://redisearch.io/Query_Syntax/) for this syntax.

```js
search
  .query('(hello|hella) (world|werld)')
  .type('direct')
  .end(function(err, ids){
    /* ... */
  });
```

Also included in the package is the RediSearch Suggestion API. This has no corollary in the Reds module. The Suggestion API is ideal for auto-complete type situations and is entirely separate from the Search API. 

```js
var suggestions = redredisearch.suggestion('my-suggestion-list');

suggestions.add(
  'redis',                                            // add 'redis'
  2,                                                  // with a 'score' of 2, this affects the position in the results, higher = higher up in results
  function(err,sizeOfSuggestionList) { /* ... */ }    // callback
);
suggestions.add(
  'redisearch',                                       
  5,
  function(err,sizeOfSuggestionList) { /* ... */ } 
);
suggestions.add(
  'reds',                                       
  1,
  function(err,sizeOfSuggestionList) { /* ... */ } 
);

/* ... */

sugggestions.get(
  're',                                               // prefix - will find anything starting with "re"
  function(err, returnedSuggestions) {
    /* returnedSuggestions is set to [ "redisearch", "redis", "reds" ] */
  }
);

sugggestions.get(
  'redis',                                            // prefix - will find anything starting with "redis", so not "reds"
  function(err, returnedSuggestions) {
    /* returnedSuggestions is set to [ "redisearch", "redis" ] */
  }
)
```

There is also a `fuzzy` opt and `maxResults` that can either be set by chaining or by passing an object in the second argument in the constructor.


## API

```js
redredisearch.createSearch(key, options, fn) : Search
redredisearch.setClient(inClient)
redredisearch.createClient()
redredisearch.confirmModule(cb)
redredisearch.words(str) : Array
redredisearch.suggestionList(key,opts) : Suggestion
Search#index(text, id[, fn])
Search#remove(id[, fn]);
Search#query(text, fn[, type]) : Query
Query#type(type)
Query#between(str)
Query#end(fn)
Suggestion#fuzzy(isFuzzy)
Suggestion#maxResults(maxResults)
Suggestion#add(str,score,fn)
Suggestion#get(prefix,fn)
Suggestion#del(str,fn)

```

 Examples:

```js
var search = redredisearch.createSearch('misc');
search.index('Foo bar baz', 'abc');
search.index('Foo bar', 'bcd');
search.remove('bcd');
search.query('foo bar').end(function(err, ids){});
```


## Benchmarks

When compared to Reds, RedRediSearch is much faster at indexing and somewhat faster at query:

_Indexing - documents / second_

| Module         | Tiny | Small | Medium | Large |
|----------------|------|-------|--------|-------|
| Reds           | 122  | 75    | 10     |  0    |
| RediRediSearch | 1,256| 501   | 132    |  5    |

_Query - queries / second_

| Module         | 1 term | 2 terms / AND | 2 terms / OR | 3 terms / AND | 3 terms / OR | Long* / AND | Long* / OR | 
|----------------|--------|---------------|--------------|---------------|--------------|------------|----------|
| Reds           | 8,754  | 8,765         | 8,389        | 7,622         | 7,193        | 1,649      | 1,647 |
| RedRediSearch  | 10,955 | 12,945        | 10,054       | 12,769        | 8,389        | 6,456      | 12,311 |

The "Long" query string is taken from the Canadian Charter of Rights and Freedoms: "Everyone has the following fundamental freedoms: (a) freedom of conscience and religion;  (b) freedom of thought, belief, opinion and expression, including freedom of the press and other media of communication; (c) freedom of peaceful assembly; and (d) freedom of association." (Used because I just had it open in another tab...)

## Next steps

- More coverage of RediSearch features
- Tests
- Better examples


## License 

(The MIT License)

Copyright (c) 2011 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Modified work Copyright (c) 2017 Kyle Davis

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
