(new (require('spaceload'))(true, './')).registerFile(require('../package.json').autoload);

var assert = require('assert');

var Routing = USE('Silex.Component.Routing.Routing');


describe('Create routing', function() {
	var routing = new Routing();
	
	it('Add routes', function() {
		routing.add({
			homepage: {
				defaults: {
					_controller: 'SitexwSiteBundle:Default:index',
				},
			},
			test_a: {
				method: ['GET'],
				host: '{_local}.sitexw.fr',
				path: '/hello/{firstname}/{lastname}/{color}.{_format}',
				defaults: {
					_controller: 'SitexwSiteBundle:Default:hello',
					_local: 'fr',
					_format: 'html',
					color: 'red',
				},
				requirements: {
					_local: 'fr|en|es|de',
					_format: 'html|txt|xml|json',
					firstname: '[a-z]+\\-[a-z]+',
				},
			},
			test_b: {
				method: ['DELETE'],
				host: 'sitexw.local',
				prefix: '/prefix',
				sub: {
					test_c: {
						prefix: '/sub-prefix',
						sub: {
							test_d: {
								method: null,
								path: '/my/pseudo/is/{pseudo}',
								defaults: {
									_controller: 'SitexwSiteBundle:Prefix:name',
								},
							},
							test_e: {
								path: '/simple',
								defaults: {
									_controller: 'SitexwSiteBundle:Prefix:simple',
								},
							},
						},
					},
					test_f: {
						prefix: '/prefix-sub',
						sub: {
							test_g: {
								path: '/simple',
								defaults: {
									_controller: 'SitexwSiteBundle:Prefix2:simple',
								},
							},
							test_h: {
								prefix: '/prefix-sub-sub',
								sub: {
									test_i: {
										method: null,
										path: '/simple',
										defaults: {
											_controller: 'SitexwSiteBundle:Prefix2:simpleSub',
										},
									},
								},
							},
						},
					},
				},
			},
		});
	});
	
	it('Compile routes', function() {
		routing.compile();
	});
	
	describe('Test routes with queries', function() {
		var queries = [
			{
				title:		'Home Page - 1',
				routeName:	'homepage',
				host:		'sitexw.fr',
				method:		'GET',
				path:		'/',
			},
			{
				title:		'Home Page - 2',
				routeName:	'homepage',
				host:		'localhost',
				method:		'POST',
				path:		'/',
			},
			{
				title:		'Home Page - 3',
				routeName:	null,
				host:		'sitexw.fr',
				method:		'DELETE',
				path:		'/',
			},
			//---------------------------------------------------------
			{
				title:		'Test A - 1',
				routeName:	'test_a',
				host:		'en.sitexw.fr',
				method:		'GET',
				path:		'/hello/pol-valentin/dupont/red.html',
			},
			{
				title:		'Test A - 2',
				routeName:	'test_a',
				host:		'sitexw.fr',
				method:		'GET',
				path:		'/hello/pol-valentin/dupont.txt',
				variables:	{
								'_local':	'fr',
								'color':	'red',
								'_format':	'txt',
							},
			},
			{
				title:		'Test A - 3',
				routeName:	null,
				host:		'sitexw.fr',
				method:		'POST',
				path:		'/hello/pol-valentin/dupont/red.html',
			},
			//---------------------------------------------------------
			{
				title:		'Test D - 1',
				routeName:	'test_d',
				host:		'sitexw.local',
				method:		'GET',
				path:		'/prefix/sub-prefix/my/pseudo/is/sitexw',
				variables:	{
								'pseudo':	'sitexw',
							},
			},
			//---------------------------------------------------------
			{
				title:		'Test E - 1',
				routeName:	'test_e',
				host:		'sitexw.local',
				method:		'DELETE',
				path:		'/prefix/sub-prefix/simple',
			},
			{
				title:		'Test E - 2',
				routeName:	null,
				host:		'sitexw.local',
				method:		'GET',
				path:		'/prefix/sub-prefix/simple',
			},
			//---------------------------------------------------------
			{
				title:		'Test G - 1',
				routeName:	'test_g',
				host:		'sitexw.local',
				method:		'DELETE',
				path:		'/prefix/prefix-sub/simple',
			},
			{
				title:		'Test G - 2',
				routeName:	null,
				host:		'sitexw.local',
				method:		'GET',
				path:		'/prefix/prefix-sub/simple',
			},
			{
				title:		'Test G - 3',
				routeName:	null,
				host:		'sitexw.fr',
				method:		'DELETE',
				path:		'/prefix/prefix-sub/simple',
			},
			//---------------------------------------------------------
			{
				title:		'Test I - 1',
				routeName:	'test_i',
				host:		'sitexw.local',
				method:		'GET',
				path:		'/prefix/prefix-sub/prefix-sub-sub/simple',
			},
			{
				title:		'Test I - 2',
				routeName:	null,
				host:		'sitexw.local',
				method:		'GET',
				path:		'/prefix/prefix-sub/prefix-sub-sub/simple2',
			},
		];
		for(var i in queries) {
			var result = null;
			it(queries[i].title, function() {
				result = routing.match(queries[i].host, queries[i].method, queries[i].path);
				assert.equal((result===null?result:result.routeName), queries[i].routeName);
			});
			if(queries[i].variables !== undefined) {
				it(queries[i].title+' (variables)', function() {
					for(var variableName in queries[i].variables) {
						assert.equal(result.variables[variableName], queries[i].variables[variableName]);
					}
				});
			}
		}
	});
});
