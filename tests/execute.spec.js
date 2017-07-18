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
const _ = require('lodash');
const os = require('os');
const childProcess = require('child_process');
const execute = require('../lib/execute');

describe('Execute', function() {

  describe('.extractAndRun()', function() {

    it('should be able to execute a script', function(done) {
      const script = _.attempt(() => {
        if (os.platform() === 'win32') {
          return {
            content: '@echo off\necho foo bar baz',
            originalFilename: 'hello.bat'
          };
        }

        return {
          content: '#!/bin/bash\necho "foo bar baz"',
          originalFilename: 'hello.sh'
        };
      });

      execute.extractAndRun(script, (error, output) => {
        m.chai.expect(error).to.not.exist;

        // The purpose of the trim is to get rid of
        // operating system-specific line endings
        m.chai.expect(output.trim()).to.equal('foo bar baz');

        done();
      });
    });

    describe('given an error when running the script', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        const error = new Error('script error');
        error.code = 27;
        this.childProcessExecFileStub.yields(error);
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should yield the error', function(done) {
        execute.extractAndRun({
          content: 'dummy content',
          originalFilename: 'foo'
        }, (error, output) => {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('script error (code 27, signal none)');
          m.chai.expect(output).to.not.exist;
          done();
        });
      });

    });

    describe('given EAGAIN errors and then success when running the script', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        const error = new Error('EAGAIN');
        error.code = 'EAGAIN';
        this.childProcessExecFileStub.onFirstCall().yields(error);
        this.childProcessExecFileStub.onSecondCall().yields(error);
        this.childProcessExecFileStub.onThirdCall().yields(error);
        this.childProcessExecFileStub.yields(null, 'foo bar baz', '');
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should eventually yield the command output', function(done) {
        this.timeout(5000);
        execute.extractAndRun({
          content: 'dummy content',
          originalFilename: 'foo'
        }, (error, output) => {
          m.chai.expect(error).to.not.exist;
          m.chai.expect(output).to.equal('foo bar baz');
          done();
        });
      });

    });

    describe('given EAGAIN errors when running the script', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        const error = new Error('EAGAIN');
        error.code = 'EAGAIN';
        this.childProcessExecFileStub.yields(error);
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should eventually yield the error', function(done) {
        this.timeout(5000);
        execute.extractAndRun({
          content: 'dummy content',
          originalFilename: 'foo'
        }, (error, output) => {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.code).to.equal('EAGAIN');
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
        execute.extractAndRun({
          content: 'dummy content',
          originalFilename: 'foo'
        }, (error, output) => {
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
        execute.extractAndRun({
          content: 'dummy content',
          originalFilename: 'foo'
        }, (error, output) => {
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
        execute.extractAndRun({
          content: 'dummy content',
          originalFilename: 'foo'
        }, (error, output) => {
          m.chai.expect(error).to.not.exist;
          m.chai.expect(output).to.equal('foo bar');
          done();
        });
      });

    });

  });

});
