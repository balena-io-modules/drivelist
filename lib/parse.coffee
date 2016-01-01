_ = require('lodash')
_.str = require('underscore.string')
yaml = require('js-yaml')

###*
# @summary Parse drivelist script output
# @function
# @protected
#
# @param {String} input - input
# @returns {Object} parsed drivelist output
#
# @example
# parse '''
# 	device: /dev/disk1
# 	description: Macintosh HD
# 	size: 249.8 GB
# 	mountpoint: /
#
# 	device: /dev/disk2
# 	description: elementary OS
# 	size: 15.7 GB
# 	mountpoint: /Volumes/Elementary
# '''
#
# {
# 		device: /dev/disk1
# 		description: Macintosh HD
# 		size: 249.8 GB
# 		mountpoint: /
# 	,
# 		device: /dev/disk2
# 		description: elementary OS
# 		size: 15.7 GB
# 		mountpoint: /Volumes/Elementary
# }
###
module.exports = (input) ->
	return {} if _.isEmpty(_.str.trim(input))
	return _.compact _.map input.split(/\n\s*\n/), (device) ->
		result = yaml.safeLoad(device)
		if _.isString(result)
			return _.object([ result ], [ null ])
		return if not result?

		return _.mapValues result, (value, key) ->
			return _.str.rtrim(value, ',') or null
