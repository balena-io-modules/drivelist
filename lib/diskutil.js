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
const exec = require('./exec');

const asyncMap = (items, iter, callback) => {
  const results = [];
  const errors = [];
  const next = (error, result) => {
    results.push(result || null);
    errors.push(error || null);
    if (!items.length) {
      callback(errors, results);
      return;
    }
    iter(items.shift(), next);
  };

  iter(items.shift(), next);
};

const hasDeviceNode = (disk) => {
  return disk && !disk.Error && disk.DeviceNode && disk.DeviceNode.length;
};

const transform = (disk) => {
  const isVirtual = disk.VirtualOrPhysical === 'Virtual';
  const isReadOnly = !(disk.Writable || disk.WritableMedia);
  const isRemovable = disk.Removable || disk.RemovableMedia || disk.Ejectable
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
    devicePath: disk.DeviceTreePath || null,
    raw: disk.DeviceNode && disk.DeviceNode.replace('/disk', '/rdisk'),
    description: disk.IORegistryEntryName || disk.MediaName,
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

const listAll = (callback) => {
  const cmd = 'diskutil';
  const argv = [ 'list', '-plist' ];
  exec(cmd, argv, (error, stdout) => {
    if (error) {
      callback(error);
      return;
    }

    let data = null;

    // NOTE: diskutil outputs error data as plist if something
    // goes wrong, hence we still attempt to parse it here
    try {
      data = plist.parse(stdout);
    } catch (e) {
      error = error || e;
    }

    // NOTE: `diskutil list -plist` can give back 'null' data when recovering
    // from a system sleep / stand-by
    if (data === null) {
      error = error || new Error(`Command "${cmd} ${argv.join(' ')}" returned without data`);
    }

    callback(error, data);
  });
};

const list = (callback) => {
  listAll((listError, globalList) => {
    if (listError) {
      callback(listError);
      return;
    }

    const tasks = globalList.WholeDisks.map((disk) => {
      return `/dev/${disk}`;
    });

    asyncMap(tasks, (devicePath, next) => {
      exec('diskutil', [ 'info', '-plist', devicePath ], (error, stdout) => {
        let data = null;
        try {
          data = plist.parse(stdout);
        } catch (e) {
          return next(e);
        }

        // NOTE: `diskutil` can return 'null' when recovering
        // from a system sleep / stand-by
        if (data === null) {
          error = error || new Error(`Command "diskutil info -plist ${devicePath}}" returned without data`);
        }

        next(error, data);
      });
    }, (infoErrors, results) => {
      const devices = results.filter((device, index) => {
        return device && !infoErrors[index];
      }).filter(hasDeviceNode).map(transform);
      setMountpoints(devices, globalList);
      callback(null, devices);
    });
  });
};

module.exports = {
  list,
  transform,
  setMountpoints
};
