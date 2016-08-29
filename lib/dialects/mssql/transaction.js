'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('knex:tx');

function Transaction_MSSQL() {
  _transaction2.default.apply(this, arguments);
}
(0, _inherits2.default)(Transaction_MSSQL, _transaction2.default);

(0, _assign3.default)(Transaction_MSSQL.prototype, {
  begin: function begin(conn) {
    debug('%s: begin', this.txid);
    return conn.tx_.begin().then(this._resolver, this._rejecter);
  },
  savepoint: function savepoint(conn) {
    var _this = this;

    debug('%s: savepoint at', this.txid);
    return _bluebird2.default.resolve().then(function () {
      return _this.query(conn, 'SAVE TRANSACTION ' + _this.txid);
    });
  },
  commit: function commit(conn, value) {
    var _this2 = this;

    this._completed = true;
    debug('%s: commit', this.txid);
    return conn.tx_.commit().then(function () {
      return _this2._resolver(value);
    }, this._rejecter);
  },
  release: function release(conn, value) {
    return this._resolver(value);
  },
  rollback: function rollback(conn, error) {
    var _this3 = this;

    this._completed = true;
    debug('%s: rolling back', this.txid);
    return conn.tx_.rollback().then(function () {
      return _this3._rejecter(error);
    });
  },
  rollbackTo: function rollbackTo(conn, error) {
    var _this4 = this;

    debug('%s: rolling backTo', this.txid);
    return _bluebird2.default.resolve().then(function () {
      return _this4.query(conn, 'ROLLBACK TRANSACTION ' + _this4.txid, 2, error);
    }).then(function () {
      return _this4._rejecter(error);
    });
  },


  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  acquireConnection: function acquireConnection(config) {
    var t = this;
    var configConnection = config && config.connection;
    return _bluebird2.default.try(function () {
      return (t.outerTx ? t.outerTx.conn : null) || configConnection || t.client.acquireConnection().completed;
    }).tap(function (conn) {
      if (!t.outerTx) {
        t.conn = conn;
        conn.tx_ = conn.transaction();
      }
    }).disposer(function (conn) {
      if (t.outerTx) return;
      if (conn.tx_) {
        if (!t._completed) {
          debug('%s: unreleased transaction', t.txid);
          conn.tx_.rollback();
        }
        conn.tx_ = null;
      }
      t.conn = null;
      if (!configConnection) {
        debug('%s: releasing connection', t.txid);
        t.client.releaseConnection(conn);
      } else {
        debug('%s: not releasing external connection', t.txid);
      }
    });
  }
});

exports.default = Transaction_MSSQL;
module.exports = exports['default'];