var childProcess, tableParser, _;

childProcess = require('child_process');

_ = require('lodash');

tableParser = require('table-parser');

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
    result = _.map(result, function(row) {
      var _ref;
      return {
        device: "/dev/" + (_.first(row.NAME)),
        description: (_ref = row.MODEL) != null ? _ref.join(' ') : void 0,
        size: _.first(row.SIZE).replace(/,/g, '.')
      };
    });
    return callback(null, result);
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
