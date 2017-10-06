/*
 * Copyright 2017 Resin.io
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

const packageInfo = require('../package.json');
const debug = require('debug')(packageInfo.name);
const fs = require('fs');
const childProcess = require('child_process');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * @summary A temporary directory to store scripts
 * @type {String}
 * @constant
 *
 * @description
 * Some users mount their system temporary directory with the `noexec`
 * option, which means we can't execute the files we put there.
 *
 * As a workaround, we try to use XDG_RUNTIME_DIR, which is probably
 * a better bet.
 */
const TMP_DIRECTORY = process.env.XDG_RUNTIME_DIR || os.tmpdir();

/**
 * @summary Generate a tmp filename with full path of OS' tmp dir
 * @function
 * @private
 *
 * @param {String} extension - temporary file extension
 * @returns {String} filename
 *
 * @example
 * const filename = tmpFilename('.sh');
 */
const tmpFilename = (extension) => {
  const random = crypto.randomBytes(6).toString('hex');
  const filename = `${packageInfo.name}-${random}${extension}`;
  return path.join(TMP_DIRECTORY, filename);
};

/**
 * @summary Create a temporary script file with the given contents
 * @function
 * @private
 *
 * @param {String} extension - temporary script file extension
 * @param {String} contents - temporary script contents
 * @param {Function} callback - callback(error, temporaryPath)
 *
 * @example
 * createTemporaryScriptFile('.sh', '#!/bin/bash\necho "Foo"', (error, temporaryPath) => {
 *   if (error) {
 *     throw error;
 *   }
 *   console.log(temporaryPath);
 * })
 */
const createTemporaryScriptFile = (extension, contents, callback) => {
  const temporaryPath = tmpFilename(extension);
  fs.writeFile(temporaryPath, contents, {
    mode: 0o755
  }, (error) => {
    debug('write %s:', temporaryPath, error || 'OK');
    callback(error, temporaryPath);
  });
};

/**
 * @summary Execute a script
 * @function
 * @private
 *
 * @param {String} scriptPath - script path
 * @param {Function} callback - callback (error, output)
 * @param {Number} [times=5] - retry times
 *
 * @example
 * executeScript('path/to/script.sh', (error, output) => {
 *   if (error) throw error;
 *   console.log(output);
 * });
 */
const executeScript = (scriptPath, callback, times) => {
  times = times === undefined ? 5 : times;
  childProcess.execFile('bash', [ scriptPath ], (error, stdout, stderr) => {
    if (error) {
      if (error.code === 'EAGAIN') {
        if (times <= 0) {
          error.message = [
            'Looks like you hit the limit of the number of processes you can have at any given time,',
            'so the child process needed to scan the available drives could not be spawned.'
          ].join(' ');
          return callback(error);
        }

        debug('Got EAGAIN, retrying...');
        return setTimeout(() => {
          executeScript(scriptPath, callback, times - 1);
        }, 500);
      }

      error.message += ` (code ${error.code}, signal ${error.signal || 'none'})`;
      debug('error:', error);
      debug('stderr: %s', stderr);
      debug('stdout: %s', stdout);
      return callback(error);
    }

    // Don't throw an error if we get `stderr` output from
    // the drive detection scripts at this point, given that
    // if the script already exitted with code zero, then
    // we consider them warnings that we can safely ignore.
    if (stderr.trim().length) {
      debug('stderr: %s', stderr);
    }

    callback(null, stdout);
  });
};

/**
 * @summary Extract and run an inline script
 * @function
 * @public
 *
 * @param {Object} script - script
 * @param {String} script.content - script content
 * @param {String} script.originalFilename - script original filename
 * @param {Function} callback - callback(error, output)
 *
 * @example
 * scripts.run({
 *   content: '#!/bin/bash\necho Foo',
 *   originalFilename: 'myscript.sh'
 * }, (error, output) => {
 *   if (error) {
 *     throw error;
 *   }
 *
 *   console.log(output);
 * });
 */
exports.extractAndRun = (script, callback) => {
  const extension = path.extname(script.originalFilename);

  createTemporaryScriptFile(extension, script.content, (writeError, temporaryPath) => {
    if (writeError) {
      return callback(writeError);
    }

    executeScript(temporaryPath, (executeError, output) => {

      // Attempt to clean up, but ignore failure
      fs.unlink(temporaryPath, (unlinkError) => {
        if (unlinkError) {
          debug('unlink error', unlinkError);
        }

        callback(executeError, output);
      });
    });
  });
};
