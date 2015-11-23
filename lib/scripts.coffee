_ = require('lodash')
_.str = require('underscore.string')
child_process = require('child_process')
path = require('path')

scriptsPath = path.join(__dirname, '..', 'scripts')

exports.paths =

	# Passing the full patch to the .bat file to
	# execFile doesn't seem to work.
	# Passing just the file name with the correct `cwd`
	# do work for some reason.
	win32: 'win32.bat',

	darwin: path.join(scriptsPath, 'darwin.sh')
	linux: path.join(scriptsPath, 'linux.sh')

exports.run = (script, callback) ->
	child_process.execFile script,

		# Needed for execFile to run .bat files
		cwd: scriptsPath

	, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.str.isBlank(stderr)
			return callback(new Error(stderr))

		return callback(null, stdout)
