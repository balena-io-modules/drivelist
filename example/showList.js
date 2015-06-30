var drivelist = require('../build/drivelist');

drivelist.list(function(error, disks) {
		if (error) throw error;
		console.log(disks);
});
