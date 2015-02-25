var getOSModule, linux, os, osx, win32;

os = require('os');

win32 = require('./win32');

osx = require('./osx');

linux = require('./linux');

getOSModule = function() {
  var operatingSystem;
  operatingSystem = os.platform();
  switch (operatingSystem) {
    case 'darwin':
      return osx;
    case 'win32':
      return win32;
    case 'linux':
      return linux;
    default:
      throw new Error("Your OS is not supported by this module: " + operatingSystem);
  }
};

exports.list = function(callback) {
  return getOSModule().list(callback);
};

exports.isSystem = function(drive, callback) {
  return getOSModule().isSystem(drive, callback);
};
