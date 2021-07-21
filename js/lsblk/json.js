"use strict";
/*
 * Copyright 2018 Balena.io
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.transform = void 0;
const path_1 = require("path");
const _1 = require(".");
function getMountpoints(children) {
    return children
        .filter((child) => {
        return child.mountpoint;
    })
        .map((child) => {
        return {
            path: child.mountpoint,
            label: child.label || child.partlabel,
        };
    });
}
function getDescription(device) {
    const description = [
        device.label || '',
        device.vendor || '',
        device.model || '',
    ];
    if (device.children) {
        let subLabels = device.children
            .filter((c) => (c.label && c.label !== device.label) || c.mountpoint)
            .map((c) => c.label || c.mountpoint);
        subLabels = Array.from(new Set(subLabels));
        if (subLabels.length) {
            description.push(`(${subLabels.join(', ')})`);
        }
    }
    return description.join(' ').replace(/\s+/g, ' ').trim();
}
function resolveDeviceName(name) {
    if (!name) {
        return null;
    }
    if (!path_1.posix.isAbsolute(name)) {
        return path_1.posix.resolve('/dev', name);
    }
    return name;
}
function transform(data) {
    return data.blockdevices
        .map((device) => Object.assign({}, device, {
        name: resolveDeviceName(device.name),
        kname: resolveDeviceName(device.kname),
    }))
        .filter((device) => 
    // Omit loop devices, CD/DVD drives, and RAM
    !device.name.startsWith('/dev/loop') &&
        !device.name.startsWith('/dev/sr') &&
        !device.name.startsWith('/dev/ram'))
        .map((device) => {
        const isVirtual = device.subsystems
            ? /^(block)$/i.test(device.subsystems)
            : null;
        const isSCSI = device.tran
            ? /^(sata|scsi|ata|ide|pci)$/i.test(device.tran)
            : null;
        const isUSB = device.tran ? /^(usb)$/i.test(device.tran) : null;
        const isReadOnly = Number(device.ro) === 1;
        const isRemovable = Number(device.rm) === 1 ||
            Number(device.hotplug) === 1 ||
            Boolean(isVirtual);
        return {
            enumerator: 'lsblk:json',
            busType: (device.tran || 'UNKNOWN').toUpperCase(),
            busVersion: null,
            device: device.name,
            devicePath: null,
            raw: device.kname || device.name,
            description: getDescription(device),
            error: null,
            size: Number(device.size) || null,
            blockSize: Number(device['phy-sec']) || 512,
            logicalBlockSize: Number(device['log-sec']) || 512,
            mountpoints: device.children
                ? getMountpoints(device.children)
                : getMountpoints([device]),
            isReadOnly,
            isSystem: !isRemovable && !isVirtual,
            isVirtual,
            isRemovable,
            isCard: null,
            isSCSI,
            isUSB,
            isUAS: null,
            partitionTableType: _1.getPartitionTableType(device.pttype),
        };
    });
}
exports.transform = transform;
function parse(stdout) {
    return transform(JSON.parse(stdout));
}
exports.parse = parse;
//# sourceMappingURL=json.js.map