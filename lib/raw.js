'use strict';

exports.__esModule = true;

var _isNumber2 = require('lodash/isNumber');

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isObject2 = require('lodash/isObject');

var _isObject3 = _interopRequireDefault(_isObject2);

var _isPlainObject2 = require('lodash/isPlainObject');

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

var _events = require('events');

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Raw
// -------
function Raw(client) {
  this.client = client;

  this.sql = '';
  this.bindings = [];
  this._cached = undefined;

  // Todo: Deprecate
  this._wrappedBefore = undefined;
  this._wrappedAfter = undefined;
  this._debug = client && client.config && client.config.debug;
}
(0, _inherits2.default)(Raw, _events.EventEmitter);

(0, _assign3.default)(Raw.prototype, {
  set: function set(sql, bindings) {
    this._cached = undefined;
    this.sql = sql;
    this.bindings = (0, _isObject3.default)(bindings) && !bindings.toSQL || (0, _isUndefined3.default)(bindings) ? bindings : [bindings];

    return this;
  },
  timeout: function timeout(ms) {
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var cancel = _ref.cancel;

    if ((0, _isNumber3.default)(ms) && ms > 0) {
      this._timeout = ms;
      if (cancel) {
        this.client.assertCanCancelQuery();
        this._cancelOnTimeout = true;
      }
    }
    return this;
  },


  // Wraps the current sql with `before` and `after`.
  wrap: function wrap(before, after) {
    this._cached = undefined;
    this._wrappedBefore = before;
    this._wrappedAfter = after;
    return this;
  },


  // Calls `toString` on the Knex object.
  toString: function toString() {
    return this.toQuery();
  },


  // Returns the raw sql for the query.
  toSQL: function toSQL(method, tz) {
    if (this._cached) return this._cached;
    if (Array.isArray(this.bindings)) {
      this._cached = replaceRawArrBindings(this);
    } else if (this.bindings && (0, _isPlainObject3.default)(this.bindings)) {
      this._cached = replaceKeyBindings(this);
    } else {
      this._cached = {
        method: 'raw',
        sql: this.sql,
        bindings: (0, _isUndefined3.default)(this.bindings) ? void 0 : [this.bindings]
      };
    }
    if (this._wrappedBefore) {
      this._cached.sql = this._wrappedBefore + this._cached.sql;
    }
    if (this._wrappedAfter) {
      this._cached.sql = this._cached.sql + this._wrappedAfter;
    }
    this._cached.options = (0, _reduce3.default)(this._options, _assign3.default, {});
    if (this._timeout) {
      this._cached.timeout = this._timeout;
      if (this._cancelOnTimeout) {
        this._cached.cancelOnTimeout = this._cancelOnTimeout;
      }
    }
    if (this.client && this.client.prepBindings) {
      this._cached.bindings = this._cached.bindings || [];
      if (helpers.containsUndefined(this._cached.bindings)) {
        throw new Error('Undefined binding(s) detected when compiling RAW query: ' + this._cached.sql);
      }
      this._cached.bindings = this.client.prepBindings(this._cached.bindings, tz);
    }
    this._cached.__knexQueryUid = _nodeUuid2.default.v4();
    return this._cached;
  }
});

function replaceRawArrBindings(raw) {
  var expectedBindings = raw.bindings.length;
  var values = raw.bindings;
  var client = raw.client;

  var index = 0;
  var bindings = [];

  var sql = raw.sql.replace(/\\?\?\??/g, function (match) {
    if (match === '\\?') {
      return match;
    }

    var value = values[index++];

    if (value && typeof value.toSQL === 'function') {
      var bindingSQL = value.toSQL();
      bindings = bindings.concat(bindingSQL.bindings);
      return bindingSQL.sql;
    }

    if (match === '??') {
      return client.formatter().columnize(value);
    }
    bindings.push(value);
    return '?';
  });

  if (expectedBindings !== index) {
    throw new Error('Expected ' + expectedBindings + ' bindings, saw ' + index);
  }

  return {
    method: 'raw',
    sql: sql,
    bindings: bindings
  };
}

function replaceKeyBindings(raw) {
  var values = raw.bindings;
  var client = raw.client;
  var sql = raw.sql;var bindings = [];

  var regex = /\\?(:\w+:?)/g;
  sql = raw.sql.replace(regex, function (full, part) {
    if (full !== part) {
      return part;
    }

    var key = full.trim();
    var isIdentifier = key[key.length - 1] === ':';
    var value = isIdentifier ? values[key.slice(1, -1)] : values[key.slice(1)];
    if (value === undefined) {
      bindings.push(value);
      return full;
    }
    if (value && typeof value.toSQL === 'function') {
      var bindingSQL = value.toSQL();
      bindings = bindings.concat(bindingSQL.bindings);
      return full.replace(key, bindingSQL.sql);
    }
    if (isIdentifier) {
      return full.replace(key, client.formatter().columnize(value));
    }
    bindings.push(value);
    return full.replace(key, '?');
  });

  return {
    method: 'raw',
    sql: sql,
    bindings: bindings
  };
}

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Raw);

exports.default = Raw;
module.exports = exports['default'];