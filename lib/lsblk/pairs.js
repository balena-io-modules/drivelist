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
    return device.pkname === '';
  });

  primaries.forEach((device) => {
    device.mountpoints = devices.filter((child) => {
      return child.pkname === device.kname;
    }).map((child) => {
      return {
        path: child.mountpoint,
        label: child.label
      };
    });
  });

  return primaries;

};

const parse = (stdout) => {
  return consolidate(parseLsblk(stdout));
};

module.exports = parse;
