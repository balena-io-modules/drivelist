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

const childProcess = require('child_process');

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
  return data.blockdevices.map((device) => {
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
      size: Number(device.size),
      blockSize: Number(device['phy-sec']),
      logicalBlockSize: Number(device['log-sec']),
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

const lsblk = (callback) => {
  const cmd = 'lsblk';
  const argv = [
    '--output-all',
    '--paths',
    '--bytes',
    '--json'
  ];

  let stdout = '';
  let stderr = '';
  const proc = childProcess.spawn(cmd, argv)
    .on('error', callback)
    .on('exit', (code, signal) => {
      let error = null;
      let data = null;

      if (code == null || code !== 0) {
        error = error || new Error(`Command "${cmd} ${argv.join(' ')}" exited unexpectedly with "${code || signal}"`);
        error.stderr = stderr;
      }

      if (error) {
        error.stderr = stderr;
      } else {
        try {
          // data = JSON.parse(stdout)
          data = transform(JSON.parse(stdout));
        } catch (e) {
          error = error || e;
        }
      }

      callback(error, data);
    });

  proc.stdout.on('readable', function() {
    let chunk = null;
    while (chunk = this.read()) {
      stdout += chunk.toString();
    }
  });

  proc.stderr.on('readable', function() {
    let chunk = null;
    while (chunk = this.read()) {
      stderr += chunk.toString();
    }
  });
};

module.exports = lsblk;
