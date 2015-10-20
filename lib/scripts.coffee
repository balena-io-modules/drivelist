_ = require('lodash')
_.str = require('underscore.string')
child_process = require('child_process')
path = require('path')

scriptsPath = path.join(__dirname, '..', 'scripts')

exports.paths =
	win32: "cscript \"#{path.join(scriptsPath, 'win32.vbs')}\" //Nologo"
	darwin: path.join(scriptsPath, 'darwin.sh')
	linux: path.join(scriptsPath, 'linux.sh')

exports.run = (script, callback) ->
	child_process.exec script, (error, stdout, stderr) ->
		return callback(error) if error?

		if not _.str.isBlank(stderr)
			return callback(new Error(stderr))

		return callback(null, stdout)
