childProcess = require('child_process')
_ = require('lodash')
tableParser = require('table-parser')

exports.win32 = (drive, callback) ->

	# Assume \\.\PHYSICALDRIVE0 is always the system disk
	return callback(drive.device.toUpperCase() is '\\\\.\\PHYSICALDRIVE0')

# We determine if a drive is a system drive
# by checking the removeable flag.
# There might be a better way in GNU/Linux systems.
exports.linux = (drive, callback) ->
	childProcess.exec "lsblk #{drive.device} -d", {}, (error, stdout, stderr) ->
		return callback(false) if error?

		if not _.isEmpty(stderr)
			return callback(false)

		result = tableParser.parse(stdout)

		# In some cases tableParser puts the value of RM
		# as the second value of MAJ:MIN
		rmFlag = result[0].RM?[0] or result[0]['MAJ:MIN'][1]

		return callback(rmFlag isnt '1')

exports.darwin = (drive, callback) ->

	# Assume true for /dev/disk0
	return callback(true) if drive.device is '/dev/disk0'

	return callback(drive.mountpoint is '/')
