var os, parse, scripts;

os = require('os');

parse = require('./parse');

scripts = require('./scripts');

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
