'use strict';

exports.__esModule = true;

// Use this shim module rather than "bluebird/js/main/promise"
// when bundling for client
exports.default = function () {
  return require('bluebird');
};

module.exports = exports['default'];