chai = require('chai')
expect = chai.expect
sinon = require('sinon')
chai.use(require('sinon-chai'))
childProcess = require('child_process')
system = require('../lib/system')

describe 'System:', ->

	describe '.win32()', ->

		describe 'given Physicaldrive0', ->

			beforeEach ->
				@drive =
					device: '\\\\.\\PHYSICALDRIVE0'
					description: 'WDC WD10JPVX-75JC3T0'
					size: '1000 GB'

			it 'should return true', (done) ->
				system.win32 @drive, (isSystem) ->
					expect(isSystem).to.be.true
					done()

		describe 'given Physicaldrive1', ->

			beforeEach ->
				@drive =
					device: '\\\\.\\PHYSICALDRIVE1'
					description: 'Generic STORAGE DEVICE USB Device'
					size: undefined

			it 'should return false', (done) ->
				system.win32 @drive, (isSystem) ->
					expect(isSystem).to.be.false
					done()

	describe '.linux()', ->

		describe 'given a system drive', ->

			beforeEach ->
				@drive =
					device: '/dev/sda'
					description: 'WDC WD10JPVX-75J'
					size: '931,5G'

				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields null, '''
					NAME MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
					sda    8:0    0 931,5G  0 disk
				''', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should return true', (done) ->
				system.linux @drive, (isSystem) ->
					expect(isSystem).to.be.true
					done()

		describe 'given a problematic removable drive', ->

			beforeEach ->
				@drive =
					device: '/dev/sdb'
					description: 'Flash Reader'
					size: '14,9G'

				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields null, '''
					NAME MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
					sdb    8:16   1  14.9G  0 disk
				''', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should return false', (done) ->
				system.linux @drive, (isSystem) ->
					expect(isSystem).to.be.false
					done()

		describe 'given a removable drive', ->

			beforeEach ->
				@drive =
					device: '/dev/sdc'
					description: 'Storage Media'
					size: '7,3G'

				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields null, '''
					NAME MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
					sdc    8:32   1   7,3G  0 disk
				''', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should return false', (done) ->
				system.linux @drive, (isSystem) ->
					expect(isSystem).to.be.false
					done()

	describe '.darwin()', ->

		describe 'given previous output', ->

			describe 'given /dev/disk0', ->

				beforeEach ->
					@drive =
						device: '/dev/disk1'
						description: 'Macintosh HD'
						size: '249.8 GB'
						mountpoint: '/'

				it 'should return true', (done) ->
					system.darwin @drive, (isSystem) ->
						expect(isSystem).to.be.true
						done()

			describe 'given /dev/disk2', ->

				beforeEach ->
					@drive =
						device: '/dev/disk2'
						description: 'elementary OS'
						size: '15.7 GB'
						mountpoint: '/Volumes/Elementary'

				it 'should return false', (done) ->
					system.darwin @drive, (isSystem) ->
						expect(isSystem).to.be.false
						done()
