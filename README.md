# abstract-leveldown

> An abstract prototype matching the [`leveldown`](https://github.com/level/leveldown/) API. Useful for extending [`levelup`](https://github.com/level/levelup) functionality by providing a replacement to `leveldown`.

[![level badge][level-badge]](https://github.com/level/awesome)
[![npm](https://img.shields.io/npm/v/abstract-leveldown.svg)](https://www.npmjs.com/package/abstract-leveldown)
![Node version](https://img.shields.io/node/v/abstract-leveldown.svg)
[![Travis](https://travis-ci.org/Level/abstract-leveldown.svg?branch=master)](http://travis-ci.org/Level/abstract-leveldown)
[![david](https://david-dm.org/Level/abstract-leveldown.svg)](https://david-dm.org/level/abstract-leveldown)
[![Coverage Status](https://coveralls.io/repos/github/Level/abstract-leveldown/badge.svg)](https://coveralls.io/github/Level/abstract-leveldown)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm](https://img.shields.io/npm/dm/abstract-leveldown.svg)](https://www.npmjs.com/package/abstract-leveldown)

## Background

`abstract-leveldown` provides a simple, operational base prototype that's ready for extending. All operations have sensible *noop* defaults (operations that essentially do nothing). For example, operations such as `.open(callback)` and `.close(callback)` will invoke `callback` on a next tick. Others perform sensible actions, like `.get(key, callback)` which will always yield a `'NotFound'` error.

You add functionality by implementing the "private" underscore versions of the operations. For example, to implement a public `put()` operation you add a private `_put()` method to your object. Each of these underscore methods override the default *noop* operations and are always provided with consistent arguments, regardless of what is passed in through the public API. All methods provide argument checking and sensible defaults for optional arguments.

For example, if you call `.open()` without a callback argument you'll get an `Error('open() requires a callback argument')`. Where optional arguments are involved, your underscore methods will receive sensible defaults. A `.get(key, callback)` will pass through to a `._get(key, options, callback)` where the `options` argument is an empty object.

**If you are upgrading:** please see [UPGRADING.md](UPGRADING.md).

## Example

Let's implement a simplistic in-memory `leveldown` replacement:

```js
var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
var util = require('util')

// Constructor, passes location to the AbstractLevelDOWN constructor
function FakeLevelDOWN (location) {
  AbstractLevelDOWN.call(this, location)
}

// Our new prototype inherits from AbstractLevelDOWN
util.inherits(FakeLevelDOWN, AbstractLevelDOWN)

FakeLevelDOWN.prototype._open = function (options, callback) {
  // Initialize a memory storage object
  this._store = {}

  // Use nextTick to be a nice async citizen
  process.nextTick(callback, null, this)
}

FakeLevelDOWN.prototype._serializeKey = function (key) {
  // Safety: avoid store['__proto__'] skullduggery.
  // Below methods will receive serialized keys in their arguments.
  return '!' + key
}

FakeLevelDOWN.prototype._put = function (key, value, options, callback) {
  this._store[key] = value
  process.nextTick(callback)
}

FakeLevelDOWN.prototype._get = function (key, options, callback) {
  if (value === undefined) {
    // 'NotFound' error, consistent with LevelDOWN API
    return process.nextTick(callback, new Error('NotFound'))
  }

  process.nextTick(callback, null, value)
}

FakeLevelDOWN.prototype._del = function (key, options, callback) {
  delete this._store[key]
  process.nextTick(callback)
}
```

Now we can use our implementation with `levelup`:

```js
var levelup = require('levelup')

var db = levelup(new FakeLevelDOWN('/who/cares'))

db.put('foo', 'bar', function (err) {
  if (err) throw err

  db.get('foo', function (err, value) {
    if (err) throw err

    console.log(value) // 'bar'
  })
})
```

See [`memdown`](https://github.com/Level/memdown/) if you are looking for a complete in-memory replacement for `leveldown`.

## Browser support

[![Sauce Test Status](https://saucelabs.com/browser-matrix/abstract-leveldown.svg)](https://saucelabs.com/u/abstract-leveldown)

## Public API for consumers

### `db = constructor(..)`

Constructors typically take a `location` argument pointing to a location on disk where the data will be stored. Since not all implementations are disk-based and some are non-persistent, implementors are free to take zero or more arguments in their constructor.

### `db.open([options, ]callback)`
### `db.close(callback)`
### `db.get(key[, options], callback)`
### `db.put(key, value[, options], callback)`
### `db.del(key[, options], callback)`
### `db.batch(operations[, options], callback)`
### `chainedBatch = db.batch()`
### `iterator = db.iterator([options])`

### `chainedBatch`

#### `chainedBatch.put(key, value)`
#### `chainedBatch.del(key)`
#### `chainedBatch.clear()`
#### `chainedBatch.write([options, ]callback)`

### `iterator`

#### `iterator.next(callback)`
#### `iterator.seek(target)`
#### `iterator.end(callback)`

## Private API for implementors

Each of these methods will receive exactly the number and order of arguments described. Optional arguments will receive sensible defaults.

### `AbstractLevelDOWN(location)`

Currently, the `AbstractLevelDOWN` constructor expects a location argument and throws if one isn't given. If your implementation doesn't have a `location`, pass an empty string (`''`).

### `AbstractLevelDOWN#status`

An `AbstractLevelDOWN` based database can be in one of the following states:

* `'new'` - newly created, not opened or closed
* `'opening'` - waiting for the database to be opened
* `'open'` - successfully opened the database, available for use
* `'closing'` - waiting for the database to be closed
* `'closed'` - database has been successfully closed, should not be used

### `AbstractLevelDOWN#_open(options, callback)`
### `AbstractLevelDOWN#_close(callback)`
### `AbstractLevelDOWN#_get(key, options, callback)`
### `AbstractLevelDOWN#_put(key, value, options, callback)`
### `AbstractLevelDOWN#_del(key, options, callback)`
### `AbstractLevelDOWN#_batch(array, options, callback)`

If `batch()` is called without arguments or with only an options object then it should return a `Batch` object with chainable methods. Otherwise it will invoke a classic batch operation.

### `AbstractLevelDOWN#_chainedBatch()`

By default a `batch()` operation without arguments returns a blank `AbstractChainedBatch` object. The prototype is available on the main exports for you to extend. If you want to implement chainable batch operations then you should extend the `AbstractChaindBatch` and return your object in the `_chainedBatch()` method.

### `AbstractLevelDOWN#_serializeKey(key)`
### `AbstractLevelDOWN#_serializeValue(value)`
### `AbstractLevelDOWN#_iterator(options)`

By default an `iterator()` operation returns a blank `AbstractIterator` object. The prototype is available on the main exports for you to extend. If you want to implement iterator operations then you should extend the `AbstractIterator` and return your object in the `_iterator(options)` method.

The `iterator()` operation accepts the following range options:

* `gt`
* `gte`
* `lt`
* `lte`
* `start` (legacy)
* `end` (legacy)

A range option that is either an empty buffer, an empty string or `null` will be ignored.

`AbstractIterator` implements the basic state management found in LevelDOWN. It keeps track of when a `next()` is in progress and when an `end()` has been called so it doesn't allow concurrent `next()` calls, it does allow `end()` while a `next()` is in progress and it doesn't allow either `next()` or `end()` after `end()` has been called.

### `AbstractIterator(db)`

Provided with the current instance of `AbstractLevelDOWN` by default.

### `AbstractIterator#_next(callback)`
### `AbstractIterator#_seek(target)`
### `AbstractIterator#_end(callback)`

### `AbstractChainedBatch`
Provided with the current instance of `AbstractLevelDOWN` by default.

### `AbstractChainedBatch#_put(key, value)`
### `AbstractChainedBatch#_del(key)`
### `AbstractChainedBatch#_clear()`
### `AbstractChainedBatch#_write(options, callback)`
### `AbstractChainedBatch#_serializeKey(key)`
### `AbstractChainedBatch#_serializeValue(value)`

## Test Suite

To prove that your implementation is `abstract-leveldown` compliant, include the test suite found in `test/`. For examples please see the test suites of implementations like [`leveldown`](https://github.com/Level/leveldown), [`level-js`](https://github.com/Level/level-js) or [`memdown`](https://github.com/Level/memdown).

As not every implementation can be fully compliant due to limitations of its underlying storage, some tests may be skipped.

| Test                   | Required | Skip if                                 |
|:-----------------------|:---------|:----------------------------------------|
| `leveldown`            | :x: | Constructor has no `location` argument       |
| `open`                 | :heavy_check_mark: | -                             |
| `put`                  | :heavy_check_mark: | -                             |
| `del`                  | :heavy_check_mark: | -                             |
| `get`                  | :heavy_check_mark: | -                             |
| `put-get-del`          | :heavy_check_mark: | -                             |
| `batch`                | :heavy_check_mark: | -                             |
| `chained-batch`        | :heavy_check_mark: | -                             |
| `close`                | :heavy_check_mark: | -                             |
| `iterator`             | :heavy_check_mark: | -                             |
| `iterator-range`       | :heavy_check_mark: | -                             |
| `iterator-snapshot`    | :x: | Reads don't operate on a snapshot<br>Snapshots are created asynchronously |
| `iterator-no-snapshot` | :x: | The `iterator-snapshot` test is included     |

If snapshots are an optional feature of your implementation, both `iterator-snapshot` and `iterator-no-snapshot` may be included.

<a name="contributing"></a>
## Contributing

`abstract-leveldown` is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [contribution guide](https://github.com/Level/community/blob/master/CONTRIBUTING.md) for more details.

## Big Thanks

Cross-browser Testing Platform and Open Source ♥ Provided by [Sauce Labs](https://saucelabs.com).

[![Sauce Labs logo](./sauce-labs.svg)](https://saucelabs.com)

<a name="license"></a>
## License

Copyright &copy; 2013-present `abstract-leveldown` [contributors](https://github.com/level/community#contributors).

`abstract-leveldown` is licensed under the MIT license. All rights not explicitly granted in the MIT license are reserved. See the included `LICENSE.md` file for more details.

[level-badge]: http://leveldb.org/img/badge.svg
