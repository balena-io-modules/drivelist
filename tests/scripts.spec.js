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
const childProcess = require('child_process');
const _ = require('lodash');
const scripts = require('../lib/scripts');

describe('Scripts', function() {

  describe('.paths', function() {

    it('should be a plain object', function() {
      m.chai.expect(_.isPlainObject(scripts.paths)).to.be.true;
    });

    it('should have a win32 string property', function() {
      m.chai.expect(scripts.paths.win32).to.be.a('string');
    });

    it('should have a linux string property', function() {
      m.chai.expect(scripts.paths.linux).to.be.a('string');
    });

    it('should have a darwin string property', function() {
      m.chai.expect(scripts.paths.darwin).to.be.a('string');
    });

  });

  describe('.run()', function() {

    describe('given an error when running the script', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        this.childProcessExecFileStub.yields(new Error('script error'));
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should yield the error', function(done) {
        scripts.run('foo', (error, output) => {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('script error');
          m.chai.expect(output).to.not.exist;
          done();
        });
      });

    });

    describe('given the script outputs to stderr with exit code 0', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        this.childProcessExecFileStub.yields(null, 'foo bar', 'script error');
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should ignore stderr', function(done) {
        scripts.run('foo', (error, output) => {
          m.chai.expect(error).to.not.exist;
          m.chai.expect(output).to.equal('foo bar');
          done();
        });
      });

    });

    describe('given the script outputs to stdout and a blank string to stderr', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        this.childProcessExecFileStub.yields(null, 'foo bar', '   ');
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should yield the result', function(done) {
        scripts.run('foo', (error, output) => {
          m.chai.expect(error).to.not.exist;
          m.chai.expect(output).to.equal('foo bar');
          done();
        });
      });

    });

    describe('given the script outputs to stdout', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        this.childProcessExecFileStub.yields(null, 'foo bar', '');
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should yield the result', function(done) {
        scripts.run('foo', (error, output) => {
          m.chai.expect(error).to.not.exist;
          m.chai.expect(output).to.equal('foo bar');
          done();
        });
      });

    });

  });

});
