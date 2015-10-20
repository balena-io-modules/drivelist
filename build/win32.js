var childProcess, parse, path, _;

childProcess = require('child_process');

_ = require('lodash');

path = require('path');

parse = require('./parse');

exports.list = function(callback) {
  var script;
  script = path.join(__dirname, '..', 'scripts', 'win32.vbs');
  return childProcess.exec("cscript \"" + script + "\" //Nologo", {}, function(error, stdout, stderr) {
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
  return callback(drive.device.toUpperCase() === '\\\\.\\PHYSICALDRIVE0');
};
