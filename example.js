var drivelist = require('./build/drivelist');

drivelist.list(function(error, drives) {
	if (error) {
		console.error(error);
		process.exit(1);
	}

	console.log(drives);
});
