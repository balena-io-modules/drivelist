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

const childProcess = require('child_process');

const exec = (cmd, argv, callback) => {
  let stdout = '';
  let stderr = '';

  const proc = childProcess.spawn(cmd, argv)
    .on('error', callback)
    .on('exit', (code, signal) => {
      let error = null;

      if (code === null || code !== 0) {
        error = error || new Error(`Command "${cmd} ${argv.join(' ')}" exited unexpectedly with "${code || signal}"`);
        error.code = code;
        error.signal = signal;
        error.stdout = stdout;
        error.stderr = stderr;
      }

      callback(error, stdout, stderr);
    });

  proc.stdout.setEncoding('utf8');
  proc.stderr.setEncoding('utf8');

  proc.stdout.on('readable', function() {
    let data = null;
    while (data = this.read()) {
      stdout += data;
    }
  });

  proc.stderr.on('readable', function() {
    let data = null;
    while (data = this.read()) {
      stderr += data;
    }
  });
};

module.exports = exec;
