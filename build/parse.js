var yaml, _;

_ = require('lodash');

_.str = require('underscore.string');

yaml = require('js-yaml');


/**
 * @summary Parse drivelist script output
 * @function
 * @protected
 *
 * @param {String} input - input
 * @returns {Object} parsed drivelist output
 *
 * @example
 * parse '''
 * 	device: /dev/disk1
 * 	description: Macintosh HD
 * 	size: 249.8 GB
 * 	mountpoint: /
 *
 * 	device: /dev/disk2
 * 	description: elementary OS
 * 	size: 15.7 GB
 * 	mountpoint: /Volumes/Elementary
 * '''
 *
 * {
 * 		device: /dev/disk1
 * 		description: Macintosh HD
 * 		size: 249.8 GB
 * 		mountpoint: /
 * 	,
 * 		device: /dev/disk2
 * 		description: elementary OS
 * 		size: 15.7 GB
 * 		mountpoint: /Volumes/Elementary
 * }
 */

module.exports = function(input) {
  if (_.isEmpty(_.str.trim(input))) {
    return {};
  }
  return _.compact(_.map(input.split(/\n\s*\n/), function(device) {
    var result;
    result = yaml.safeLoad(device);
    if (_.isString(result)) {
      return _.object([result], [null]);
    }
    return result;
  }));
};
