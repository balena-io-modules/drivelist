childProcess = require('child_process')
_ = require('lodash')
tableParser = require('table-parser')

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

		result = _.map result, (row) ->

			device = row.pop()
			sizeMeasure = row.pop()
			size = row.pop()

			return {
				device: "/dev/#{device}"
				size: "#{size} #{sizeMeasure}"
				description: row.join(' ')
			}

		return callback(null, result)

exports.isSystem = (drive, callback) ->

	childProcess.exec "diskutil info #{drive.device}", {}, (error, stdout, stderr) ->
		return callback(false) if error?

		if not _.isEmpty(stderr)
			return callback(false)

		# Assume true for /dev/disk0
		return callback(true) if drive.device is '/dev/disk0'

		result = tableParser.parse(stdout)
		mountPoint = _.findWhere(result, Device: [ 'Mount' ])?['Identifier:'][1]
		return callback(mountPoint is '/')
