childProcess = require('child_process')
_ = require('lodash')
path = require('path')

exports.list = (callback) ->
	script = path.join(__dirname, '..', 'scripts', 'win_drives.vbs')

	childProcess.exec "cscript #{script} //Nologo", {}, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.isEmpty(stderr)
			return callback(new Error(stderr))

		output = stdout.trim().replace(/\r/, '').split(/\n/g)

		result = _.map output, (row) ->
			driveInfo = row.split('\t')
			driveInfo = _.map driveInfo, (element) ->
				return element.trim()

			size = _.parseInt(driveInfo[3]) / 1e+9 or undefined

			return {
				device: driveInfo[1],
				description: driveInfo[0],
				size: "#{Math.floor(size)} GB" if size?
				mountpoint: driveInfo[2]
			}

		return callback(null, result)

exports.isSystem = (drive, callback) ->

	# Assume \\.\PHYSICALDRIVE0 is always the system disk
	return callback(drive.device.toUpperCase() is '\\\\.\\PHYSICALDRIVE0')
