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
exports.lsblk = exports.getPartitionTableType = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const json_1 = require("./json");
const pairs_1 = require("./pairs");
const execFileAsync = util_1.promisify(child_process_1.execFile);
const DISK_PATH_DIR = '/dev/disk/by-path/';
let SUPPORTS_JSON = true;
let SUPPORTS_PTTYPE = true;
function getPartitionTableType(pttype) {
    if (pttype === 'gpt') {
        return 'gpt';
    }
    else if (pttype === 'dos') {
        return 'mbr';
    }
    return null;
}
exports.getPartitionTableType = getPartitionTableType;
async function getDevicePaths() {
    const mapping = new Map();
    for (const filename of await fs_1.promises.readdir(DISK_PATH_DIR)) {
        const linkPath = path_1.join(DISK_PATH_DIR, filename);
        let link;
        try {
            link = await fs_1.promises.readlink(linkPath);
        }
        catch (error) {
            continue;
        }
        const devicePath = path_1.resolve(DISK_PATH_DIR, link);
        mapping.set(devicePath, linkPath);
    }
    return mapping;
}
async function addDevicePaths(devices) {
    const devicePaths = await getDevicePaths();
    for (const device of devices) {
        device.devicePath = devicePaths.get(device.device) || null;
    }
}
async function getOutput(command, ...args) {
    const { stdout } = await execFileAsync(command, args);
    return stdout;
}
async function lsblkJSON() {
    return json_1.parse(await getOutput('lsblk', '--bytes', '--all', '--json', '--paths', '--output-all'));
}
async function getLsblkPairsOutput() {
    if (SUPPORTS_PTTYPE) {
        try {
            return await getOutput('lsblk', '--bytes', '--all', '--pairs', '-o', '+pttype');
        }
        catch (error) {
            SUPPORTS_PTTYPE = false;
        }
    }
    return await getOutput('lsblk', '--bytes', '--all', '--pairs');
}
async function lsblkPairs() {
    return pairs_1.parse(await getLsblkPairsOutput());
}
async function $lsblk() {
    if (SUPPORTS_JSON) {
        try {
            return await lsblkJSON();
        }
        catch (error) {
            SUPPORTS_JSON = false;
        }
    }
    return await lsblkPairs();
}
async function lsblk() {
    const drives = await $lsblk();
    try {
        await addDevicePaths(drives);
    }
    catch (error) {
        // Couldn't add device paths
    }
    return drives;
}
exports.lsblk = lsblk;
//# sourceMappingURL=index.js.map