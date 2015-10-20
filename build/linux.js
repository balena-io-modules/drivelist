var childProcess, parse, path, tableParser, _;

childProcess = require('child_process');

path = require('path');

_ = require('lodash');

tableParser = require('table-parser');

parse = require('./parse');

exports.list = function(callback) {
  var script;
  script = path.join(__dirname, '..', 'scripts', 'linux.sh');
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
  return childProcess.exec("lsblk " + drive.device + " -d", {}, function(error, stdout, stderr) {
    var result, rmFlag, _ref;
    if (error != null) {
      return callback(false);
    }
    if (!_.isEmpty(stderr)) {
      return callback(false);
    }
    result = tableParser.parse(stdout);
    rmFlag = ((_ref = result[0].RM) != null ? _ref[0] : void 0) || result[0]['MAJ:MIN'][1];
    return callback(rmFlag !== '1');
  });
};
