var childProcess, tableParser, _;

childProcess = require('child_process');

_ = require('lodash');

tableParser = require('table-parser');

exports.list = function(callback) {
  return childProcess.exec('wmic diskdrive get DeviceID, Caption, Size', {}, function(error, stdout, stderr) {
    var result;
    if (error != null) {
      return callback(error);
    }
    if (!_.isEmpty(stderr)) {
      return callback(new Error(stderr));
    }
    result = tableParser.parse(stdout);
    result = _.map(result, function(row) {
      var size;
      size = _.parseInt(row.Size[0]) / 1e+9;
      return {
        device: _.first(row.DeviceID),
        size: "" + (Math.floor(size)) + " GB",
        description: row.Caption.join(' ')
      };
    });
    return callback(null, result);
  });
};
