_ = require('lodash')
os = require('os')
chai = require('chai')
expect = chai.expect
sinon = require('sinon')
chai.use(require('sinon-chai'))
drivelist = require('../lib/drivelist')

osx = require('../lib/osx')
win32 = require('../lib/win32')
linux = require('../lib/linux')

describe 'Drivelist:', ->

	describe '.list()', ->

		beforeEach ->
			@osxStub = sinon.stub(osx, 'list')
			@win32Stub = sinon.stub(win32, 'list')
			@linuxStub = sinon.stub(linux, 'list')

		afterEach ->
			@osxStub.restore()
			@win32Stub.restore()
			@linuxStub.restore()

		describe 'given platform is darwin', ->

			beforeEach ->
				@osPlatformStub = sinon.stub(os, 'platform')
				@osPlatformStub.returns('darwin')

				drivelist.list()

			afterEach ->
				@osPlatformStub.restore()

			it 'should only call osx.list()', ->
				expect(@osxStub).to.have.been.calledOnce
				expect(@win32Stub).to.not.have.been.called
				expect(@linuxStub).to.not.have.been.called

		describe 'given platform is win32', ->

			beforeEach ->
				@osPlatformStub = sinon.stub(os, 'platform')
				@osPlatformStub.returns('win32')

				drivelist.list()

			afterEach ->
				@osPlatformStub.restore()

			it 'should only call win32.list()', ->
				expect(@osxStub).to.not.have.been.called
				expect(@win32Stub).to.have.been.calledOnce
				expect(@linuxStub).to.not.have.been.called

		describe 'given platform is linux', ->

			beforeEach ->
				@osPlatformStub = sinon.stub(os, 'platform')
				@osPlatformStub.returns('linux')

				drivelist.list()

			afterEach ->
				@osPlatformStub.restore()

			it 'should only call linux.list()', ->
				expect(@osxStub).to.not.have.been.called
				expect(@win32Stub).to.not.have.been.called
				expect(@linuxStub).to.have.been.calledOnce

		describe 'given platform is unknown', ->

			beforeEach ->
				@osPlatformStub = sinon.stub(os, 'platform')
				@osPlatformStub.returns('foobar')

			afterEach ->
				@osPlatformStub.restore()

			it 'should throw an error', ->
				expect ->
					drivelist.list(_.noop)
				.to.throw('Your OS is not supported by this module: foobar')

	describe '.isSystem()', ->

		beforeEach ->
			@osxStub = sinon.stub(osx, 'isSystem')
			@win32Stub = sinon.stub(win32, 'isSystem')
			@linuxStub = sinon.stub(linux, 'isSystem')

		afterEach ->
			@osxStub.restore()
			@win32Stub.restore()
			@linuxStub.restore()

		describe 'given platform is darwin', ->

			beforeEach ->
				@osPlatformStub = sinon.stub(os, 'platform')
				@osPlatformStub.returns('darwin')

				drivelist.isSystem()

			afterEach ->
				@osPlatformStub.restore()

			it 'should only call osx.isSystem()', ->
				expect(@osxStub).to.have.been.calledOnce
				expect(@win32Stub).to.not.have.been.called
				expect(@linuxStub).to.not.have.been.called

		describe 'given platform is win32', ->

			beforeEach ->
				@osPlatformStub = sinon.stub(os, 'platform')
				@osPlatformStub.returns('win32')

				drivelist.isSystem()

			afterEach ->
				@osPlatformStub.restore()

			it 'should only call win32.isSystem()', ->
				expect(@osxStub).to.not.have.been.called
				expect(@win32Stub).to.have.been.calledOnce
				expect(@linuxStub).to.not.have.been.called

		describe 'given platform is linux', ->

			beforeEach ->
				@osPlatformStub = sinon.stub(os, 'platform')
				@osPlatformStub.returns('linux')

				drivelist.isSystem()

			afterEach ->
				@osPlatformStub.restore()

			it 'should only call linux.isSystem()', ->
				expect(@osxStub).to.not.have.been.called
				expect(@win32Stub).to.not.have.been.called
				expect(@linuxStub).to.have.been.calledOnce

		describe 'given platform is unknown', ->

			beforeEach ->
				@osPlatformStub = sinon.stub(os, 'platform')
				@osPlatformStub.returns('foobar')

			afterEach ->
				@osPlatformStub.restore()

			it 'should throw an error', ->
				expect ->
					drivelist.isSystem(_.noop)
				.to.throw('Your OS is not supported by this module: foobar')
