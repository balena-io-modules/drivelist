var childProcess, tableParser, _;

childProcess = require('child_process');

_ = require('lodash');

tableParser = require('table-parser');

exports.win32 = function(drive, callback) {
  return callback(drive.device.toUpperCase() === '\\\\.\\PHYSICALDRIVE0');
};

exports.linux = function(drive, callback) {
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

exports.darwin = function(drive, callback) {
  if (drive.device === '/dev/disk0') {
    return callback(true);
  }
  return callback(drive.mountpoint === '/');
};
