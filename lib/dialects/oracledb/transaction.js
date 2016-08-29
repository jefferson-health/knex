'use strict';

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var inherits = require('inherits');
var Promise = require('bluebird');
var Transaction = require('../../transaction');
var debugTx = require('debug')('knex:tx');


function Oracle_Transaction(client, container, config, outerTx) {
  Transaction.call(this, client, container, config, outerTx);
}
inherits(Oracle_Transaction, Transaction);

(0, _assign3.default)(Oracle_Transaction.prototype, {
  // disable autocommit to allow correct behavior (default is true)
  begin: function begin() {
    return Promise.resolve();
  },
  commit: function commit(conn, value) {
    this._completed = true;
    return conn.commitAsync().return(value).then(this._resolver, this._rejecter);
  },
  release: function release(conn, value) {
    return this._resolver(value);
  },
  rollback: function rollback(conn, err) {
    var self = this;
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return conn.rollbackAsync().timeout(5000).catch(Promise.TimeoutError, function (e) {
      self._rejecter(e);
    }).then(function () {
      self._rejecter(err);
    });
  },
  acquireConnection: function acquireConnection(config) {
    var t = this;
    return Promise.try(function () {
      return t.client.acquireConnection().completed.then(function (cnx) {
        cnx.isTransaction = true;
        return cnx;
      });
    }).disposer(function (connection) {
      debugTx('%s: releasing connection', t.txid);
      connection.isTransaction = false;
      connection.commitAsync().then(function (err) {
        if (err) {
          this._rejecter(err);
        }
        if (!config.connection) {
          t.client.releaseConnection(connection);
        } else {
          debugTx('%s: not releasing external connection', t.txid);
        }
      });
    });
  }
});

module.exports = Oracle_Transaction;