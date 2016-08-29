#!/usr/bin/env node
'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _liftoff = require('liftoff');

var _liftoff2 = _interopRequireDefault(_liftoff);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _interpret = require('interpret');

var _interpret2 = _interopRequireDefault(_interpret);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _tildify = require('tildify');

var _tildify2 = _interopRequireDefault(_tildify);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var argv = require('minimist')(process.argv.slice(2));
/* eslint no-console:0 */

var fs = _bluebird2.default.promisifyAll(require('fs'));
var cliPkg = require('../../package');

function exit(text) {
  if (text instanceof Error) {
    _chalk2.default.red(console.error(text.stack));
  } else {
    _chalk2.default.red(console.error(text));
  }
  process.exit(1);
}

function success(text) {
  console.log(text);
  process.exit(0);
}

function checkLocalModule(env) {
  if (!env.modulePath) {
    console.log(_chalk2.default.red('No local knex install found in:'), _chalk2.default.magenta((0, _tildify2.default)(env.cwd)));
    exit('Try running: npm install knex.');
  }
}

function initKnex(env) {

  checkLocalModule(env);

  if (!env.configPath) {
    exit('No knexfile found in this directory. Specify a path with --knexfile');
  }

  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    console.log('Working directory changed to', _chalk2.default.magenta((0, _tildify2.default)(env.cwd)));
  }

  var environment = _commander2.default.env || process.env.NODE_ENV;
  var defaultEnv = 'development';
  var config = require(env.configPath);

  if (!environment && (0, _typeof3.default)(config[defaultEnv]) === 'object') {
    environment = defaultEnv;
  }

  if (environment) {
    console.log('Using environment:', _chalk2.default.magenta(environment));
    config = config[environment] || config;
  }

  if (!config) {
    console.log(_chalk2.default.red('Warning: unable to read knexfile config'));
    process.exit(1);
  }

  if (argv.debug !== undefined) config.debug = argv.debug;
  var knex = require(env.modulePath);
  return knex(config);
}

function invoke(env) {

  var filetypes = ['js', 'coffee', 'eg', 'ls'];
  var pending = null;

  _commander2.default.version(_chalk2.default.blue('Knex CLI version: ', _chalk2.default.green(cliPkg.version)) + '\n' + _chalk2.default.blue('Local Knex version: ', _chalk2.default.green(env.modulePackage.version)) + '\n').option('--debug', 'Run with debugging.').option('--knexfile [path]', 'Specify the knexfile path.').option('--cwd [path]', 'Specify the working directory.').option('--env [name]', 'environment, default: process.env.NODE_ENV || development');

  _commander2.default.command('init').description('        Create a fresh knexfile.').option('-x [' + filetypes.join('|') + ']', 'Specify the knexfile extension (default js)').action(function () {
    var type = (argv.x || 'js').toLowerCase();
    if (filetypes.indexOf(type) === -1) {
      exit('Invalid filetype specified: ' + type);
    }
    if (env.configPath) {
      exit('Error: ' + env.configPath + ' already exists');
    }
    checkLocalModule(env);
    var stubPath = './knexfile.' + type;
    pending = fs.readFileAsync(_path2.default.dirname(env.modulePath) + '/lib/migrate/stub/knexfile-' + type + '.stub').then(function (code) {
      return fs.writeFileAsync(stubPath, code);
    }).then(function () {
      success(_chalk2.default.green('Created ' + stubPath));
    }).catch(exit);
  });

  _commander2.default.command('migrate:make <name>').description('       Create a named migration file.').option('-x [' + filetypes.join('|') + ']', 'Specify the stub extension (default js)').action(function (name) {
    var instance = initKnex(env);
    var ext = (argv.x || env.configPath.split('.').pop()).toLowerCase();
    pending = instance.migrate.make(name, { extension: ext }).then(function (name) {
      success(_chalk2.default.green('Created Migration: ' + name));
    }).catch(exit);
  });

  _commander2.default.command('migrate:latest').description('        Run all migrations that have not yet been run.').action(function () {
    pending = initKnex(env).migrate.latest().spread(function (batchNo, log) {
      if (log.length === 0) {
        success(_chalk2.default.cyan('Already up to date'));
      }
      success(_chalk2.default.green('Batch ' + batchNo + ' run: ' + log.length + ' migrations \n') + _chalk2.default.cyan(log.join('\n')));
    }).catch(exit);
  });

  _commander2.default.command('migrate:rollback').description('        Rollback the last set of migrations performed.').action(function () {
    pending = initKnex(env).migrate.rollback().spread(function (batchNo, log) {
      if (log.length === 0) {
        success(_chalk2.default.cyan('Already at the base migration'));
      }
      success(_chalk2.default.green('Batch ' + batchNo + ' rolled back: ' + log.length + ' migrations \n') + _chalk2.default.cyan(log.join('\n')));
    }).catch(exit);
  });

  _commander2.default.command('migrate:currentVersion').description('       View the current version for the migration.').action(function () {
    pending = initKnex(env).migrate.currentVersion().then(function (version) {
      success(_chalk2.default.green('Current Version: ') + _chalk2.default.blue(version));
    }).catch(exit);
  });

  _commander2.default.command('seed:make <name>').description('       Create a named seed file.').option('-x [' + filetypes.join('|') + ']', 'Specify the stub extension (default js)').action(function (name) {
    var instance = initKnex(env);
    var ext = (argv.x || env.configPath.split('.').pop()).toLowerCase();
    pending = instance.seed.make(name, { extension: ext }).then(function (name) {
      success(_chalk2.default.green('Created seed file: ' + name));
    }).catch(exit);
  });

  _commander2.default.command('seed:run').description('       Run seed files.').action(function () {
    pending = initKnex(env).seed.run().spread(function (log) {
      if (log.length === 0) {
        success(_chalk2.default.cyan('No seed files exist'));
      }
      success(_chalk2.default.green('Ran ' + log.length + ' seed files \n' + _chalk2.default.cyan(log.join('\n'))));
    }).catch(exit);
  });

  _commander2.default.parse(process.argv);

  _bluebird2.default.resolve(pending).then(function () {
    _commander2.default.help();
  });
}

var cli = new _liftoff2.default({
  name: 'knex',
  extensions: _interpret2.default.jsVariants,
  v8flags: require('v8flags')
});

cli.on('require', function (name) {
  console.log('Requiring external module', _chalk2.default.magenta(name));
});

cli.on('requireFail', function (name) {
  console.log(_chalk2.default.red('Failed to load external module'), _chalk2.default.magenta(name));
});

cli.launch({
  cwd: argv.cwd,
  configPath: argv.knexfile,
  require: argv.require,
  completion: argv.completion
}, invoke);