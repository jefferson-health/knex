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

var debugTx = require('debug')('knex:tx');

function Oracle_Transaction(client, container, config, outerTx) {
  _transaction2.default.call(this, client, container, config, outerTx);
}
(0, _inherits2.default)(Oracle_Transaction, _transaction2.default);

(0, _assign3.default)(Oracle_Transaction.prototype, {

  // disable autocommit to allow correct behavior (default is true)
  begin: function begin() {
    return _bluebird2.default.resolve();
  },
  commit: function commit(conn, value) {
    this._completed = true;
    return conn.commitAsync().return(value).then(this._resolver, this._rejecter);
  },
  release: function release(conn, value) {
    return this._resolver(value);
  },
  rollback: function rollback(conn, err) {
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return conn.rollbackAsync().throw(err).catch(this._rejecter);
  },
  acquireConnection: function acquireConnection(config) {
    var t = this;
    return _bluebird2.default.try(function () {
      return config.connection || t.client.acquireConnection().completed;
    }).tap(function (connection) {
      if (!t.outerTx) {
        connection.setAutoCommit(false);
      }
    }).disposer(function (connection) {
      debugTx('%s: releasing connection', t.txid);
      connection.setAutoCommit(true);
      if (!config.connection) {
        t.client.releaseConnection(connection);
      } else {
        debugTx('%s: not releasing external connection', t.txid);
      }
    });
  }
});

exports.default = Oracle_Transaction;
module.exports = exports['default'];