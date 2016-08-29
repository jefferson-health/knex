'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

exports.default = Knex;

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

var _helpers = require('./helpers');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _makeClient = require('./util/make-client');

var _makeClient2 = _interopRequireDefault(_makeClient);

var _makeKnex = require('./util/make-knex');

var _makeKnex2 = _interopRequireDefault(_makeKnex);

var _parseConnection = require('./util/parse-connection');

var _parseConnection2 = _interopRequireDefault(_parseConnection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The client names we'll allow in the `{name: lib}` pairing.
var aliases = {
  'mariadb': 'maria',
  'mariasql': 'maria',
  'pg': 'postgres',
  'postgresql': 'postgres',
  'sqlite': 'sqlite3'
};

function Knex(config) {
  if (typeof config === 'string') {
    return new Knex((0, _assign3.default)((0, _parseConnection2.default)(config), arguments[2]));
  }
  var Dialect = void 0;
  if (arguments.length === 0 || !config.client && !config.dialect) {
    Dialect = (0, _makeClient2.default)(_client2.default);
  } else if (typeof config.client === 'function' && config.client.prototype instanceof _client2.default) {
    Dialect = (0, _makeClient2.default)(config.client);
  } else {
    var clientName = config.client || config.dialect;
    Dialect = (0, _makeClient2.default)(require('./dialects/' + (aliases[clientName] || clientName) + '/index.js'));
  }
  if (typeof config.connection === 'string') {
    config = (0, _assign3.default)({}, config, { connection: (0, _parseConnection2.default)(config.connection).connection });
  }
  return (0, _makeKnex2.default)(new Dialect(config));
}

// Expose Client on the main Knex namespace.
Knex.Client = _client2.default;

// Expose Knex version on the main Knex namespace.
Knex.VERSION = require('../package.json').version;

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = function (sql, bindings) {
  return new _raw2.default({}).set(sql, bindings);
};

// Create a new "knex" instance with the appropriate configured client.
Knex.initialize = function (config) {
  (0, _helpers.warn)('knex.initialize is deprecated, pass your config object directly to the knex module');
  return new Knex(config);
};

// Bluebird
Knex.Promise = require('bluebird');

// Doing this ensures Browserify works. Still need to figure out
// the best way to do some of this.
if (process.browser) {
  require('./dialects/websql/index.js');
}
module.exports = exports['default'];