/*
 * Copyright 2018 Resin.io
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

const getMountpoints = (children) => {
  return children.filter((child) => {
    return child.mountpoint;
  }).map((child) => {
    return {
      path: child.mountpoint,
      label: child.label || child.partlabel
    };
  });
};

const getDescription = (device) => {
  const description = [
    device.label || '',
    device.vendor || '',
    device.model || ''
  ];
  if (device.children) {
    let subLabels = device.children
      .filter((c) => {
        return c.label && c.label !== device.label;
      })
      .map((c) => {
        return c.label;
      });
    subLabels = Array.from(new Set(subLabels));
    if (subLabels.length) {
      description.push(`(${subLabels.join(', ')})`);
    }
  }
  return description.join(' ').replace(/\s+/g, ' ').trim();
};

const transform = (data) => {
  return data.blockdevices.filter((device) => {
    // Omit loop devices, CD/DVD drives, and RAM
    return !device.name.startsWith('/dev/loop')
      && !device.name.startsWith('/dev/sr')
      && !device.name.startsWith('/dev/ram');
  }).map((device) => {
    const isVirtual = /^(block)$/i.test(device.subsystems);
    const isSCSI = /^(sata|scsi|ata|ide|pci)$/i.test(device.tran);
    const isUSB = /^(usb)$/i.test(device.tran);
    const isReadOnly = Number(device.ro) === 1;
    const isRemovable = Number(device.rm) === 1 || isVirtual;
    return {
      enumerator: 'lsblk',
      busType: (device.tran || 'UNKNOWN').toUpperCase(),
      busVersion: null,
      device: device.name,
      raw: device.kname,
      description: getDescription(device),
      error: null,
      size: Number(device.size) || null,
      blockSize: Number(device['phy-sec']) || null,
      logicalBlockSize: Number(device['log-sec']) || null,
      mountpoints: device.children ? getMountpoints(device.children) : [],
      isReadOnly: isReadOnly,
      isSystem: !isRemovable && !isVirtual,
      isVirtual: isVirtual,
      isRemovable: isRemovable,
      isCard: null,
      isSCSI: isSCSI,
      isUSB: isUSB,
      isUAS: null
    };
  });
};

const parse = (stdout) => {
  return transform(JSON.parse(stdout));
};

module.exports = parse;
