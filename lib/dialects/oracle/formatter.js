'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _formatter = require('../../formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Oracle_Formatter(client) {
  _formatter2.default.call(this, client);
}
(0, _inherits2.default)(Oracle_Formatter, _formatter2.default);

(0, _assign3.default)(Oracle_Formatter.prototype, {
  alias: function alias(first, second) {
    return first + ' ' + second;
  },
  parameter: function parameter(value, notSetValue) {
    // Returning helper uses always ROWID as string
    if (value instanceof _utils.ReturningHelper && this.client.driver) {
      value = new this.client.driver.OutParam(this.client.driver.OCCISTRING);
    } else if (typeof value === 'boolean') {
      value = value ? 1 : 0;
    }
    return _formatter2.default.prototype.parameter.call(this, value, notSetValue);
  }
});

exports.default = Oracle_Formatter;
module.exports = exports['default'];