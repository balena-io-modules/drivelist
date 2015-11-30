var child_process, os, path, scriptsPath, _;

_ = require('lodash');

_.str = require('underscore.string');

child_process = require('child_process');

path = require('path');

os = require('os');

scriptsPath = path.join(__dirname, '..', 'scripts');

exports.paths = {
  win32: 'win32.bat',
  darwin: path.join(scriptsPath, 'darwin.sh'),
  linux: path.join(scriptsPath, 'linux.sh')
};

exports.run = function(script, callback) {
  return child_process.execFile(script, os.platform() === 'win32' ? {
    cwd: scriptsPath
  } : void 0, function(error, stdout, stderr) {
    if (error != null) {
      return callback(error);
    }
    if (!_.str.isBlank(stderr)) {
      return callback(new Error(stderr));
    }
    return callback(null, stdout);
  });
};
