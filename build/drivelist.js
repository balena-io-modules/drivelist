var linux, os, osx, win32;

os = require('os');

win32 = require('./win32');

osx = require('./osx');

linux = require('./linux');

exports.list = function(callback) {
  var error, operatingSystem;
  operatingSystem = os.platform();
  switch (operatingSystem) {
    case 'darwin':
      return osx.list(callback);
    case 'win32':
      return win32.list(callback);
    case 'linux':
      return linux.list(callback);
    default:
      error = new Error("Your OS is not supported by this module: " + operatingSystem);
      return callback(error);
  }
};
