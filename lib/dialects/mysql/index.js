'use strict';

exports.__esModule = true;

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _compiler3 = require('./schema/compiler');

var _compiler4 = _interopRequireDefault(_compiler3);

var _tablecompiler = require('./schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL(config) {
  _client2.default.call(this, config);
}
// MySQL Client
// -------

(0, _inherits2.default)(Client_MySQL, _client2.default);

(0, _assign3.default)(Client_MySQL.prototype, {

  dialect: 'mysql',

  driverName: 'mysql',

  _driver: function _driver() {
    return require('mysql');
  },


  QueryCompiler: _compiler2.default,

  SchemaCompiler: _compiler4.default,

  TableCompiler: _tablecompiler2.default,

  ColumnCompiler: _columncompiler2.default,

  Transaction: _transaction2.default,

  wrapIdentifier: function wrapIdentifier(value) {
    return value !== '*' ? '`' + value.replace(/`/g, '``') + '`' : '*';
  },


  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    var connection = this.driver.createConnection(this.connectionSettings);
    return new _bluebird2.default(function (resolver, rejecter) {
      connection.connect(function (err) {
        if (err) return rejecter(err);
        connection.on('error', client._connectionErrorHandler.bind(null, client, connection));
        connection.on('end', client._connectionErrorHandler.bind(null, client, connection));
        resolver(connection);
      });
    });
  },


  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.end(cb);
  },


  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function _stream(connection, obj, stream, options) {
    options = options || {};
    return new _bluebird2.default(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      connection.query(obj.sql, obj.bindings).stream(options).pipe(stream);
    });
  },


  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new _bluebird2.default(function (resolver, rejecter) {
      var _obj = obj;
      var sql = _obj.sql;

      if (!sql) return resolver();
      if (obj.options) sql = (0, _assign3.default)({ sql: sql }, obj.options);
      connection.query(sql, obj.bindings, function (err, rows, fields) {
        if (err) return rejecter(err);
        obj.response = [rows, fields];
        resolver(obj);
      });
    });
  },


  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    if (obj == null) return;
    var response = obj.response;
    var method = obj.method;

    var rows = response[0];
    var fields = response[1];
    if (obj.output) return obj.output.call(runner, rows, fields);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        {
          var resp = helpers.skim(rows);
          if (method === 'pluck') return (0, _map3.default)(resp, obj.pluck);
          return method === 'first' ? resp[0] : resp;
        }
      case 'insert':
        return [rows.insertId];
      case 'del':
      case 'update':
      case 'counter':
        return rows.affectedRows;
      default:
        return response;
    }
  },


  // MySQL Specific error handler
  _connectionErrorHandler: function _connectionErrorHandler(client, connection, err) {
    if (connection && err && err.fatal && !connection.__knex__disposed) {
      connection.__knex__disposed = true;
      client.pool.destroy(connection);
    }
  },

  ping: function ping(resource, callback) {
    resource.query('SELECT 1', callback);
  },


  canCancelQuery: true,

  cancelQuery: function cancelQuery(connectionToKill) {
    var _this = this;

    var acquiringConn = this.acquireConnection().completed;

    // Error out if we can't acquire connection in time.
    // Purposely not putting timeout on `KILL QUERY` execution because erroring
    // early there would release the `connectionToKill` back to the pool with
    // a `KILL QUERY` command yet to finish.
    return acquiringConn.timeout(100).then(function (conn) {
      return _this.query(conn, {
        method: 'raw',
        sql: 'KILL QUERY ?',
        bindings: [connectionToKill.threadId],
        options: {}
      });
    }).finally(function () {
      // NOT returning this promise because we want to release the connection
      // in a non-blocking fashion
      acquiringConn.then(function (conn) {
        return _this.releaseConnection(conn);
      });
    });
  }
});

exports.default = Client_MySQL;
module.exports = exports['default'];