// noinspection Eslint
'use strict';

const c = require('chalk');
const gulpUtilLog = require('fancy-log');
const gulpUtilPluginError = require('plugin-error');
const map = require('map-stream');

// Consts
const PLUGIN_NAME = 'gulp-flake8';

exports.fancyReporter = result => {
  const cwd = process.cwd();
  let filenamePrevious = '';
  let filenamePrint = '';
  let filenameLength = 0;
  result.flake8.errorList.forEach(error => {
    if (filenamePrevious !== error.filename) {
      filenamePrevious = error.filename;
      filenamePrint = filenamePrevious.replace(`${cwd}/`, '');
      filenameLength = filenamePrint.length;
    } else {
      filenamePrint = new Array(filenameLength + 1).join(' ');
    }
    const msg = `${c.cyan(filenamePrint)} ` +
                `${c.magenta(`${error.row}:${error.column}`)} ` +
                `${c.red(error.reason)}`;
    gulpUtilLog(msg);
  });
};

exports.originalReporter = result => {
  const cwd = process.cwd();
  result.flake8.errorList.forEach(error => {
    const filenamePrint = error.filename.replace(`${cwd}`, '.');

    const msg = `${filenamePrint} ${error.row}:${error.column}: ${error.reason}`;
    gulpUtilLog(msg);
  });
};

/**
 * Maps flake8 result objects through the given reporter if success is false.
 * @param reporter A reporter function that takes a file and reports
 *    on the flake8 object.
 *    Optional, defaults to defaultReporter.
 */
exports.reporter = paramReporter => {
  let reporter = paramReporter;
  if (!reporter || reporter === 'default' || reporter === 'original') {
    reporter = exports.originalReporter;
  }

  if (reporter === 'fancy') {
    reporter = exports.fancyReporter;
  }

  if (typeof reporter === 'undefined') {
    throw new gulpUtilPluginError(PLUGIN_NAME, `Invalid reporter ${reporter}`);
  }

  return map((result, cb) => {
    // Only report if Flake8 was run and errors were found
    let error;
    if (result.flake8 && !result.flake8.success) {
      error = reporter(result);
    }

    return cb(error, result);
  });
};
