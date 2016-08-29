'use strict';

exports.__esModule = true;

var _values2 = require('lodash/values');

var _values3 = _interopRequireDefault(_values2);

var _flatten2 = require('lodash/flatten');

var _flatten3 = _interopRequireDefault(_flatten2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _string = require('../../query/string');

var _string2 = _interopRequireDefault(_string);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _compiler3 = require('./schema/compiler');

var _compiler4 = _interopRequireDefault(_compiler3);

var _columnbuilder = require('./schema/columnbuilder');

var _columnbuilder2 = _interopRequireDefault(_columnbuilder);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _tablecompiler = require('./schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _stream2 = require('./stream');

var _stream3 = _interopRequireDefault(_stream2);

var _utils = require('./utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.

// Oracle Client
// -------
function Client_Oracle(config) {
  _client2.default.call(this, config);
}
(0, _inherits2.default)(Client_Oracle, _client2.default);

(0, _assign3.default)(Client_Oracle.prototype, {

  dialect: 'oracle',

  driverName: 'oracle',

  _driver: function _driver() {
    return require('oracle');
  },


  Transaction: _transaction2.default,

  Formatter: _formatter2.default,

  QueryCompiler: _compiler2.default,

  SchemaCompiler: _compiler4.default,

  ColumnBuilder: _columnbuilder2.default,

  ColumnCompiler: _columncompiler2.default,

  TableCompiler: _tablecompiler2.default,

  prepBindings: function prepBindings(bindings) {
    var _this = this;

    return (0, _map3.default)(bindings, function (value) {
      // returning helper uses always ROWID as string
      if (value instanceof _utils.ReturningHelper && _this.driver) {
        return new _this.driver.OutParam(_this.driver.OCCISTRING);
      } else if (typeof value === 'boolean') {
        return value ? 1 : 0;
      } else if (Buffer.isBuffer(value)) {
        return _string2.default.bufferToString(value);
      }
      return value;
    });
  },


  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    return new _bluebird2.default(function (resolver, rejecter) {
      client.driver.connect(client.connectionSettings, function (err, connection) {
        if (err) return rejecter(err);
        _bluebird2.default.promisifyAll(connection);
        if (client.connectionSettings.prefetchRowCount) {
          connection.setPrefetchRowCount(client.connectionSettings.prefetchRowCount);
        }
        resolver(connection);
      });
    });
  },


  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.close();
    cb();
  },


  // Return the database for the Oracle client.
  database: function database() {
    return this.connectionSettings.database;
  },


  // Position the bindings for the query.
  positionBindings: function positionBindings(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function () {
      questionCount += 1;
      return ':' + questionCount;
    });
  },
  _stream: function _stream(connection, obj, stream, options) {
    obj.sql = this.positionBindings(obj.sql);
    return new _bluebird2.default(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      var queryStream = new _stream3.default(connection, obj.sql, obj.bindings, options);
      queryStream.pipe(stream);
    });
  },


  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {

    // convert ? params into positional bindings (:1)
    obj.sql = this.positionBindings(obj.sql);

    if (!obj.sql) throw new Error('The query is empty');

    return connection.executeAsync(obj.sql, obj.bindings).then(function (response) {
      if (!obj.returning) return response;
      var rowIds = obj.outParams.map(function (v, i) {
        return response['returnParam' + (i ? i : '')];
      });
      return connection.executeAsync(obj.returningSql, rowIds);
    }).then(function (response) {
      obj.response = response;
      obj.rowsAffected = response.updateCount;
      return obj;
    });
  },


  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    var response = obj.response;
    var method = obj.method;

    if (obj.output) return obj.output.call(runner, response);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        response = helpers.skim(response);
        if (obj.method === 'pluck') response = (0, _map3.default)(response, obj.pluck);
        return obj.method === 'first' ? response[0] : response;
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning) {
          if (obj.returning.length > 1 || obj.returning[0] === '*') {
            return response;
          }
          // return an array with values if only one returning value was specified
          return (0, _flatten3.default)((0, _map3.default)(response, _values3.default));
        }
        return obj.rowsAffected;
      default:
        return response;
    }
  },
  ping: function ping(resource, callback) {
    resource.execute('SELECT 1 FROM DUAL', [], callback);
  }
});

exports.default = Client_Oracle;
module.exports = exports['default'];