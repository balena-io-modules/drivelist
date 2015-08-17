drivelist
---------

[![npm version](https://badge.fury.io/js/drivelist.svg)](http://badge.fury.io/js/drivelist)
[![dependencies](https://david-dm.org/resin-io/drivelist.png)](https://david-dm.org/resin-io/drivelist.png)
[![Build Status](https://travis-ci.org/resin-io/drivelist.svg?branch=master)](https://travis-ci.org/resin-io/drivelist)
[![Build status](https://ci.appveyor.com/api/projects/status/63x4eai5c8qiyvwh?svg=true)](https://ci.appveyor.com/project/jviotti/drivelist)

List all connected drives in your computer, in all major operating systems.

Notice that this module **does not require** admin privileges to get the drives in any operating system supported.

Supports:

- Windows.
- GNU/Linux distributions that include [util-linux](https://github.com/karelzak/util-linux).
- Mac OS X.

Examples (the output will vary depending on your machine):

```coffee
var drivelist = require('drivelist');

drivelist.list(function(error, disks) {
		if (error) throw error;
		console.log(disks);
});

```

***

Mac OS X:

```sh
[
	{
		device: '/dev/disk0',
		description: 'GUID_partition_scheme',
		size: '*750.2 GB'
		mountpoint: '/'
	},
	{
		device: '/dev/disk1',
		description: 'Apple_HFS Macintosh HD',
		size: '*748.9 GB'
	}
]
```

***

GNU/Linux

```sh
[
	{
		device: '/dev/sda',
		description: 'WDC WD10JPVX-75J',
		size: '931.5G',
		mountpoint: '/'
	},
	{
		device: '/dev/sr0',
		description: 'DVD+-RW GU90N',
		size: '1024M'
	}
]
```

***

Windows

```sh
[
	{
		device: '\\\\.\\PHYSICALDRIVE0',
		description: 'WDC WD10JPVX-75JC3T0',
		size: '1000 GB'
		mountpoint: 'C:'
	},
	{
		device: '\\\\.\\PHYSICALDRIVE1',
		description: 'Generic STORAGE DEVICE USB Device',
		size: '15 GB'
		mountpoint: 'D:'
	}
]
```

Installation
------------

Install `drivelist` by running:

```sh
$ npm install --save drivelist
```

Documentation
-------------

### drivelist.list(callback)

List available drives.

The function will throw an error if you attempt to call it from an unsupported operating system.

#### callback(error, drives)

- `error` is a possible error.
- `drives` is an array of objects describing the drives found.

Predicates
----------

### drivelist.isSystem(drive, callback)

Determines if a drive returned by `drivelist.list()` is a system drive.

The callbacks gets passed a single boolean value.

Tests
-----

Run the test suite by doing:

```sh
$ gulp test
```

Contribute
----------

We're looking forward to support more operating systems. Please raise an issue or even better, send a PR to increase support!

- Issue Tracker: [github.com/resin-io/drivelist/issues](https://github.com/resin-io/drivelist/issues)
- Source Code: [github.com/resin-io/drivelist](https://github.com/resin-io/drivelist)

Before submitting a PR, please make sure that you include tests, and that [coffeelint](http://www.coffeelint.org/) runs without any warning:

```sh
$ gulp lint
```

Support
-------

If you're having any problem, please [raise an issue](https://github.com/resin-io/drivelist/issues/new) on GitHub.

ChangeLog
---------

### v1.3.0

- Add `mountpoint` attribute to drives.

### v1.2.2

- Fix issue where a removable drive was detected as a system drive in Linux.

### v1.2.1

Fix win32 issue where DeviceID gets part of the device description.

### v1.2.0

- Implement isSystem predicate.

### v1.1.2

- Prevent empty lsblk model crash the module. Return `undefined` description instead.

### v1.1.1

- Prevent empty wmic size crash the module. Return `undefined` size instead.

### v1.1.0

- Return non supported OS error to the callback instead of just throwing it.

License
-------

The project is licensed under the MIT license.
