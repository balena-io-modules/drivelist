childProcess = require('child_process')
_ = require('lodash')
tableParser = require('table-parser')

exports.list = (callback) ->
	childProcess.exec 'lsblk -d --output NAME,MODEL,SIZE', {}, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.isEmpty(stderr)
			return callback(new Error(stderr))

		result = tableParser.parse(stdout)

		result = _.map result, (row) ->
			return {
				device: "/dev/#{_.first(row.NAME)}"
				description: row.MODEL?.join(' ')
				size: _.first(row.SIZE).replace(/,/g, '.')
			}

		return callback(null, result)

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
