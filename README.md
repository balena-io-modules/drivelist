drivelist
=========

> List all connected drives in your computer, in all major operating systems.

[![npm version](https://badge.fury.io/js/drivelist.svg)](http://badge.fury.io/js/drivelist)
[![dependencies](https://david-dm.org/resin-io-modules/drivelist.svg)](https://david-dm.org/resin-io-modules/drivelist.svg)
[![Build Status](https://travis-ci.org/resin-io-modules/drivelist.svg?branch=master)](https://travis-ci.org/resin-io-modules/drivelist)
[![Build status](https://ci.appveyor.com/api/projects/status/8jn2em9gtkbxeen3/branch/master?svg=true)](https://ci.appveyor.com/project/resin-io/drivelist/branch/master)
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/resin-io/chat)

Notice that this module **does not require** admin privileges to get the drives in any supported operating system.

Supports:

- Windows.
- GNU/Linux distributions that include [util-linux](https://github.com/karelzak/util-linux) and [udev](https://wiki.archlinux.org/index.php/udev).
- Mac OS X.

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
[
  {
    device: '/dev/disk0',
    description: 'GUID_partition_scheme',
    size: 68719476736,
    mountpoints: [
      {
        path: '/'
      }
    ],
    raw: '/dev/rdisk0',
    protected: false,
    system: true
  },
  {
    device: '/dev/disk1',
    description: 'Apple_HFS Macintosh HD',
    size: 68719476736,
    mountpoints: [],
    raw: '/dev/rdisk0',
    protected: false,
    system: true
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
    size: 68719476736,
    mountpoints: [
      {
        path: '/'
      }
    ],
    raw: '/dev/sda',
    protected: false,
    system: true
  },
  {
    device: '/dev/sdb',
    description: 'DataTraveler 2.0',
    size: 7823458304,
    mountpoints: [
      {
        path: '/media/UNTITLED'
      }
    ],
    raw: '/dev/sdb',
    protected: true,
    system: false
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
    size: 68719476736,
    mountpoints: [
      {
        path: 'C:'
      }
    ],
    raw: '\\\\.\\PHYSICALDRIVE0',
    protected: false,
    system: true
  },
  {
    device: '\\\\.\\PHYSICALDRIVE1',
    description: 'Generic STORAGE DEVICE USB Device',
    size: 7823458304,
    mountpoints: [
      {
        path: 'D:'
      }
    ],
    raw: '\\\\.\\PHYSICALDRIVE1',
    protected: true,
    system: false
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


* [drivelist](#module_drivelist)
    * _static_
        * [.list(callback)](#module_drivelist.list)
    * _inner_
        * [~IntervalDrivesEmitter](#module_drivelist..IntervalDrivesEmitter) ⇐ <code>EventEmitter</code>
            * [new IntervalDrivesEmitter(scanInterval)](#new_module_drivelist..IntervalDrivesEmitter_new)
            * [.start()](#module_drivelist..IntervalDrivesEmitter+start)
            * [.stop()](#module_drivelist..IntervalDrivesEmitter+stop)

<a name="module_drivelist.list"></a>

### drivelist.list(callback)
**Kind**: static method of <code>[drivelist](#module_drivelist)</code>  
**Summary**: List available drives  
**Access:** public  

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
<a name="module_drivelist..IntervalDrivesEmitter"></a>

### drivelist~IntervalDrivesEmitter ⇐ <code>EventEmitter</code>
Emitter that scans the drives every `scanInterval`ms.

Emits the following events:
- `drives (Object[])`
- `error (Error)`

**Kind**: inner class of <code>[drivelist](#module_drivelist)</code>  
**Extends:** <code>EventEmitter</code>  
**Access:** public  

* [~IntervalDrivesEmitter](#module_drivelist..IntervalDrivesEmitter) ⇐ <code>EventEmitter</code>
    * [new IntervalDrivesEmitter(scanInterval)](#new_module_drivelist..IntervalDrivesEmitter_new)
    * [.start()](#module_drivelist..IntervalDrivesEmitter+start)
    * [.stop()](#module_drivelist..IntervalDrivesEmitter+stop)

<a name="new_module_drivelist..IntervalDrivesEmitter_new"></a>

#### new IntervalDrivesEmitter(scanInterval)
Create an instance.


| Param | Type | Description |
| --- | --- | --- |
| scanInterval | <code>number</code> | Interval between scans. |

**Example**  
```js
const scanner = new IntervalDriveScanner(2000);

scanner.on('drives', (drives) => {
  console.log(drives);
});

scanner.on('error', (error) => {
  throw error;
});
```
<a name="module_drivelist..IntervalDrivesEmitter+start"></a>

#### intervalDrivesEmitter.start()
**Kind**: instance method of <code>[IntervalDrivesEmitter](#module_drivelist..IntervalDrivesEmitter)</code>  
**Summary**: Start scanning drives.  
**Example**  
```js
new IntervalDrivesEmitter().start();
```
<a name="module_drivelist..IntervalDrivesEmitter+stop"></a>

#### intervalDrivesEmitter.stop()
**Kind**: instance method of <code>[IntervalDrivesEmitter](#module_drivelist..IntervalDrivesEmitter)</code>  
**Summary**: Stop scanning drives.  
**Example**  
```js
new IntervalDrivesEmitter().stop();
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

Support
-------

If you're having any problem, please [raise an issue](https://github.com/resin-io-modules/drivelist/issues/new) on GitHub.

License
-------

The project is licensed under the Apache 2.0 license.
