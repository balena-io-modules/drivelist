var async, childProcess, getMountPoint, tableParser, _;

childProcess = require('child_process');

async = require('async');

_ = require('lodash');

tableParser = require('table-parser');

getMountPoint = function(device, callback) {
  return childProcess.exec("grep \"^" + device + "\" /proc/mounts | cut -d ' ' -f 2", {}, function(error, stdout, stderr) {
    if (error != null) {
      return callback(error);
    }
    if (!_.isEmpty(stderr)) {
      return callback(new Error(stderr));
    }
    return callback(null, stdout);
  });
};

exports.list = function(callback) {
  return childProcess.exec('lsblk -d --output NAME,MODEL,SIZE', {}, function(error, stdout, stderr) {
    var result;
    if (error != null) {
      return callback(error);
    }
    if (!_.isEmpty(stderr)) {
      return callback(new Error(stderr));
    }
    result = tableParser.parse(stdout);
    return async.map(result, function(row, callback) {
      var device;
      device = "/dev/" + (_.first(row.NAME));
      return getMountPoint(device, function(error, mountPoint) {
        var _ref;
        if (error != null) {
          return callback(error);
        }
        return callback(null, {
          device: device,
          description: (_ref = row.MODEL) != null ? _ref.join(' ') : void 0,
          size: _.first(row.SIZE).replace(/,/g, '.'),
          mountpoint: mountPoint || void 0
        });
      });
    }, callback);
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
