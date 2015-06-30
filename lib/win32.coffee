childProcess = require('child_process')
_ = require('lodash')
tableParser = require('table-parser')

exports.list = (callback) ->
	childProcess.exec 'wmic logicaldisk get DeviceID, Size, VolumeName', {}, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.isEmpty(stderr)
			return callback(new Error(stderr))

		result = tableParser.parse(stdout)

		result = _.map result, (row) ->
			size = _.parseInt(row.Size?[0]) / 1e+9 or undefined

			if row.DeviceID.length > 1
				row.Caption = row.VolumeName.concat(_.initial(row.VolumeName))

			return {
				device: _.first(row.DeviceID)
				description: row.VolumeName.join(' ')
				size: "#{Math.floor(size)} GB" if size?
			}

		return callback(null, result)

exports.isSystem = (drive, callback) ->

	# Assume C: is always the system disk
	return callback(drive.device.toUpperCase() is 'C:')
