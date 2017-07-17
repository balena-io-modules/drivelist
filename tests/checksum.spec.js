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

const m = require('mochainon');
const path = require('path');
const checksum = require('../lib/checksum');

describe('Checksum', function() {

  describe('.calculateFromString()', function() {

    it('should calculate an MD5 hash from a string', function() {
      m.chai.expect(checksum.calculateFromString('md5', 'foo')).to.equal('acbd18db4cc2f85cedef654fccc4a4d8');
      m.chai.expect(checksum.calculateFromString('md5', 'bar')).to.equal('37b51d194a7513e45b56f6524f2d51f2');
    });

  });

  describe('.calculateFromFile()', function() {

    it('should calculate an MD5 hash from a file', function(done) {
      checksum.calculateFromFile('md5', path.join(__dirname, 'foobar'), (error, fileChecksum) => {
        m.chai.expect(error).to.not.exist;
        m.chai.expect(fileChecksum).to.equal('a0a6e1a375117c58d77221f10c5ce12e');
        done();
      });
    });

  });

});
