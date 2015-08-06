var async, childProcess, getMountPoint, path, tableParser, _;

childProcess = require('child_process');

path = require('path');

async = require('async');

_ = require('lodash');

tableParser = require('table-parser');

getMountPoint = function(device, callback) {
  return childProcess.exec("diskutil info " + device, {}, function(error, stdout, stderr) {
    var mount, mountPoint, result;
    if (error != null) {
      return callback(error);
    }
    if (!_.isEmpty(stderr)) {
      return callback(new Error(stderr));
    }
    result = tableParser.parse(stdout);
    mount = _.findWhere(result, {
      Device: ['Mount']
    });
    mountPoint = (mount != null ? mount['Identifier:'][1] : void 0) || (mount != null ? mount[path.basename(device)][0] : void 0);
    return callback(null, mountPoint);
  });
};

exports.list = function(callback) {
  return childProcess.exec('diskutil list', {}, function(error, stdout, stderr) {
    var result;
    if (error != null) {
      return callback(error);
    }
    if (!_.isEmpty(stderr)) {
      return callback(new Error(stderr));
    }
    result = tableParser.parse(stdout);
    result = _.map(result, function(row) {
      return _.compact(_.flatten(_.values(row)));
    });
    result = _.filter(result, function(row) {
      return row[0] === '0:';
    });
    result = _.map(result, function(row) {
      return _.rest(row);
    });
    return async.map(result, function(row, callback) {
      var device, size, sizeMeasure;
      device = "/dev/" + (row.pop());
      sizeMeasure = row.pop();
      size = row.pop();
      return getMountPoint(device, function(error, mountPoint) {
        if (error != null) {
          return callback(error);
        }
        return callback(null, {
          device: device,
          size: "" + size + " " + sizeMeasure,
          description: row.join(' '),
          mountpoint: mountPoint
        });
      });
    }, callback);
  });
};

exports.isSystem = function(drive, callback) {
  return getMountPoint(drive.device, function(error, mountPoint) {
    if (error != null) {
      return callback(false);
    }
    if (drive.device === '/dev/disk0') {
      return callback(true);
    }
    return callback(mountPoint === '/');
  });
};
