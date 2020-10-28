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

/**
 * @module drivelist
 */

import bindings = require('bindings');
import { platform } from 'os';

import { lsblk } from './lsblk';

export interface Mountpoint {
	path: string;
	label: string | null;
}

export interface Drive {
	blockSize: number;
	busType: string;
	busVersion: null;
	description: string;
	device: string;
	devicePath: string | null;
	enumerator: string;
	error: null;
	isCard: null;
	isReadOnly: boolean;
	isRemovable: boolean;
	isSCSI: boolean | null;
	isSystem: boolean;
	isUAS: null;
	isUSB: boolean | null;
	isVirtual: boolean | null;
	logicalBlockSize: number;
	mountpoints: Mountpoint[];
	raw: string;
	size: number | null;
}

const drivelistBindings = bindings('drivelist');

function bindingsList(): Promise<Drive[]> {
	return new Promise((resolve, reject) => {
		drivelistBindings.list((error: Error, drives: Drive[]) => {
			if (error != null) {
				reject(error);
			} else {
				resolve(drives);
			}
		});
	});
}

function handleApfs(disks: Drive[]): void {
	const apfs: Drive[] = [];
	const other: Drive[] = [];
	for (const disk of disks) {
		if (disk.description === 'AppleAPFSMedia') {
			apfs.push(disk);
		} else {
			other.push(disk);
		}
	}
	for (const disk of apfs) {
		const source = other.find(
			(d) => d.devicePath === disk.devicePath && !d.isVirtual,
		);
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
export async function list(): Promise<Drive[]> {
	const plat = platform();
	if (plat === 'win32') {
		return await bindingsList();
	} else if (plat === 'darwin') {
		const disks = await bindingsList();
		handleApfs(disks);
		return disks;
	} else if (plat === 'linux') {
		return await lsblk();
	}
	throw new Error(`Your OS is not supported by this module: ${platform()}`);
}
