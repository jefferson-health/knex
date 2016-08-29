'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

exports.default = makeClient;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Ensure the client has fresh objects so we can tack onto
// the prototypes without mutating them globally.
function makeClient(ParentClient) {

  if (typeof ParentClient.prototype === 'undefined') {
    throw new Error('A valid parent client must be passed to makeClient');
  }

  function Client(config) {
    ParentClient.call(this, config);
  }
  (0, _inherits2.default)(Client, ParentClient);

  function Formatter(client) {
    Formatter.super_.call(this, client);
  }
  (0, _inherits2.default)(Formatter, ParentClient.prototype.Formatter);

  function QueryBuilder(client) {
    QueryBuilder.super_.call(this, client);
  }
  (0, _inherits2.default)(QueryBuilder, ParentClient.prototype.QueryBuilder);

  function SchemaBuilder(client) {
    SchemaBuilder.super_.call(this, client);
  }
  (0, _inherits2.default)(SchemaBuilder, ParentClient.prototype.SchemaBuilder);

  function SchemaCompiler(client, builder) {
    SchemaCompiler.super_.call(this, client, builder);
  }
  (0, _inherits2.default)(SchemaCompiler, ParentClient.prototype.SchemaCompiler);

  function TableBuilder(client, method, tableName, fn) {
    TableBuilder.super_.call(this, client, method, tableName, fn);
  }
  (0, _inherits2.default)(TableBuilder, ParentClient.prototype.TableBuilder);

  function TableCompiler(client, tableBuilder) {
    TableCompiler.super_.call(this, client, tableBuilder);
  }
  (0, _inherits2.default)(TableCompiler, ParentClient.prototype.TableCompiler);

  function ColumnBuilder(client, tableBuilder, type, args) {
    ColumnBuilder.super_.call(this, client, tableBuilder, type, args);
  }
  (0, _inherits2.default)(ColumnBuilder, ParentClient.prototype.ColumnBuilder);

  function ColumnCompiler(client, tableCompiler, columnBuilder) {
    ColumnCompiler.super_.call(this, client, tableCompiler, columnBuilder);
  }
  (0, _inherits2.default)(ColumnCompiler, ParentClient.prototype.ColumnCompiler);

  (0, _assign3.default)(Client.prototype, {
    Formatter: Formatter,
    QueryBuilder: QueryBuilder,
    SchemaBuilder: SchemaBuilder,
    SchemaCompiler: SchemaCompiler,
    TableBuilder: TableBuilder,
    TableCompiler: TableCompiler,
    ColumnBuilder: ColumnBuilder,
    ColumnCompiler: ColumnCompiler
  });

  return Client;
}
module.exports = exports['default'];