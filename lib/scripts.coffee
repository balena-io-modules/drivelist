_ = require('lodash')
_.str = require('underscore.string')
child_process = require('child_process')
path = require('path')
os = require('os')

scriptsPath = path.join(__dirname, '..', 'scripts')

exports.paths =
	win32: path.join(scriptsPath, 'win32.bat')
	darwin: path.join(scriptsPath, 'darwin.sh')
	linux: path.join(scriptsPath, 'linux.sh')

exports.run = (script, callback) ->
	child_process.execFile script, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.str.isBlank(stderr)
			return callback(new Error(stderr))

		return callback(null, stdout)
