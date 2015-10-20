var os, parse, scripts, system;

os = require('os');

parse = require('./parse');

scripts = require('./scripts');

system = require('./system');

exports.list = function(callback) {
  var operatingSystem, script;
  operatingSystem = os.platform();
  script = scripts.paths[operatingSystem];
  if (script == null) {
    throw new Error("Your OS is not supported by this module: " + operatingSystem);
  }
  return scripts.run(script, function(error, output) {
    if (error != null) {
      return callback(error);
    }
    return callback(null, parse(output));
  });
};

exports.isSystem = function(drive, callback) {
  var isSystem, operatingSystem;
  operatingSystem = os.platform();
  isSystem = system[operatingSystem];
  if (isSystem == null) {
    throw new Error("Your OS is not supported by this module: " + operatingSystem);
  }
  return isSystem(drive, callback);
};
