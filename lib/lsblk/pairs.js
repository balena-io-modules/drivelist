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

const parseLsblkLine = (line) => {

  const data = {};
  let offset = 0;
  let key = '';
  let value = '';

  const keyChar = /[^"=]/;
  const whitespace = /\s+/;
  const escape = '\\';
  let state = 'key';

  while (offset < line.length) {
    if (state === 'key') {
      while (keyChar.test(line[offset])) {
        key += line[offset];
        offset += 1;
      }
      if (line[offset] === '=') {
        state = 'value';
        offset += 1;
      }
    } else if (state === 'value') {
      if (line[offset] !== '"') {
        throw new Error(`Expected '"', saw "${line[offset]}"`);
      }
      offset += 1;
      while (line[offset] !== '"' && line[offset - 1] !== escape) {
        value += line[offset];
        offset += 1;
      }
      if (line[offset] !== '"') {
        throw new Error(`Expected '"', saw "${line[offset]}"`);
      }
      offset += 1;
      data[key.toLowerCase()] = value.trim();
      key = '';
      value = '';
      state = 'space';
    } else if (state === 'space') {
      while (whitespace.test(line[offset])) {
        offset += 1;
      }
      state = 'key';
    } else {
      throw new Error(`Undefined state "${state}"`);
    }
  }

  return data;

};

const parseLsblk = (output) => {
  return output.trim().split(/\r?\n/g).map(parseLsblkLine);
};

const consolidate = (devices) => {

  const primaries = devices.filter((device) => {
    return device.type === 'disk'
      && !device.name.startsWith('ram')
      && !device.name.startsWith('sr');
  });

  primaries.forEach((device) => {
    device.mountpoints = devices.filter((child) => {
      return [ 'disk', 'part' ].includes(child.type) && child.mountpoint
        && child.name.startsWith(device.name);
    }).map((child) => {
      return {
        path: child.mountpoint,
        label: child.label
      };
    });
  });

  return primaries;

};

const getDescription = (device) => {
  const description = [
    device.label || '',
    device.vendor || '',
    device.model || ''
  ];
  if (device.mountpoints.length) {
    let subLabels = device.mountpoints
      .filter((c) => {
        return c.label && c.label !== device.label || c.path;
      })
      .map((c) => {
        return c.label || c.path;
      });
    subLabels = Array.from(new Set(subLabels));
    if (subLabels.length) {
      description.push(`(${subLabels.join(', ')})`);
    }
  }
  return description.join(' ').replace(/\s+/g, ' ').trim();
};

const parse = (stdout) => {
  const devices = consolidate(parseLsblk(stdout));

  return devices.map((device) => {
    const isVirtual = device.subsystems ? /^(block)$/i.test(device.subsystems) : null;
    const isSCSI = device.tran ? /^(sata|scsi|ata|ide|pci)$/i.test(device.tran) : null;
    const isUSB = device.tran ? /^(usb)$/i.test(device.tran) : null;
    const isReadOnly = Number(device.ro) === 1;
    const isRemovable = Number(device.rm) === 1 || Number(device.hotplug) === 1 || Boolean(isVirtual);

    return {
      enumerator: 'lsblk:pairs',
      busType: (device.tran || 'UNKNOWN').toUpperCase(),
      busVersion: null,
      device: '/dev/' + device.name,
      devicePath: null,
      raw: '/dev/' + device.name,
      description: getDescription(device) || device.name,
      error: null,
      size: Number(device.size) || null,
      blockSize: Number(device['phy-sec']) || 512,
      logicalBlockSize: Number(device['log-sec']) || 512,
      mountpoints: device.mountpoints,
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

module.exports = parse;
