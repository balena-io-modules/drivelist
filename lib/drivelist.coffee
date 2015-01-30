os = require('os')

win32 = require('./win32')
osx = require('./osx')
linux = require('./linux')

exports.list = (callback) ->
	operatingSystem = os.platform()

	switch operatingSystem
		when 'darwin' then osx.list(callback)
		when 'win32' then win32.list(callback)
		when 'linux' then linux.list(callback)
		else
			error = new Error("Your OS is not supported by this module: #{operatingSystem}")
			return callback(error)
