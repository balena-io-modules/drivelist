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

'use strict';

import { execFile } from 'mz/child_process';
import { readdir, readlink } from 'mz/fs';
import { join, resolve } from 'path';

import { Drive } from '..';
import { parse as parseJSON } from './json';
import { parse as parsePairs } from './pairs';

const DISK_PATH_DIR = '/dev/disk/by-path/';

let SUPPORTS_JSON = true;

async function getDevicePaths(): Promise<Map<string, string>> {
	const mapping = new Map();
	for (const filename of await readdir(DISK_PATH_DIR)) {
		const linkPath = join(DISK_PATH_DIR, filename);
		let link: string;
		try {
			link = await readlink(linkPath);
		} catch (error) {
			continue;
		}
		const devicePath = resolve(DISK_PATH_DIR, link);
		mapping.set(devicePath, linkPath);
	}
	return mapping;
}

export async function lsblk(): Promise<Drive[]> {
	const argv = ['--bytes', '--all'];

	if (SUPPORTS_JSON) {
		argv.push('--json', '--paths', '--output-all');
	} else {
		argv.push('--pairs');
	}

	let stdout: string;
	try {
		[stdout] = await execFile('lsblk', argv);
	} catch (error) {
		if (SUPPORTS_JSON) {
			SUPPORTS_JSON = false;
			return await lsblk();
		} else {
			throw error;
		}
	}

	// TODO: #321
	const devices: Drive[] = SUPPORTS_JSON
		? parseJSON(stdout)
		: parsePairs(stdout);

	try {
		const devicePaths = await getDevicePaths();
		for (const device of devices) {
			device.devicePath = devicePaths.get(device.device) || null;
		}
	} catch {}

	return devices;
}
