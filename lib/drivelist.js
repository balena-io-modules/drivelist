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

/**
 * @module drivelist
 */

const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const os = require('os');
const Rx = require('rx');
const parse = require('./parse');
const scripts = require('./scripts');

/**
 * @summary List available drives
 * @function
 * @public
 *
 * @param {Function} callback - callback (error, drives)
 *
 * @example
 * const drivelist = require('drivelist');
 *
 * drivelist.list((error, drives) => {
 *   if (error) {
 *     throw error;
 *   }
 *
 *   drives.forEach((drive) => {
 *     console.log(drive);
 *   });
 * });
 */
exports.list = (callback) => {
  const operatingSystem = os.platform();
  const script = scripts.paths[operatingSystem];

  if (!script) {
    callback(new Error(`Your OS is not supported by this module: ${operatingSystem}`));
    return;
  }

  scripts.run(script, (error, output) => {
    if (error) {
      return callback(error);
    }

    return callback(null, parse(output));
  });
};

const drivesStream = Symbol();
const prevPollDrives = Symbol();

const createDrivesStream = (interval) => {
  return Rx.Observable.timer(0, interval)
    .flatMap(() => {
      return Rx.Observable.fromNodeCallback(require('./drivelist').list)();
    })
    .pausable(new Rx.Subject());
};

const emitDrivesEvents = function(drives) {
  this.emit('drives', drives);

  if (_.isEqual(drives, this[prevPollDrives])) {
    return;
  }

  const addedDrives = _.differenceWith(drives, this[prevPollDrives], _.isEqual);
  if (addedDrives.length > 0) {
    this.emit('add', addedDrives);
  }

  const removedDrives = _.differenceWith(this[prevPollDrives], drives, _.isEqual);
  if (removedDrives.length > 0) {
    this.emit('remove', removedDrives);
  }

  if (addedDrives.length > 0 || removedDrives.length > 0) {
    this.emit('change', drives, this[prevPollDrives]);
  }
};

/**
 * Emitter that scans the drives every `scanInterval`ms.
 *
 * Emits the following events:
 * - `drives (Object[])`
 * - `change (Object[], Object[])`
 * - `add (Object[])`
 * - `remove (Object[])`
 * - `error (Error)`
 *
 * @extends EventEmitter
 *
 * @public
 *
 * @example
 * const scanner = new IntervalDriveScanner(2000);
 *
 * scanner.on('drives', (drives) => {
 *   console.log(drives);
 * });
 *
 * scanner.on('change', (currentDrives, previousDrives) => {
 *   console.log(currentDrives);
 *   console.log(previousDrives);
 * });
 *
 * scanner.on('add', (drives) => {
 *   console.log(drives);
 * });
 *
 * scanner.on('remove', (drives) => {
 *   console.log(drives);
 * });
 *
 * scanner.on('error', (error) => {
 *   throw error;
 * });
 *
 */
class IntervalEmitter extends EventEmitter {

  /**
   * Create an instance.
   * @param {number} interval - Polling interval, also used between `drives` event emits.
   */
  constructor(interval) {
    super();
    this[prevPollDrives] = null;
    this[drivesStream] = createDrivesStream(interval);

    this[drivesStream].subscribe((drives) => {
      Reflect.apply(emitDrivesEvents, this, [ drives ]);
      this[prevPollDrives] = drives;
    }, (error) => {
      this.emit('error', error);
    });
  }

  /**
   * @summary Start scanning drives.
   *
   * @example
   * new IntervalEmitter().start();
   */
  start() {
    this[drivesStream].resume();
  }

  /**
   * @summary Stop scanning drives.
   *
   * @example
   * new IntervalEmitter().stop();
   */
  stop() {
    this[drivesStream].pause();
  }
}

exports.IntervalEmitter = IntervalEmitter;
