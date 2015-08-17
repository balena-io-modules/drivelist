chai = require('chai')
expect = chai.expect
sinon = require('sinon')
chai.use(require('sinon-chai'))
childProcess = require('child_process')
linux = require('../lib/linux')

describe 'Drivelist LINUX:', ->

	describe '.list()', ->

		describe 'given correct output from lsblk', ->

			beforeEach ->
				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.withArgs('lsblk -d --output NAME,MODEL,SIZE').yields null, '''
					NAME MODEL              SIZE
					sda  WDC WD10JPVX-75J 931,5G
					sdb  STORAGE DEVICE    14,7G
					sr0  DVD+-RW GU90N     1024M
				''', undefined

				@childProcessStub.withArgs('grep "^/dev/sda" /proc/mounts | cut -d \' \' -f 2').yields null, '''
					/boot/efi
				''', undefined

				@childProcessStub.withArgs('grep "^/dev/sdb" /proc/mounts | cut -d \' \' -f 2').yields null, '''
					/media/johndoe/UNTITLED
				''', undefined

				@childProcessStub.withArgs('grep "^/dev/sr0" /proc/mounts | cut -d \' \' -f 2').yields null, '', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should extract the necessary information', (done) ->
				linux.list (error, drives) ->
					expect(error).to.not.exist

					expect(drives).to.deep.equal [
						{
							device: '/dev/sda'
							description: 'WDC WD10JPVX-75J'
							size: '931.5G'
							mountpoint: '/boot/efi'
						}
						{
							device: '/dev/sdb'
							description: 'STORAGE DEVICE'
							size: '14.7G'
							mountpoint: '/media/johndoe/UNTITLED'
						}
						{
							device: '/dev/sr0'
							description: 'DVD+-RW GU90N'
							size: '1024M'
							mountpoint: undefined
						}
					]

					return done()

		describe 'given lsblk output without model', ->

			beforeEach ->
				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.withArgs('lsblk -d --output NAME,MODEL,SIZE').yields null, '''
					NAME    MODEL           SIZE
					sda     SD Plus         3.8G
					mmcblk0                14.4G
				''', undefined

				@childProcessStub.withArgs('grep "^/dev/sda" /proc/mounts | cut -d \' \' -f 2').yields null, '''
					/boot/efi
				''', undefined

				@childProcessStub.withArgs('grep "^/dev/mmcblk0" /proc/mounts | cut -d \' \' -f 2').yields null, '''
					/media/johndoe/UNTITLED
				''', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should default model to undefined', (done) ->
				linux.list (error, drives) ->
					expect(error).to.not.exist

					expect(drives).to.deep.equal [
						{
							device: '/dev/sda'
							description: 'SD Plus'
							size: '3.8G'
							mountpoint: '/boot/efi'
						}
						{
							device: '/dev/mmcblk0'
							description: undefined
							size: '14.4G'
							mountpoint: '/media/johndoe/UNTITLED'
						}
					]

					return done()

		describe 'given stderr output', ->

			beforeEach ->
				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields(null, undefined, 'Hello World')

			afterEach ->
				@childProcessStub.restore()

			it 'should return an error containing stderr output', (done) ->
				linux.list (error, drives) ->
					expect(error).to.be.an.instanceof(Error)
					expect(error.message).to.equal('Hello World')
					expect(drives).not.exist
					done()

	describe '.isSystem()', ->

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
				linux.isSystem @drive, (isSystem) ->
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
				linux.isSystem @drive, (isSystem) ->
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
				linux.isSystem @drive, (isSystem) ->
					expect(isSystem).to.be.false
					done()
