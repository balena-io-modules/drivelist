os = require('os')
parse = require('./parse')
scripts = require('./scripts')
system = require('./system')

exports.list = (callback) ->
	operatingSystem = os.platform()
	script = scripts.paths[operatingSystem]

	if not script?
		throw new Error("Your OS is not supported by this module: #{operatingSystem}")

	scripts.run script, (error, output) ->
		return callback(error) if error?
		return callback(null, parse(output))

exports.isSystem = (drive, callback) ->
	operatingSystem = os.platform()
	isSystem = system[operatingSystem]

	if not isSystem?
		throw new Error("Your OS is not supported by this module: #{operatingSystem}")

	isSystem(drive, callback)
