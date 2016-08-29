'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _formatter = require('../../formatter');

var _formatter2 = _interopRequireDefault(_formatter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function MSSQL_Formatter(client) {
  _formatter2.default.call(this, client);
}
(0, _inherits2.default)(MSSQL_Formatter, _formatter2.default);

(0, _assign3.default)(MSSQL_Formatter.prototype, {

  // Accepts a string or array of columns to wrap as appropriate.
  columnizeWithPrefix: function columnizeWithPrefix(prefix, target) {
    var columns = typeof target === 'string' ? [target] : target;
    var str = '',
        i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', ';
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  }
});

exports.default = MSSQL_Formatter;
module.exports = exports['default'];