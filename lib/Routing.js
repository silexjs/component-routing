var Routing = function() {};
Routing.prototype = {
	routes: {},
	compiledRoutes: {},
	config: {
		specialCharacters: '\\/.^$*+-?()[]|',
		variable: '\\{([A-Za-z0-9_]+)\\}',
		variableDefault: '[A-Za-z0-9\\s\\-_]+',
	},
	
	add: function(routes) {
		for(var routeName in routes) {
			this.routes[routeName] = routes[routeName];
		}
		return this;
	},
	compile: function(routes) {
		routes = routes || this.routes;
		
		for(var routeName in routes) {
			var route = routes[routeName];
			if(typeof route !== 'undefined' && typeof route.sub !== 'undefined') {
				if(route.prefix.length === 0 || route.prefix[0] !== '/') {
					route.prefix = '/'+route.prefix;
				}
				var routePrefix = this.clone(route.sub);
				for(var routeSubName in routePrefix) {
					for(var key in route) {
						if(key !== 'prefix' && key !== 'sub' && routePrefix[routeSubName][key] === undefined) {
							routePrefix[routeSubName][key] = route[key];
						}
					}
					if(routePrefix[routeSubName].prefix !== undefined) {
						if(route.prefix[route.prefix.length-1] === '/' && routePrefix[routeSubName].prefix[0] === '/') {
							route.prefix = route.prefix.substr(0, route.prefix.length-1);
						}
						routePrefix[routeSubName].prefix = route.prefix+routePrefix[routeSubName].prefix;
					} else {
						if(route.prefix[route.prefix.length-1] === '/' && routePrefix[routeSubName].path[0] === '/') {
							route.prefix = route.prefix.substr(0, route.prefix.length-1);
						}
						routePrefix[routeSubName].path = route.prefix+routePrefix[routeSubName].path;
					}
				}
				this.compile(routePrefix);
				continue;
			}
			
			var route = {
				config: route,
			};
			
			if(route.config.method === undefined) {
				route.config.method = ['GET', 'POST'];
			}
			route.config.host = route.config.host || null;
			route.config.path = route.config.path || '';
			route.config.defaults = route.config.defaults || {};
			route.config.requirements = route.config.requirements || {};
			
			if(route.config.host !== null && (route.config.host.length === 0 || route.config.host[route.config.host.length-1] !== '.')) {
				route.config.host = route.config.host+'.';
			}
			if(route.config.path.length === 0 || route.config.path[0] !== '/') {
				route.config.path = '/'+route.config.path;
			}
			
			route.regexHost = route.config.host;
			route.regexPath = route.config.path;
			var length = this.config.specialCharacters.length;
			for(var i=0; i<length; i++) {
				var specialCharacter = this.config.specialCharacters[i];
				var regex = new RegExp('\\'+specialCharacter, 'g');
				if(route.config.host !== null) {
					route.regexHost = route.regexHost.replace(regex, '\\'+specialCharacter);
				} else {
					route.regexHost = null;
				}
				route.regexPath = route.regexPath.replace(regex, '\\'+specialCharacter);
			}
			
			route.variables = {};
			route.variablesKey = [];
			var match;
			var regex = new RegExp(this.config.variable, 'g');
			if(route.regexHost !== null) {
				while(match = regex.exec(route.regexHost)) {
					route.variables[match[1]] = this.config.variableDefault;
					route.variablesKey.push(match[1]);
				}
			}
			while(match = regex.exec(route.regexPath)) {
				route.variables[match[1]] = this.config.variableDefault;
				route.variablesKey.push(match[1]);
			}
			for(var variableName in route.variables) {
				if(route.config.requirements[variableName] !== undefined) {
					route.variables[variableName] = route.config.requirements[variableName];
				}
				
				if(route.regexHost !== null) {
					var regex = '(('+route.variables[variableName]+')\\.)';
					if(route.config.defaults[variableName] !== undefined) {
						regex = regex+'?';
					}
					route.regexHost = route.regexHost.replace(new RegExp('\{'+variableName+'\}\\\\.', 'g'), regex);
				}
				
				var prefix = (variableName==='_format'?'\\.':'\\/');
				var regex = '('+prefix+'('+route.variables[variableName]+'))';
				if(route.config.defaults[variableName] !== undefined) {
					regex = regex+'?';
				}
				var prefix = (variableName==='_format'?'\\\\.':'\\\\/');
				route.regexPath = route.regexPath.replace(new RegExp(prefix+'\{'+variableName+'\}', 'g'), regex);
			}
			if(route.regexHost !== null) {
				route.regexHost = new RegExp('^'+route.regexHost+'$');
			}
			route.regexPath = new RegExp('^'+route.regexPath+'$');
			
			this.compiledRoutes[routeName] = route;
		}
		return this;
	},
	match: function(host, method, path) {
		if(host[host.length-1] !== '.') {
			host = host+'.';
		}
		host = host.toLowerCase();
		method = method.toUpperCase();
		for(var routeName in this.compiledRoutes) {
			var route = this.compiledRoutes[routeName];
			var matchHost = null;
			var matchPath = null;
			if((route.config.method === null || route.config.method.indexOf(method) !== -1)
			&& (route.regexHost === null || (matchHost = host.match(route.regexHost)) !== null)
			&& (matchPath = path.match(route.regexPath)) !== null) {
				var variables = {};
				var n = 0;
				if(matchHost !== null) {
					var matchHostLength = matchHost.length;
					for(var i=2; i<matchHostLength; i+=2) {
						variables[route.variablesKey[n]] = (matchHost[i]!==undefined?matchHost[i]:route.config.defaults[route.variablesKey[n]]);
						n++;
					}
				}
				var matchPathLength = matchPath.length;
				for(var i=2; i<matchPathLength; i+=2) {
					variables[route.variablesKey[n]] = (matchPath[i]!==undefined?matchPath[i]:route.config.defaults[route.variablesKey[n]]);
					n++;
				}
				for(var key in route.config.defaults) {
					if(variables[key] === undefined) {
						variables[key] = route.config.defaults[key];
					}
				}
				return {
					routeName: routeName,
					route: route.config,
					variables: variables,
				};
			}
		}
		return null;
	},
	generate: function(route, variables, secure) {
		var variables = variables || {};
		if(secure === undefined) { var secure = false; }
		if(this.compiledRoutes[route] === undefined) {
			throw new Error('ROUTING: The "'+route+'" route does not exist.');
		}
		var route = this.compiledRoutes[route];
		return route.config.path.replace(/\/\{([A-Za-z0-9_]+)\}/g, function(match, contents, offset, s) {
			var value = '';
			if(variables[contents] !== undefined) {
				value = variables[contents];
			} else if(route.config.defaults[contents] !== undefined) {
				value = route.config.defaults[contents];
			}
			return '/'+value;
		});
	},
	clone: function(obj) {
		var copy = {};
		for(var key in obj) {
			copy[key] = obj[key];
		}
		return copy;
	},
};


module.exports = Routing;
