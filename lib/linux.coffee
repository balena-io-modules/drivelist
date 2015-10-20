childProcess = require('child_process')
path = require('path')
_ = require('lodash')
tableParser = require('table-parser')
parse = require('./parse')

exports.list = (callback) ->
	script = path.join(__dirname, '..', 'scripts', 'linux.sh')

	childProcess.exec script, {}, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.isEmpty(stderr)
			return callback(new Error(stderr))

		return callback(null, parse(stdout))

# We determine if a drive is a system drive
# by checking the removeable flag.
# There might be a better way in GNU/Linux systems.
exports.isSystem = (drive, callback) ->
	childProcess.exec "lsblk #{drive.device} -d", {}, (error, stdout, stderr) ->
		return callback(false) if error?

		if not _.isEmpty(stderr)
			return callback(false)

		result = tableParser.parse(stdout)

		# In some cases tableParser puts the value of RM
		# as the second value of MAJ:MIN
		rmFlag = result[0].RM?[0] or result[0]['MAJ:MIN'][1]

		return callback(rmFlag isnt '1')
