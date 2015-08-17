var childProcess, path, _;

childProcess = require('child_process');

_ = require('lodash');

path = require('path');

exports.list = function(callback) {
  var script;
  script = path.join(__dirname, '..', 'scripts', 'win_drives.vbs');
  return childProcess.exec("cscript " + script + " //Nologo", {}, function(error, stdout, stderr) {
    var output, result;
    if (error != null) {
      return callback(error);
    }
    if (!_.isEmpty(stderr)) {
      return callback(new Error(stderr));
    }
    output = stdout.trim().replace(/\r/, '').split(/\n/g);
    result = _.map(output, function(row) {
      var driveInfo, size;
      driveInfo = row.split('\t');
      driveInfo = _.map(driveInfo, function(element) {
        return element.trim();
      });
      size = _.parseInt(driveInfo[3]) / 1e+9 || void 0;
      return {
        device: driveInfo[1],
        description: driveInfo[0],
        size: size != null ? "" + (Math.floor(size)) + " GB" : void 0,
        mountpoint: driveInfo[2]
      };
    });
    return callback(null, result);
  });
};

exports.isSystem = function(drive, callback) {
  return callback(drive.device.toUpperCase() === '\\\\.\\PHYSICALDRIVE0');
};
