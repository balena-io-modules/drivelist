"use strict";
/*
 * Copyright 2016 Balena.io
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
exports.list = void 0;
/**
 * @module drivelist
 */
const bindings = require("bindings");
const os_1 = require("os");
const lsblk_1 = require("./lsblk");
const drivelistBindings = bindings('drivelist');
function bindingsList() {
    return new Promise((resolve, reject) => {
        drivelistBindings.list((error, drives) => {
            if (error != null) {
                reject(error);
            }
            else {
                resolve(drives);
            }
        });
    });
}
function handleApfs(disks) {
    const apfs = [];
    const other = [];
    for (const disk of disks) {
        if (disk.description === 'AppleAPFSMedia') {
            apfs.push(disk);
        }
        else {
            other.push(disk);
        }
    }
    for (const disk of apfs) {
        const source = other.find((d) => d.devicePath === disk.devicePath && !d.isVirtual);
        if (source !== undefined) {
            source.mountpoints.push(...disk.mountpoints);
            disk.isVirtual = true;
        }
    }
}
/**
 * @summary List available drives
 *
 * @example
 * const drivelist = require('drivelist');
 *
 * const drives = await drivelist.list();
 * drives.forEach((drive) => {
 *   console.log(drive);
 * });
 */
async function list() {
    const plat = os_1.platform();
    if (plat === 'win32') {
        return await bindingsList();
    }
    else if (plat === 'darwin') {
        const disks = await bindingsList();
        handleApfs(disks);
        return disks;
    }
    else if (plat === 'linux') {
        return await lsblk_1.lsblk();
    }
    throw new Error(`Your OS is not supported by this module: ${os_1.platform()}`);
}
exports.list = list;
//# sourceMappingURL=index.js.map