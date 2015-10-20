childProcess = require('child_process')
_ = require('lodash')
path = require('path')
parse = require('./parse')

exports.list = (callback) ->
	script = path.join(__dirname, '..', 'scripts', 'win_drives.vbs')

	childProcess.exec "cscript \"#{script}\" //Nologo", {}, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.isEmpty(stderr)
			return callback(new Error(stderr))

		return callback(null, parse(stdout))

exports.isSystem = (drive, callback) ->

	# Assume \\.\PHYSICALDRIVE0 is always the system disk
	return callback(drive.device.toUpperCase() is '\\\\.\\PHYSICALDRIVE0')
