var childProcess, path, _;

childProcess = require('child_process');

path = require('path');

_ = require('lodash');

exports.list = function(callback) {
  var script;
  script = path.join(__dirname, '..', 'scripts', 'drives.sh');
  return childProcess.exec(script, {}, function(error, stdout, stderr) {
    var output, result;
    if (error != null) {
      return callback(error);
    }
    if (!_.isEmpty(stderr)) {
      return callback(new Error(stderr));
    }
    output = stdout.trim().replace(/\r/, '').split(/\n/g);
    result = _.map(output, function(row) {
      var description, device, mountpoint, size, _ref;
      _ref = row.split('\t'), device = _ref[0], description = _ref[1], mountpoint = _ref[2], size = _ref[3];
      return {
        device: device,
        description: description,
        mountpoint: mountpoint,
        size: size
      };
    });
    return callback(null, result);
  });
};

exports.isSystem = function(drive, callback) {
  if (drive.device === '/dev/disk0') {
    return callback(true);
  }
  return callback(drive.mountpoint === '/');
};
