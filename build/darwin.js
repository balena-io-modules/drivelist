var childProcess, parse, path, _;

childProcess = require('child_process');

path = require('path');

_ = require('lodash');

parse = require('./parse');

exports.list = function(callback) {
  var script;
  script = path.join(__dirname, '..', 'scripts', 'darwin.sh');
  return childProcess.exec(script, {}, function(error, stdout, stderr) {
    if (error != null) {
      return callback(error);
    }
    if (!_.isEmpty(stderr)) {
      return callback(new Error(stderr));
    }
    return callback(null, parse(stdout));
  });
};

exports.isSystem = function(drive, callback) {
  if (drive.device === '/dev/disk0') {
    return callback(true);
  }
  return callback(drive.mountpoint === '/');
};
