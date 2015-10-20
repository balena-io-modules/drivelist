childProcess = require('child_process')
path = require('path')
_ = require('lodash')
parse = require('./parse')

exports.list = (callback) ->
	script = path.join(__dirname, '..', 'scripts', 'darwin.sh')

	childProcess.exec script, {}, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.isEmpty(stderr)
			return callback(new Error(stderr))

		return callback(null, parse(stdout))

exports.isSystem = (drive, callback) ->

	# Assume true for /dev/disk0
	return callback(true) if drive.device is '/dev/disk0'

	return callback(drive.mountpoint is '/')
