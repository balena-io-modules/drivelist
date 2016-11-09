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
const parse = require('../lib/parse');

describe('Parse', function() {

  it('should return an empty object if no input', function() {
    m.chai.expect(parse()).to.deep.equal([]);
  });

  it('should return an empty object if input is an empty string', function() {
    m.chai.expect(parse('')).to.deep.equal([]);
  });

  it('should return an empty object if input is a string containing only spaces', function() {
    m.chai.expect(parse('    ')).to.deep.equal([]);
  });

  it('should parse a single device', function() {
    m.chai.expect(parse([
      'device: /dev/disk1',
      'description: Macintosh HD',
      'size: 249.8 GB',
      'mountpoint: /'
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk1',
        description: 'Macintosh HD',
        size: '249.8 GB',
        mountpoint: '/'
      }
    ]);
  });

  it('should parse multiple devices', function() {
    m.chai.expect(parse([
      'device: /dev/disk1',
      'description: Macintosh HD',
      'size: 249.8 GB',
      'mountpoint: /',
      '',
      'device: /dev/disk2',
      'description: elementary OS',
      'size: 15.7 GB',
      'mountpoint: /Volumes/Elementary'
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk1',
        description: 'Macintosh HD',
        size: '249.8 GB',
        mountpoint: '/'
      },
      {
        device: '/dev/disk2',
        description: 'elementary OS',
        size: '15.7 GB',
        mountpoint: '/Volumes/Elementary'
      }
    ]);
  });

  it('should omit blank lines', function() {
    m.chai.expect(parse([
      'device: /dev/disk1',
      'description: Macintosh HD',
      'size: 249.8 GB',
      'mountpoint: /',
      '',
      'device:',
      'description:',
      'size:',
      'mountpoint:'
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk1',
        description: 'Macintosh HD',
        size: '249.8 GB',
        mountpoint: '/'
      }
    ]);
  });

  it('should ignore new lines after the output', function() {
    m.chai.expect(parse([
      'device: /dev/disk1',
      'description: Macintosh HD',
      'size: 249.8 GB',
      'mountpoint: /',
      '',
      'device: /dev/disk2',
      'description: elementary OS',
      'size: 15.7 GB',
      'mountpoint: /Volumes/Elementary',
      '',
      '',
      ''
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk1',
        description: 'Macintosh HD',
        size: '249.8 GB',
        mountpoint: '/'
      },
      {
        device: '/dev/disk2',
        description: 'elementary OS',
        size: '15.7 GB',
        mountpoint: '/Volumes/Elementary'
      }
    ]);
  });

  it('should parse a truthy boolean', function() {
    m.chai.expect(parse([
      'device: /dev/disk1',
      'hello: True'
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk1',
        hello: true
      }
    ]);
  });

  it('should parse a falsy boolean', function() {
    m.chai.expect(parse([
      'device: /dev/disk1',
      'hello: False'
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk1',
        hello: false
      }
    ]);
  });

  it('should ignore invalid keys', function() {
    m.chai.expect(parse([
      '[0x7FFAC9E570E3] ANOMALY: use of REX.w',
      'device: /dev/disk2',
      'foo: foo',
      'this is a warning',
      'bar: bar'
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk2',
        foo: 'foo',
        bar: 'bar'
      }
    ]);
  });

  it('should parse multiple devices that are heterogeneous', function() {
    m.chai.expect(parse([
      'device: /dev/disk1',
      'hello: world',
      'foo: bar',
      '',
      'device: /dev/disk2',
      'hey: there'
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk1',
        hello: 'world',
        foo: 'bar'
      },
      {
        device: '/dev/disk2',
        hey: 'there'
      }
    ]);
  });

  it('should set null for values without keys', function() {
    m.chai.expect(parse([
      'device: /dev/disk1',
      'hello:'
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk1',
        hello: null
      }
    ]);
  });

  it('should not interpret a word without colon as a key without value', function() {
    m.chai.expect(parse([ 'hello' ].join('\n'))).to.deep.equal([]);
  });

  it('should not interpret multiple words without colon as a key without value', function() {
    m.chai.expect(parse([ 'hello world' ].join('\n'))).to.deep.equal([]);
  });

  it('should handle a double quote inside a value', function() {
    m.chai.expect(parse([
      'device: /dev/disk1',
      'description: "SAMSUNG SSD PM810 2.5" 7mm 256GB"'
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk1',
        description: 'SAMSUNG SSD PM810 2.5" 7mm 256GB'
      }
    ]);
  });

  it('should handle multiple double quotes inside a value', function() {
    m.chai.expect(parse([
      'device: /dev/disk1',
      'description: "SAMSUNG "SSD" PM810 2.5" 7mm 256GB"'
    ].join('\n'))).to.deep.equal([
      {
        device: '/dev/disk1',
        description: 'SAMSUNG "SSD" PM810 2.5" 7mm 256GB'
      }
    ]);
  });

});
