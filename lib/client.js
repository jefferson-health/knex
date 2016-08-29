'use strict';

exports.__esModule = true;

var _cloneDeep2 = require('lodash/cloneDeep');

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _uniqueId2 = require('lodash/uniqueId');

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

var _runner = require('./runner');

var _runner2 = _interopRequireDefault(_runner);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _builder = require('./query/builder');

var _builder2 = _interopRequireDefault(_builder);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _builder3 = require('./schema/builder');

var _builder4 = _interopRequireDefault(_builder3);

var _compiler3 = require('./schema/compiler');

var _compiler4 = _interopRequireDefault(_compiler3);

var _tablebuilder = require('./schema/tablebuilder');

var _tablebuilder2 = _interopRequireDefault(_tablebuilder);

var _tablecompiler = require('./schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _columnbuilder = require('./schema/columnbuilder');

var _columnbuilder2 = _interopRequireDefault(_columnbuilder);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _pool = require('pool2');

var _pool2 = _interopRequireDefault(_pool);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _events = require('events');

var _string = require('./query/string');

var _string2 = _interopRequireDefault(_string);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('knex:client');
var debugQuery = require('debug')('knex:query');

// The base client provides the general structure
// for a dialect specific client object.
function Client() {
  var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  this.config = config;
  this.connectionSettings = (0, _cloneDeep3.default)(config.connection || {});
  if (this.driverName && config.connection) {
    this.initializeDriver();
    if (!config.pool || config.pool && config.pool.max !== 0) {
      this.initializePool(config);
    }
  }
  this.valueForUndefined = this.raw('DEFAULT');
  if (config.useNullAsDefault) {
    this.valueForUndefined = null;
  }
}
(0, _inherits2.default)(Client, _events.EventEmitter);

(0, _assign3.default)(Client.prototype, {

  Formatter: _formatter2.default,

  formatter: function formatter() {
    return new this.Formatter(this);
  },


  QueryBuilder: _builder2.default,

  queryBuilder: function queryBuilder() {
    return new this.QueryBuilder(this);
  },


  QueryCompiler: _compiler2.default,

  queryCompiler: function queryCompiler(builder) {
    return new this.QueryCompiler(this, builder);
  },


  SchemaBuilder: _builder4.default,

  schemaBuilder: function schemaBuilder() {
    return new this.SchemaBuilder(this);
  },


  SchemaCompiler: _compiler4.default,

  schemaCompiler: function schemaCompiler(builder) {
    return new this.SchemaCompiler(this, builder);
  },


  TableBuilder: _tablebuilder2.default,

  tableBuilder: function tableBuilder(type, tableName, fn) {
    return new this.TableBuilder(this, type, tableName, fn);
  },


  TableCompiler: _tablecompiler2.default,

  tableCompiler: function tableCompiler(tableBuilder) {
    return new this.TableCompiler(this, tableBuilder);
  },


  ColumnBuilder: _columnbuilder2.default,

  columnBuilder: function columnBuilder(tableBuilder, type, args) {
    return new this.ColumnBuilder(this, tableBuilder, type, args);
  },


  ColumnCompiler: _columncompiler2.default,

  columnCompiler: function columnCompiler(tableBuilder, columnBuilder) {
    return new this.ColumnCompiler(this, tableBuilder, columnBuilder);
  },


  Runner: _runner2.default,

  runner: function runner(connection) {
    return new this.Runner(this, connection);
  },


  SqlString: _string2.default,

  Transaction: _transaction2.default,

  transaction: function transaction(container, config, outerTx) {
    return new this.Transaction(this, container, config, outerTx);
  },


  Raw: _raw2.default,

  raw: function raw() {
    var raw = new this.Raw(this);
    return raw.set.apply(raw, arguments);
  },
  query: function query(connection, obj) {
    var _this = this;

    if (typeof obj === 'string') obj = { sql: obj };
    this.emit('query', (0, _assign3.default)({ __knexUid: connection.__knexUid }, obj));
    debugQuery(obj.sql);
    return this._query.call(this, connection, obj).catch(function (err) {
      err.message = _string2.default.format(obj.sql, obj.bindings) + ' - ' + err.message;
      _this.emit('query-error', err, (0, _assign3.default)({ __knexUid: connection.__knexUid }, obj));
      throw err;
    });
  },
  stream: function stream(connection, obj, _stream, options) {
    if (typeof obj === 'string') obj = { sql: obj };
    this.emit('query', (0, _assign3.default)({ __knexUid: connection.__knexUid }, obj));
    debugQuery(obj.sql);
    return this._stream.call(this, connection, obj, _stream, options);
  },
  prepBindings: function prepBindings(bindings) {
    return bindings;
  },
  wrapIdentifier: function wrapIdentifier(value) {
    return value !== '*' ? '"' + value.replace(/"/g, '""') + '"' : '*';
  },
  initializeDriver: function initializeDriver() {
    try {
      this.driver = this._driver();
    } catch (e) {
      helpers.exit('Knex: run\n$ npm install ' + this.driverName + ' --save\n' + e.stack);
    }
  },


  Pool: _pool2.default,

  initializePool: function initializePool(config) {
    if (this.pool) this.destroy();
    this.pool = new this.Pool((0, _assign3.default)(this.poolDefaults(config.pool || {}), config.pool));
    this.pool.on('error', function (err) {
      helpers.error('Pool2 - ' + err);
    });
    this.pool.on('warn', function (msg) {
      helpers.warn('Pool2 - ' + msg);
    });
  },
  poolDefaults: function poolDefaults(poolConfig) {
    var client = this;
    return {
      min: 2,
      max: 10,
      acquire: function acquire(callback) {
        client.acquireRawConnection().tap(function (connection) {
          connection.__knexUid = (0, _uniqueId3.default)('__knexUid');
          if (poolConfig.afterCreate) {
            return _bluebird2.default.promisify(poolConfig.afterCreate)(connection);
          }
        }).asCallback(callback);
      },
      dispose: function dispose(connection, callback) {
        if (poolConfig.beforeDestroy) {
          poolConfig.beforeDestroy(connection, function () {
            if (connection !== undefined) {
              client.destroyRawConnection(connection, callback);
            }
          });
        } else if (connection !== void 0) {
          client.destroyRawConnection(connection, callback);
        }
      },
      ping: function ping(resource, callback) {
        return client.ping(resource, callback);
      }
    };
  },


  // Acquire a connection from the pool.
  acquireConnection: function acquireConnection() {
    var client = this;
    var request = null;
    var completed = new _bluebird2.default(function (resolver, rejecter) {
      if (!client.pool) {
        return rejecter(new Error('There is no pool defined on the current client'));
      }
      request = client.pool.acquire(function (err, connection) {
        if (err) return rejecter(err);
        debug('acquired connection from pool: %s', connection.__knexUid);
        resolver(connection);
      });
    });
    var abort = function abort(reason) {
      if (request && !request.fulfilled) {
        request.abort(reason);
      }
    };
    return {
      completed: completed,
      abort: abort
    };
  },


  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection: function releaseConnection(connection) {
    var pool = this.pool;

    return new _bluebird2.default(function (resolver) {
      debug('releasing connection to pool: %s', connection.__knexUid);
      pool.release(connection);
      resolver();
    });
  },


  // Destroy the current connection pool for the client.
  destroy: function destroy(callback) {
    var client = this;
    var promise = new _bluebird2.default(function (resolver) {
      if (!client.pool) return resolver();
      client.pool.end(function () {
        client.pool = undefined;
        resolver();
      });
    });
    // Allow either a callback or promise interface for destruction.
    if (typeof callback === 'function') {
      promise.asCallback(callback);
    } else {
      return promise;
    }
  },


  // Return the database being used by this client.
  database: function database() {
    return this.connectionSettings.database;
  },
  toString: function toString() {
    return '[object KnexClient]';
  },


  canCancelQuery: false,

  assertCanCancelQuery: function assertCanCancelQuery() {
    if (!this.canCancelQuery) {
      throw new Error("Query cancelling not supported for this dialect");
    }
  },
  cancelQuery: function cancelQuery() {
    throw new Error("Query cancelling not supported for this dialect");
  }
});

exports.default = Client;
module.exports = exports['default'];