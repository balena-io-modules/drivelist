childProcess = require('child_process')
_ = require('lodash')
tableParser = require('table-parser')

exports.list = (callback) ->
	childProcess.exec 'wmic diskdrive get DeviceID, Caption, Size', {}, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.isEmpty(stderr)
			return callback(new Error(stderr))

		result = tableParser.parse(stdout)

		result = _.map result, (row) ->
			size = _.parseInt(row.Size[0]) / 1e+9

			return {
				device: _.first(row.DeviceID)
				size: "#{Math.floor(size)} GB"
				description: row.Caption.join(' ')
			}

		return callback(null, result)
