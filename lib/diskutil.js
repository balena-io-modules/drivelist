/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const plist = require('fast-plist');
const childProcess = require('child_process');

const run = (cmd, argv, callback) => {
  let stdout = '';
  let stderr = '';

  const proc = childProcess.spawn(cmd, argv)
    .on('error', callback)
    .on('exit', (code, signal) => {
      let error = null;
      let data = null;

      if (code === null || code !== 0) {
        error = error || new Error(`Command "${cmd} ${argv.join(' ')}" exited unexpectedly with "${code || signal}"`);
        error.stderr = stderr;
      }

      // NOTE: diskutil outputs error data as plist if something
      // goes wrong, hence we still attempt to parse it here
      try {
        data = plist.parse(stdout);
      } catch (e) {
        error = error || e;
      }

      // NOTE: diskutil can give back 'null' data when recovering
      // from a system sleep / stand-by
      if (data === null) {
        error = new Error(`Command "${cmd} ${argv.join(' ')}" returned without data`);
      }

      callback(error, data);
    });

  proc.stdout.setEncoding('utf8');
  proc.stderr.setEncoding('utf8');

  proc.stdout.on('readable', function() {
    let data = null;
    while (data = this.read()) {
      stdout += data;
    }
  });

  proc.stderr.on('readable', function() {
    let data = null;
    while (data = this.read()) {
      stderr += data;
    }
  });
};

const asyncMap = (items, iter, callback) => {
  const results = [];
  const next = (error, result) => {
    if (result !== undefined) {
      results.push(result);
    }
    if (error || !items.length) {
      callback(error, results);
      return;
    }
    iter(items.shift(), next);
  };

  next();
};

const hasDeviceNode = (disk) => {
  return !disk.Error && disk.DeviceNode && disk.DeviceNode.length;
};

const transform = (disk) => {
  const isVirtual = disk.VirtualOrPhysical === 'Virtual';
  const isReadOnly = !(disk.Writable || disk.WritableMedia);
  const isRemovable = disk.Removable || disk.RemovableMedia
    || disk.RemovableMediaOrExternalDevice;
  const isSystem = disk.Internal && !isRemovable || disk.SystemImage;
  const isUSB = /^(USB)$/i.test(disk.BusProtocol);
  const isSCSI = /^(SATA|SCSI|ATA|IDE|PCI)$/i.test(disk.BusProtocol);

  // NOTE: Not sure whether `disk.DeviceBlockSize` refers to
  // physical or logical block size, and diskutil only yields
  // one value unfortunately
  return {
    enumerator: 'diskutil',
    busType: disk.BusProtocol || 'UNKNOWN',
    busVersion: null,
    device: disk.DeviceNode,
    raw: disk.DeviceNode && disk.DeviceNode.replace('/disk', '/rdisk'),
    description: disk.IORegistryEntryName,
    error: null,
    size: disk.IOKitSize || disk.Size || disk.TotalSize,
    blockSize: disk.DeviceBlockSize,
    logicalBlockSize: disk.VolumeAllocationBlockSize || disk.DeviceBlockSize,
    mountpoints: [],
    isReadOnly: isReadOnly,
    isSystem: isSystem,
    isVirtual: isVirtual,
    isRemovable: isRemovable,
    isCard: null,
    isSCSI: isSCSI,
    isUSB: isUSB,
    isUAS: null
  };
};

const setMountpoints = (devices, list) => {
  devices.forEach((device) => {
    const layout = list.AllDisksAndPartitions.find((disk) => {
      return device.device.endsWith(disk.DeviceIdentifier);
    });
    if (layout.Partitions || layout.APFSVolumes) {
      const partitions = layout.Partitions || [];
      const apfsVolumes = layout.APFSVolumes || [];
      device.mountpoints = partitions.concat(apfsVolumes).filter((part) => {
        return Boolean(part.MountPoint);
      }).map((part) => {
        return {
          path: part.MountPoint,
          label: part.VolumeName
        };
      });
    } else if (layout.MountPoint) {
      device.mountpoints = [ {
        path: layout.MountPoint,
        label: layout.VolumeName
      } ];
    }
  });
};

const list = (callback) => {
  run('diskutil', [ 'list', '-plist' ], (listError, globalList) => {
    if (listError) {
      callback(listError);
      return;
    }

    const tasks = globalList.WholeDisks.map((disk) => {
      return `/dev/${disk}`;
    });

    asyncMap(tasks, (devicePath, next) => {
      run('diskutil', [ 'info', '-plist', devicePath ], next);
    }, (infoError, results) => {
      const devices = results.filter(hasDeviceNode).map(transform);
      setMountpoints(devices, globalList);
      callback(infoError, devices);
    });
  });
};

module.exports = {
  list,
  transform,
  setMountpoints
};
