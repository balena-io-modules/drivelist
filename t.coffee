drivelist = require('./lib/drivelist')

drivelist.list (error, drives) ->
	throw error if error?
	console.log(drives)
