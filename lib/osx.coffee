childProcess = require('child_process')
path = require('path')
async = require('async')
_ = require('lodash')
tableParser = require('table-parser')

getMountPoint = (device, callback) ->
	childProcess.exec "diskutil info #{device}", {}, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.isEmpty(stderr)
			return callback(new Error(stderr))

		result = tableParser.parse(stdout)
		mount = _.findWhere(result, Device: [ 'Mount' ])
		mountPoint = mount?['Identifier:'][1] or mount?[path.basename(device)][0]
		return callback(null, mountPoint)

exports.list = (callback) ->
	childProcess.exec 'diskutil list', {}, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.isEmpty(stderr)
			return callback(new Error(stderr))

		result = tableParser.parse(stdout)

		result = _.map result, (row) ->
			return _.compact _.flatten _.values(row)

		result = _.filter result, (row) ->
			return row[0] is '0:'

		result = _.map result, (row) ->
			return _.rest(row)

		async.map result, (row, callback) ->
			device = "/dev/#{row.pop()}"
			sizeMeasure = row.pop()
			size = row.pop()

			getMountPoint device, (error, mountPoint) ->
				return callback(error) if error?
				return callback null,
					device: device
					size: "#{size} #{sizeMeasure}"
					description: row.join(' ')
					mountpoint: mountPoint
		, callback

exports.isSystem = (drive, callback) ->

	getMountPoint drive.device, (error, mountPoint) ->
		return callback(false) if error?

		# Assume true for /dev/disk0
		return callback(true) if drive.device is '/dev/disk0'

		return callback(mountPoint is '/')
