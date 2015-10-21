_ = require('lodash')
os = require('os')
chai = require('chai')
expect = chai.expect
sinon = require('sinon')
chai.use(require('sinon-chai'))
scripts = require('../lib/scripts')
drivelist = require('../lib/drivelist')

describe 'Drivelist:', ->

	describe '.list()', ->

		describe 'given scripts run succesfully', ->

			beforeEach ->
				@scriptsRunStub = sinon.stub(scripts, 'run')

				@scriptsRunStub.withArgs(scripts.paths.win32).yields null, '''
					device: "\\\\\\\\.\\\\PHYSICALDRIVE1"
					description: "My drive"
					size: "15 GB"
					mountpoint: "D:"
				'''

				@scriptsRunStub.withArgs(scripts.paths.linux).yields null, '''
					device: "/dev/sda"
					description: "My drive"
					size: "15 GB"
					mountpoint: "/mnt/drive"
				'''

				@scriptsRunStub.withArgs(scripts.paths.darwin).yields null, '''
					device: "/dev/disk2"
					description: "My drive"
					size: "15 GB"
					mountpoint: "/Volumes/drive"
				'''

			afterEach ->
				@scriptsRunStub.restore()

			describe 'given win32', ->

				beforeEach ->
					@osPlatformStub = sinon.stub(os, 'platform')
					@osPlatformStub.returns('win32')

				afterEach ->
					@osPlatformStub.restore()

				it 'should execute win32 script', (done) ->
					drivelist.list (error, drives) ->
						expect(error).to.not.exist
						expect(drives).to.deep.equal [
							device: '\\\\.\\PHYSICALDRIVE1'
							description: 'My drive'
							size: '15 GB'
							mountpoint: 'D:'
						]
						done()

			describe 'given linux', ->

				beforeEach ->
					@osPlatformStub = sinon.stub(os, 'platform')
					@osPlatformStub.returns('linux')

				afterEach ->
					@osPlatformStub.restore()

				it 'should execute linux script', (done) ->
					drivelist.list (error, drives) ->
						expect(error).to.not.exist
						expect(drives).to.deep.equal [
							device: '/dev/sda'
							description: 'My drive'
							size: '15 GB'
							mountpoint: '/mnt/drive'
						]
						done()

			describe 'given darwin', ->

				beforeEach ->
					@osPlatformStub = sinon.stub(os, 'platform')
					@osPlatformStub.returns('darwin')

				afterEach ->
					@osPlatformStub.restore()

				it 'should execute darwin script', (done) ->
					drivelist.list (error, drives) ->
						expect(error).to.not.exist
						expect(drives).to.deep.equal [
							device: '/dev/disk2'
							description: 'My drive'
							size: '15 GB'
							mountpoint: '/Volumes/drive'
						]
						done()

			describe 'given an unsupported os', ->

				beforeEach ->
					@osPlatformStub = sinon.stub(os, 'platform')
					@osPlatformStub.returns('foobar')

				afterEach ->
					@osPlatformStub.restore()

				it 'should yield an unsupported error', ->
					expect ->
						drivelist.list(_.noop)
					.to.throw('Your OS is not supported by this module: foobar')
