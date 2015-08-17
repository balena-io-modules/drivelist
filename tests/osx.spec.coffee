chai = require('chai')
expect = chai.expect
sinon = require('sinon')
chai.use(require('sinon-chai'))
childProcess = require('child_process')
osx = require('../lib/osx')

describe 'Drivelist OSX:', ->

	describe '.list()', ->

		describe 'given correct output from diskdrive', ->

			beforeEach ->
				@childProcessStub = sinon.stub(childProcess, 'exec')

				@childProcessStub.withArgs('diskutil list').yields null, '''
					/dev/disk0
						 #:                       TYPE NAME                    SIZE       IDENTIFIER
						 0:      GUID_partition_scheme                        *750.2 GB   disk0
						 1:                        EFI EFI                     209.7 MB   disk0s1
						 2:          Apple_CoreStorage                         749.3 GB   disk0s2
						 3:                 Apple_Boot Recovery HD             650.0 MB   disk0s3
					/dev/disk1
						 #:                       TYPE NAME                    SIZE       IDENTIFIER
						 0:                  Apple_HFS Macintosh HD           *748.9 GB   disk1
																					 Logical Volume on disk0s2
																					 3D74D961-80FB-4DB1-808F-8B5800C53E3A
																					 Unlocked Encrypted
					/dev/disk2
						 #:                       TYPE NAME                    SIZE       IDENTIFIER
						 0:                            elementary OS          *15.7 GB    disk2
				''', undefined

				@childProcessStub.withArgs('diskutil info /dev/disk0').yields null, '''
					Device Identifier:        disk0
					Device Node:              /dev/disk0
					Part of Whole:            disk0
					Device / Media Name:      APPLE SSD SM0256G Media

					Volume Name:              Not applicable (no file system)

					Mounted:                  Not applicable (no file system)

					File System:              None

					Content (IOContent):      GUID_partition_scheme
					OS Can Be Installed:      No
					Media Type:               Generic
					Protocol:                 PCI
					SMART Status:             Verified

					Total Size:               251.0 GB (251000193024 Bytes) (exactly 490234752 512-Byte-Units)
					Volume Free Space:        Not applicable (no file system)
					Device Block Size:        512 Bytes

					Read-Only Media:          No
					Read-Only Volume:         Not applicable (no file system)
					Ejectable:                No

					Whole:                    Yes
					Internal:                 Yes
					Solid State:              Yes
					OS 9 Drivers:             No
					Low Level Format:         Not supported
				''', undefined

				@childProcessStub.withArgs('diskutil info /dev/disk1').yields null, '''
					Device Identifier:        disk1
					Device Node:              /dev/disk1
					Part of Whole:            disk1
					Device / Media Name:      Macintosh HD

					Volume Name:              Macintosh HD

					Mounted:                  Yes
					Mount Point:              /

					File System Personality:  Journaled HFS+
					Type (Bundle):            hfs
					Name (User Visible):      Mac OS Extended (Journaled)
					Journal:                  Journal size 24576 KB at offset 0x19502000
					Owners:                   Enabled

					Content (IOContent):      Apple_HFS
					OS Can Be Installed:      Yes
					Recovery Disk:            disk0s3
					Media Type:               Generic
					Protocol:                 PCI
					SMART Status:             Not Supported
					Volume UUID:              02768F72-AD55-36DD-8EE1-0ADB0590BE56
					Disk / Partition UUID:    DCD23031-6322-4269-A142-CD36C8FD95D7

					Total Size:               249.8 GB (249779191808 Bytes) (exactly 487849984 512-Byte-Units)
					Volume Free Space:        201.8 GB (201823002624 Bytes) (exactly 394185552 512-Byte-Units)
					Device Block Size:        512 Bytes
					Allocation Block Size:    4096 Bytes

					Read-Only Media:          No
					Read-Only Volume:         No
					Ejectable:                No

					Whole:                    Yes
					Internal:                 Yes
					Solid State:              Yes
					OS 9 Drivers:             No
					Low Level Format:         Not supported

					This disk is a Core Storage Logical Volume (LV).  Core Storage Information:
					LV UUID:                  DCD23031-6322-4269-A142-CD36C8FD95D7
					LVF UUID:                 C3BB8BBF-B377-416F-AF8F-07BE6E36B90C
					LVG UUID:                 BEBAA479-1F77-4691-9911-10A5580850DF
					Fusion Drive:             No
					Encrypted:                Yes
				''', undefined

				@childProcessStub.withArgs('diskutil info /dev/disk2').yields null, '''
					Device Identifier:        disk2
					Device Node:              /dev/disk2
					Part of Whole:            disk2
					Device / Media Name:      Sony Storage Media Media

					Volume Name:              Not applicable (no file system)

					Mounted:                  Yes
					Mount Point:              /Volumes/Elementary

					File System:              None

					Content (IOContent):      FDisk_partition_scheme
					OS Can Be Installed:      No
					Media Type:               Generic
					Protocol:                 USB
					SMART Status:             Not Supported

					Total Size:               7.8 GB (7801405440 Bytes) (exactly 15237120 512-Byte-Units)
					Volume Free Space:        Not applicable (no file system)
					Device Block Size:        512 Bytes

					Read-Only Media:          No
					Read-Only Volume:         Not applicable (no file system)
					Ejectable:                Yes

					Whole:                    Yes
					Internal:                 No
					OS 9 Drivers:             No
					Low Level Format:         Not supported
				''', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should extract the necessary information', (done) ->
				osx.list (error, drives) ->
					expect(error).to.not.exist

					expect(drives).to.deep.equal [
						{
							device: '/dev/disk0'
							description: 'GUID_partition_scheme'
							size: '*750.2 GB'
							mountpoint: undefined
						}
						{
							device: '/dev/disk1'
							description: 'Apple_HFS Macintosh HD'
							size: '*748.9 GB'
							mountpoint: '/'
						}
						{
							device: '/dev/disk2'
							description: 'elementary OS'
							size: '*15.7 GB'
							mountpoint: '/Volumes/Elementary'
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
				osx.list (error, drives) ->
					expect(error).to.be.an.instanceof(Error)
					expect(error.message).to.equal('Hello World')
					expect(drives).not.exist
					done()

	describe '.isSystem()', ->

		describe 'given previous output', ->

			describe 'given /dev/disk0', ->

				beforeEach ->
					@drive =
						device: '/dev/disk0'
						description: 'GUID_partition_scheme'
						size: '*750.2 GB'

					@childProcessStub = sinon.stub(childProcess, 'exec')
					@childProcessStub.yields null, '''
						Device Identifier:        disk0
						Device Node:              /dev/disk0
						Part of Whole:            disk0
						Device / Media Name:      APPLE HDD HTS541075A9E662 Media

						Volume Name:              Not applicable (no file system)

						Mounted:                  Not applicable (no file system)

						File System:              None

						Content (IOContent):      GUID_partition_scheme
						OS Can Be Installed:      No
						Media Type:               Generic
						Protocol:                 SATA
						SMART Status:             Verified

						Total Size:               750.2 GB (750156374016 Bytes) (exactly 1465149168 512-Byte-Units)
						Volume Free Space:        Not applicable (no file system)
						Device Block Size:        512 Bytes

						Read-Only Media:          No
						Read-Only Volume:         Not applicable (no file system)
						Ejectable:                No

						Whole:                    Yes
						Internal:                 Yes
						Solid State:              No
						OS 9 Drivers:             No
						Low Level Format:         Not supported
					''', undefined

				afterEach ->
					@childProcessStub.restore()

				it 'should return true', (done) ->
					osx.isSystem @drive, (isSystem) ->
						expect(isSystem).to.be.true
						done()

			describe 'given /dev/disk1', ->

				beforeEach ->
					@drive =
						device: '/dev/disk1'
						description: 'Apple_HFS Macintosh HD'
						size: '*748.9 GB'

					@childProcessStub = sinon.stub(childProcess, 'exec')
					@childProcessStub.yields null, '''
						Device Identifier:        disk1
						Device Node:              /dev/disk1
						Part of Whole:            disk1
						Device / Media Name:      Macintosh HD

						Volume Name:              Macintosh HD

						Mounted:                  Yes
						Mount Point:              /

						File System Personality:  Journaled HFS+
						Type (Bundle):            hfs
						Name (User Visible):      Mac OS Extended (Journaled)
						Journal:                  Journal size 57344 KB at offset 0x12ad1000
						Owners:                   Enabled

						Content (IOContent):      Apple_HFS
						OS Can Be Installed:      Yes
						Recovery Disk:            disk0s3
						Media Type:               Generic
						Protocol:                 SATA
						SMART Status:             Not Supported
						Volume UUID:              D62D3791-1231-3C7C-A99B-85FD8FB641C9
						Disk / Partition UUID:    3D74D961-80FB-4DB1-808F-8B5800C53E3A

						Total Size:               748.9 GB (748925353984 Bytes) (exactly 1462744832 512-Byte-Units)
						Volume Free Space:        452.4 GB (452423471104 Bytes) (exactly 883639592 512-Byte-Units)
						Device Block Size:        512 Bytes
						Allocation Block Size:    4096 Bytes

						Read-Only Media:          No
						Read-Only Volume:         No
						Ejectable:                No

						Whole:                    Yes
						Internal:                 Yes
						Solid State:              No
						OS 9 Drivers:             No
						Low Level Format:         Not supported

						This disk is a Core Storage Logical Volume (LV).  Core Storage Information:
						LV UUID:                  3D74D961-80FB-4DB1-808F-8B5800C53E3A
						LVF UUID:                 EBCD7AD2-9680-40A0-A12B-F7F1C8563B65
						LVG UUID:                 E661E0E3-9670-48D3-BFBF-1C7B59803E78
						Fusion Drive:             No
						Encrypted:                Yes
					''', undefined

				afterEach ->
					@childProcessStub.restore()

				it 'should return true', (done) ->
					osx.isSystem @drive, (isSystem) ->
						expect(isSystem).to.be.true
						done()

			describe 'given /dev/disk2', ->

				beforeEach ->
					@drive =
						device: '/dev/disk2'
						description: 'JVIOTTI'
						size: '*7.8 GB'

					@childProcessStub = sinon.stub(childProcess, 'exec')
					@childProcessStub.yields null, '''
						Device Identifier:        disk2
						Device Node:              /dev/disk2
						Part of Whole:            disk2
						Device / Media Name:      Sony Storage Media Media

						Volume Name:              Not applicable (no file system)

						Mounted:                  Not applicable (no file system)

						File System:              None

						Content (IOContent):      FDisk_partition_scheme
						OS Can Be Installed:      No
						Media Type:               Generic
						Protocol:                 USB
						SMART Status:             Not Supported

						Total Size:               7.8 GB (7801405440 Bytes) (exactly 15237120 512-Byte-Units)
						Volume Free Space:        Not applicable (no file system)
						Device Block Size:        512 Bytes

						Read-Only Media:          No
						Read-Only Volume:         Not applicable (no file system)
						Ejectable:                Yes

						Whole:                    Yes
						Internal:                 No
						OS 9 Drivers:             No
						Low Level Format:         Not supported
					''', undefined

				afterEach ->
					@childProcessStub.restore()

				it 'should return false', (done) ->
					osx.isSystem @drive, (isSystem) ->
						expect(isSystem).to.be.false
						done()

		describe 'given stderr output', ->

			beforeEach ->
				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields(null, undefined, 'Hello World')

			afterEach ->
				@childProcessStub.restore()

			it 'should return false', (done) ->
				drive =
					device: '/dev/disk0'
					description: 'GUID_partition_scheme'
					size: '*750.2 GB'

				osx.isSystem drive, (isSystem) ->
					expect(isSystem).to.be.false
					done()

