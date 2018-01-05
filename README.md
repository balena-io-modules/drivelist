<!-- Make sure you edit doc/README.hbs rather than README.md because the latter is auto-generated -->

drivelist
=========

> List all connected drives in your computer, in all major operating systems.

[![Current Release](https://img.shields.io/npm/v/drivelist.svg?style=flat-square)](https://npmjs.com/package/drivelist)
[![License](https://img.shields.io/npm/l/drivelist.svg?style=flat-square)](https://npmjs.com/package/drivelist)
[![Downloads](https://img.shields.io/npm/dm/drivelist.svg?style=flat-square)](https://npmjs.com/package/drivelist)
[![Travis CI status](https://img.shields.io/travis/resin-io-modules/drivelist/master.svg?style=flat-square&label=linux)](https://travis-ci.org/resin-io-modules/drivelist/branches)
[![AppVeyor status](https://img.shields.io/appveyor/ci/resin-io/drivelist/master.svg?style=flat-square&label=windows)](https://ci.appveyor.com/project/resin-io/drivelist/branch/master)
[![Dependency status](https://img.shields.io/david/resin-io-modules/drivelist.svg?style=flat-square)](https://david-dm.org/resin-io-modules/drivelist)
[![Gitter Chat](https://img.shields.io/gitter/room/resin-io/etcher.svg?style=flat-square)](https://gitter.im/resin-io/etcher)

Notice that this module **does not require** admin privileges to get the drives in any supported operating system.

Supports:

- Windows.
- GNU/Linux distributions that include [util-linux](https://github.com/karelzak/util-linux) and [udev](https://wiki.archlinux.org/index.php/udev).
- Mac OS X.

The `drivelist` core consists of a set of scripts built with technologies that
are available by default on the target operating systems (like Bash, VBScript,
etc). Each of these scripts attempts to get information about the available
drives (and metadata related to them), using any methods the target platform
provides, like a combination of `diskutil`, `/proc/mounts`, etc. You can find
these scripts in the `scripts/` directory.

The scripts are then expected to print to `stdout` all the drive information
they have gathered in a predefined way, based on the [YAML][yaml] language. The
scripts are expected to output a set of blocks (separated by blank lines), each
representing a drive with a set of key/value pairs. The exact keys that we
expect are constantly changing while we keep improving this module, but you can
see what the currently expected keys are by running the platform script that
corresponds to your operating system.

This is how the raw output looks on my MacBook Pro at the time of this writing:

```sh
$ ./scripts/darwin.sh
enumerator: diskutil
busType: UNKNOWN
busVersion: "0.0"
device: /dev/disk0
raw: /dev/rdisk0
description: "APPLE SSD TS128E"
error: null
size: 121332826112
blockSize: null
logicalBlockSize: null
mountpoints: []
isReadOnly: False
isSystem: True
isVirtual: null
isRemovable: null
isCard: null
isSCSI: null
isUSB: null
isUAS: null

enumerator: diskutil
busType: UNKNOWN
busVersion: "0.0"
device: /dev/disk2
raw: /dev/rdisk2
description: "SD Card Reader"
error: null
size: 31104958464
blockSize: null
logicalBlockSize: null
mountpoints:
  - path: "/Volumes/Patchwork"
isReadOnly: False
isSystem: False
isVirtual: null
isRemovable: null
isCard: null
isSCSI: null
isUSB: null
isUAS: null
```

Because of the simplicity of this module's design, supporting a new operating
system simply means adding a new script to `scripts/` that gathers drive data
and outputs something similar to the above example. The challenge with this is
that we must ensure all the platform scripts print consistent output.

When the user executes `drivelist.list()`, the module checks the operating
system of the client, and executes the corresponding drive scanning script as a
child process. It then parses the [YAML][yaml] output of the script as an array
of objects, and returns that to the user.

Examples (the output will vary depending on your machine):

```js
const drivelist = require('drivelist');

drivelist.list((error, drives) => {
  if (error) {
    throw error;
  }

  console.log(drives);
});
```

***

Mac OS X:

```sh
[{
  enumerator: 'diskutil',
  busType: 'UNKNOWN',
  busVersion: '0.0',
  device: '/dev/disk0',
  raw: '/dev/rdisk0',
  description: 'APPLE SSD TS128E',
  error: null,
  size: 121332826112,
  blockSize: null,
  logicalBlockSize: null,
  mountpoints: [],
  isReadOnly: false,
  isSystem: true,
  isVirtual: null,
  isRemovable: null,
  isCard: null,
  isSCSI: null,
  isUSB: null,
  isUAS: null
}, {
  enumerator: 'diskutil',
  busType: 'UNKNOWN',
  busVersion: '0.0',
  device: '/dev/disk1',
  raw: '/dev/rdisk1',
  description: 'APPLE SSD TS128E',
  error: null,
  size: 120473067520,
  blockSize: null,
  logicalBlockSize: null,
  mountpoints: [
    { path: '/' },
    { path: '/private/var/vm' }
  ],
  isReadOnly: false,
  isSystem: true,
  isVirtual: null,
  isRemovable: null,
  isCard: null,
  isSCSI: null,
  isUSB: null,
  isUAS: null
}, {
  enumerator: 'diskutil',
  busType: 'UNKNOWN',
  busVersion: '0.0',
  device: '/dev/disk2',
  raw: '/dev/rdisk2',
  description: 'SD Card Reader',
  error: null,
  size: 31104958464,
  blockSize: null,
  logicalBlockSize: null,
  mountpoints: [
    { path: '/Volumes/Patchwork' }
  ],
  isReadOnly: false,
  isSystem: false,
  isVirtual: null,
  isRemovable: null,
  isCard: null,
  isSCSI: null,
  isUSB: null,
  isUAS: null
}]

```

***

GNU/Linux

```sh
[{
  enumerator: 'lsblk',
  busType: 'UNKNOWN',
  busVersion: '0.0',
  device: '/dev/sdb',
  raw: '/dev/sdb',
  description: 'Storage Device',
  error: null,
  size: 31914983424,
  blockSize: null,
  logicalBlockSize: null,
  mountpoints: [{
    path: '/media/jonas/Etcher 1.2.0'
  }],
  isReadOnly: false,
  isSystem: false,
  isVirtual: null,
  isRemovable: null,
  isCard: null,
  isSCSI: null,
  isUSB: null,
  isUAS: null
}, {
  enumerator: 'lsblk',
  busType: 'UNKNOWN',
  busVersion: '0.0',
  device: '/dev/sda',
  raw: '/dev/sda',
  description: 'Samsung SSD 850',
  error: null,
  size: 120034123776,
  blockSize: null,
  logicalBlockSize: null,
  mountpoints: [{
    path: '/'
  }, {
    path: '/boot/efi'
  }],
  isReadOnly: false,
  isSystem: true,
  isVirtual: null,
  isRemovable: null,
  isCard: null,
  isSCSI: null,
  isUSB: null,
  isUAS: null
}]
```

***

Windows

```sh
[{
  enumerator: 'SCSI',
  busType: 'SATA',
  busVersion: '2.0',
  device: '\\\\?\\scsi#disk&ven_wdc&prod_wd1600bevs-07rst#4&5a60d67&0&000000#{53f56307-b6bf-11d0-94f2-00a0c91efb8b}',
  raw: '\\\\.\\PhysicalDrive0',
  description: 'WDC WD1600BEVS-07RST0',
  error: null,
  size: 160041885696,
  blockSize: 512,
  logicalBlockSize: 512,
  mountpoints: [{
    path: 'D:\\'
  }],
  isReadOnly: false,
  isSystem: true,
  isVirtual: false,
  isRemovable: false,
  isCard: false,
  isSCSI: true,
  isUSB: false,
  isUAS: false
}, {
  enumerator: 'SD',
  busType: 'SD',
  busVersion: '2.0',
  device: '\\\\?\\sd#disk&generic&sc16g&8.0#5&c518b2e&0&c3964099&0#{53f56307-b6bf-11d0-94f2-00a0c91efb8b}',
  raw: '\\\\.\\PhysicalDrive4',
  description: 'Generic SC16G SD Card',
  error: null,
  size: 15931539456,
  blockSize: 4096,
  logicalBlockSize: 512,
  mountpoints: [{
    path: 'G:\\'
  }, {
    path: 'H:\\'
  }],
  isReadOnly: false,
  isSystem: false,
  isVirtual: false,
  isRemovable: true,
  isCard: true,
  isSCSI: true,
  isUSB: false,
  isUAS: false
}, {
  enumerator: 'SCSI',
  busType: 'USB',
  busVersion: '2.0',
  device: '\\\\?\\scsi#disk&ven_usb3.0&prod_#000000#{53f56307-b6bf-11d0-94f2-00a0c91efb8b}',
  raw: '\\\\.\\PhysicalDrive2',
  description: 'USB3.0  SCSI Disk Device',
  error: null,
  size: 500107862016,
  blockSize: 4096,
  logicalBlockSize: 512,
  mountpoints: [{
    path: 'E:\\'
  }],
  isReadOnly: false,
  isSystem: false,
  isVirtual: false,
  isRemovable: true,
  isCard: false,
  isSCSI: true,
  isUSB: false,
  isUAS: true
}, {
  enumerator: 'SCSI',
  busType: 'SATA',
  busVersion: '2.0',
  device: '\\\\?\\scsi#disk&ven_samsung&prod_ssd_850_evo_m.2#4&5a60d67&0&020000#{53f56307-b6bf-11d0-94f2-00a0c91efb8b}',
  raw: '\\\\.\\PhysicalDrive1',
  description: 'Samsung SSD 850 EVO M.2 120GB',
  error: null,
  size: 120034123776,
  blockSize: 512,
  logicalBlockSize: 512,
  mountpoints: [{
    path: 'C:\\'
  }],
  isReadOnly: false,
  isSystem: true,
  isVirtual: false,
  isRemovable: false,
  isCard: false,
  isSCSI: true,
  isUSB: false,
  isUAS: false
}, {
  enumerator: 'USBSTOR',
  busType: 'USB',
  busVersion: '2.0',
  device: '\\\\?\\usbstor#disk&ven_disk&prod_name&rev_ax10#0012345667888&0#{53f56307-b6bf-11d0-94f2-00a0c91efb8b}',
  raw: '\\\\.\\PhysicalDrive3',
  description: 'Disk Name USB Device',
  error: null,
  size: 1000204886016,
  blockSize: 512,
  logicalBlockSize: 512,
  mountpoints: [{
    path: 'F:\\'
  }],
  isReadOnly: false,
  isSystem: false,
  isVirtual: false,
  isRemovable: true,
  isCard: false,
  isSCSI: false,
  isUSB: true,
  isUAS: false
}]
```

Installation
------------

Install `drivelist` by running:

```sh
$ npm install --save drivelist
```

Documentation
-------------

<a name="module_drivelist.list"></a>

### drivelist.list(callback)
**Kind**: static method of [<code>drivelist</code>](#module_drivelist)  
**Summary**: List available drives  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | callback (error, drives) |

**Example**  
```js
const drivelist = require('drivelist');

drivelist.list((error, drives) => {
  if (error) {
    throw error;
  }

  drives.forEach((drive) => {
    console.log(drive);
  });
});
```

Tests
-----

Run the test suite by doing:

```sh
$ npm test
```

Contribute
----------

We're looking forward to support more operating systems. Please raise an issue or even better, send a PR to increase support!

- Issue Tracker: [github.com/resin-io-modules/drivelist/issues](https://github.com/resin-io-modules/drivelist/issues)
- Source Code: [github.com/resin-io-modules/drivelist](https://github.com/resin-io-modules/drivelist)

Before submitting a PR, please make sure that you include tests, and that the linter runs without any warning:

```sh
$ npm run lint
```

Execute the following command after making any changes to the platform scripts:

```sh
npm run compile-scripts
```

Support
-------

If you're having any problem, please [raise an issue](https://github.com/resin-io-modules/drivelist/issues/new) on GitHub.

License
-------

The project is licensed under the Apache 2.0 license.

[yaml]: http://yaml.org
