m = require('mochainon')
parse = require('../lib/parse')

describe 'Parse:', ->

	it 'should return an empty object if no input', ->
		m.chai.expect(parse()).to.deep.equal({})

	it 'should return an empty object if input is an empty string', ->
		m.chai.expect(parse('')).to.deep.equal({})

	it 'should return an empty object if input is a string containing only spaces', ->
		m.chai.expect(parse('    ')).to.deep.equal({})

	it 'should parse a single device', ->
		m.chai.expect parse '''
			device: /dev/disk1
			description: Macintosh HD
			size: 249.8 GB
			mountpoint: /
		'''
		.to.deep.equal [
			device: '/dev/disk1'
			description: 'Macintosh HD'
			size: '249.8 GB'
			mountpoint: '/'
		]

	it 'should parse multiple devices', ->
		m.chai.expect parse '''
			device: /dev/disk1
			description: Macintosh HD
			size: 249.8 GB
			mountpoint: /

			device: /dev/disk2
			description: elementary OS
			size: 15.7 GB
			mountpoint: /Volumes/Elementary
		'''
		.to.deep.equal [
			device: '/dev/disk1'
			description: 'Macintosh HD'
			size: '249.8 GB'
			mountpoint: '/'
		,
			device: '/dev/disk2'
			description: 'elementary OS'
			size: '15.7 GB'
			mountpoint: '/Volumes/Elementary'
		]

	it 'should omit blank devices', ->
		m.chai.expect parse '''
			device: /dev/disk1
			description: Macintosh HD
			size: 249.8 GB
			mountpoint: /

			device:
			description:
			size:
			mountpoint:
		'''
		.to.deep.equal [
			device: '/dev/disk1'
			description: 'Macintosh HD'
			size: '249.8 GB'
			mountpoint: '/'
		]

	it 'should ignore new lines after the output', ->
		m.chai.expect parse '''
			device: /dev/disk1
			description: Macintosh HD
			size: 249.8 GB
			mountpoint: /

			device: /dev/disk2
			description: elementary OS
			size: 15.7 GB
			mountpoint: /Volumes/Elementary



		'''
		.to.deep.equal [
			device: '/dev/disk1'
			description: 'Macintosh HD'
			size: '249.8 GB'
			mountpoint: '/'
		,
			device: '/dev/disk2'
			description: 'elementary OS'
			size: '15.7 GB'
			mountpoint: '/Volumes/Elementary'
		]

	it 'should discard trailing commas', ->
		m.chai.expect parse '''
			device: /dev/disk1
			hello: foo,bar,baz,
		'''
		.to.deep.equal [
			device: '/dev/disk1'
			hello: 'foo,bar,baz'
		]

	it 'should parse a truthy boolean', ->
		m.chai.expect parse '''
			device: /dev/disk1
			hello: True
		'''
		.to.deep.equal [
			device: '/dev/disk1'
			hello: true
		]

	it 'should parse a falsy boolean', ->
		m.chai.expect parse '''
			device: /dev/disk1
			hello: False
		'''
		.to.deep.equal [
			device: '/dev/disk1'
			hello: false
		]

	it 'should parse multiple devices that are heterogeneous', ->
		m.chai.expect parse '''
			device: /dev/disk1
			hello: world
			foo: bar

			device: /dev/disk2
			hey: there
		'''
		.to.deep.equal [
			device: '/dev/disk1'
			hello: 'world'
			foo: 'bar'
		,
			device: '/dev/disk2'
			hey: 'there'
		]

	it 'should set null for values without keys', ->
		m.chai.expect parse '''
			device: /dev/disk1
			hello:
		'''
		.to.deep.equal [
			device: '/dev/disk1'
			hello: null
		]

	it 'should interpret a word without colon as a key without value', ->
		m.chai.expect parse '''
			hello
		'''
		.to.deep.equal [
			hello: null
		]

	it 'should interpret multiple words without colon as a key without value', ->
		m.chai.expect parse '''
			hello world
		'''
		.to.deep.equal [
			'hello world': null
		]

	it 'should handle a double quote inside a value', ->
		m.chai.expect parse '''
			device: /dev/disk1
			description: "SAMSUNG SSD PM810 2.5" 7mm 256GB"
		'''
		.to.deep.equal [
			device: '/dev/disk1'
			description: 'SAMSUNG SSD PM810 2.5" 7mm 256GB'
		]

	it 'should handle multiple double quotes inside a value', ->
		m.chai.expect parse '''
			device: /dev/disk1
			description: "SAMSUNG "SSD" PM810 2.5" 7mm 256GB"
		'''
		.to.deep.equal [
			device: '/dev/disk1'
			description: 'SAMSUNG "SSD" PM810 2.5" 7mm 256GB'
		]
