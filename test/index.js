module.exports = function (test, testCommon, options) {
  options = options || {}

  require('./leveldown-test').args(test, testCommon)

  // TODO: move openAdvanced tests to separate files so they can be skipped.
  require('./open-test').all(test, testCommon)

  // if (options.createIfMissing !== false) {
  //   require('./open-create-if-missing-test').all(test, testCommon)
  // }
  //
  // if (options.errorIfExists !== false) {
  //   require('./open-error-if-exists-test').all(test, testCommon)
  // }

  require('./close-test').close(test, testCommon)

  require('./put-test').all(test, testCommon)
  require('./get-test').all(test, testCommon)
  require('./del-test').all(test, testCommon)
  require('./put-get-del-test').all(test, testCommon)

  require('./batch-test').all(test, testCommon)
  require('./chained-batch-test').all(test, testCommon)

  require('./iterator-test').all(test, testCommon)
  require('./iterator-range-test').all(test, testCommon)

  if (options.snapshots !== false) {
    require('./iterator-snapshot-test').all(test, testCommon)
  } else {
    require('./iterator-no-snapshot-test').all(test, testCommon)
  }
}
