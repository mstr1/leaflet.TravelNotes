(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
 *
 * Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
 * by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)
 *
 * @module polyline
 */

var polyline = {};

function py2_round(value) {
    // Google's polyline algorithm uses the same rounding strategy as Python 2, which is different from JS for negative values
    return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1);
}

function encode(current, previous, factor) {
    current = py2_round(current * factor);
    previous = py2_round(previous * factor);
    var coordinate = current - previous;
    coordinate <<= 1;
    if (current - previous < 0) {
        coordinate = ~coordinate;
    }
    var output = '';
    while (coordinate >= 0x20) {
        output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
        coordinate >>= 5;
    }
    output += String.fromCharCode(coordinate + 63);
    return output;
}

/**
 * Decodes to a [latitude, longitude] coordinates array.
 *
 * This is adapted from the implementation in Project-OSRM.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Array}
 *
 * @see https://github.com/Project-OSRM/osrm-frontend/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
 */
polyline.decode = function(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

/**
 * Encodes the given [latitude, longitude] coordinates array.
 *
 * @param {Array.<Array.<Number>>} coordinates
 * @param {Number} precision
 * @returns {String}
 */
polyline.encode = function(coordinates, precision) {
    if (!coordinates.length) { return ''; }

    var factor = Math.pow(10, precision || 5),
        output = encode(coordinates[0][0], 0, factor) + encode(coordinates[0][1], 0, factor);

    for (var i = 1; i < coordinates.length; i++) {
        var a = coordinates[i], b = coordinates[i - 1];
        output += encode(a[0], b[0], factor);
        output += encode(a[1], b[1], factor);
    }

    return output;
};

function flipped(coords) {
    var flipped = [];
    for (var i = 0; i < coords.length; i++) {
        flipped.push(coords[i].slice().reverse());
    }
    return flipped;
}

/**
 * Encodes a GeoJSON LineString feature/geometry.
 *
 * @param {Object} geojson
 * @param {Number} precision
 * @returns {String}
 */
polyline.fromGeoJSON = function(geojson, precision) {
    if (geojson && geojson.type === 'Feature') {
        geojson = geojson.geometry;
    }
    if (!geojson || geojson.type !== 'LineString') {
        throw new Error('Input must be a GeoJSON LineString');
    }
    return polyline.encode(flipped(geojson.coordinates), precision);
};

/**
 * Decodes to a GeoJSON LineString geometry.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Object}
 */
polyline.toGeoJSON = function(str, precision) {
    var coords = polyline.decode(str, precision);
    return {
        type: 'LineString',
        coordinates: flipped(coords)
    };
};

if (typeof module === 'object' && module.exports) {
    module.exports = polyline;
}

},{}],2:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- DataSearchEngine.js file -----------------------------------------------------------------------------------------------
This file contains:
	- the DataSearchEngine object
	- the module.exports implementation
Changes:
	- v1.4.0:
		- created from DataManager
Doc reviewed ...
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';
	
	var DataSearchEngine = function ( ) {

		var _TravelNotesData = require ( '../L.TravelNotes' );
		
		/*
		--- getRoute function -------------------------------------------------------------------------------------

		This function returns a route when giving the routeObjId
		
		-----------------------------------------------------------------------------------------------------------
		*/

		var _GetRoute = function ( routeObjId ) {
			var route = null;
			route = _TravelNotesData.travel.routes.getAt ( routeObjId );
			if ( ! route ) {
				if ( routeObjId === _TravelNotesData.editedRoute.objId ) {
					route = _TravelNotesData.editedRoute;
				}
			}
			if ( ! route ) {
				console.log ( 'Invalid noteObjId ' + routeObjId + ' for function DataSearchEngine.getRoute ( )' );
			}

			return route;
		};

		/*
		--- _GetNoteAndRoute method --------------------------------------------------------------------------------

		This function returns a note and a route ( when the note is linked to a route ) from the noteObjId
		
		-----------------------------------------------------------------------------------------------------------
		*/

		var _GetNoteAndRoute = function ( noteObjId ) {
			var note = null;
			note = _TravelNotesData.travel.notes.getAt ( noteObjId );
			if ( note ) {
				return { note : note, route : null };
			}
			var routeIterator = _TravelNotesData.travel.routes.iterator;
			while ( ! routeIterator.done ) {
				note = routeIterator.value.notes.getAt ( noteObjId );
				if ( note ) {
					return { note : note, route : routeIterator.value };
				}
			}
			note = _TravelNotesData.editedRoute.notes.getAt ( noteObjId );
			if ( ! note ) {
				console.log ( 'Invalid noteObjId ' + noteObjId + ' for function DataSearchEngine.getNote ( )' );
				return { note : null, route : null };
			}

			return { note : note, route : _TravelNotesData.editedRoute };
		};
		
		/*
		--- _GetWayPoint method -----------------------------------------------------------------------------------

		This function returns a wayPoint from the wayPointObjId
		
		-----------------------------------------------------------------------------------------------------------
		*/

		var _GetWayPoint = function ( wayPointObjId ) {
			var wayPoint = null;
			var routeIterator = _TravelNotesData.travel.routes.iterator;
			while ( ! routeIterator.done ) {
				wayPoint = routeIterator.value.wayPoints.getAt ( wayPointObjId );
				if ( wayPoint ) {
					return wayPoint;
				}
			}
			wayPoint = _TravelNotesData.editedRoute.wayPoints.getAt ( wayPointObjId );
			if ( ! wayPoint ) {
				console.log ( 'Invalid wayPointObjId ' + wayPointObjId + ' for function DataSearchEngine.getWayPoint ( )' );
				return null;
			}
			return wayPoint;
		};

		/* 
		--- DataSearchEngine object -----------------------------------------------------------------------------------
		
		---------------------------------------------------------------------------------------------------------------
		*/
		
		return {
			getRoute : function ( routeObjId ) { return _GetRoute ( routeObjId ); },
			getNoteAndRoute : function ( noteObjId ) { return _GetNoteAndRoute ( noteObjId ); },
			getWayPoint : function ( wayPointObjId ) { return _GetWayPoint ( wayPointObjId ); }
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = DataSearchEngine;
	}

} ) ( );

/*
--- End of DataSearchEngine.js file ----------------------------------------------------------------------------------------
*/
},{"../L.TravelNotes":7}],3:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- Itinerary.js file -------------------------------------------------------------------------------------------------
This file contains:
	- the Itinerary object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170925
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';

	var _ObjType = require ( '../data/ObjType' ) ( 'Itinerary', require ( './Version' ) );

	/*
	--- Itinerary object ----------------------------------------------------------------------------------------------

	Patterns : Closure

	-------------------------------------------------------------------------------------------------------------------
	*/

	var Itinerary = function ( ) {

		// Private variables

		var _Provider = '';

		var _TransitMode = '';

		var _ItineraryPoints = require ( '../data/Collection' ) ( 'ItineraryPoint' );

		var _Maneuvers = require ( '../data/Collection' ) ( 'Maneuver' );

		var _ObjId = require ( '../data/ObjId' ) ( );

		return {

			// getters and setters...

			get itineraryPoints ( ) { return _ItineraryPoints; },

			get maneuvers ( ) { return _Maneuvers; },

			get provider ( ) { return _Provider; },
			set provider ( Provider ) { _Provider = Provider; },

			get transitMode ( ) { return _TransitMode; },
			set transitMode ( TransitMode ) { _TransitMode = TransitMode; },

			get objId ( ) { return _ObjId; },

			get objType ( ) { return _ObjType; },

			get object ( ) {
				return {
					itineraryPoints : _ItineraryPoints.object,
					maneuvers : _Maneuvers.object,
					provider : _Provider,
					transitMode : _TransitMode,
					objId : _ObjId,
					objType : _ObjType.object
				};
			},
			set object ( Object ) {
				Object = _ObjType.validate ( Object );
				_ItineraryPoints.object = Object.itineraryPoints || [];
				_Maneuvers.object = Object.maneuvers || [];
				_Provider = Object.provider || '';
				_TransitMode = Object.transitMode || '';
				_ObjId = require ( '../data/ObjId' ) ( );
				// rebuilding links between maneuvers and itineraryPoints
				var itineraryPointObjIdMap = new Map ( );
				var sourceCounter = 0;
				var targetIterator = _ItineraryPoints.iterator;
				while ( ! targetIterator.done ) {
					itineraryPointObjIdMap.set ( Object.itineraryPoints [ sourceCounter ].objId, targetIterator.value.objId );
					sourceCounter ++;
				}
				var maneuverIterator = _Maneuvers.iterator;
				while ( ! maneuverIterator.done ) {
					maneuverIterator.value.itineraryPointObjId = itineraryPointObjIdMap.get ( maneuverIterator.value.itineraryPointObjId );
				}
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Itinerary;
	}

} ) ( );

/*
--- End of Itinerary.js file ------------------------------------------------------------------------------------------
*/
},{"../data/Collection":33,"../data/ObjId":39,"../data/ObjType":40,"./Version":6}],4:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- Route.js file -----------------------------------------------------------------------------------------------------
This file contains:
	- the Route object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	-v1.1.0:
		- Issue #33: Add a command to hide a route
		- Issue #36: Add a linetype property to route
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170926
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';

	var _ObjType = require ( '../data/ObjType' ) ( 'Route', require ( './Version' ) );

	var Route = function ( ) {

		// Private variables

		var _Name = '';

		var _WayPoints = require ( '../data/Collection' ) ( 'WayPoint' );
		_WayPoints.add ( require ( '../data/Waypoint' ) ( ) );
		_WayPoints.add ( require ( '../data/Waypoint' ) ( ) );

		var _Notes = require ( '../data/Collection' ) ( 'Note' );

		var _Itinerary = require ( '../data/Itinerary' ) ( );

		var _Width = require ( '../L.TravelNotes' ).config.route.width || 5;

		var _Color = require ( '../L.TravelNotes' ).config.route.color || '#ff0000';
		
		var _DashArray = require ( '../L.TravelNotes' ).config.route.dashArray || 0;

		var _Chain = false;

		var _ChainedDistance = 0;

		var _Distance = 0;

		var _Duration = 0;
		
		var _Hidden = false;

		var _ObjId = require ( '../data/ObjId' ) ( );

		return {

			// getters and setters...

			get wayPoints ( ) { return _WayPoints; },

			get itinerary ( ) { return _Itinerary; },

			get notes ( ) { return _Notes; },

			get name ( ) { return _Name; },
			set name ( Name ) { _Name = Name;},

			get width ( ) { return _Width; },
			set width ( Width ) { _Width = Width; },

			get color ( ) { return _Color; },
			set color ( Color ) { _Color = Color; },

			get dashArray ( ) { return _DashArray; },
			set dashArray ( DashArray ) { _DashArray = DashArray; },

			get chain ( ) { return _Chain; },
			set chain ( Chain ) { _Chain = Chain; },

			get chainedDistance ( ) { return _ChainedDistance; },
			set chainedDistance ( ChainedDistance ) { _ChainedDistance = ChainedDistance; },

			get distance ( ) { return _Distance; },
			set distance ( Distance ) { _Distance = Distance; },

			get duration ( ) { return _Duration; },
			set duration ( Duration ) { _Duration = Duration; },

			get hidden ( ) { return _Hidden; },
			set hidden ( Hidden ) { _Hidden = Hidden; },

			get objId ( ) { return _ObjId; },

			get objType ( ) { return _ObjType; },

			get object ( ) {
				return {
					name : _Name,
					wayPoints : _WayPoints.object,
					notes : _Notes.object,
					itinerary : _Itinerary.object,
					width : _Width,
					color : _Color,
					dashArray : _DashArray,
					chain :_Chain,
					distance : parseFloat ( _Distance.toFixed ( 2 ) ),
					duration : _Duration,
					hidden : _Hidden,
					chainedDistance : parseFloat ( _ChainedDistance.toFixed ( 2 ) ),
					objId : _ObjId,
					objType : _ObjType.object
				};
			},
			set object ( Object ) {
				Object = _ObjType.validate ( Object );
				_Name = Object.name || '';
				_WayPoints.object = Object.wayPoints || [];
				_Notes.object = Object.notes || [];
				_Itinerary.object = Object.itinerary || require ( './Itinerary' ) ( ).object;
				_Width = Object.width || 5;
				_Color = Object.color || '#000000';
				_DashArray = Object.dashArray || 0;
				_Chain = Object.chain || false;
				_Distance = Object.distance;
				_Duration = Object.duration;
				_Hidden = Object.hidden || false;
				_ChainedDistance = Object.chainedDistance;
				_ObjId = require ( '../data/ObjId' ) ( );
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Route;
	}

} ) ( );

/*
--- End of Route.js file ----------------------------------------------------------------------------------------------
*/
},{"../L.TravelNotes":7,"../data/Collection":33,"../data/Itinerary":35,"../data/ObjId":39,"../data/ObjType":40,"../data/Waypoint":46,"./Itinerary":3,"./Version":6}],5:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- Travel.js file ----------------------------------------------------------------------------------------------------
This file contains:
	- the Travel object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170926
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';

	var _ObjType = require ( '../data/ObjType' ) ( 'Travel', require ( './Version' ) );

	var Travel = function ( ) {

		// Private variables

		var _Name = 'TravelNotes';

		var _Routes = require ( '../data/Collection' ) ( 'Route' );

		var _Notes = require ( '../data/Collection' ) ( 'Note' );

		var _ObjId = require ( '../data/ObjId' ) ( );
		
		var _UserData = {};

		return {

			// getters and setters...

			get routes ( ) { return _Routes; },

			get notes ( ) { return _Notes; },

			get name ( ) { return _Name; },
			set name ( Name ) { _Name = Name;},

			get userData ( ) { return _UserData; },
			set userData ( UserData ) { _UserData = UserData;},

			get objId ( ) { return _ObjId; },

			get objType ( ) { return _ObjType; },

			get object ( ) {
				return {
					name : _Name,
					routes : _Routes.object,
					notes : _Notes.object,
					userData : _UserData,
					objId : _ObjId,
					objType : _ObjType.object
				};
			},
			set object ( Object ) {
				Object = _ObjType.validate ( Object );
				_Name = Object.name || '';
				_UserData = Object.userData || {};
				_Routes.object = Object.routes || [];
				_Notes.object = Object.notes || [];
				_ObjId = require ( '../data/ObjId' ) ( );
			}
		};
	};
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Travel;
	}

} ) ( );

/*
--- End of Travel.js file ---------------------------------------------------------------------------------------------
*/
},{"../data/Collection":33,"../data/ObjId":39,"../data/ObjType":40,"./Version":6}],6:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
/*
--- Version.js file ---------------------------------------------------------------------------------------------------
This file contains:
	- the version number
	- v1.4.0:
		- created from DataManager
Doc reviewed ....

-----------------------------------------------------------------------------------------------------------------------
*/
( function ( ) {
	
	'use strict';
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = '1.3.0';
	}
	
} ) ( );

/*
--- End of Version.js file --------------------------------------------------------------------------------------------
*/
},{}],7:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- L.TravelNotes.js file -------------------------------------------------------------------------------------
This file contains:
	- the L.TravelNotes object
Changes:
	- v1.0.0:
		- created
	- v1.1.0:
		- Issue #26 : added confirmation message before leaving the page when data modified.
		- Issue #27 : push directly the route in the editor when starting a new travel
	- v1.3.0:
		- Improved _ReadURL method
		- Working with Promise at startup
		- Added baseDialog property
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
		- removing interface
		- moving file functions from TravelEditor to the new FileLoader
		- added loading of osmSearch

Doc reviewed 20171001
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/


( function ( ){
	
	'use strict';


	/* 
	--- TravelNotes object --------------------------------------------------------------------------------------------
	
	This object contains all you need to use TravelNotes :-)
	
	Patterns : Closure
	-------------------------------------------------------------------------------------------------------------------
	*/

	var TravelNotes = function ( ) {

		var _TravelNotesData = require ( './data/TravelNotesData' ) ( );
		if ( typeof module !== 'undefined' && module.exports ) {
			module.exports = _TravelNotesData;
		}
		
		var _LeftUserContextMenuData = [];
		var _RightUserContextMenuData = [];
		var _HaveLeftContextMenu = false;
		var _HaveRightContextMenu = false;
		
		var _Langage = null;
		
		var _TravelUrl = null;
	
		/*
		--- _ReadURL function -----------------------------------------------------------------------------------------

		This function extract the route providers API key from the url

		---------------------------------------------------------------------------------------------------------------
		*/

		var _ReadURL = function ( ) {
			var newUrlSearch = '?' ;
			( decodeURI ( window.location.search ).substr ( 1 ).split ( '&' ) ).forEach ( 
				function ( urlSearchSubString ){
					if ( 'fil=' === urlSearchSubString.substr ( 0, 4 ).toLowerCase ( ) ) {
						// Needed to first extract the file name because the file name 
						// can contains some = chars (see base64 specs)
						_TravelUrl = decodeURIComponent ( escape( atob ( urlSearchSubString.substr ( 4 ) ) ) );
						newUrlSearch += ( newUrlSearch === '?' ) ? '' :  '&';
						newUrlSearch += urlSearchSubString;
					}
					else {
						var param = urlSearchSubString.split ( '=' );
						if ( 2 === param.length ) {
							if ( -1 !== param [ 0 ].indexOf ( 'ProviderKey' )  ) {
								var providerName = param [ 0 ].substr ( 0, param [ 0 ].length - 11 ).toLowerCase ( );
								var provider = _TravelNotesData.providers.get ( providerName );
								if ( provider && provider.providerKeyNeeded ) {
									provider.providerKey = param [ 1 ];
								}
								sessionStorage.setItem ( providerName, btoa ( param [ 1 ] ) );
							}
							else {
								newUrlSearch += ( newUrlSearch === '?' ) ? '' :  '&';
								newUrlSearch += urlSearchSubString;
								if ( 'lng' === param [ 0 ].toLowerCase ( ) ) {
									_Langage = param [ 1 ].toLowerCase ( );
								}
							}
						}
					}
				}
			);
			var stateObj = { index: "bar" };
			history.replaceState ( stateObj, "page", newUrlSearch );
			
			_TravelNotesData.providers.forEach (
				function ( provider ) {
					if ( provider.providerKeyNeeded && 0 === provider.providerKey ) {
						var providerKey = null;
						if ( require ( './util/Utilities' ) ( ).storageAvailable ( 'sessionStorage' ) ) {
							providerKey = sessionStorage.getItem ( provider.name.toLowerCase ( ) ) ;
						}
						if ( providerKey ) {
							provider.providerKey = atob ( providerKey );
						}
						else {
							_TravelNotesData.providers.delete ( provider.name.toLowerCase( ) );
						}
					}
				}
			);
		};

		/*
		--- End of _ReadURL function ---
		*/
		
		/*
		--- _StartXMLHttpRequest function -----------------------------------------------------------------------------

		This function ...

		---------------------------------------------------------------------------------------------------------------
		*/
		
		var _XMLHttpRequestUrl = '';

		var _StartXMLHttpRequest = function ( returnOnOk, returnOnError ) {
			
			var xmlHttpRequest = new XMLHttpRequest ( );
			xmlHttpRequest.timeout = 20000;
			
			xmlHttpRequest.ontimeout = function ( event ) {
				returnOnError ( 'XMLHttpRequest TimeOut. File : ' + xmlHttpRequest.responseURL );
			};
			
			xmlHttpRequest.onreadystatechange = function ( ) {
				if ( xmlHttpRequest.readyState === 4 ) {
					if ( xmlHttpRequest.status === 200 ) {
						var response;
						try {
							response = JSON.parse ( xmlHttpRequest.responseText );
						}
						catch ( e ) {
							returnOnError ( 'JSON parsing error. File : ' + xmlHttpRequest.responseURL );
						}
						returnOnOk ( response );
					}
					else {
						returnOnError ( 'Error XMLHttpRequest - Status : ' + xmlHttpRequest.status + ' - StatusText : ' + xmlHttpRequest.statusText + ' - File : ' + xmlHttpRequest.responseURL );
					}
				}
			};
			
			xmlHttpRequest.open ( "GET", _XMLHttpRequestUrl, true );
			xmlHttpRequest.overrideMimeType ( 'application/json' );
			xmlHttpRequest.send ( null );
			
		};
		
		/*
		--- End of _StartXMLHttpRequest function ---
		*/

		/*
		--- _AddControl function --------------------------------------------------------------------------------------

		This function add the control on the HTML page

		---------------------------------------------------------------------------------------------------------------
		*/

		var _AddControl = function ( map, divControlId ) {
			
			_TravelNotesData.map = map;
			_ReadURL ( );
			
			var promises = [];
			// loading config
			_XMLHttpRequestUrl = window.location.href.substr (0, window.location.href.lastIndexOf( '/') + 1 ) +'TravelNotesConfig.json';
			promises.push ( new Promise ( _StartXMLHttpRequest ) );
			// loading translations
			_XMLHttpRequestUrl = window.location.href.substr (0, window.location.href.lastIndexOf( '/') + 1 ) + 'TravelNotes' + ( _Langage || _TravelNotesData.config.language).toUpperCase ( )  + '.json';
			promises.push ( new Promise ( _StartXMLHttpRequest ) );
			// loading travel
			if ( _TravelUrl ) {
				_XMLHttpRequestUrl = _TravelUrl;
				promises.push (  new Promise ( _StartXMLHttpRequest ) );
			}
			
			Promise.all ( promises ).then ( 
				// promises succeeded
				function ( values ) {
					// config adaptation
					if ( _Langage ) {
						values [ 0 ].language = _Langage;
					}
					_TravelNotesData.config = values [ 0 ];
					
					if ( window.osmSearch ) {
						window.osmSearch.getDictionaryPromise ( _TravelNotesData.config.language )
						.then ( 
							function ( ) { console.log ( 'Dictionary loaded' ); },
							function ( error ) { console.log ( error ); }
						);
					}
					else {
						console.log ( 'osmSearch not found' );
					}

					_TravelNotesData.providers.forEach (
						function ( provider ) {
							provider.userLanguage =  _TravelNotesData.config.language;
						}
					);
					// translations adaptation
					require ( './UI/Translator' ) ( ).setTranslations ( values [ 1 ] );
					// loading new travel
					_TravelNotesData.travel = require ( './data/Travel' ) ( );
					_TravelNotesData.travel.routes.add ( require ( './data/Route' ) ( ) );
					_TravelNotesData.editedRoute = ( require ( './data/Route' ) ( ) );
					// user interface is added
					document.getElementById ( divControlId ).appendChild ( require ( './UI/UserInterface' ) ( ).UI );
					require ( './UI/TravelEditorUI' ) ( ).setRoutesList ( _TravelNotesData.travel.routes );
					require ( './core/TravelEditor' ) ( ).updateRoadBook ( true );

					if ( _TravelUrl ) {
						// loading travel...
						require ( './core/FileLoader' ) ( ).openDistantFile ( values [ 2 ] );
					}
					else {
						if ( _TravelNotesData.config.travelEditor.startupRouteEdition ) {
							require ( './core/TravelEditor' ) ( ).editRoute ( _TravelNotesData.travel.routes.first.objId );
						}
						else {
							require ( './UI/RouteEditorUI' ) ( ) .reduce ( );
						}	
					}
				}
			).catch ( 
				// promises failed
				function ( error ) {
					console.log ( error );
					//document.getElementsByTagName ( 'body' )[0].innerHTML = error;
				}
			);
		};
		
		/*
		--- End of _AddControl function ---
		*/
		
		/*
		--- _OnMapClick function --------------------------------------------------------------------------------------

		Map click event handler
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _OnMapClick = function ( event ) {
			if ( _TravelNotesData.travel.readOnly ) {
				return;
			}
			require ( './UI/ContextMenu' ) ( 
				event, 
				require ( './core/RouteEditor' ) ( ).getMapContextMenu ( [ event.latlng.lat, event.latlng.lng ] )
				.concat ( require ( './core/NoteEditor' ) ( ).getMapContextMenu ( [ event.latlng.lat, event.latlng.lng ] ) )
				.concat ( _LeftUserContextMenuData ) 
			);
		};
		
		/*
		--- _OnMapContextMenu function --------------------------------------------------------------------------------

		Map context menu event handler
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _OnMapContextMenu = function ( event ) {
			if ( _TravelNotesData.travel.readOnly ) {
				return;
			}
			require ( './UI/ContextMenu' ) (
				event, 
				require ( './core/RouteEditor' ) ( ).getMapContextMenu ( [ event.latlng.lat, event.latlng.lng ] )
				.concat ( require ( './core/NoteEditor' ) ( ).getMapContextMenu ( [ event.latlng.lat, event.latlng.lng ] ) )
				.concat ( require ( './core/TravelEditor' ) ( ).getMapContextMenu ( [ event.latlng.lat, event.latlng.lng ] ) )
				.concat ( _RightUserContextMenuData )
			);
		};

		return {

			/*
			--- addControl method --------------------------------------------------------------------------------------

			This method add the control on the page

			-----------------------------------------------------------------------------------------------------------
			*/

			addControl : function ( map, divControlId ) { return _AddControl ( map, divControlId );}, 
			
			/*
			--- addProvider method ------------------------------------------------------------------------------------

			This method add a provider to the providers map

			-----------------------------------------------------------------------------------------------------------
			*/
			
			addProvider : function ( provider ) { _TravelNotesData.providers.set ( provider.name.toLowerCase( ), provider ); },
			
			/*
			--- addMapContextMenu method ------------------------------------------------------------------------------

			This method add the map context menus

			-----------------------------------------------------------------------------------------------------------
			*/

			addMapContextMenu : function ( leftButton, rightButton ) {
				if ( leftButton ) {
					_TravelNotesData.map.on ( 'click', _OnMapClick );
					_HaveLeftContextMenu = true;
				}
				if ( rightButton ) {
					_TravelNotesData.map.on ( 'contextmenu', _OnMapClick );
					_HaveRightContextMenu = true;
				}
			},

			/*
			--- getters and setters -----------------------------------------------------------------------------------

			-----------------------------------------------------------------------------------------------------------
			*/

			get baseDialog ( ) { return require ( './UI/baseDialog' ) ( ); },

			get userData ( ) { return _TravelNotesData.travel.userData;},
			set userData ( userData ) { _TravelNotesData.travel.userData = userData;},
			
			get rightContextMenu ( ) { return _HaveRightContextMenu; },
			set rightContextMenu ( RightContextMenu ) { 
				if  ( ( RightContextMenu ) && ( ! _HaveRightContextMenu ) ) {
					_TravelNotesData.map.on ( 'contextmenu', _OnMapContextMenu );
					_HaveRightContextMenu = true;
				}
				else if ( ( ! RightContextMenu ) && ( _HaveRightContextMenu ) ) {
					_TravelNotesData.map.off ( 'contextmenu', _OnMapContextMenu );
					_HaveRightContextMenu = false;
				}
			},
			
			get leftContextMenu ( ) { return _HaveLeftContextMenu; },
			set leftContextMenu ( LeftContextMenu ) { 
				if  ( ( LeftContextMenu ) && ( ! _HaveLeftContextMenu ) ) {
					_TravelNotesData.map.on ( 'click', _OnMapClick );
					_HaveLeftContextMenu = true;
				}
				else if ( ( ! LeftContextMenu ) && ( _HaveLeftContextMenu ) ) {
					_TravelNotesData.map.off ( 'click', _OnMapClick );
					_HaveLeftContextMenu = false;
				}
			},
			
			get leftUserContextMenu ( ) { return _LeftUserContextMenuData; },
			set leftUserContextMenu ( LeftUserContextMenu ) {_LeftUserContextMenuData = LeftUserContextMenu; },
			
			get rightUserContextMenu ( ) { return _RightUserContextMenuData; },
			set rightUserContextMenu ( RightUserContextMenu ) {_RightUserContextMenuData = RightUserContextMenu; },
			
			get maneuver ( ) { return require ( './data/Maneuver' ) ( ); },
			
			get itineraryPoint ( ) { return require ( './data/ItineraryPoint' ) ( );},
			
			get version ( ) { return require ( './data/Version' ) ; }
		};
	};
	L.travelNotes = TravelNotes ( );
	
}());

/*
--- End of L.TravelNotes.js file --------------------------------------------------------------------------------------
*/

},{"./UI/ContextMenu":11,"./UI/RouteEditorUI":17,"./UI/Translator":20,"./UI/TravelEditorUI":21,"./UI/UserInterface":22,"./UI/baseDialog":23,"./core/FileLoader":25,"./core/NoteEditor":29,"./core/RouteEditor":30,"./core/TravelEditor":32,"./data/ItineraryPoint":36,"./data/Maneuver":37,"./data/Route":41,"./data/Travel":42,"./data/TravelNotesData":43,"./data/Version":44,"./util/Utilities":47}],8:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- AboutDialog.js file -----------------------------------------------------------------------------------------------
This file contains:
	- the AboutDialog object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170929
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	var AboutDialog = function ( color ) {
		
		var baseDialog = require ( '../UI/BaseDialog' ) ( );
		baseDialog.title = require ( '../UI/Translator' ) ( ).getText ( 'AboutDialog - About Travel & Notes' );
		
		var aboutDiv = require ( './HTMLElementsFactory' ) ( ).create (
			'div',
			{
				id : 'TravelNotes-AboutDialog-AboutDiv'
			},
			baseDialog.content
		);
		
		aboutDiv.innerHTML = 
			"<p>This  program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.</p>" +
			"<p>Copyright - 2017 2018 - Christian Guyette</p>" +
			"<p>Contact : <a href='http://www.ouaie.be/blog/pages/contact' target='_blank'>http://www.ouaie.be/</a></p>" +
			"<p>GitHub : <a href='https://github.com/wwwouaiebe/leaflet.TravelNotes' target='_blank'>https://github.com/wwwouaiebe/leaflet.TravelNotes</a></p>" +
			"<p>Version : " + require ( '../data/Version' ) +'.' +
			"<p>This program uses:" +
			" <a href='https://leafletjs.com/' target='_blank'>leaflet</a>," +
			" <a href='https://github.com/mapbox/polyline' target='_blank'>mapbox/polyline</a>," +
			" <a href='https://github.com/Project-OSRM/osrm-text-instructions' target='_blank'>Project-OSRM/osrm-text-instructions</a> and " +
			" <a href='https://github.com/drolbr/Overpass-API' target='_blank'>the Overpass API</a></p>";
		
		baseDialog.center ( );
		
		return baseDialog;
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = AboutDialog;
	}

}());

/*
--- End of AboutDialog.js file ----------------------------------------------------------------------------------------
*/	
},{"../UI/BaseDialog":9,"../UI/Translator":20,"../data/Version":44,"./HTMLElementsFactory":13}],9:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/


/*
--- BaseDialog.js file -----------------------------------------------------------------------------------------------
This file contains:
	- the BaseDialog object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.3.0:
		- added the possibility to have an event listener on the cancel button and escape key in
		the derived dialog boxes (see addClickCancelButtonEventListener addEscapeKeyEventListener)
Doc reviewed 20170928
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	
	var BaseDialog = function ( ) {
		
		var okButtonListener = null;
		var cancelButtonListener = null;
		var escapeKeyEventListener = null;
		
		var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;
		
		var onKeyDown = function ( keyBoardEvent ) {
			if ( 'Escape' === keyBoardEvent.key || 'Esc' === keyBoardEvent.key ) {
				if ( escapeKeyEventListener ) {
					if ( ! escapeKeyEventListener ( ) ) {
						return;
					}
				}

				document.removeEventListener ( 'keydown', onKeyDown, true );
				document.getElementsByTagName('body') [0].removeChild ( document.getElementById ( "TravelNotes-BaseDialog-BackgroundDiv" ) );
			}
		};
		
		// A new element covering the entire screen is created, with drag and drop event listeners
		var body = document.getElementsByTagName('body') [0];
		var backgroundDiv = htmlElementsFactory.create ( 'div', { id: 'TravelNotes-BaseDialog-BackgroundDiv', className : 'TravelNotes-BaseDialog-BackgroundDiv'} , body );
		backgroundDiv.addEventListener ( 
			'dragover', 
			function ( event ) {
				return;
			},
			false
		);	
		backgroundDiv.addEventListener ( 
			'drop', 
			function ( event ) {
				return;
			},
			false
		);	

		// variables initialization for drag and drop
		var screenWidth = backgroundDiv.clientWidth;
		var screenHeight = backgroundDiv.clientHeight;
		
		var startDragX = 0;
		var startDragY = 0;
		
		var dialogX = 0;
		var dialogY = 0;

		// the dialog is created
		var dialogContainer = htmlElementsFactory.create ( 
			'div',
			{ 
				id : 'TravelNotes-BaseDialog-Container',
				className : 'TravelNotes-BaseDialog-Container',
			},
			backgroundDiv
		);
		var topBar = htmlElementsFactory.create ( 
			'div',
			{ 
				id : 'TravelNotes-BaseDialog-TopBar',
				className : 'TravelNotes-BaseDialog-TopBar',
				draggable : true
			},
			dialogContainer
		);
		var cancelButton = htmlElementsFactory.create ( 
			'div',
			{ 
				innerHTML: '&#x274c', 
				id : 'TravelNotes-BaseDialog-CancelButton',
				title : require ( '../UI/Translator' ) ( ).getText ( "BaseDialog - Cancel" )
			},
			topBar
		);
		cancelButton.addEventListener ( 
			'click',
			function ( ) {
				if ( cancelButtonListener ) {
					if ( ! cancelButtonListener ( ) ) {
						return;
					}
				}
				document.removeEventListener ( 'keydown', onKeyDown, true );
				document.getElementsByTagName('body') [0].removeChild ( backgroundDiv );
			},
			false
		);
		topBar.addEventListener ( 
			'dragstart', 
			function ( event ) {
				try {
					event.dataTransfer.setData ( 'Text', '1' );
				}
				catch ( e ) {
				}
				startDragX = event.screenX;
				startDragY = event.screenY;
			},
			false
		);	
		topBar.addEventListener ( 
			'dragend', 
			function ( event ) {
				dialogX += event.screenX - startDragX;
				dialogY += event.screenY - startDragY;
				dialogX = Math.min ( Math.max ( dialogX, 20 ),screenWidth - dialogContainer.clientWidth -20 );
				dialogY = Math.max ( dialogY, 20 );
				var dialogMaxHeight = screenHeight - Math.max ( dialogY, 0 ) - 20;
				dialogContainer.setAttribute ( "style", "top:" + dialogY + "px;left:" + dialogX +"px;max-height:" + dialogMaxHeight +"px;" );
			},
			false 
		);
		var headerDiv = htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-BaseDialog-HeaderDiv',
				id : 'TravelNotes-BaseDialog-HeaderDiv'
			},
			dialogContainer
		);		
		var contentDiv = htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-BaseDialog-ContentDiv',
				id : 'TravelNotes-BaseDialog-ContentDiv'
			},
			dialogContainer
		);
		var errorDiv = htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-BaseDialog-ErrorDiv TravelNotes-BaseDialog-ErrorDivHidden',
				id : 'TravelNotes-BaseDialog-ErrorDiv',
			},
			dialogContainer
		);
		var footerDiv = htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-BaseDialog-FooterDiv',
				id : 'TravelNotes-BaseDialog-FooterDiv',
			},
			dialogContainer
		);
		var okButton = htmlElementsFactory.create ( 
			'div',
			{ 
				innerHTML: '&#x1f4be;', 
				id : 'TravelNotes-BaseDialog-OkButton',
				className : 'TravelNotes-BaseDialog-Button'
			},
			footerDiv
		);
		okButton.addEventListener ( 
			'click',
			function ( ) {
				if ( okButtonListener ) {
					if ( ! okButtonListener ( ) ) {
						return;
					}
				}
				document.removeEventListener ( 'keydown', onKeyDown, true );
				document.getElementsByTagName('body') [0].removeChild ( backgroundDiv );
			},
			false
		);				
		document.addEventListener ( 'keydown', onKeyDown, true );
		
		/*
		--- BaseDialog object -----------------------------------------------------------------------------------------

		---------------------------------------------------------------------------------------------------------------
		*/

		return {
			
			addClickOkButtonEventListener : function ( listener ) {
				okButtonListener = listener;
			},
			
			addClickCancelButtonEventListener : function ( listener ) {
				cancelButtonListener = listener;
			},
			
			addEscapeKeyEventListener : function ( listener ) {
				escapeKeyEventListener = listener;
			},
			
			get title ( ) { return headerDiv.innerHTML; },
			set title ( Title ) { headerDiv.innerHTML = Title; },
			
			center : function ( ) {
				dialogX = ( screenWidth - dialogContainer.clientWidth ) / 2;
				dialogY = ( screenHeight - dialogContainer.clientHeight ) / 2;
				dialogX = Math.min ( Math.max ( dialogX, 20 ),screenWidth - dialogContainer.clientWidth -20 );
				dialogY = Math.max ( dialogY, 20 );
				var dialogMaxHeight = screenHeight - Math.max ( dialogY, 0 ) - 20;
				dialogContainer.setAttribute ( "style", "top:" + dialogY + "px;left:" + dialogX +"px;max-height:" + dialogMaxHeight +"px;" );
			},

			get header ( ) { return headerDiv;},
			set header ( Header ) { headerDiv = Header; },
			
			get content ( ) { return contentDiv;},
			set content ( Content ) { contentDiv = Content; },

			get footer ( ) { return footerDiv;},
			set footer ( Footer ) { footerDiv = Footer; }
			
		};
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = BaseDialog;
	}

}());

/*
--- End of BaseDialog.js file -----------------------------------------------------------------------------------------
*/
},{"../UI/Translator":20,"./HTMLElementsFactory":13}],10:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- ColorDialog.js file -----------------------------------------------------------------------------------------------
This file contains:
	- the ColorDialog object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
Doc reviewed 20170929
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	
	var onOkButtonClick = function ( ) {
		return true;
	};

	var ColorDialog = function ( color ) {
		
		/*
		--- colorToNumbers function -------------------------------------------------------------------------------------------

		This function transforms a css color into an object { r : xx, g : xx, b : xx}

		---------------------------------------------------------------------------------------------------------------
		*/

		var colorToNumbers = function ( color ) {
			return {
				r : parseInt ( color.substr ( 1, 2 ), 16 ),
				g : parseInt ( color.substr ( 3, 2 ), 16 ), 
				b : parseInt ( color.substr ( 5, 2 ), 16 ), 
			};
		};
		
		/*
		--- colorToNumbers function -------------------------------------------------------------------------------------------

		This function transforms 3 numbers into a css color

		---------------------------------------------------------------------------------------------------------------
		*/
		var numbersToColor = function ( r, g, b ) {
			// MS Edge do't know padStart...
			if ( ! String.prototype.padStart ) {
				String.prototype.padStart = function padStart ( targetLength, padString ) {
					targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
					padString = String ( padString || ' ' );
					if ( this.length > targetLength ) {
						return String ( this );
					}
					else {
						targetLength = targetLength - this.length;
						if ( targetLength > padString.length ) {
							padString += padString.repeat ( targetLength / padString.length ); //append to original to ensure we are longer than needed
						}
						return padString.slice ( 0, targetLength ) + String ( this );
					}
				};
			}			
			
			return '#' + 
				parseInt ( r ).toString(16).padStart ( 2, '0' ) + 
				parseInt ( g ).toString(16).padStart ( 2, '0' ) + 
				parseInt ( b ).toString(16).padStart ( 2, '0' ) ;
		};

		// Click event handler on a color button
		var onColorClick = function ( event ) {
			newColor = event.target.colorValue;
			var numbers = colorToNumbers ( newColor );
			redInput.value = numbers.r;
			greenInput.value = numbers.g;
			blueInput.value = numbers.b;
			document.getElementById ( 'TravelNotes-ColorDialog-ColorSampleDiv').setAttribute ( 'style', 'background-color:'+ event.target.colorValue +';' );
		};
		
		// Click event handler on a red color button
		var onRedColorClick = function ( event ) {
			var r = event.target.redValue;
			var g = 255;
			var b = 255;
			var rowCounter = 0;
			while ( ++ rowCounter < 7 ) {
				var cellCounter = 0;
				g = 255;
				while ( ++ cellCounter < 7 ) {
					var button = document.getElementById ( ( 'TravelNotes-ColorDialog-CellColorDiv' + rowCounter ) + cellCounter );
					button.colorValue = numbersToColor ( r, g, b );
					button.setAttribute ( 'style', 'background-color:' + numbersToColor ( r, g, b ) );
					g -= 51;
				}
				b -= 51;
			}
		};
	
		// Red, green or blue input event handler 
		var onColorInput = function ( )  {
			newColor = numbersToColor ( redInput.value, greenInput.value, blueInput.value );
			document.getElementById ( 'TravelNotes-ColorDialog-ColorSampleDiv').setAttribute ( 'style', 'background-color:' + newColor + ';' );
		};
		

		var newColor = color;
		var translator = require ( '../UI/Translator' ) ( );		
		var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;

		// the dialog base is created
		var baseDialog = require ( '../UI/BaseDialog' ) ( );
		baseDialog.title = translator.getText ( 'ColorDialog - Colors' );
		baseDialog.addClickOkButtonEventListener ( onOkButtonClick );
		baseDialog.getNewColor = function ( ) {
			return newColor;
		};
		
		// elements are added to the base dialog content
		var colorDiv = htmlElementsFactory.create (
			'div',
			{
				className : 'TravelNotes-ColorDialog-ColorDiv',
				id : 'TravelNotes-ColorDialog-ColorDiv'
			},
			baseDialog.content
		);
		var buttonsDiv = htmlElementsFactory.create (
			'div',
			{
				className : 'TravelNotes-ColorDialog-ButtonsDiv',
				id : 'TravelNotes-ColorDialog-ButtonsDiv'
			},
			colorDiv
		);

		var r = 255;
		var g = 255;
		var b = 255;		
		var rowCounter = 0;
		
		// loop on the 7 rows
		while ( ++ rowCounter < 8 ) {			
			var colorButtonsRowDiv = htmlElementsFactory.create (
				'div',
				{
					className : 'TravelNotes-ColorDialog-RowColorDiv',
					id : 'TravelNotes-ColorDialog-RowColorDiv' +rowCounter
				},
				buttonsDiv
			);
			
			var cellCounter = 0;
			g = 255;
			
			// loop on the 6 cells
			while ( ++ cellCounter < 7 ) {
				var className = 'TravelNotes-ColorDialog-CellColorDiv';
				if ( rowCounter < 7 ) {
					className = 'TravelNotes-ColorDialog-CellColorDiv TravelNotes-ColorDialog-RedDiv';
				}
				var colorButtonCellDiv = htmlElementsFactory.create (
					'div',
					{
						className : 'TravelNotes-ColorDialog-CellColorDiv',
						id : ( 'TravelNotes-ColorDialog-CellColorDiv' + rowCounter ) + cellCounter
					},
					colorButtonsRowDiv
				);
				if ( rowCounter < 7 ) {
					colorButtonCellDiv.setAttribute ( 'style', 'background-color:' + numbersToColor ( r, g, b ) );
					colorButtonCellDiv.colorValue = numbersToColor ( r, g, b );
					colorButtonCellDiv.addEventListener ( 'click', onColorClick, false );
					g -= 51;
				}
				else
				{
					r = ( cellCounter - 1 ) * 51;
					var buttonColor = numbersToColor ( 255, r, r );
					colorButtonCellDiv.setAttribute ( 'style', 'background-color:' + buttonColor );
					colorButtonCellDiv.redValue = 255 - r;
					colorButtonCellDiv.addEventListener ( 'click', onRedColorClick, false );
				}
			}
			b -= 51;
		}
		
		var rvbDiv = htmlElementsFactory.create (
			'div',
			{
				className : 'TravelNotes-ColorDialog-DataDiv',
				id : 'TravelNotes-ColorDialog-DataDiv'
			},
			colorDiv
		);
		
		// ... red ...
		htmlElementsFactory.create (
			'text',
			{
				data : translator.getText ( 'ColorDialog - Red'),
			},
			rvbDiv
		);
		var redInput =  htmlElementsFactory.create (
			'input',
			{
				type : 'number',
				className : 'TravelNotes-ColorDialog-NumberInput',
				id : 'TravelNotes-ColorDialog-RedInput'
				
			},
			rvbDiv
		);
		redInput.value = colorToNumbers ( color ).r;
		redInput.min = 0;
		redInput.max = 255;
		
		redInput.addEventListener ( 'input', onColorInput, false );
		
		// ... and green...
		htmlElementsFactory.create (
			'text',
			{
				data : translator.getText ( 'ColorDialog - Green'),
			},
			rvbDiv
		);
		var greenInput =  htmlElementsFactory.create (
			'input',
			{
				type : 'number',
				className : 'TravelNotes-ColorDialog-NumberInput',
				id : 'TravelNotes-ColorDialog-GreenInput'
			},
			rvbDiv
		);
		greenInput.value = colorToNumbers ( color ).g;
		greenInput.min = 0;
		greenInput.max = 255;
		greenInput.addEventListener ( 'input', onColorInput, false );

		// ... and blue
		htmlElementsFactory.create (
			'text',
			{
				data : translator.getText ( 'ColorDialog - Blue'),
			},
			rvbDiv
		);
		var blueInput =  htmlElementsFactory.create (
			'input',
			{
				type : 'number',
				className : 'TravelNotes-ColorDialog-NumberInput',
				id : 'TravelNotes-ColorDialog-BlueInput'
			},
			rvbDiv
		);
		blueInput.value = colorToNumbers ( color ).b;
		blueInput.min = 0;
		blueInput.max = 255;
		blueInput.addEventListener ( 'input', onColorInput, false );
		
		// Sample color
		var colorSampleDiv = htmlElementsFactory.create (
			'div',
			{
				className : 'TravelNotes-ColorDialog-ColorSampleDiv',
				id : 'TravelNotes-ColorDialog-ColorSampleDiv'
			},
			colorDiv
		);
		colorSampleDiv.setAttribute ( 'style', 'background-color:'+ color +';' );

		
		// and the dialog is centered on the screen
		baseDialog.center ( );
		
		return baseDialog;
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = ColorDialog;
	}

}());

/*
--- End of ColorDialog.js file ----------------------------------------------------------------------------------------
*/	
},{"../UI/BaseDialog":9,"../UI/Translator":20,"./HTMLElementsFactory":13}],11:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- ContextMenu.js file -----------------------------------------------------------------------------------------------
This file contains:
	- the ContextMenu object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170929
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';
	
	var _MenuItems = [];
	var _ContextMenuContainer = null;
	var _OriginalEvent = null;
	var _FocusIsOnItem = 0;
	var _Lat = 0;
	var _Lng = 0;
	var _TimerId = null;
	
	/*
	--- onCloseMenu function ------------------------------------------------------------------------------------------

	event listener for the close button. Alson called from others events

	-------------------------------------------------------------------------------------------------------------------
	*/
		
	var onCloseMenu = function ( ) {
		
		if ( _TimerId ) {
			clearTimeout ( _TimerId );
			_TimerId = null;
		}
		
		_Lat = 0;
		_Lng = 0;
		
		// removing event listeners
		document.removeEventListener ( 'keydown', onKeyDown, true );
		document.removeEventListener ( 'keypress', onKeyPress, true );
		document.removeEventListener ( 'keyup', onKeyUp, true );
		
		// removing menu items
		var childNodes = _ContextMenuContainer.childNodes;
		childNodes [ 0 ].firstChild.removeEventListener ( 'click', onCloseMenu, false );
		for ( var childNodesCounter = 1; childNodesCounter < childNodes.length; childNodesCounter ++ ) {
			childNodes [ childNodesCounter ].firstChild.removeEventListener ( 'click', onCloseMenu, false );
		}
		
		// removing the menu container
		document.getElementsByTagName('body') [0].removeChild ( _ContextMenuContainer );
		_ContextMenuContainer = null;
		_FocusIsOnItem = 0;
	};
	
	/*
	--- onKeyDown function --------------------------------------------------------------------------------------------

	Keyboard event listener

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onKeyDown = function ( keyBoardEvent ) {
		
		if ( _ContextMenuContainer ) {
			keyBoardEvent.preventDefault ( );
			keyBoardEvent.stopPropagation ( );
		}
		if ( 'Escape' === keyBoardEvent.key || 'Esc' === keyBoardEvent.key ) {
			onCloseMenu ( );
		}
		if ( 'ArrowDown' === keyBoardEvent.key  || 'ArrowRight' === keyBoardEvent.key  ||  'Tab' === keyBoardEvent.key ){
			_FocusIsOnItem = _FocusIsOnItem >= _MenuItems.length ? 1 : ++ _FocusIsOnItem;
			_ContextMenuContainer.childNodes [ _FocusIsOnItem ].firstChild.focus ( );
		}
		if ( 'ArrowUp' === keyBoardEvent.key  || 'ArrowLeft' === keyBoardEvent.key ){
			_FocusIsOnItem = _FocusIsOnItem <= 1 ? _MenuItems.length : -- _FocusIsOnItem;
			_ContextMenuContainer.childNodes [ _FocusIsOnItem ].firstChild.focus ( );
		}
		if ( 'Home' === keyBoardEvent.key ) {
			_FocusIsOnItem = 1;
			_ContextMenuContainer.childNodes [ _FocusIsOnItem ].firstChild.focus ( );
		}
		if ( 'End' === keyBoardEvent.key ) {
			_FocusIsOnItem = _MenuItems.length;
			_ContextMenuContainer.childNodes [ _FocusIsOnItem ].firstChild.focus ( );
		}
		if ( ( 'Enter' === keyBoardEvent.key )  && ( _FocusIsOnItem > 0 ) && ( _MenuItems[ _FocusIsOnItem -1 ].action ) ) {
			_ContextMenuContainer.childNodes[ _FocusIsOnItem ].firstChild.click ( );
		}
	};
	
	/*
	--- onKeyPress function -------------------------------------------------------------------------------------------

	Keyboard event listener

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onKeyPress = function ( keyBoardEvent ) {
		keyBoardEvent.preventDefault ( );
		keyBoardEvent.stopPropagation ( );
	};
	
	/*
	--- onKeyUp function ----------------------------------------------------------------------------------------------

	Keyboard event listener

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onKeyUp = function ( keyBoardEvent ) {
		keyBoardEvent.preventDefault ( );
		keyBoardEvent.stopPropagation ( );
	};

	/*
	--- onClickItem function ------------------------------------------------------------------------------------------

	Mouse click event listener

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onClickItem = function ( event ) {
		event.stopPropagation ( );
		if ( _MenuItems[ event.target.menuItem ].param ) {
			_MenuItems[ event.target.menuItem ].action.call ( 
				_MenuItems[ event.target.menuItem ].context,
				_MenuItems[ event.target.menuItem ].param,
				_OriginalEvent
			);
		}
		else {
			_MenuItems[ event.target.menuItem ].action.call ( 
				_MenuItems[ event.target.menuItem ].context,
				_OriginalEvent
			);
		}
		onCloseMenu ( );
	};
	
	/*
	--- ContextMenu object --------------------------------------------------------------------------------------------

	-------------------------------------------------------------------------------------------------------------------
	*/

	var ContextMenu = function ( event, userMenu ) {
		// stopPropagation ( ) and preventDefault ( ) are not working correctly on leaflet events, so the event continue and bubble.
		// To avoid the menu close directly, we compare the lat and lng of the event with the lat and lng of the previous event
		// and we stop the procedure if equals.
		if  ( ( event.latlng.lat === _Lat ) && ( event.latlng.lng === _Lng ) ) {
			_Lat = 0;
			_Lng = 0;
			return;
		}
		else
		{
			_Lat = event.latlng.lat;
			_Lng = event.latlng.lng;
		}
		
		_OriginalEvent = event; 
		
		// the menu is already opened, so we suppose the user will close the menu by clicking outside...
		if ( _ContextMenuContainer ) {
			onCloseMenu ( );
			return;
		}
		
		_MenuItems = userMenu;
		var body = document.getElementsByTagName('body') [0];
		var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;
		
		// a dummy div is created to find the screen width and height
		var dummyDiv = htmlElementsFactory.create ( 'div', { className : 'TravelNotes-ContextMenu-Panel'} , body );
		var screenWidth = dummyDiv.clientWidth;
		var screenHeight = dummyDiv.clientHeight;
		body.removeChild ( dummyDiv );
		
		// and then the menu is created
		_ContextMenuContainer = htmlElementsFactory.create ( 'div', { id : 'TravelNotes-ContextMenu-Container',className : 'TravelNotes-ContextMenu-Container'}, body );
		_ContextMenuContainer.addEventListener ( 
			'mouseenter',
			function ( ) { 
				if ( _TimerId ) {
					clearTimeout ( _TimerId );
					_TimerId = null;
				}
			},
			false
		);
		_ContextMenuContainer.addEventListener ( 'mouseleave', function ( ) { _TimerId = setTimeout ( onCloseMenu, require ( '../L.TravelNotes' ).config.contextMenu.timeout ); }, false );
		// close button
		var closeButton = htmlElementsFactory.create ( 
			'div',
			{ 
				innerHTML: '&#x274c', 
				className : 'TravelNotes-ContextMenu-CloseButton',
				title : require ( './Translator' ) ( ).getText ( "ContextMenu - Close" )
			},
			_ContextMenuContainer
		);
		closeButton.addEventListener ( 'click', onCloseMenu, false );

		// items
		var menuItemCounter = 0;
		_MenuItems.forEach ( 
			function ( menuItem ) {
				var itemContainer = htmlElementsFactory.create ( 'div', { className : 'TravelNotes-ContextMenu-ItemContainer'},_ContextMenuContainer);
				var item = htmlElementsFactory.create ( 
					'button', 
					{ 
						innerHTML : menuItem.name,
						id : 'TravelNotes-ContextMenu-Item' + menuItemCounter,
						className : menuItem.action ? 'TravelNotes-ContextMenu-Item' : 'TravelNotes-ContextMenu-Item TravelNotes-ContextMenu-ItemDisabled'
					},
					itemContainer
				);
				if ( menuItem.action ) {
					item.addEventListener ( 'click', onClickItem, false );
				}
				item.menuItem = menuItemCounter;
				++ menuItemCounter;
			}
		);
		
		// the menu is positionned ( = top left where the user have clicked but the menu must be completely in the window...
		var menuTop = Math.min ( event.originalEvent.clientY, screenHeight - _ContextMenuContainer.clientHeight - 20 );
		var menuLeft = Math.min ( event.originalEvent.clientX, screenWidth - _ContextMenuContainer.clientWidth - 20 );
		_ContextMenuContainer.setAttribute ( "style", "top:" + menuTop + "px;left:" + menuLeft +"px;" );
		
		// keyboard event listeners
		document.addEventListener ( 'keydown', onKeyDown, true );
		document.addEventListener ( 'keypress', onKeyPress, true );
		document.addEventListener ( 'keyup', onKeyUp, true );
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = ContextMenu;
	}

}());

/*
--- End of ContextMenu.js file ----------------------------------------------------------------------------------------
*/	

},{"../L.TravelNotes":7,"./HTMLElementsFactory":13,"./Translator":20}],12:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- ErrorEditorUI.js file ---------------------------------------------------------------------------------------------
This file contains:
	- the ErrorEditorUI object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170929
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';
	
	var _TimerId = null;

	var ErrorEditorUI = function ( ) {
				
		var translator = require ( './Translator' ) ( );

		/*
		--- _ReduceUI function ----------------------------------------------------------------------------------------

		This function reduces the UI
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _ReduceUI = function ( ) {
			document.getElementById ( 'TravelNotes-Control-ErrorDataDiv' ).classList.add ( 'TravelNotes-Control-HiddenList' );
			//document.getElementById ( 'TravelNotes-Control-ErrorHeaderDiv' ).classList.add ( 'TravelNotes-Control-HiddenList' );
			document.getElementById ( 'TravelNotes-Control-ErrorMessageDiv' ).innerHTML = '';
		};
		
		/*
		--- _SetMessage function ----------------------------------------------------------------------------------------

		This function add a message, expand the UI and start a timer
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _SetMessage = function ( message ) {
			if ( _TimerId ) {
				clearTimeout ( _TimerId );
				_TimerId = null;
			}
			document.getElementById ( 'TravelNotes-Control-ErrorMessageDiv' ).innerHTML = message;
			document.getElementById ( 'TravelNotes-Control-ErrorDataDiv' ).classList.remove ( 'TravelNotes-Control-HiddenList' );
			//document.getElementById ( 'TravelNotes-Control-ErrorHeaderDiv' ).classList.remove ( 'TravelNotes-Control-HiddenList' );
			_TimerId = setTimeout ( _ReduceUI, require ( '../L.TravelNotes' ).config.errorMessages.timeout );
		};
		
		/*
		--- _CreateUI function ----------------------------------------------------------------------------------------

		This function creates the UI
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _CreateUI = function ( controlDiv ){ 
		
			if ( document.getElementById ( 'TravelNotes-Control-ErrorDataDiv' ) ) {
				return;
			}

			var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;
			var dataDiv = htmlElementsFactory.create ( 'div', { id : 'TravelNotes-Control-ErrorDataDiv', className : 'TravelNotes-Control-DataDiv TravelNotes-Control-HiddenList'}, controlDiv );
			var headerDiv = htmlElementsFactory.create ( 'div', { id : 'TravelNotes-Control-ErrorHeaderDiv', className : 'TravelNotes-Control-HeaderDiv TravelNotes-Control-HiddenList'}, dataDiv );
			var expandButton = htmlElementsFactory.create (
				'span',
				{ 
					innerHTML : '&#x274c',
					title : translator.getText ( 'ErrorEditorUI - Hide' ),
					id : 'TravelNotes-Control-ErrorExpandButton',
					className : 'TravelNotes-Control-HiddenList'
				},
				headerDiv 
			);
			expandButton.addEventListener ( 
				'click' ,
				function ( clickEvent ) {
					clickEvent.stopPropagation ( );
					if ( ! document.getElementById ( 'TravelNotes-Control-ErrorMessageDiv' ).innerHTML.length ) {
						return;
					}	
					_ReduceUI ( );
				},
				false 
			);
			var messageDiv = htmlElementsFactory.create ( 'div', { id : 'TravelNotes-Control-ErrorMessageDiv'}, dataDiv );
		};
				
		/*
		--- ErrorEditorUI object --------------------------------------------------------------------------------------

		---------------------------------------------------------------------------------------------------------------
		*/

		return {
			
			createUI : function ( controlDiv ) { 
				_CreateUI ( controlDiv ); 
			},
	
			set message ( message )
			{ 
				_SetMessage ( message );
			},
			
			get message (  ) { return document.getElementById ( 'TravelNotes-Control-ErrorDataDiv' ).innerHTML; }
			
		};
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = ErrorEditorUI;
	}

}());

/*
--- End of ErrorEditorUI.js file --------------------------------------------------------------------------------------
*/	
},{"../L.TravelNotes":7,"./HTMLElementsFactory":13,"./Translator":20}],13:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- HTMLElementsFactory.js file ---------------------------------------------------------------------------------------
This file contains:
	- the HTMLElementsFactory object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
Doc reviewed 20170929
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';
	
	/* 
	--- HTMLElementsFactory object ------------------------------------------------------------------------------------
	
	-------------------------------------------------------------------------------------------------------------------
	*/

	var HTMLElementsFactory = function ( ) {

		/* 
		--- HTMLElementsFactory object --------------------------------------------------------------------------------
		
		---------------------------------------------------------------------------------------------------------------
		*/

		return {
			create : function ( tagName, properties, parentNode ) {
				var element;
				if ( 'text' === tagName.toLowerCase ( ) ) {
					element = document.createTextNode ( '' );
				}
				else {
					element = document.createElement ( tagName );
				}
				if ( parentNode ) {
					parentNode.appendChild ( element );
				}
				if ( properties )
				{
					for ( var property in properties ) {
						try {
							element [ property ] = properties [ property ];
						}
						catch ( e ) {
							console.log ( "Invalid property : " + property );
						}
					}
				}
				return element;
			}
			
		};
			
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = HTMLElementsFactory;
	}

}());

/*
--- End of HTMLElementsFactory.js file --------------------------------------------------------------------------------
*/	

},{}],14:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- HTMLViewsFactory.js file ------------------------------------------------------------------------------------------
This file contains:
	- the HTMLViewsFactory object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
		- Added noteObjId in the _AddNoteHTML function
Doc reviewed 20170929
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';
	
	var _HTMLElementsFactory = require ( '../UI/HTMLElementsFactory' ) ( );
	var _TravelNotesData = require ( '../L.TravelNotes' );
	var _Translator = require ( '../UI/Translator' ) ( );
	var _Utilities = require ( '../util/Utilities' ) ( );
	var _NoteEditor = require ( '../core/NoteEditor' ) ( );
	var _RouteEditor = require ( '../core/RouteEditor' ) ( );
	
	var _ClassNamePrefix = 'TravelNotes-Control-';

	var HTMLViewsFactory = function ( ) {
				
		/*
		--- _AddNoteHTML function -------------------------------------------------------------------------------------

		This function add to the rowDiv parameter two div with the note icon ant the note content

		---------------------------------------------------------------------------------------------------------------
		*/

		var _AddNoteHTML = function ( note, rowDiv ) {
			var iconCell = _HTMLElementsFactory.create (
				'div',
				{ 
					className : _ClassNamePrefix + 'Travel-Notes-IconCell',
					innerHTML : note.iconContent
				}, 
				rowDiv
			);
			iconCell.setAttribute ( "style", "width:" + note.iconWidth + "px;" );
			
			var noteElement = _HTMLElementsFactory.create (
				'div',
				{ 
					className : _ClassNamePrefix + 'Travel-Notes-Cell',
					innerHTML : _NoteEditor.getNoteHTML ( note, _ClassNamePrefix )
				}, 
				rowDiv
			);
			rowDiv.noteObjId = note.objId;
		};
				
		/*
		--- _GetTravelHeaderHTML function -----------------------------------------------------------------------------

		This function returns an HTML element with the travel's header

		---------------------------------------------------------------------------------------------------------------
		*/

		var _GetTravelHeaderHTML = function ( ) {
			var travelHeaderHTML = _HTMLElementsFactory.create ( 'div', { className :  _ClassNamePrefix + 'Travel-Header' } ); 
			_HTMLElementsFactory.create ( 
				'div',
				{ 
					className : _ClassNamePrefix + 'Travel-Header-Name',
					innerHTML: _TravelNotesData.travel.name
				},
				travelHeaderHTML
			); 
			
			var travelDistance = 0;
			var travelRoutesIterator = _TravelNotesData.travel.routes.iterator;
			while ( ! travelRoutesIterator.done ) {
				_HTMLElementsFactory.create ( 
					'div',
					{ 
						className : _ClassNamePrefix + 'Travel-Header-RouteName',
						innerHTML: '<a href="#route' +  travelRoutesIterator.value.objId + '">' + travelRoutesIterator.value.name + '</a>' + '&nbsp;:&nbsp;' + _Utilities.formatDistance ( travelRoutesIterator.value.distance ) + '.'
					},
					travelHeaderHTML
				); 
				if ( travelRoutesIterator.value.chain ) {
					travelDistance += travelRoutesIterator.value.distance;
				}
			}

			_HTMLElementsFactory.create ( 
				'div',
				{ 
					className : _ClassNamePrefix + 'Travel-Header-TravelDistance',
					innerHTML:  _Translator.getText ( 'HTMLViewsFactory - Travel distance&nbsp;:&nbsp;{distance}', { distance : _Utilities.formatDistance ( travelDistance ) } )
				},
				travelHeaderHTML
			); 

			return travelHeaderHTML;
		};

				
		/*
		--- _GetTravelNotesHTML function ------------------------------------------------------------------------------

		This function returns an HTML element with the travel's notes

		---------------------------------------------------------------------------------------------------------------
		*/

		var _GetTravelNotesHTML = function ( ) {
			var travelNotesHTML = _HTMLElementsFactory.create ( 'div', { className :  _ClassNamePrefix + 'Travel-Notes'} ); 
			var travelNotesIterator = _TravelNotesData.travel.notes.iterator;
			while ( ! travelNotesIterator.done ) {
				var rowDiv = _HTMLElementsFactory.create ( 
					'div', 
					{ className : _ClassNamePrefix + 'Travel-Notes-Row'}, 
					travelNotesHTML
				);
				 _AddNoteHTML ( travelNotesIterator.value, rowDiv ) ;
			}
			
			return travelNotesHTML;
		};
				
		/*
		--- _GetRouteHeaderHTML function ------------------------------------------------------------------------------

		This function returns an HTML element with the route header

		---------------------------------------------------------------------------------------------------------------
		*/

		var _GetRouteHeaderHTML = function ( route ) {
			return _HTMLElementsFactory.create ( 
				'div',
				{ 
					className : _ClassNamePrefix + 'Route-Header',
					id : 'route' + route.objId,
					innerHTML: _RouteEditor.getRouteHTML ( route, _ClassNamePrefix )
				}
			); 
		};
				
		/*
		--- _GetRouteManeuversAndNotesHTML function -------------------------------------------------------------------

		This function returns an HTML element with the route maneuvers and notes

		---------------------------------------------------------------------------------------------------------------
		*/

		var _GetRouteManeuversAndNotesHTML = function ( route ) {
			var routeManeuversAndNotesHTML = _HTMLElementsFactory.create ( 'div', { className : _ClassNamePrefix + 'Route-ManeuversAndNotes' } ); 
			
			var notesIterator = route.notes.iterator;
			var notesDone =  notesIterator.done;
			var notesDistance = ! notesDone ? notesIterator.value.distance : 999999999;
			
			var maneuversIterator = route.itinerary.maneuvers.iterator;
			var maneuversDone = maneuversIterator.done;
			var maneuversDistance = 0;
			
			while ( ! ( maneuversDone && notesDone ) ) {
				var rowDiv = _HTMLElementsFactory.create ( 
					'div', 
					{ className : _ClassNamePrefix + 'Route-ManeuversAndNotes-Row' }, 
					routeManeuversAndNotesHTML
				);

				if ( maneuversDistance <= notesDistance ) {
					if ( ! maneuversDone ) {
						rowDiv.className = _ClassNamePrefix + 'Route-Maneuvers-Row';
						_HTMLElementsFactory.create (
							'div',
							{ 
								className : _ClassNamePrefix + 'Route-ManeuversAndNotes-IconCell ' + 'TravelNotes-ManeuverNote-' + maneuversIterator.value.iconName,
							}, 
							rowDiv
						);
						
						var maneuverText = 
							'<div>' +  maneuversIterator.value.instruction + '</div>';
						
						if ( 0 < maneuversIterator.value.distance ) {
							maneuverText +=	'<div>' + 
								_Translator.getText ( 
									'HTMLViewsFactory - To next instruction&nbsp;:&nbsp;{distance}&nbsp;-&nbsp;{duration}', 
									{
										distance : _Utilities.formatDistance ( maneuversIterator.value.distance ),
										duration : _Utilities.formatTime (maneuversIterator.value.duration )
									}
								) + '</div>';
						}
						_HTMLElementsFactory.create (
							'div',
							{ 
								className : _ClassNamePrefix + 'Route-ManeuversAndNotes-Cell',
								innerHTML : maneuverText
							}, 
							rowDiv
						);
						
						rowDiv.objId= require ( '../data/ObjId' ) ( );
						rowDiv.latLng = route.itinerary.itineraryPoints.getAt ( maneuversIterator.value.itineraryPointObjId ).latLng;
						rowDiv.maneuverObjId = maneuversIterator.value.objId;
						
						maneuversDistance +=  maneuversIterator.value.distance;
						maneuversDone = maneuversIterator.done;
						if ( maneuversDone ) {
							maneuversDistance = 999999999;
						}
					}
				}
				else {
					if ( ! notesDone ) {
						rowDiv.className = _ClassNamePrefix + 'Route-Notes-Row';

						_AddNoteHTML ( notesIterator.value, rowDiv );

						rowDiv.objId= require ( '../data/ObjId' ) ( );
						rowDiv.latLng = notesIterator.value.latLng;
						rowDiv.noteObjId = notesIterator.value.objId;
						
						notesDone = notesIterator.done;
						notesDistance = notesDone ? 999999999 :  notesIterator.value.distance;
					}
				}	
			}
			
			return routeManeuversAndNotesHTML;
		};
				
		/*
		--- _GetRouteFooterHTML function ------------------------------------------------------------------------------

		This function returns an HTML element with the route footer

		---------------------------------------------------------------------------------------------------------------
		*/

		var _GetRouteFooterHTML = function ( route ) {
			var innerHTML = '';
			if ( ( '' !== route.itinerary.provider ) && ( '' !== route.itinerary.transitMode ) ) {
				innerHTML = _Translator.getText ( 
					'HTMLViewsFactory - Itinerary computed by {provider} and optimized for {transitMode}', 
					{
						provider: route.itinerary.provider, 
						transitMode : _Translator.getText ( 'HTMLViewsFactory - TransitMode ' +	route.itinerary.transitMode )
					} 
				);
			}
			
			return _HTMLElementsFactory.create ( 'div', { className : _ClassNamePrefix + 'RouteFooter',	innerHTML : innerHTML } ); 
		};
				
		/*
		--- _GetTravelFooterHTML function -----------------------------------------------------------------------------

		This function returns an HTML element with the travel's footer

		---------------------------------------------------------------------------------------------------------------
		*/

		var _GetTravelFooterHTML = function ( ) {
			return _HTMLElementsFactory.create ( 
				'div',
				{ 
					className : _ClassNamePrefix + 'TravelFooter',
					innerHTML : _Translator.getText ( 'HTMLViewsFactory - Travel footer' )
				} 
			); 
		};
				
		/*
		--- _GetTravelHTML function -----------------------------------------------------------------------------------

		This function returns an HTML element with the complete travel

		---------------------------------------------------------------------------------------------------------------
		*/

		var _GetTravelHTML = function ( ) {
			
			var travelHTML = _HTMLElementsFactory.create ( 'div', { className : _ClassNamePrefix + 'Travel'} ); 
			
			travelHTML.appendChild ( _GetTravelHeaderHTML ( ) );
			travelHTML.appendChild ( _GetTravelNotesHTML ( ) );
			
			var travelRoutesIterator = _TravelNotesData.travel.routes.iterator;
			while ( ! travelRoutesIterator.done ) {
				var useEditedRoute = _TravelNotesData.config.routeEditor.displayEditionInHTMLPage && travelRoutesIterator.value.objId === _TravelNotesData.routeEdition.routeInitialObjId;
				travelHTML.appendChild ( _GetRouteHeaderHTML ( useEditedRoute ? _TravelNotesData.editedRoute : travelRoutesIterator.value ) );
				travelHTML.appendChild ( _GetRouteManeuversAndNotesHTML ( useEditedRoute ? _TravelNotesData.editedRoute :travelRoutesIterator.value ) );
				travelHTML.appendChild ( _GetRouteFooterHTML ( useEditedRoute ? _TravelNotesData.editedRoute : travelRoutesIterator.value ) );
			}
			
			travelHTML.appendChild ( _GetTravelFooterHTML ( ) );

			return travelHTML;
		};

		/* 
		--- HTMLViewsFactory object -----------------------------------------------------------------------------------
		
		---------------------------------------------------------------------------------------------------------------
		*/

		return {
			
			set classNamePrefix ( ClassNamePrefix ) { _ClassNamePrefix = ClassNamePrefix; },
			get classNamePrefix ( ) { return _ClassNamePrefix; },
			
			get travelHeaderHTML ( )  { return _GetTravelHeaderHTML ( ); }, 
			
			get travelNotesHTML ( )  { return _GetTravelNotesHTML ( ); }, 
			
			get routeHeaderHTML ( )  { return _GetRouteHeaderHTML ( _TravelNotesData.editedRoute ); }, 
			
			get routeManeuversAndNotesHTML ( )  { return _GetRouteManeuversAndNotesHTML ( _TravelNotesData.editedRoute ); }, 
			
			get routeFooterHTML ( )  { return _GetRouteFooterHTML ( _TravelNotesData.editedRoute ); }, 
			
			get travelFooterHTML ( )  { return _GetTravelFooterHTML ( ); }, 
			
			get travelHTML ( ) { return  _GetTravelHTML ( ); }
		};
			
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = HTMLViewsFactory;
	}

}());

/*
--- End of HTMLViewsFactory.js file --------------------------------------------------------------------------------
*/	
},{"../L.TravelNotes":7,"../UI/HTMLElementsFactory":13,"../UI/Translator":20,"../core/NoteEditor":29,"../core/RouteEditor":30,"../data/ObjId":39,"../util/Utilities":47}],15:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- ItineraryEditorUI.js file -----------------------------------------------------------------------------------------
This file contains:
	- the ItineraryEditorUI object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.3.0:
		- added train button
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170929
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';
	
	var _Translator = require ( './Translator' ) ( );
	var _TravelNotesData = require ( '../L.TravelNotes' );
	var _ActivePaneIndex = -1;
	var _OsmSearchStarted = false;
	var _SearchParameters = { searchPhrase : '', bbox : null };
	var _PreviousSearchRectangleObjId = -1;
	var _NextSearchRectangleObjId = -1;
	var _SearchLimits = ( window.osmSearch ) ? window.osmSearch.searchLimits : null;
	
	/*
	--- onWheel function ----------------------------------------------------------------------------------------------

	wheel event listener for the data div

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onWheel = function ( wheelEvent ) { 
		if ( wheelEvent.deltaY ) {
			wheelEvent.target.scrollTop = wheelEvent.target.scrollTop + wheelEvent.deltaY * 10 ;
		}
		wheelEvent.stopPropagation ( );
	};

	/*
	--- onClickExpandButton function ----------------------------------------------------------------------------------

	click event listener for the expand button

	-------------------------------------------------------------------------------------------------------------------
	*/

	/*
	var onClickExpandButton = function ( clickEvent ) {
		clickEvent.stopPropagation ( );
		document.getElementById ( 'TravelNotes-Control-ItineraryHeaderDiv' ).classList.toggle ( 'TravelNotes-Control-SmallHeader' );
		document.getElementById ( 'TravelNotes-Control-ItineraryDataDiv' ).classList.toggle ( 'TravelNotes-Control-HiddenList' );
		document.getElementById ( 'TravelNotes-Control-ItineraryButtonsDiv' ).classList.toggle ( 'TravelNotes-Control-HiddenList' );
		var hiddenList = document.getElementById ( 'TravelNotes-Control-ItineraryDataDiv' ).classList.contains ( 'TravelNotes-Control-HiddenList' );
		document.getElementById ( 'TravelNotes-Control-ItineraryExpandButton' ).innerHTML = hiddenList ? '&#x25b6;' : '&#x25bc;';
		document.getElementById ( 'TravelNotes-Control-ItineraryExpandButton' ).title = hiddenList ? _Translator.getText ( 'ItineraryEditorUI - Show' ) : _Translator.getText ( 'ItineraryEditorUI - Hide' );
	};
	*/
	
	
	/*
	+-------------------------------------------+
	|                                           |
	| Itinerary events                          |
	|                                           |
	+-------------------------------------------+
	*/

	/*
	--- onInstructionClick function -----------------------------------------------------------------------------------

	click event listener for the instruction

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onInstructionClick = function ( clickEvent ) {
		clickEvent.stopPropagation ( );
		var element = clickEvent.target;
		while ( ! element.latLng ) {
			element = element.parentNode;
		}
		require ( '../core/MapEditor' ) ( ).zoomToPoint ( element.latLng );
	};
	
	/*
	--- onInstructionContextMenu function -----------------------------------------------------------------------------

	contextmenu event listener for the instruction

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onInstructionContextMenu = function ( clickEvent ) {
		clickEvent.stopPropagation ( );
		clickEvent.preventDefault ( );
		var element = clickEvent.target;
		while ( ! element.latLng ) {
			element = element.parentNode;
		}
		if ( element.maneuverObjId ) {
			require ( '../core/NoteEditor' ) ( ).newManeuverNote ( element.maneuverObjId, element.latLng );
		} 
		else if ( element.noteObjId ) {
			require ( '../core/NoteEditor' ) ( ).editNote ( element.noteObjId );
		}
	};
	
	/*
	--- onInstructionMouseEnter function ------------------------------------------------------------------------------

	mouseenter event listener for the instruction

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onInstructionMouseEnter = function ( mouseEvent ) {
		mouseEvent.stopPropagation ( );
		require ( '../core/MapEditor' ) ( ).addItineraryPointMarker ( mouseEvent.target.objId, mouseEvent.target.latLng  );
	};
	
	/*
	--- onInstructionMouseLeave function ------------------------------------------------------------------------------

	mouseleave event listener for the instruction

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onInstructionMouseLeave = function ( mouseEvent ) {
		mouseEvent.stopPropagation ( );
		require ( '../core/MapEditor' ) ( ).removeObject ( mouseEvent.target.objId );
	};

	/*
	+-------------------------------------------+
	|                                           |
	| Travel notes events                       |
	|                                           |
	+-------------------------------------------+
	*/

	/*
	--- onTravelNoteContextMenu function ------------------------------------------------------------------------------

	This function ...

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onTravelNoteContextMenu = function ( clickEvent ) {
		clickEvent.stopPropagation ( );
		clickEvent.preventDefault ( );
		var element = clickEvent.target;
		while ( ! element.noteObjId ) {
			element = element.parentNode;
		}
		require ( '../core/MapEditor' ) ( ).zoomToNote ( element.noteObjId );
	};
	
	/*
	--- onTravelNoteClick function ------------------------------------------------------------------------------------

	This function ...

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onTravelNoteClick = function ( clickEvent ) {
		clickEvent.stopPropagation ( );
		clickEvent.preventDefault ( );
		var element = clickEvent.target;
		while ( ! element.noteObjId ) {
			element = element.parentNode;
		}
		require ( '../core/NoteEditor' ) ( ).editNote ( element.noteObjId );
	};
	
	/*
	+-------------------------------------------+
	|                                           |
	| Search events                             |
	|                                           |
	+-------------------------------------------+
	*/

	/*
	--- _DrawSearchRectangle function ---------------------------------------------------------------------------------

	This function ...

	-------------------------------------------------------------------------------------------------------------------
	*/
	
	var _DrawSearchRectangle = function ( ) {
		if ( ! _SearchParameters.bbox ) {
			return;
		}
		if ( -1 !== _PreviousSearchRectangleObjId ) {
			require ( '../core/MapEditor' ) ( ).removeObject ( _PreviousSearchRectangleObjId );
		}
		else {
			_PreviousSearchRectangleObjId = require ( '../data/ObjId' ) ( );
		}
		require ( '../core/MapEditor' ) ( ).addRectangle ( 
			_PreviousSearchRectangleObjId, 
			L.latLngBounds ( _SearchParameters.bbox.southWest, _SearchParameters.bbox.northEast ) , 
			_TravelNotesData.config.previousSearchLimit );
	};
	
	/*
	--- onSearchSuccess function --------------------------------------------------------------------------------------

	This function ...

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onSearchSuccess = function ( searchData ) {
		_TravelNotesData.searchData = searchData;
		_OsmSearchStarted = false;
		_DrawSearchRectangle ( );
		ItineraryEditorUI( ).setSearch ( );
	};
	
	/*
	--- onSearchError function ----------------------------------------------------------------------------------------

	This function ...

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onSearchError = function ( error ) {
		console.log ( error );
		_OsmSearchStarted = false;
	};
	
	/*
	--- onSearchInputChange function ----------------------------------------------------------------------------------

	This function ...

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onSearchInputChange = function ( event ) {
		if ( _OsmSearchStarted ) {
			return;
		}
		_OsmSearchStarted = true;
		var mapBounds =  _TravelNotesData.map.getBounds ( );
		_SearchParameters = {
			bbox : { southWest : mapBounds.getSouthWest ( ), northEast : mapBounds.getNorthEast ( ) },
			searchPhrase : document.getElementById ( 'TravelNotes-Control-SearchInput' ).value
		};
		_TravelNotesData.searchData = [];
		window.osmSearch.getSearchPromise ( _SearchParameters ).then (  onSearchSuccess, onSearchError  );
	};
	
	/*
	--- _SetSearch function -------------------------------------------------------------------------------------------

	This function ...

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onMapChange = function ( event ) {
		var mapCenter = _TravelNotesData.map.getCenter ( );
		if ( -1 !== _NextSearchRectangleObjId ) {
			require ( '../core/MapEditor' ) ( ).removeObject ( _NextSearchRectangleObjId );
		}
		else {
			_NextSearchRectangleObjId = require ( '../data/ObjId' ) ( );
		}
		require ( '../core/MapEditor' ) ( ).addRectangle ( 
			_NextSearchRectangleObjId, 
			L.latLngBounds ( L.latLng ( mapCenter.lat - _SearchLimits.lat, mapCenter.lng - _SearchLimits.lng ), L.latLng (  mapCenter.lat + _SearchLimits.lat, mapCenter.lng + _SearchLimits.lng ) ), 
			_TravelNotesData.config.nextSearchLimit );
	};

	/*
	--- onSearchClick function ----------------------------------------------------------------------------------------

	click event listener for the search

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onSearchClick = function ( clickEvent ) {
		clickEvent.stopPropagation ( );
		var element = clickEvent.target;
		while ( ! element.latLng ) {
			element = element.parentNode;
		}
		require ( '../core/MapEditor' ) ( ).zoomToPoint ( element.latLng );
	};
	
	/*
	--- onSearchContextMenu function ----------------------------------------------------------------------------------

	contextmenu event listener for the search

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onSearchContextMenu = function ( clickEvent ) {
		clickEvent.stopPropagation ( );
		clickEvent.preventDefault ( );
		var element = clickEvent.target;
		while ( ! element.latLng ) {
			element = element.parentNode;
		}
		require ( '../core/NoteEditor' ) ( ).newSearchNote ( element.searchResult );
	};
	
	/*
	--- onSearchMouseEnter function -----------------------------------------------------------------------------------

	mouseenter event listener for the search

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onSearchMouseEnter = function ( mouseEvent ) {
		mouseEvent.stopPropagation ( );
		require ( '../core/MapEditor' ) ( ).addSearchPointMarker ( mouseEvent.target.objId, mouseEvent.target.latLng  );
	};
	
	/*
	--- onSearchMouseLeave function -----------------------------------------------------------------------------------

	mouseleave event listener for the search

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onSearchMouseLeave = function ( mouseEvent ) {
		mouseEvent.stopPropagation ( );
		require ( '../core/MapEditor' ) ( ).removeObject ( mouseEvent.target.objId );
	};

	/*
	+-------------------------------------------+
	|                                           |
	| Provider toolbar events                   |
	|                                           |
	+-------------------------------------------+
	*/

	/*
	--- onClicktransitModeButton function -----------------------------------------------------------------------------

	click event listener  for the car, bike and pedestrian buttons

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onClicktransitModeButton = function ( clickEvent ) {
		clickEvent.stopPropagation ( );

		_TravelNotesData.routing.transitMode = clickEvent.target.transitMode;

		document.getElementsByClassName ( 'TravelNotes-Control-ActiveTransitModeImgButton' ) [ 0 ].classList.remove ( 'TravelNotes-Control-ActiveTransitModeImgButton' );
		clickEvent.target.classList.add ( 'TravelNotes-Control-ActiveTransitModeImgButton' );

		require ( '../core/RouteEditor' ) ( ).startRouting ( );
	};
	
	/*
	--- onProviderButtonClick function --------------------------------------------------------------------------------

	click event listener for the providers button

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onProviderButtonClick = function ( clickEvent ) {
		clickEvent.stopPropagation ( );

		_TravelNotesData.routing.provider = clickEvent.target.provider;

		document.getElementsByClassName ( 'TravelNotes-Control-ActiveProviderImgButton' ) [ 0 ].classList.remove ( 'TravelNotes-Control-ActiveProviderImgButton' );
		clickEvent.target.classList.add ( 'TravelNotes-Control-ActiveProviderImgButton' ); 

		// activating the transit mode buttons, depending of the capabilities of the provider
		var provider = _TravelNotesData.providers.get ( clickEvent.target.provider );
		if ( provider.transitModes.car ) {
			document.getElementById ( 'TravelNotes-Control-carImgButton' ).classList.remove ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
		}
		else {
			document.getElementById ( 'TravelNotes-Control-carImgButton' ).classList.add ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
		}
		if ( provider.transitModes.bike ) {
			document.getElementById ( 'TravelNotes-Control-bikeImgButton' ).classList.remove ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
		}
		else {
			document.getElementById ( 'TravelNotes-Control-bikeImgButton' ).classList.add ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
		}
		if ( provider.transitModes.pedestrian ) {
			document.getElementById ( 'TravelNotes-Control-pedestrianImgButton' ).classList.remove ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
		}
		else {
			document.getElementById ( 'TravelNotes-Control-pedestrianImgButton' ).classList.add ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
		}
		if ( provider.transitModes.train ) {
			document.getElementById ( 'TravelNotes-Control-trainImgButton' ).classList.remove ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
		}
		else {
			document.getElementById ( 'TravelNotes-Control-trainImgButton' ).classList.add ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
		}
		
		// verfying that the current transit mode is supported by the provider, otherwise changes the transit mode
		if ( ! _TravelNotesData.providers.get ( clickEvent.target.provider ).transitModes [ _TravelNotesData.routing.transitMode ] ) { // you understand?
			if ( provider.transitModes.bike ) {
				document.getElementById ( 'TravelNotes-Control-bikeImgButton' ).click ( );
			}
			else if ( provider.transitModes.pedestrian )  {
				document.getElementById ( 'TravelNotes-Control-pedestrianImgButton' ).click ( );
			}
			else if ( provider.transitModes.car )  {
				document.getElementById ( 'TravelNotes-Control-carImgButton' ).click ( );
			}
			else if ( provider.transitModes.train )  {
				document.getElementById ( 'TravelNotes-Control-trainImgButton' ).click ( );
			}
		}
		
		require ( '../core/RouteEditor' ) ( ).startRouting ( );
	};

	/*
	+-------------------------------------------+
	|                                           |
	| Pane buttons events                       |
	|                                           |
	+-------------------------------------------+
	*/

	/*
	--- onClickItineraryPaneButton function -----------------------------------------------------------------------

	This function ...

	---------------------------------------------------------------------------------------------------------------
	*/

	var onClickItineraryPaneButton = function ( clickEvent ) {
		ItineraryEditorUI ( ).setItinerary ( );
	};

	/*
	--- onClickTravelNotesPaneButton function ---------------------------------------------------------------------

	This function ...

	---------------------------------------------------------------------------------------------------------------
	*/

	var onClickTravelNotesPaneButton = function ( clickEvent ) {
		ItineraryEditorUI ( ).setTravelNotes ( );
	};

	/*
	--- onClickSearchPaneButton function --------------------------------------------------------------------------

	This function ...

	---------------------------------------------------------------------------------------------------------------
	*/

	var onClickSearchPaneButton = function ( clickEvent ) {
		ItineraryEditorUI ( ).setSearch ( );
	};

	/*
	+-------------------------------------------+
	|                                           |
	| main function                             |
	|                                           |
	+-------------------------------------------+
	*/

	/*
	--- ItineraryEditorUI function ------------------------------------------------------------------------------------

	This function ...

	-------------------------------------------------------------------------------------------------------------------
	*/

	var ItineraryEditorUI = function ( ) {


		/*
		--- _CreateUI function ----------------------------------------------------------------------------------------

		This function creates the UI

		---------------------------------------------------------------------------------------------------------------
		*/

		var _CreateUI = function ( controlDiv ) {
			
			if ( document.getElementById ( 'TravelNotes-Control-ItineraryDataDiv' ) ) {
				// UI already created
				return;
			}

			var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;

			// header div: expand button and title
			var headerDiv = htmlElementsFactory.create ( 'div', { id : 'TravelNotes-Control-ItineraryHeaderDiv', className : 'TravelNotes-Control-HeaderDiv'}, controlDiv );
			
			/*
			var expandButton = htmlElementsFactory.create ( 'span', { innerHTML : '&#x25bc;', id : 'TravelNotes-Control-ItineraryExpandButton', className : 'TravelNotes-Control-ExpandButton'}, headerDiv );
			expandButton.addEventListener ( 'click' , onClickExpandButton, false );
			htmlElementsFactory.create ( 
				'span', 
				{ 
					innerHTML : _Translator.getText ( 'ItineraryEditorUI - Itinerary and notes' ), 
					id : 'TravelNotes-Control-ItineraryHeaderText', 
					className : 'TravelNotes-Control-HeaderText'
				},
				headerDiv 
			);
			*/
			
			var itineraryPaneButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					innerHTML : _Translator.getText ( 'ItineraryEditorUI - Itinerary' ), 
					id : 'TravelNotes-Control-ItineraryPaneButton', 
					className : 'TravelNotes-Control-PaneButton'
				},
				headerDiv 
			);
			itineraryPaneButton.addEventListener ( 'click', onClickItineraryPaneButton, false );
			var travelNotesPaneButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					innerHTML : _Translator.getText ( 'ItineraryEditorUI - Travel notes' ), 
					id : 'TravelNotes-Control-TravelNotesPaneButton', 
					className : 'TravelNotes-Control-PaneButton'
				},
				headerDiv 
			);
			travelNotesPaneButton.addEventListener ( 'click', onClickTravelNotesPaneButton, false );
			if ( window.osmSearch ) {
				var searchPaneButton = htmlElementsFactory.create ( 
					'div', 
					{ 
						innerHTML : _Translator.getText ( 'ItineraryEditorUI - Search' ), 
						id : 'TravelNotes-Control-SearchPaneButton', 
						className : 'TravelNotes-Control-PaneButton'
					},
					headerDiv 
				);
				searchPaneButton.addEventListener ( 'click', onClickSearchPaneButton, false );
			}
			
			// data div: currently empty. Will be completed later. See _SetItinerary ( )
			var dataDiv = htmlElementsFactory.create ( 'div', { id : 'TravelNotes-Control-ItineraryDataDiv', className : 'TravelNotes-Control-DataDiv'}, controlDiv );
			dataDiv.addEventListener ( 'wheel', onWheel, false );
			
			
			// buttons div ...
			var buttonsDiv = htmlElementsFactory.create ( 'div', { id : 'TravelNotes-Control-ItineraryButtonsDiv', className : 'TravelNotes-Control-ButtonsDiv' }, controlDiv );
			
			// ... bike
			var bikeButton = htmlElementsFactory.create (
				'img',
					{ 
						src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AoaESkaC0SxrgAABMdJREFUSMfNl1loVGcYhp//n+WcZmbiJE4WjVKVaLWOGxglilFTSmYUF1ILKiIILSjplQiKS65EXG4UvBGrQvVCUAdjoRrEGmtwjQbtWKlpEsTGGDMxkzKTzHr+XiRucbK4ts/lOd/5X853vuU9gj4YN+48Dx58DUBOzrmhnZ0qXykWJBKqKJlkYjyusgAsFtFqMnHPbBa/CcEvaWnir5YWT1vvM3ojUl2cPv1XamqK8fv/MBcWPtwfDhuLlWKYUvSLECAEzTabPHP16uc/uN1fJp6fNShhpRROZ+WSzk7jVDyuTLwDFotIpqXJb4LBkgohRP/Cbvc5/H6krhsnolFVOtAbDoQQoGnCF4nIb91uDL/f8+KefDXQ70e6XOpIJPL+ot2Zg0hElbpc6ojf/7qWBPB6q1FKoevqRCBgrOYDEwgYq3VdnVBK4fVWd2cjL6+SpqYSnM5zi4PBZAUfEafTtCQY9JzJy6tENjWVsH79ZWs4bJziIxMOG6fWr79sbWoq6S4uTTt7MBo1vuMToGnyx2jU+71ITz/rCoWM3w2D3AFKBUj0NIL5nYWl5IndLidJw2CsUgOJwtSp6SQSC7h5czZO50vhIUPMTJrkYMIEO8OHa4Op9FzDYKyUEs9gWqelJUpbm8GcOdcJBmOAARjEYgZFRUOoqZnNyJGDEkZKPOZIRM0bTIricUU8blBePhaQKAXJZBzDUMyYkcnly21cvx7sPRpSEomoeWZgQv9hSUAxYoSD8+efsmdPIxkZVgBMJrDZTKxdO4YLF56Sm/sZT5509jzX76SdYI7FurdMKoqKMti8eQyZmVakFOTkaGzaFGP79gZCoSSaJpk82UFl5VN2727k+PEpxGIGHR0Jdu5s4Natf1KeG4uprD7Lc86cDPbuHc/y5Xd4/DhKa+tXNDZ2cfJkC9euFXLw4EMMA6ZNG8KOHfUcPjyZKVPSWbnyNg0NEXy+aaxadYcbN1KLS6tVtKZK75YtY1ix4i51dZ0sWpTF3bshurqSZGdruN3VLFyYS3HxUEKhJAsXZpGbq1Faeovt28dz716IpUtvs21bfs+neh2rVbSagftAVu+edTotdHUl0XVJdraV+fOvcejQJPLzbSj1lHXr/GiapL09gc83lWg0ycyZDk6ffozNZiIUSpKdbe3p/ze4LzVNVKVIBJcuteHxuOjqSrJvXyNpaSaKi134fM2AoL6+C6/Xxf79X7Bx45/Y7RZ27XpIeXkdoVCcuXMzuXIldZVrmqgSdvvZwnDYuNK7l9PTzVRVzUAIQV1dmLlzh7Jhw32OHm16ZY0r8vPTSCQUXm8WW7fmc/p0C263g5wcK7NmXePZs/gbO9pmk7MGGJkJvN5cRo9O4+efW3j0KNKXaQEMJk50sGzZMOrrwxw79nfKlno+MgexJFR/Lumt458vCQlQVmYvs1hEgj79oHiLNdB3vMUiEmVl9rL/3gh4vdW0t5ec0XXp+1iiui597e0lZ7zeal4YgZecky6XOvKhfZfLJX8KBMQa8BgpXabbjREIiDW6LnxCvL+gEKDrwhcIiDVuN8b/wtCnXJ4FBRfp6PBU1NaO0h0OeUBKmgeTASFASpodDnmgtnaU3tHhqSgouDj4f6dP8dP2L6C7Ld6Z4dDBAAAAAElFTkSuQmCC",
						id : 'TravelNotes-Control-bikeImgButton', 
						className : 'TravelNotes-Control-ImgButton'
					},
				buttonsDiv
			);
			bikeButton.transitMode = 'bike';
			bikeButton.addEventListener ( 'click', onClicktransitModeButton, false );
			
			// ... pedestrian
			var pedestrianButton = htmlElementsFactory.create (
				'img',
					{ 
						src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AoaESo7bADyMwAABNlJREFUSMe1V19oU1cY/52Te5Ob3DR/SfzTNNCufxRXxmarONCnPbi+ykYrFdRSkeJLX5ykZcKcFfG5oIJ2Y2sVFZQ+iPoiUhC128OIiJrUlgQTm9o0t23SJufmnj2k2ura5syx7ynknu/7nd93vr8E6wghBJxzAEAgAEsmc3pToWD1y3L6M8NQfABA6eIUY54xs3kh5Xb3JONx5D/WXdX2Wh9crkPIZAbAOVBRcbpvYaHuO87lDZyTCs7lFaochDAQwucANmmzRa7PzfWECFm2IQTsdrdiZuYqHI5quVg80J7P113WdR+AIsTEBEmagsUSOayq539PpVLM5WpFJnO1POOtW+GMRH4dKRa9jZxTABz/TggIMSDLU+Fg8NDuaBTaxyfoux8ORxsAwG7vrI5Ehl7pur+Rc/IJoCX3c05QKGxsnJgYemW3d1avxPgH42AQzkRi6JWuOz3ljReX7k3KnpQkLb158/6aWGyZOS0F0kF4vX45mRwY0XV3WdCGBhsePvwa3d1BAEZZYF13e5LJgRGv1y87nQdLjCmlMAwDqvrj4Wx2x6XyDAw8eLADe/b4AQCqehu5nJj7bbYnHbncT5cppaCGYYBzIJ+vu7TiydcNnP7+GBKJRQwPJ5HL6YLvTlEo1F3iHDAMo4Rkt5/qK6UMFwK+du0NurvDePt2EQ0NdkE9Dl33wW4/1QcApKoKltevrz01DLVWNGKbmhwYHd1dCrEiR0vLY9y7Ny0UaJRmo5WV339OZ2b6NgGyXzRRVFXC4OCXKwwBd+/uRH//VkHmsn9mpm8TZUzxcU4comzb2zciEFCg6yWQZ8/mcOJEGF1dNaivV8tb4MTBmOKjkpSuLdXe8lJZacb5819g374/QEiphJpMBGfPvlxiTwSAZUjSdC0tdZnyCiYTwfBwMx49SuPOnSkA7P3/7/QZM4SC0zCsPkn0bX0+GU+eTCMUGgNAcO7cGEwmCbOzFITI2Lv3ESYmFsWruar2tmWzu4bEjhtLxY4jn/8G2ayByck8mpsfY36+CPEAfbif6ronSggTLgKAgQsXtmF+nuLIkTC2bHGhpcUj3EwIYdB1b5TK8uIUIXxW9LbBoBXt7VW4ciWOGzeSuHnzNQYHvxJ3MeGzZvPiFHW7Q0mApcTUiujtrYHVChw79hyAjOPHX6JYJLh4cZtQwyCEpVyuUJLG48hbrS+uA6aySvX1Kjo7q9HV9fS9a6PRHG7dSqCtLYBAwFp2OlGUF9fjceRJKbcAWf6N67p3zbciBBgZ2Ym6OjsaGh4gk1luDmYzQT7/LUKhZzhzZnyN0kkgSdNg7AAhBKCUUhACWCyRjvVc1dxcgV273Dh58jkymQ+DsVAwcPToX1AUsm5GmM2RjiXQ0tVcroMAbsvZ7Nk/GdvYuNoF/H4ZGzZYEA7PrcpIUSgoBXI5Y9VskOU3Yafzh+2MtTBN++W/jD7iIklauqpqf834+Eejz7tBLBaDpij3myRJS4sNBeXzXpK0tKLcbxofh+Z0tq0/3tbWwhmLDYww5vv/x9vlDaIV0Sg0jye03WYbPSxJ0xBJtQ8H+mlus412eDwntkej0Fyu1k9dYX7uW1ioX3OFoZQB4HOEsEmr9RNXmLWWtspKWDRt9aVN1z1jsryQcjh6komE2NL2N0SHF0QJfjNNAAAAAElFTkSuQmCC",
						id : 'TravelNotes-Control-pedestrianImgButton', 
						className : 'TravelNotes-Control-ImgButton'
					},
				buttonsDiv
			);
			pedestrianButton.transitMode = 'pedestrian';
			pedestrianButton.addEventListener ( 'click', onClicktransitModeButton, false );
			
			// ... car
			var carButton = htmlElementsFactory.create (
				'img',
					{ 
						src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AoaESgBmDpJAwAABQBJREFUSMe9V09MFFcY/703szOz7PLP2WVBV6rtdm21HqhG2wiCh8bL2jWhsl71IhqJJ4oHL4RIxKP1HzESLh4MEGPkoAeNYRWtGkPShGRF+aeFld2psd0BZnZmXg+LW4SdrW3EX/Iub775fe/7977vEdigrCyMmZnrAABZbvGoavkGSh0hy3LtNAzuS57nZAAwTVPhOHOEUnXAstL9Ltd0TFFOJ5dyLAXJtSnLMhRFwaNHoDt3nj2v66vDjHHljDkAsIXf2CKKzB4haRBixgVh6vrAwNEj27bB8ng8SCaTH6aYMcDtPh3StM/6DKNIACz8N1Dw/J+6KI7Xp1It/YTkkliEwsJmnD8PIopdvbOzX90wDPf/UAoAFgzDLczOfn1Dkrp6T5wAKSpqtre4tRXk5MkLV3W9ch8+IgRhsqel5XCkrS0bn4xiWZaRTCqQpK5eTfPVYwUgiq/75ucP/uT1ZmJOvd4wFEWBy9UR0nXPiigFAF331LtcHaFkMomysnDG4mgUdNeuq3OZmK4ceD6lP34ccVZVwSIZN5y9qGlfHLJPJAa/X4LbzeUlnp21MDk5Z1csAChE8XmnpjU1Eln+2fPmzXe/WZZYbkcoyxympn6AaaahKCrIkvpgjKGkpACSJCAQuI2JibR9oVEtXlz862ZeVSs2MMaV57NkzRoHBIFi06aHGB5+m/XC4sIIBAoxMrILfr+YVzFjXPncXPkGSikfytxIeapyIQKHDlUAAIJBN3p7t+Lata0IBt0AGBobVy/IsrxcjDlACL+Htyx3zT+nz3GnEqCyUkJ39wSOHYvh7t1vUVvrz37fu3cNotHfUVs7BElywO+XAKj5VIMxdw01TS5onwwWHjzYjp6ebaiokFBdXYJUSl8mNT9voq6uBH6/hO7uLXjy5HtQamsKTJMLUo7j5NwWMxw44Mf27TIKCnjs3u1DNFqDVGq5bDJp4M6dHQiHV6OggMeWLaU4enQt7Hg5jltF88WjqIjPNo13aGj4fJnc/v3r32swAFBcnD9vqGmaSm5XE5w58xINDYMgBKiru4ebN+NIpxlGR1WMjWXW6KgKTbMwOKigunoAhACHDz/CqVNjsOM1TVPhBOHHsGG4KnOfK41z577BunWFcDgscByDzyfh9u04Xr5UMTmZWT6fhFevVAQCBaiqKkVpKYfLl6fzNI3UEE9pKgr4duSOB0EqZQAAVNXAyIiKp0/fgudJ1qWEAJcujYEQAll2LMiaiwaG5ZyEpKK8ZRn9hKSPM8bnul3R1TWJUGgtLlyYwtDQX3njtn69E01NQVy58gqMEZvyTIMxo586ndMxQsy4Hdn4eBr37ycwPj6/YIH9mprScO9eAs+eaXnuBTPudE7HFprELxc1LZCnSVhLh5W804e9LIUgPO/U9aZGAgDDw6CbN1+dM82VbYscl9JjsYgzEIBFy8rC2LgRlihO1BNirphSQkyI4nh9IAArOwh4vV7MzCQ+7egDAIlEAoQAra0H9wnCRM/HVioIEz2trQf3EYLsjP1eFrS3N7Pjx49ERPF138dwe8a9r/va2o5E2tub2QcO9B0hTVv3aQb6d/B4ZKhqS/+tWxGnJL3opFSLE2IsOifJcXYCQgxQqsUl6UXn4GDEqaot/V6v58PfTpmECyORWPpo4/dYlrvGMLggz3OrFh5tf1BqPuO4VNSyjBsuVzymKB3/+mj7G1dPIltjqpC6AAAAAElFTkSuQmCC",
						id : 'TravelNotes-Control-carImgButton', 
						className : 'TravelNotes-Control-ImgButton'
					},
				buttonsDiv
			);
			carButton.transitMode = 'car';
			carButton.addEventListener ( 'click', onClicktransitModeButton, false );
			
			// ... train
			var trainButton = htmlElementsFactory.create (
				'img',
					{ 
						src : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4goTCiEjvCsRvgAABXRJREFUSMe9V11MFFcU/u7MsDPLrgvu7A80BEhLsRIxEFIlcSXBF41BN2ExqC8kPHQraV80iA+GhKAYaLUihkLaaErig1FCiCZq2kQDjS0YfcGYQKtBg7DL7hbFHdaZnTu3D0tR7C7aRvxeJrn3zP3O3z3nXIIUcLm8mJ0dBADIcpNDUbLWcVxalWFYKnSd/1QQeBkAKKURnqd/cJwyZBjxqxbLzHgk0hF+84w3QZItyrKMSCSC0VFwFRVnuzXtIy9jfBZjaQDY4m/stSMSa4TEQQgNmEzTg0NDXzVs2gTD4XAgHA6/GzFjgNXaUaWqef26bjMBBv4bOAjCvCaKk75otOkqIckkXsOaNY3o7gYRxXOXFxY+u6Lr1v9BCgAGdN1qWlhYf0WSzl0+ehTEZmtMbXFLC8jx499f1LTcPXiPMJmeXGpqOlDb2roUnwSxLMsIhyOQpHOXVdXtwypAFIP9L1/W1zidiZhzTqcXkUgEFkt7laY5VoUUADTN4bNY2qvC4TBcLm/C4uFhcJWVF2OJmK4eBCGq3blTay4thUESbjjbo6qf+JMlks3GYX7egNfrgtv9A+bn55Geng673Y7du3eD0iL4/ffx6JECm03A3JwOxlJnuyj+2auqX3/Jy/Jhh6Ks72SMtyZPDAJNY9i40Yq+vi9QU1OD6elp5OXlIRgMorp6C4qL14BSBkWhCAY1CAJgJL0MDIyl52Rm5v8kKEr2Osb4rJQXw0iob7ebMDIygvLy8qW9/Px89PT0oKSkBGfOfItTpwK4fz8KWU5DMBhH8hrBZ8ViWes4jhOqEhUpORwOEW63Cdu2CSgvL8fY2BgYY2CMobOzEzt27IDD4UBnZydevEi42WYTUp7HWBoIEXYJhmHd+qr8/Rvd3RuQns5j374NOH/+PLKzs9HX1wdCCOx2O+rq6pCTkwNN00AIQSCgYnx8AUAsFTUYs24VKOULl9fe5XjyJIbm5s9x4sQJlJSUwO12g1KaUtHe3l7k5lbg3r35FBIElPKFHM/z8koWHzu2BUNDQ7h27RpKS0tXJAUAv9+Pykr7ChIMPM/bhbfdPb/fj4GBAfT39y+tud1ubN68GRkZGQiFQpiamsKzZ8+gKApisRhGR/sAFK18pymlEYA4U1lNKUVlZSUuXLiA7du3w25fbg1J0nri8Tiam39ewdU0IvA8nYjHmTOVZnv37kVhYSE8Hg/YYmX45zs5OYmZmRmUlZVBkqTF0qhB1/W3uJpOcBwXHU7RlgEA1dXV4HkegiDgwIEGdHR8A13XQQjBxMQEPB4P2tvbl+T379+PgwcPrUBMQEh0mEjSd1tU9eNfGUse7p07HcjOlvD0aRPMZjMGBgaW9nw+HyoqKqAoCjRNA6UUU1NTuH79OmZmfkxOS3SI4iMPWbv2sOP58/IxwxBTVi9CgPr6HITDzXC5XJAkCV1dXSltOnToF5w8qSav1pwayMj4vViYm+sIi2LXoKoWJG0SZjOBIHAoK7OB484gM/M31NXV4e7du7h5U0Ju7gzM5hhu3bqFkZEReDzHcfr0wgoj0dPBubmOMAGABw/AFRdfjFG6um2R56Pa+HituaAABudyeVFUBEMUH/sIoatGSgiFKE76CgpgLA0CTqcTs7OhDzv6AEAoFAIhQEtL/R6T6fGl901qMj2+1NJSv4cQLM3Yy8bbtrZGduRIQ60oBvvfh9sT7g32t7Y21La1NbJ3HOjbq1Q1/8MM9K+avwxFabp640atWZIe9nKcGiBEf01PkkR3AkJ0cJwakKSHvbdv15oVpemq0+l497dTIuG8CIXefLQJuwzDulXX+UJB4O2LTeQvjqMTPB8dNgz9isUSGI9E2t/6aPsbwfNWty4y/a8AAAAASUVORK5CYII=",
						id : 'TravelNotes-Control-trainImgButton', 
						className : 'TravelNotes-Control-ImgButton'
					},
				buttonsDiv
			);
			trainButton.transitMode = 'train';
			trainButton.addEventListener ( 'click', onClicktransitModeButton, false );
			
			// providers
			if ( _TravelNotesData.providers ) {
				var activeButton = false;
				_TravelNotesData.providers.forEach (
					function ( provider ) {
						var providerButton = htmlElementsFactory.create (
							'img',
								{ 
									src : "data:image/png;base64," + provider.icon,
									id : 'TravelNotes-Control-'+ provider.name + 'ImgButton', 
									className : 'TravelNotes-Control-ImgButton',
									title : provider.name
								},
							buttonsDiv
						);
						providerButton.provider = provider.name.toLowerCase ( );
						providerButton.addEventListener ( 'click', onProviderButtonClick, false );
						// when loading the control, the first provider will be the active provider
						if ( ! activeButton ) {
							providerButton.classList.add ( 'TravelNotes-Control-ActiveProviderImgButton' );
							_TravelNotesData.routing.provider = providerButton.provider;
							activeButton = true;
							
							// ... and the first possible transit mode will be the active transit mode
							if ( provider.transitModes.bike ) {
								bikeButton.classList.add ( 'TravelNotes-Control-ActiveTransitModeImgButton' );
								_TravelNotesData.routing.transitMode = 'bike';
							} else if ( provider.transitModes.pedestrian ) {
								pedestrianButton.classList.add ( 'TravelNotes-Control-ActiveTransitModeImgButton' );
								_TravelNotesData.routing.transitMode = 'pedestrian';
							} else if ( provider.transitModes.car ) {
								carButton.classList.add ( 'TravelNotes-Control-ActiveTransitModeImgButton' );
								_TravelNotesData.routing.transitMode = 'car';
							} else if ( provider.transitModes.train ) {
								trainButton.classList.add ( 'TravelNotes-Control-ActiveTransitModeImgButton' );
								_TravelNotesData.routing.transitMode = 'train';
							} 
							
							// deactivating transit mode buttons if not supported by the provider
							if ( ! provider.transitModes.car ) {
								carButton.classList.add ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
							}
							if ( ! provider.transitModes.pedestrian ) {
								pedestrianButton.classList.add ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
							}
							if ( ! provider.transitModes.bike ) {
								bikeButton.classList.add ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
							}
							if ( ! provider.transitModes.train ) {
								trainButton.classList.add ( 'TravelNotes-Control-InactiveTransitModeImgButton' );
							}
						}
					}
				);
			}
		};

		/*
		--- _RemoveActivePane function --------------------------------------------------------------------------------

		This function ...

		---------------------------------------------------------------------------------------------------------------
		*/

		var _RemoveActivePane = function ( ) {
			switch ( _ActivePaneIndex ) {
				case 0:
					_RemoveItinerary ( );
					break;
				case 1:
					_RemoveTravelNotes ( );
					break;
				case 2 :
					if ( window.osmSearch ) {
						_RemoveSearch ( );
					}
					break;
				default:
					break;
			}
		};
		
		/*
		+-------------------------------------------+
		|                                           |
		| Itinerary functions                       |
		|                                           |
		+-------------------------------------------+
		*/

		/*
		--- _RemoveItinerary function ---------------------------------------------------------------------------------

		This function ...

		---------------------------------------------------------------------------------------------------------------
		*/
		
		var _RemoveItinerary = function ( ) {
			
			var dataDiv = document.getElementById ( 'TravelNotes-Control-ItineraryDataDiv' );
			if ( ! dataDiv ) {
				return;
			}
			
			// removing previous header 
			var routeHeader = document.getElementsByClassName ( 'TravelNotes-Control-Route-Header' ) [ 0 ];
			if ( routeHeader ) {
				dataDiv.removeChild ( routeHeader );
			}
			
			// removing previous itinerary
			var childCounter;
			var childNodes;
			var childNode;			
			var routeManeuversNotesList = document.getElementsByClassName ( 'TravelNotes-Control-Route-ManeuversAndNotes' ) [ 0 ];
			if ( routeManeuversNotesList ) {
				childNodes = routeManeuversNotesList.childNodes;
				for ( childCounter = 0; childCounter < childNodes.length; childCounter ++ ) {
					childNode = childNodes [ childCounter ];
					childNode.removeEventListener ( 'click' , onInstructionClick, false );
					childNode.removeEventListener ( 'contextmenu' , onInstructionContextMenu, false );
					childNode.removeEventListener ( 'mouseenter' , onInstructionMouseEnter, false );
					childNode.removeEventListener ( 'mouseleave' , onInstructionMouseLeave, false );
				}
				dataDiv.removeChild ( routeManeuversNotesList );
			}
		};
				
		/*
		--- _SetItinerary function ------------------------------------------------------------------------------------

		This function add the itinerary to the UI

		---------------------------------------------------------------------------------------------------------------
		*/

		var _SetItinerary = function ( ) {
			
			_ActivePaneIndex = 0;

			document.getElementById ( 'TravelNotes-Control-ItineraryPaneButton' ).classList.add ( 'TravelNotes-Control-ActivePaneButton' );
			document.getElementById ( 'TravelNotes-Control-TravelNotesPaneButton' ).classList.remove ( 'TravelNotes-Control-ActivePaneButton' );
			if ( window.osmSearch ) {
				document.getElementById ( 'TravelNotes-Control-SearchPaneButton' ).classList.remove ( 'TravelNotes-Control-ActivePaneButton' );
			}
			
			var htmlViewsFactory = require ( '../UI/HTMLViewsFactory' ) ( );
			htmlViewsFactory.classNamePrefix = 'TravelNotes-Control-';
			
			var dataDiv = document.getElementById ( 'TravelNotes-Control-ItineraryDataDiv' );
			if ( ! dataDiv ) {
				return;
			}
			
			// adding new header
			dataDiv.appendChild ( htmlViewsFactory.routeHeaderHTML );
			
			
			// adding new itinerary
			dataDiv.appendChild ( htmlViewsFactory.routeManeuversAndNotesHTML );
			
			// adding event listeners 
			var childCounter;
			var childNodes;
			var childNode;			
			var routeManeuversNotesList = document.getElementsByClassName ( 'TravelNotes-Control-Route-ManeuversAndNotes' ) [ 0 ];
			if ( routeManeuversNotesList ) {
				childNodes = routeManeuversNotesList.childNodes;
				for ( childCounter = 0; childCounter < childNodes.length; childCounter ++ ) {
					childNode = childNodes [ childCounter ];
					childNode.addEventListener ( 'click' , onInstructionClick, false );
					childNode.addEventListener ( 'contextmenu' , onInstructionContextMenu, false );
					childNode.addEventListener ( 'mouseenter' , onInstructionMouseEnter, false );
					childNode.addEventListener ( 'mouseleave' , onInstructionMouseLeave, false );
				}
			}
		};
		
		/*
		+-------------------------------------------+
		|                                           |
		| Travel notes functions                    |
		|                                           |
		+-------------------------------------------+
		*/

		/*
		--- _RemoveTravelNotes function -------------------------------------------------------------------------------

		This function ...

		---------------------------------------------------------------------------------------------------------------
		*/

		var _RemoveTravelNotes = function ( ) {

			var dataDiv = document.getElementById ( 'TravelNotes-Control-ItineraryDataDiv' );
			if ( ! dataDiv ) {
				return;
			}

			var travelNotesDiv = dataDiv.firstChild;
			if ( travelNotesDiv ) {
				travelNotesDiv.childNodes.forEach (
					function ( childNode  ) {
						childNode.removeEventListener ( 'click' , onTravelNoteClick, false );
						childNode.removeEventListener ( 'contextmenu' , onTravelNoteContextMenu, false );
					}
				);
				dataDiv.removeChild ( travelNotesDiv );
			}
		};
		
		/*
		--- _SetTravelNotes function ----------------------------------------------------------------------------------

		This function ...

		---------------------------------------------------------------------------------------------------------------
		*/
		
		var _SetTravelNotes = function ( ) {

			_ActivePaneIndex = 1;

			document.getElementById ( 'TravelNotes-Control-ItineraryPaneButton' ).classList.remove ( 'TravelNotes-Control-ActivePaneButton' );
			document.getElementById ( 'TravelNotes-Control-TravelNotesPaneButton' ).classList.add ( 'TravelNotes-Control-ActivePaneButton' );
			if ( window.osmSearch ) {
				document.getElementById ( 'TravelNotes-Control-SearchPaneButton' ).classList.remove ( 'TravelNotes-Control-ActivePaneButton' );
			}
			
			var htmlViewsFactory = require ( '../UI/HTMLViewsFactory' ) ( );
			htmlViewsFactory.classNamePrefix = 'TravelNotes-Control-';
			
			var dataDiv = document.getElementById ( 'TravelNotes-Control-ItineraryDataDiv' );
			if ( ! dataDiv ) {
				return;
			}
			
			// adding travel notes
			var travelNotesDiv = htmlViewsFactory.travelNotesHTML;
			dataDiv.appendChild ( travelNotesDiv );
			travelNotesDiv.childNodes.forEach (
				function ( childNode  ) {
					childNode.addEventListener ( 'click' , onTravelNoteClick, false );
					childNode.addEventListener ( 'contextmenu' , onTravelNoteContextMenu, false );
				}
			);
		};
		
		/*
		+-------------------------------------------+
		|                                           |
		| Search functions                          |
		|                                           |
		+-------------------------------------------+
		*/

		/*
		--- _RemoveSearch function ------------------------------------------------------------------------------------

		This function ...

		---------------------------------------------------------------------------------------------------------------
		*/

		var _RemoveSearch = function ( ) {
			
			_TravelNotesData.map.off ( 'zoom', onMapChange );
			_TravelNotesData.map.off ( 'move', onMapChange );
			if ( -1 !== _NextSearchRectangleObjId ) {
				require ( '../core/MapEditor' ) ( ).removeObject ( _NextSearchRectangleObjId );
				_NextSearchRectangleObjId = -1;
			}
			if ( -1 !== _PreviousSearchRectangleObjId ) {
				require ( '../core/MapEditor' ) ( ).removeObject ( _PreviousSearchRectangleObjId );
				_PreviousSearchRectangleObjId = -1;
			}
			var dataDiv = document.getElementById ( 'TravelNotes-Control-ItineraryDataDiv' );
			if ( ! dataDiv ) {
				return;
			}
			var searchInputElement = document.getElementById ( 'TravelNotes-Control-SearchInput' );
			if ( searchInputElement ) {
				searchInputElement.removeEventListener ( 'change', onSearchInputChange, false );
			}
			var searchDiv = document.getElementById ( 'TravelNotes-Control-SearchDiv' );
			
			var searchResultsElements = document.getElementsByClassName ( 'TravelNotes-Control-SearchResult' );
			
			Array.prototype.forEach.call ( 
				searchResultsElements,
				function ( searchResultsElement ) {
					searchResultsElement.removeEventListener ( 'click' , onSearchClick );
					searchResultsElement.removeEventListener ( 'contextmenu' , onSearchContextMenu, false );
					searchResultsElement.removeEventListener ( 'mouseenter' , onSearchMouseEnter, false );
					searchResultsElement.removeEventListener ( 'mouseleave' , onSearchMouseLeave, false );
				}
			);
			
			if ( searchDiv ) {
				dataDiv.removeChild ( searchDiv );
			}
		};
		
		/*
		--- _SetSearch function ---------------------------------------------------------------------------------------

		This function ...

		---------------------------------------------------------------------------------------------------------------
		*/
		
		var _SetSearch = function ( ) {
			
			_ActivePaneIndex = 2;

			document.getElementById ( 'TravelNotes-Control-ItineraryPaneButton' ).classList.remove ( 'TravelNotes-Control-ActivePaneButton' );
			document.getElementById ( 'TravelNotes-Control-TravelNotesPaneButton' ).classList.remove ( 'TravelNotes-Control-ActivePaneButton' );
			document.getElementById ( 'TravelNotes-Control-SearchPaneButton' ).classList.add ( 'TravelNotes-Control-ActivePaneButton' );

			_TravelNotesData.map.on ( 'zoom', onMapChange );
			_TravelNotesData.map.on ( 'move', onMapChange );
			onMapChange ( );
			_DrawSearchRectangle ( );
			var dataDiv = document.getElementById ( 'TravelNotes-Control-ItineraryDataDiv' );
			if ( ! dataDiv ) {
				return;
			}
			
			var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;
			var searchDiv = htmlElementsFactory.create (
				'div',
				{
					id : 'TravelNotes-Control-SearchDiv'
				},
				dataDiv
			);
			var searchButton = htmlElementsFactory.create (
				'div', 
				{ 
					id : 'TravelNotes-Control-SearchButton',
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'ItineraryEditorUI - Search OpenStreetMap' ), 
					innerHTML : '&#x1f50e'
				},
				searchDiv 
			);
			searchButton.addEventListener ( 'click', onSearchInputChange, false );

			var searchInput = htmlElementsFactory.create ( 
				'input', 
				{ 
					type : 'text', 
					id : 'TravelNotes-Control-SearchInput', 
					placeholder : _Translator.getText ( 'ItineraryEditorUI - Search phrase' ),
					value: _SearchParameters.searchPhrase
				},
				searchDiv 
			);
			searchInput.addEventListener ( 'change', onSearchInputChange, false );
			searchInput.focus ( );
			var resultsCounter = 0;
			_TravelNotesData.searchData.forEach ( 
				function ( searchResult ) {
					var searchResultDiv = htmlElementsFactory.create (
						'div',
						{
							id : 'TravelNotes-Control-SearchResult'+ (resultsCounter ++ ),
							className :	'TravelNotes-Control-SearchResult',
							innerHTML : ( searchResult.description != '' ? '<p class=\'TravelNotes-Control-SearchResultDescription\'>' + searchResult.description + '</p>' : '' ) +
								( searchResult.name != '' ?  '<p>' + searchResult.name + '</p>' : '' ) +
								( searchResult.street != '' ? '<p>' + searchResult.street + ' ' + searchResult.housenumber +'</p>' : '' ) +
								( searchResult.city != '' ? '<p>' + searchResult.postcode + ' ' + searchResult.city +'</p>' : '' ) +
								( searchResult.phone != '' ? '<p>' + searchResult.phone + '</p>' : '' ) +
								( searchResult.email != '' ? '<p><a href=\'mailto:' + searchResult.email + '\'>' + searchResult.email + '</a></p>' : '' ) +
								( searchResult.website != '' ? '<p><a href=\''+ searchResult.website +'\' target=\'_blank\'>' + searchResult.website + '</a></p>' : '' ) +
								( searchResult.ranking ? '<p>&#x26ab;' + searchResult.ranking + '</p>' : '' )
						},
						searchDiv
					);
					searchResultDiv.searchResult = searchResult;
					searchResultDiv.objId = require ( '../data/ObjId' ) ( );
					searchResultDiv.osmId = searchResult.id;
					searchResultDiv.latLng = L.latLng ( [ searchResult.lat, searchResult.lon ] );
					searchResultDiv.addEventListener ( 'click' , onSearchClick, false );
					searchResultDiv.addEventListener ( 'contextmenu' , onSearchContextMenu, false );
					searchResultDiv.addEventListener ( 'mouseenter' , onSearchMouseEnter, false );
					searchResultDiv.addEventListener ( 'mouseleave' , onSearchMouseLeave, false );
				}
			);	
		};

		/* 
		--- ItineraryEditorUI object ----------------------------------------------------------------------------------
		
		---------------------------------------------------------------------------------------------------------------
		*/
		
		return {
			createUI : function ( controlDiv ) { 
				_CreateUI ( controlDiv ); 
			},
			setItinerary : function ( ) { 
				_RemoveActivePane ( );
				_SetItinerary ( );
			},
			setTravelNotes : function ( ) { 
				_RemoveActivePane ( );
				_SetTravelNotes ( );
			},
			setSearch : function ( ) { 
				_RemoveActivePane ( );
				_SetSearch ( );
			},
			get provider ( ) { return _TravelNotesData.routing.provider;},
			set provider ( providerName ) {
				 var button = document.getElementById ( 'TravelNotes-Control-'+ providerName + 'ImgButton' );
				 if ( button ) {
					 button.click ( );
				 }
			},
			get transitMode ( ) { return _TravelNotesData.routing.transitMode; },
			set transitMode ( transitMode ) {
				var button = document.getElementById ( 'TravelNotes-Control-' + transitMode + 'ImgButton' );
				 if ( button ) {
					 button.click ( );
				 }
			}
		};
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = ItineraryEditorUI;
	}

}());

/*
--- End of ItineraryEditorUI.js file ----------------------------------------------------------------------------------
*/	
},{"../L.TravelNotes":7,"../UI/HTMLViewsFactory":14,"../core/MapEditor":28,"../core/NoteEditor":29,"../core/RouteEditor":30,"../data/ObjId":39,"./HTMLElementsFactory":13,"./Translator":20}],16:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- NoteDialog.js file ------------------------------------------------------------------------------------------------
This file contains:
	- the NoteDialog object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.3.0:
		- changed message
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170929
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	var _Translator = require ( '../UI/Translator' ) ( );
	var _UserData = { editionButtons : [], preDefinedIconsList : [] };
	var _ServerData = { editionButtons : [], preDefinedIconsList : [] };
	var _GlobalData = { editionButtons : [], preDefinedIconsList : [] };
	var _Note;
	var _RouteObjId;
	
	
	/*
	--- onOkButtonClick function ----------------------------------------------------------------------------------

	click event listener for the ok button

	-------------------------------------------------------------------------------------------------------------------
	*/

	var onOkButtonClick = function ( ) {
		// Verifying that the icon is not empty. A note with an empty icon cannot be viewed on the map
		// and then, cannot be edited or removed!
		if ( 0 === document.getElementById ( 'TravelNotes-NoteDialog-TextArea-IconHtmlContent' ).value.length ) {
			document.getElementById ( 'TravelNotes-BaseDialog-ErrorDiv' ).innerHTML = _Translator.getText ( 'Notedialog - The icon content cannot be empty' );
			document.getElementById ( 'TravelNotes-BaseDialog-ErrorDiv' ).classList.remove ( 'TravelNotes-BaseDialog-ErrorDivHidden' );
			return false;
		}
		// saving values in the note.
		_Note.iconWidth = document.getElementById ( 'TravelNotes-NoteDialog-WidthNumberInput' ).value;
		_Note.iconHeight = document.getElementById ( 'TravelNotes-NoteDialog-HeightNumberInput' ).value;
		_Note.iconContent = document.getElementById ( 'TravelNotes-NoteDialog-TextArea-IconHtmlContent' ).value;
		_Note.popupContent = document.getElementById ( 'TravelNotes-NoteDialog-TextArea-PopupContent' ).value;
		_Note.tooltipContent = document.getElementById ( 'TravelNotes-NoteDialog-InputText-Tooltip' ).value;
		_Note.address = document.getElementById ( 'TravelNotes-NoteDialog-InputText-Adress' ).value;
		_Note.url = document.getElementById ( 'TravelNotes-NoteDialog-InputText-Link' ).value;
		_Note.phone = document.getElementById ( 'TravelNotes-NoteDialog-InputText-Phone' ).value;
		require ( '../core/NoteEditor' ) ( ).endNoteDialog ( _Note, _RouteObjId );
		return true;
	};

	/*
	--- NoteDialog function -------------------------------------------------------------------------------------------

	-------------------------------------------------------------------------------------------------------------------
	*/

	var NoteDialog = function ( note, routeObjId, newNote ) {

		// function to add the predefined icons to the select
		var addPreDefinedIconsList = function ( ) {
			_GlobalData.preDefinedIconsList = _ServerData.preDefinedIconsList.concat ( _UserData.preDefinedIconsList );
			_GlobalData.preDefinedIconsList.sort ( function ( a, b ) { return a.name.localeCompare ( b.name );} );
			var elementCounter = 0;
			for ( elementCounter = preDefinedIconsSelect.length - 1; elementCounter>= 0; elementCounter -- ) {
				preDefinedIconsSelect.remove ( counter );
			}
			for ( elementCounter = 0; elementCounter < _GlobalData.preDefinedIconsList.length; elementCounter ++ ) {
				var option = htmlElementsFactory.create ( 'option', { text :  _GlobalData.preDefinedIconsList [ elementCounter ].name } );
				preDefinedIconsSelect.add ( option );
			}
		};

		// function to add buttons on the toolbar
		var addEditionButtons = function ( editionButtons ) {
			editionButtons.forEach ( 
				function ( editionButton ) {
					var newButton = htmlElementsFactory.create ( 
						'button',
						{
							type : 'button',
							innerHTML : editionButton.title || '?',
							htmlBefore : editionButton.htmlBefore || '',
							htmlAfter : editionButton.htmlAfter || '',
							className : 'TravelNotes-NoteDialog-EditorButton'
						},
						toolbarDiv
					);
					newButton.addEventListener ( 'click', onClickEditionButton, false );
				}
			);
		};

		// event handler for edition with the styles buttons
		var onClickEditionButton = function ( event ) {
			if ( ! focusControl ) {
				return;
			}
			var button = event.target;
			while ( ! button.htmlBefore ) {
				button = button.parentNode;
			}
			var bInsertBeforeAndAfter = button.htmlAfter && 0 < button.htmlAfter.length;
			var selectionStart = focusControl.selectionStart;
			var selectionEnd = focusControl.selectionEnd;
			var oldText = focusControl.value;
			focusControl.value = oldText.substring ( 0, selectionStart ) + 
				( bInsertBeforeAndAfter ? button.htmlBefore + oldText.substring ( selectionStart, selectionEnd ) + button.htmlAfter : button.htmlBefore ) + 
				oldText.substring ( selectionEnd );
			focusControl.setSelectionRange ( 
				bInsertBeforeAndAfter || selectionStart === selectionEnd ? selectionStart + button.htmlBefore.length : selectionStart,
				( bInsertBeforeAndAfter ? selectionEnd : selectionStart ) + button.htmlBefore.length );
			focusControl.focus ( );
		};	

		_Note = note;
		_RouteObjId = routeObjId;
		
		// the dialog base is created
		var baseDialog = require ( '../UI/BaseDialog' ) ( );
		baseDialog.title = _Translator.getText ( 'NoteDialog - Note' );
		baseDialog.addClickOkButtonEventListener ( onOkButtonClick );

		var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;

		var NoteDataDiv = htmlElementsFactory.create (
			'div',
			{
				id : 'TravelNotes-NoteDialog-MainDataDiv'
			},
			baseDialog.content
		);
		
		// Toolbar
		var toolbarDiv = htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-NoteDialog-ToolbarDiv',
				id : 'TravelNotes-NoteDialog-ToolbarDiv'
			},
			NoteDataDiv
		);
		
		// a select is added for the predefined icons
		var preDefinedIconsSelect = htmlElementsFactory.create (
			'select',
			{
				className : 'TravelNotes-NoteDialog-Select',
				id : 'TravelNotes-NoteDialog-IconSelect'
			},
			toolbarDiv
		);
		
		// change event listener on the select
		preDefinedIconsSelect.addEventListener ( 
			'change', 
			function ( changeEvent ) {
				var index = preDefinedIconsSelect.selectedIndex ;
				var preDefinedIcon = _GlobalData.preDefinedIconsList [ preDefinedIconsSelect.selectedIndex ];
				widthInput.value = preDefinedIcon.width ;
				heightInput.value = preDefinedIcon.height ;
				iconHtmlContent.value = preDefinedIcon.icon ;
				tooltip.value = preDefinedIcon.tooltip ;
			},
			false 
		);
		
		var focusControl = null;

		// open userdata button ... with the well know hack to hide the file input ( a div + an input + a fake div + a button )
		var openUserDataFileDiv = htmlElementsFactory.create ( 
			'div', 
			{ 
				id: 'TravelNotes-NoteDialog-OpenEditorFileDiv'
			}, 
			toolbarDiv 
		);
		var openUserDataFileInput = htmlElementsFactory.create ( 
			'input',
			{
				id : 'TravelNotes-NoteDialog-OpenEditorFileInput', 
				type : 'file',
				accept : '.json'
			},
			openUserDataFileDiv
		);
		openUserDataFileInput.addEventListener ( 
			'change', 
			function ( event ) {
				var fileReader = new FileReader( );
				fileReader.onload = function ( event ) {
					try {
						var newEditorData = JSON.parse ( fileReader.result ) ;
						_UserData.editionButtons = _UserData.editionButtons.concat ( newEditorData.editionButtons );
						_UserData.preDefinedIconsList = _UserData.preDefinedIconsList.concat ( newEditorData.preDefinedIconsList );
						addEditionButtons ( newEditorData.editionButtons );
						addPreDefinedIconsList ( );
					}
					catch ( e )
					{
					}
				};
				var fileName = event.target.files [ 0 ].name;
				fileReader.readAsText ( event.target.files [ 0 ] );
			},
			false
		);
		var openUserDataFileFakeDiv = htmlElementsFactory.create ( 
			'div', 
			{ 
				id: 'TravelNotes-NoteDialog-OpenStyleFakeDiv'
			}, 
			openUserDataFileDiv 
		);
		var openUserDataFileButton = htmlElementsFactory.create ( 
			'button', 
			{ 
				id : 'TravelNotes-NoteDialog-OpenEditorFileButton', 
				className: 'TravelNotes-NoteDialog-EditorButton', 
				title : _Translator.getText ( 'NoteDialog - Open a configuration file' ), 
				innerHTML : '&#x23CD;'
			}, 
			openUserDataFileFakeDiv 
		);
		
		openUserDataFileButton.addEventListener ( 'click' , function ( ) { openUserDataFileInput.click ( ); }, false );
	
		
		// standard buttons for div, p, span and a
		addEditionButtons (
			[
				{
					title : 'div',
					htmlBefore : '<div>',
					htmlAfter :  '</div>'
				},
				{
					title : 'p',
					htmlBefore : '<p>',
					htmlAfter : '</p>'
				},
				{
					title : 'span',
					htmlBefore : '<span>',
					htmlAfter : '</span>'
				},
				{
					title : 'a',
					htmlBefore : '<a target="_blank" href="">',
					htmlAfter : '</a>'
				},
			]
		);
		
		// personnalised buttons from server file are restored
		addEditionButtons ( _ServerData.editionButtons );
		// personnalised buttons from local file are restored
		addEditionButtons ( _UserData.editionButtons );
		addPreDefinedIconsList ( );
		
		// icon dimensions...
		var iconDimensionsDiv = htmlElementsFactory.create (
			'div',
			{
				className : 'TravelNotes-NoteDialog-DataDiv',
				id : 'TravelNotes-NoteDialog-DimensionsDataDiv'
			},
			NoteDataDiv
		);
		
		// ... width ...
		htmlElementsFactory.create (
			'text',
			{
				data : _Translator.getText ( 'NoteDialog - Icon width'),
			},
			iconDimensionsDiv
		);
		var widthInput =  htmlElementsFactory.create (
			'input',
			{
				type : 'number',
				className : 'TravelNotes-NoteDialog-NumberInput',
				id : 'TravelNotes-NoteDialog-WidthNumberInput'
				
			},
			iconDimensionsDiv
		);
		widthInput.value = note.iconWidth;
		
		// ... and height
		htmlElementsFactory.create (
			'text',
			{
				data : _Translator.getText ( 'NoteDialog - Icon height'),
			},
			iconDimensionsDiv
		);
		var heightInput =  htmlElementsFactory.create (
			'input',
			{
				type : 'number',
				className : 'TravelNotes-NoteDialog-NumberInput',
				id : 'TravelNotes-NoteDialog-HeightNumberInput'
			},
			iconDimensionsDiv
		);
		heightInput.value = note.iconHeight;
		
		// icon content
		htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-NoteDialog-TitleDiv',
				id : 'TravelNotes-NoteDialog-IconContentTitleDiv',
				innerHTML : _Translator.getText ( 'NoteDialog - Icon content' )
			},
			NoteDataDiv
		);
		var iconHtmlContent = htmlElementsFactory.create ( 
			'textarea',
			{ 
				className : 'TravelNotes-NoteDialog-TextArea',
				id: 'TravelNotes-NoteDialog-TextArea-IconHtmlContent'
			},
			NoteDataDiv
		);
		iconHtmlContent.addEventListener (
			'focus',
			function ( event ) {
				focusControl = iconHtmlContent;
			},
			false
		);
		iconHtmlContent.value = note.iconContent;
		
		// Popup content
		htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-NoteDialog-TitleDiv',
				innerHTML : _Translator.getText ( 'NoteDialog - Text' )
			},
			NoteDataDiv
		);
		var popUpContent = htmlElementsFactory.create ( 
			'textarea',
			{ 
				className : 'TravelNotes-NoteDialog-TextArea',
				id: 'TravelNotes-NoteDialog-TextArea-PopupContent'
			},
			NoteDataDiv
		);
		popUpContent.addEventListener (
			'focus',
			function ( event ) {
				focusControl = popUpContent;
			},
			false
		);
		popUpContent.value = note.popupContent;
		
		// tooltip content
		htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-NoteDialog-TitleDiv',
				innerHTML : _Translator.getText ( 'NoteDialog - Tooltip content' )
			},
			NoteDataDiv
		);
		var tooltip = htmlElementsFactory.create ( 
			'input',
			{ 
				type : 'text',
				className : 'TravelNotes-NoteDialog-InputText',
				id: 'TravelNotes-NoteDialog-InputText-Tooltip'
			},
			NoteDataDiv
		);
		tooltip.addEventListener (
			'focus',
			function ( event ) {
				focusControl = tooltip;
			},
			false
		);
		tooltip.value = note.tooltipContent;
		
		// Address
		htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-NoteDialog-TitleDiv',
				innerHTML : _Translator.getText ( 'NoteDialog - Address&nbsp;:' )
			},
			NoteDataDiv
		);
		var address = htmlElementsFactory.create ( 
			'input',
			{ 
				type : 'text',
				className : 'TravelNotes-NoteDialog-InputText',
				id: 'TravelNotes-NoteDialog-InputText-Adress'
			},
			NoteDataDiv
		);
		address.addEventListener (
			'focus',
			function ( event ) {
				focusControl = address;
			},
			false
		);
		address.value = note.address;
		
		// link
		htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-NoteDialog-TitleDiv',
				innerHTML : _Translator.getText ( 'NoteDialog - Link' )
			},
			NoteDataDiv
		);
		var link = htmlElementsFactory.create ( 
			'input',
			{ 
				type : 'text',
				className : 'TravelNotes-NoteDialog-InputText',
				id: 'TravelNotes-NoteDialog-InputText-Link'
			},
			NoteDataDiv
		);
		link.addEventListener (
			'focus',
			function ( event ) {
				focusControl = null;
			},
			false
		);
		link.value = note.url;
		
		// phone
		htmlElementsFactory.create ( 
			'div',
			{ 
				className : 'TravelNotes-NoteDialog-TitleDiv',
				innerHTML : _Translator.getText ( 'NoteDialog - Phone' )
			},
			NoteDataDiv
		);
		var phone = htmlElementsFactory.create ( 
			'input',
			{ 
				type : 'text',
				className : 'TravelNotes-NoteDialog-InputText',
				id: 'TravelNotes-NoteDialog-InputText-Phone'
			},
			NoteDataDiv
		);
		phone.addEventListener (
			'focus',
			function ( event ) {
				focusControl = phone;
			},
			false
		);
		phone.value = note.phone;

		// predefined icons and editionButtons are loaded if not already done previously
		if ( 0 === _ServerData.preDefinedIconsList.length ) {
			var buttonsHttpRequest = new XMLHttpRequest ( );
			buttonsHttpRequest.onreadystatechange = function ( event ) {
				if ( this.readyState === buttonsHttpRequest.DONE ) {
					if ( this.status === 200 ) {
						try {
							_ServerData = JSON.parse ( this.responseText );
							addEditionButtons ( _ServerData.editionButtons );
							_ServerData.preDefinedIconsList.push ( { name : '', icon : '', tooltip : '', width : 40, height : 40 } );
							addPreDefinedIconsList ( );
						}
						catch ( e )
						{
							console.log ( 'Error reading TravelNotesNoteDialog.json' );
						}
					} 
					else {
						console.log ( 'Error sending request for TravelNotesNoteDialog.json' );
					}
				}
			};
			buttonsHttpRequest.open ( 
				'GET',
				window.location.href.substr (0, window.location.href.lastIndexOf( '/') + 1 ) +'TravelNotesNoteDialog.json',
				true
			);
			buttonsHttpRequest.send ( null );
		}

		// geolocalization
		if ( ( require ( '../L.TravelNotes' ).config.note.reverseGeocoding )  && ( '' === note.address ) && newNote ) {
			require ( '../core/GeoCoder' ) ( ).getAddress ( note.lat, note.lng, function ( newAddress ) { address.value = newAddress ; }, this );
		}
		
		// and the dialog is centered on the screen
		baseDialog.center ( );
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = NoteDialog;
	}

}());

/*
--- End of NoteDialog.js file -----------------------------------------------------------------------------------------
*/	
},{"../L.TravelNotes":7,"../UI/BaseDialog":9,"../UI/Translator":20,"../core/GeoCoder":26,"../core/NoteEditor":29,"./HTMLElementsFactory":13}],17:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- RouteEditorUI.js file ---------------------------------------------------------------------------------------------
This file contains:
	- the RouteEditorUI object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170929
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';
	
	var _Translator = require ( './Translator' ) ( );
	var _WayPointsList = null;

	// Events handler for expand and expand list buttons
	
	var onClickExpandButton = function ( clickEvent ) {
		clickEvent.stopPropagation ( );

		if ( -1 === require ( '../L.TravelNotes' ).routeEdition.routeInitialObjId ) {
			return;
		}

		document.getElementById ( 'TravelNotes-Control-RouteHeaderDiv' ).classList.toggle ( 'TravelNotes-Control-SmallHeader' );
		document.getElementById ( 'TravelNotes-Control-RouteDataDiv' ).classList.toggle ( 'TravelNotes-Control-HiddenList' );
		document.getElementById ( 'TravelNotes-Control-RouteButtonsDiv' ).classList.toggle ( 'TravelNotes-Control-HiddenList' );
		var hiddenList = document.getElementById ( 'TravelNotes-Control-RouteDataDiv' ).classList.contains ( 'TravelNotes-Control-HiddenList' );
		document.getElementById ( 'TravelNotes-Control-RouteExpandButton' ).innerHTML = hiddenList ? '&#x25b6;' : '&#x25bc;';
		document.getElementById ( 'TravelNotes-Control-RouteExpandButton' ).title = hiddenList ? _Translator.getText ( 'RouteEditorUI - Show' ) : _Translator.getText ( 'RouteEditorUI - Hide' );
	};
	
	var onClickExpandListButton = function ( clickEvent ) {
		clickEvent.stopPropagation ( );
		document.getElementById ( 'TravelNotes-Control-RouteDataDiv' ).classList.toggle ( 'TravelNotes-Control-ExpandedList' );
		var expandedList = document.getElementById ( 'TravelNotes-Control-RouteDataDiv' ).classList.contains ( 'TravelNotes-Control-ExpandedList' );
		document.getElementById ( 'TravelNotes-Control-ExpandWayPointsListButton' ).innerHTML = expandedList ? '&#x25b3;' : '&#x25bd;';
		document.getElementById ( 'TravelNotes-Control-ExpandWayPointsListButton' ).title = expandedList ? _Translator.getText ( 'RouteEditorUI - Reduce the list' ) : _Translator.getText ( 'RouteEditorUI - Expand the list' );		
	};

	var RouteEditorUI = function ( ) {
				
		/*
		--- _CreateUI function ----------------------------------------------------------------------------------------

		This function creates the UI
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _CreateUI = function ( controlDiv ){ 

			if ( document.getElementById ( 'TravelNotes-Control-RouteDataDiv' ) ) {
				return;
			}
			
			var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;
			
			// header div
			var headerDiv = htmlElementsFactory.create (
				'div',
				{ 
					id : 'TravelNotes-Control-RouteHeaderDiv',
					className : 'TravelNotes-Control-HeaderDiv'
				},
				controlDiv
			);

			// expand button
			var expandButton = htmlElementsFactory.create ( 
				'span', 
				{ 
					innerHTML : '&#x25bc;',
					id : 'TravelNotes-Control-RouteExpandButton',
					className : 'TravelNotes-Control-ExpandButton'
				},
				headerDiv 
			);
			expandButton.addEventListener ( 'click' , onClickExpandButton, false );
			
			// title
			htmlElementsFactory.create ( 
				'span', 
				{ 
					innerHTML : 
					_Translator.getText ( 'RouteEditorUI - Waypoints' ), 
					id : 'TravelNotes-Control-RouteHeaderText',
					className : 'TravelNotes-Control-HeaderText'
				},
				headerDiv 
			);

			// data div
			var dataDiv = htmlElementsFactory.create ( 
				'div',
				{ 
					id : 'TravelNotes-Control-RouteDataDiv', 
					className : 'TravelNotes-Control-DataDiv'
				},
				controlDiv
			);
			
			// wayPoints list
			_WayPointsList = require ( './SortableList' ) ( 
				{
					minSize : 0,
					listStyle : 'LimitedSort',
					id : 'TravelNotes-Control-RouteWaypointsList'
				}, 
				dataDiv
			);
			_WayPointsList.container.addEventListener ( 
				'SortableListDelete', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).removeWayPoint ( event.itemNode.dataObjId );
				},
				false
			);
			_WayPointsList.container.addEventListener ( 
				'SortableListUpArrow', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).swapWayPoints ( event.itemNode.dataObjId, true );
				},
				false
			);
			_WayPointsList.container.addEventListener ( 
				'SortableListDownArrow', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).swapWayPoints ( event.itemNode.dataObjId, false );
				}, 
				false
			);
			_WayPointsList.container.addEventListener ( 
				'SortableListChange', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).renameWayPoint ( event.dataObjId, event.changeValue );
				}, 
				false 
			);
			_WayPointsList.container.addEventListener ( 
				'SortableListDrop', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).wayPointDropped ( event.draggedObjId, event.targetObjId, event.draggedBefore );
				}, 
				false 
			);

			// buttons div
			var buttonsDiv = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-RouteButtonsDiv', 
					className : 'TravelNotes-Control-ButtonsDiv'
				},
				controlDiv
			);
			
			// expand list button
			var expandListButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-ExpandWayPointsListButton', 
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'RouteEditorUI - Expand the list' ), 
					innerHTML : '&#x25bd;'
				}, 
				buttonsDiv 
			);
			expandListButton.addEventListener ( 'click' , onClickExpandListButton, false );

			// cancel route button
			var cancelRouteButton = htmlElementsFactory.create (
				'div', 
				{ 
					id : 'TravelNotes-Control-CancelRouteButton',
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'RouteEditorUI - Cancel' ), 
					innerHTML : '&#x274c'
				},
				buttonsDiv 
			);
			cancelRouteButton.addEventListener ( 
				'click', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).cancelEdition ( );
				},
				false 
			);
			
			// save route button
			var saveRouteButton = htmlElementsFactory.create (
				'div', 
				{ 
					id : 'TravelNotes-Control-SaveRouteButton',
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'RouteEditorUI - Save' ), 
					innerHTML : '&#x1f4be;'
				},
				buttonsDiv 
			);
			saveRouteButton.addEventListener ( 
				'click', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).saveEdition ( );
				}, 
				false 
			);
			
			// gpx button
			var gpxButton = htmlElementsFactory.create (
				'div', 
				{ 
					id : 'TravelNotes-Control-gpxButton',
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'RouteEditorUI - Save the route in a gpx file' ), 
					innerHTML : 'gpx'
				},
				buttonsDiv 
			);
			gpxButton.addEventListener ( 
				'click', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).saveGpx ( );
				}, 
				false 
			);
			
			// reverse wayPoints button
			var reverseWayPointsButton = htmlElementsFactory.create ( 
				'div',
				{ 
					id : 'TravelNotes-Control-ReverseWayPointsButton', 
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'RouteEditorUI - Invert waypoints' ),  
					innerHTML : '&#x21C5;'
				},
				buttonsDiv
			);
			reverseWayPointsButton.addEventListener ( 
				'click' , 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).reverseWayPoints ( );
				},
				false 
			);
			
			// add wayPoint button
			// Todo... not usefull without geocoding...
			/*
			var addWayPointButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-AddWayPointButton',
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'RouteEditorUI - Add waypoint' ), 
					innerHTML : '+'
				},
				buttonsDiv 
			);
			
			addWayPointButton.addEventListener ( 
				'click', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).addWayPoint ( );
				},
				false 
			);
			*/
			
			// remove all wayPoints button
			var removeAllWayPointsButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-RemoveAllWayPointsButton', 
					className: 'TravelNotes-Control-Button',
					title: _Translator.getText ( 'RouteEditorUI - Delete all waypoints' ),
					innerHTML : '&#x267b;'
				}, 
				buttonsDiv
			);
			removeAllWayPointsButton.addEventListener ( 
				'click' , 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/RouteEditor' ) ( ).removeAllWayPoints ( );
				},
				false
			);
		};
	
		/*
		--- _ExpandUI function ----------------------------------------------------------------------------------------

		This function expands the UI
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _ExpandUI = function ( ) {
			document.getElementById ( 'TravelNotes-Control-RouteExpandButton' ).innerHTML = '&#x25bc;';
			document.getElementById ( 'TravelNotes-Control-RouteExpandButton' ).title = 'Masquer';
			document.getElementById ( 'TravelNotes-Control-RouteDataDiv' ).classList.remove ( 'TravelNotes-Control-HiddenList' );
			document.getElementById ( 'TravelNotes-Control-RouteButtonsDiv' ).classList.remove ( 'TravelNotes-Control-HiddenList' );
		};
		
		/*
		--- _ReduceUI function ----------------------------------------------------------------------------------------

		This function reduces the UI
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _ReduceUI = function ( ) {
			document.getElementById ( 'TravelNotes-Control-RouteExpandButton' ).innerHTML = '&#x25b6;';
			document.getElementById ( 'TravelNotes-Control-RouteExpandButton' ).title = 'Afficher';
			document.getElementById ( 'TravelNotes-Control-RouteDataDiv' ).classList.add ( 'TravelNotes-Control-HiddenList' );
			document.getElementById ( 'TravelNotes-Control-RouteButtonsDiv' ).classList.add ( 'TravelNotes-Control-HiddenList' );
		};
		
		/*
		--- _SetWayPointsList function --------------------------------------------------------------------------------

		This function fill the wayPoints list
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _SetWayPointsList = function ( ) {
			_WayPointsList.removeAllItems ( );

			if ( -1 === require ( '../L.TravelNotes' ).routeEdition.routeInitialObjId ) {
				return;
			}
			
			var wayPointsIterator = require ( '../L.TravelNotes' ).editedRoute.wayPoints.iterator;
			while ( ! wayPointsIterator.done ) {
				var indexName = wayPointsIterator.first ? 'A' : ( wayPointsIterator.last ? ' B' : wayPointsIterator.index );
				var placeholder = 
					wayPointsIterator.first ? _Translator.getText ( 'RouteEditorUI - Start' ) : ( wayPointsIterator.last ? _Translator.getText ( 'RouteEditorUI - End' ) : _Translator.getText ( 'RouteEditorUI - Via' ) );
				_WayPointsList.addItem ( wayPointsIterator.value.UIName, indexName, placeholder, wayPointsIterator.value.objId, wayPointsIterator.last );
			}
		};
		
		/*
		--- RouteEditorUI object --------------------------------------------------------------------------------------

		---------------------------------------------------------------------------------------------------------------
		*/

		return {
			createUI : function ( controlDiv ) { 
				_CreateUI ( controlDiv ); 
			},
	
			expand : function ( ) {
				_ExpandUI ( );
			},
			
			reduce : function ( ) {
				_ReduceUI ( );
			},

			setWayPointsList : function ( ) {
				_SetWayPointsList ( );
			}
		};
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = RouteEditorUI;
	}

}());

/*
--- End of RouteEditorUI.js file --------------------------------------------------------------------------------------
*/
},{"../L.TravelNotes":7,"../core/RouteEditor":30,"./HTMLElementsFactory":13,"./SortableList":19,"./Translator":20}],18:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

( function ( ){
	
	'use strict';

/*
--- RoutePropertiesDialog.js file -------------------------------------------------------------------------------------
This file contains:
	- the RoutePropertiesDialog object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.1.0:
		- Issue #36: Add a linetype property to route
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170930
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

	var _Translator = require ( '../UI/Translator' ) ( );


	/*
	--- RoutePropertiesDialog function --------------------------------------------------------------------------------

	-------------------------------------------------------------------------------------------------------------------
	*/

	var RoutePropertiesDialog = function ( route ) {
		
		/*
		--- onOkButtonClick function --------------------------------------------------------------------------------------

		click event listener for the ok button

		-------------------------------------------------------------------------------------------------------------------
		*/

		var onOkButtonClick = function ( ) {
			route.color = colorDialog.getNewColor ( );
			route.width = parseInt ( widthInput.value );
			route.chain = chainInput.checked;
			route.dashArray = dashSelect.selectedIndex;

			require ( '../core/MapEditor' ) ( ).editRoute ( route );
			require ( '../core/RouteEditor' ) ( ).chainRoutes ( );
			require ( '../UI/TravelEditorUI' ) ( ).setRoutesList ( );
			require ( '../core/TravelEditor' ) ( ).updateRoadBook ( );
			return true;
		};

		// the dialog base is created
		var colorDialog = require ( '../UI/ColorDialog' ) ( route.color );
		colorDialog.title = _Translator.getText ( 'RoutePropertiesDialog - Route properties' );
		colorDialog.addClickOkButtonEventListener ( onOkButtonClick );
		
		var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;

		var routePropertiesDiv = htmlElementsFactory.create (
			'div',
			{
				id : 'TravelNotes-RoutePropertiesDialog-MainDataDiv'
			},
			colorDialog.content
		);
		
		// ... width ...
		var widthDiv = htmlElementsFactory.create (
			'div',
			{
				className : 'TravelNotes-RoutePropertiesDialog-DataDiv',
				id : 'TravelNotes-RoutePropertiesDialog-WithDiv'
			},
			routePropertiesDiv
		);
		widthDiv.innerHTML = '<span>' + _Translator.getText ( 'RoutePropertiesDialog - Width') + '</span>';
		var widthInput =  htmlElementsFactory.create (
			'input',
			{
				type : 'number',
				id : 'TravelNotes-RoutePropertiesDialog-WidthInput'
				
			},
			widthDiv
		);
		widthInput.value = route.width;
		widthInput.min = 1;
		widthInput.max = 40;

		// dash
		var dashDiv = htmlElementsFactory.create (
			'div',
			{
				className : 'TravelNotes-RoutePropertiesDialog-DataDiv',
				id : 'TravelNotes-RoutePropertiesDialog-dashDiv'
			},
			routePropertiesDiv
		);
		dashDiv.innerHTML = '<span>' + _Translator.getText ( 'RoutePropertiesDialog - Linetype') + '</span>';
		var dashSelect = htmlElementsFactory.create (
			'select',
			{
				className : 'TravelNotes-RoutePropertiesDialog-Select',
				id : 'TravelNotes-RoutePropertiesDialog-DashSelect'
			},
			dashDiv
		);

		var dashChoices = require ( '../L.TravelNotes' ).config.route.dashChoices;
		for ( var optionsCounter = 0; optionsCounter < dashChoices.length; optionsCounter ++ ) {
			dashSelect.add ( htmlElementsFactory.create ( 'option', { text :  dashChoices [ optionsCounter ].text } ) );
		}
		dashSelect.selectedIndex = route.dashArray < dashChoices.length ? route.dashArray : 0;
		
		// chain
		var chainDiv = htmlElementsFactory.create (
			'div',
			{
				className : 'TravelNotes-RoutePropertiesDialog-DataDiv',
				id : 'TravelNotes-RoutePropertiesDialog-ChainDiv'
			},
			routePropertiesDiv
		);
		chainDiv.innerHTML = '<span>' + _Translator.getText ( 'RoutePropertiesDialog - Chained route') + '</span>';
		var chainInput =  htmlElementsFactory.create (
			'input',
			{
				type : 'checkbox',
				id : 'TravelNotes-RoutePropertiesDialog-ChainInput'			
			},
			chainDiv
		);
		chainInput.checked = route.chain;
		return colorDialog;
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = RoutePropertiesDialog;
	}

}());

/*
--- End of RoutePropertiesDialog.js file ------------------------------------------------------------------------------
*/	
},{"../L.TravelNotes":7,"../UI/ColorDialog":10,"../UI/Translator":20,"../UI/TravelEditorUI":21,"../core/MapEditor":28,"../core/RouteEditor":30,"../core/TravelEditor":32,"./HTMLElementsFactory":13}],19:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- SortableList.js file ----------------------------------------------------------------------------------------------
This file contains:
	- the SortableList object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
Doc reviewed 20171001
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	var _Translator = require ( '../UI/Translator' ) ( );
	
	var _DataObjId  = 0;

	var onDragStart = function  ( dragEvent ) {
		dragEvent.stopPropagation ( ); 
		try {
			dragEvent.dataTransfer.setData ( 'Text', dragEvent.target.dataObjId );
			dragEvent.dataTransfer.dropEffect = "move";
		}
		catch ( e ) {
		}
		// for this #@!& MS Edge... don't remove - 1 otherwise crasy things comes in FF
		// MS Edge know the dataTransfer object, but the objects linked to the event are different in the drag event and the drop event
		_DataObjId = dragEvent.target.dataObjId - 1;
	};
	
	var onDragOver = function ( event ) {
		event.preventDefault ( );
	};
	
	var onDrop = function ( dragEvent ) { 
		dragEvent.preventDefault ( );
		var element = dragEvent.target;
		while ( ! element.dataObjId ) {
			element = element.parentElement;
		}
		var clientRect = element.getBoundingClientRect ( );
		var event = new Event ( 'SortableListDrop' );
		
		// for this #@!& MS Edge... don't remove + 1 otherwise crasy things comes in FF
		//event.draggedObjId = parseInt ( dragEvent.dataTransfer.getData("Text") );
		event.draggedObjId = _DataObjId + 1;

		event.targetObjId = element.dataObjId;
		event.draggedBefore = ( dragEvent.clientY - clientRect.top < clientRect.bottom - dragEvent.clientY );
		element.parentNode.dispatchEvent ( event );
	};

	var onDeleteButtonClick = function ( ClickEvent ) {
		var event = new Event ( 'SortableListDelete' );
		event.itemNode = ClickEvent.target.parentNode;
		ClickEvent.target.parentNode.parentNode.dispatchEvent ( event );
		ClickEvent.stopPropagation();
	};
	
	var onUpArrowButtonClick = function ( ClickEvent ) {
		var event = new Event ( 'SortableListUpArrow' );
		event.itemNode = ClickEvent.target.parentNode;
		ClickEvent.target.parentNode.parentNode.dispatchEvent ( event );
		ClickEvent.stopPropagation();
	};
	
	var onDownArrowButtonClick = function ( ClickEvent ) {
		var event = new Event ( 'SortableListDownArrow' );
		event.itemNode = ClickEvent.target.parentNode;
		ClickEvent.target.parentNode.parentNode.dispatchEvent ( event );
		ClickEvent.stopPropagation();
	};
	
	var onRightArrowButtonClick = function ( ClickEvent ) {
		var event = new Event ( 'SortableListRightArrow' );
		event.itemNode = ClickEvent.target.parentNode;
		ClickEvent.target.parentNode.parentNode.dispatchEvent ( event );
		ClickEvent.stopPropagation();
	};
	
	var onChange = function ( changeEvent ) {
		var event = new Event ( 'SortableListChange' );
		event.dataObjId = changeEvent.target.parentNode.dataObjId;
		event.changeValue = changeEvent.target.value;
		changeEvent.target.parentNode.parentNode.dispatchEvent ( event );
		changeEvent.stopPropagation();
	};
	
	var onWheel = function ( wheelEvent ) { 
		if ( wheelEvent.deltaY ) {
			wheelEvent.target.scrollTop = wheelEvent.target.scrollTop + wheelEvent.deltaY * 10 ;
		}
		wheelEvent.stopPropagation ( );
	};
	
	/* 
	--- SortableList object -------------------------------------------------------------------------------------------
	
	-------------------------------------------------------------------------------------------------------------------
	*/

	var SortableList = function ( options, parentNode ) {
		
		var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;
		
		this.items = [];
		
		/*
		--- removeAllItems method -------------------------------------------------------------------------------------
		This method ...
		---------------------------------------------------------------------------------------------------------------
		*/

		this.removeAllItems = function ( ) {
			for ( var ItemCounter = 0; ItemCounter < this.items.length; ItemCounter ++ ) {
				this.container.removeChild ( this.items [ ItemCounter ] );
			}
			this.items.length = 0;
		};
		
		/*
		--- addItem method --------------------------------------------------------------------------------------------
		This method ...
		---------------------------------------------------------------------------------------------------------------
		*/

		this.addItem = function ( name, indexName, placeholder, dataObjId, isLastItem  ) {
	
			name = name || '';
			indexName = indexName || '';
			placeholder = placeholder || '';
			dataObjId = dataObjId || -1;
			
			var item = htmlElementsFactory.create ( 'div', { draggable : false , className : 'TravelNotes-SortableList-Item' } );

			htmlElementsFactory.create ( 'div', { className : 'TravelNotes-SortableList-ItemTextIndex' , innerHTML : indexName }, item );
			var inputElement = htmlElementsFactory.create ( 'input', { type : 'text', className : 'TravelNotes-SortableList-ItemInput', placeholder : placeholder, value: name}, item );
			inputElement.addEventListener ( 'change' , onChange, false );

			//Workaround for issue #8
			inputElement.addEventListener ( 
				'focus',
				function ( event ) {
					event.target.parentElement.draggable = false;
				},
				false
			);
			inputElement.addEventListener ( 
				'blur',
				function ( event ) {
					event.target.parentElement.draggable = event.target.parentElement.canDrag;
				},
				false
			);
				
			var upArrowButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					className : 'TravelNotes-SortableList-ItemUpArrowButton', 
					title : _Translator.getText ('SortableList - Move up' ),
					innerHTML : String.fromCharCode( 8679 )
				}, 
				item
			);
			upArrowButton.addEventListener ( 'click', onUpArrowButtonClick, false );
			var downArrowButton = htmlElementsFactory.create (
				'div', 
				{ 
					className : 'TravelNotes-SortableList-ItemDownArrowButton', 
					title : _Translator.getText ('SortableList - Move down' ), 
					innerHTML : String.fromCharCode( 8681 ) 
				},
				item 
			);
			downArrowButton.addEventListener ( 'click', onDownArrowButtonClick, false );
			var rightArrowButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					className : 'TravelNotes-SortableList-ItemRightArrowButton', 
					title : _Translator.getText ('SortableList - Edit' ), 
					innerHTML : String.fromCharCode( 8688 ) 
				},
			item );
			if ( 'AllSort' === this.options.listStyle ) {
				rightArrowButton.addEventListener ( 'click', onRightArrowButtonClick, false );
			}
			var deleteButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					className : 'TravelNotes-SortableList-ItemDeleteButton', 
					title : _Translator.getText ('SortableList - Delete' ),
					innerHTML : '&#x267b;' 
				},
				item 
			);
			deleteButton.addEventListener ( 'click', onDeleteButtonClick, false );
			item.dataObjId = dataObjId; 

			item.canDrag = false;
			if ( ( ( 'LimitedSort' !== this.options.listStyle ) || ( 1 < this.items.length ) ) && ( ! isLastItem  ) ){
				item.draggable = true;
				item.addEventListener ( 'dragstart', onDragStart, false );	
				item.classList.add ( 'TravelNotes-SortableList-MoveCursor' );
				item.canDrag = true;
			}
			
			this.items.push ( item );

			this.container.appendChild ( item );
		};
		
		/*
		--- _create method --------------------------------------------------------------------------------------------
		This method ...
		---------------------------------------------------------------------------------------------------------------
		*/

		this._create = function ( options, parentNode ) {

			// options
			
			// options.listStyle = 'AllSort' : all items can be sorted or deleted
			// options.listStyle = 'LimitedSort' : all items except first and last can be sorted or deleted
			
			this.options = { minSize : 2, listStyle : 'AllSort', id : 'TravelNotes-SortableList-Container' } ;
			for ( var option in options ) {
				this.options [ option ] = options [ option ];
			}
			if ( ( 'LimitedSort' === this.options.listStyle ) && ( 2 > this.options.minSize ) )
			{
				this.options.minSize = 0;
			}
			this.container = htmlElementsFactory.create ( 'div', { id : options.id, className : 'TravelNotes-SortableList-Container' } );
			this.container.classList.add ( this.options.listStyle );
			this.container.addEventListener ( 'drop', onDrop, false );
			this.container.addEventListener ( 'dragover', onDragOver, false );
			this.container.addEventListener ( 'wheel', onWheel, false );

			if ( parentNode ) {
				parentNode.appendChild ( this.container );
			}
			
			for ( var itemCounter = 0; itemCounter < this.options.minSize; itemCounter++ )
			{
				this.addItem ( );
			}
		};
		
		this._create ( options, parentNode );
		
	};
	
	/* 
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	var sortableList = function ( options, parentNode ) {
		return new SortableList ( options, parentNode );
	};
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = sortableList;
	}

}());

/*
--- End of SortableList.js file ---------------------------------------------------------------------------------------
*/	

},{"../UI/Translator":20,"./HTMLElementsFactory":13}],20:[function(require,module,exports){
(function (global){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- Translator.js file ------------------------------------------------------------------------------------------------
This file contains:
	- the Translator object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
Doc reviewed 20170930
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {
	
	'use strict';
	var Translator = function ( ) {
		
		if ( ! global.translations ) {
			global.translations = new Map ( );
		}

		return {
			
			setTranslations : function ( translations ) {
				translations.forEach (
					function ( translation ) {
						global.translations.set ( translation.msgid, translation.msgstr );
					}
				);
			},
			
			getText : function ( msgid , params ) { 
				var translation = global.translations.get ( msgid );
				if ( params && translation ) {
					Object.getOwnPropertyNames ( params ).forEach (
						function ( propertyName ) {
							translation = translation.replace ( '{' + propertyName + '}' , params [ propertyName ] ); 
						}
					);
				}
				
				return translation ? translation : msgid;
			}
		};
	};
	
	/* 
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Translator;
	}

} ) ( );

/*
--- End of Translator.js file -----------------------------------------------------------------------------------------
*/	

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],21:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- TravelEditorUI.js file --------------------------------------------------------------------------------------------
This file contains:
	- the TravelEditorUI object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.1.0:
		- Issue #26 : added confirmation message before leaving the page when data modified.
		- Issue #31 : Add a command to import from others maps
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
		- moving file functions from TravelEditor to the new FileLoader
Doc reviewed 20170930
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';
	
	var _Translator = require ( './Translator' ) ( );
	var _TravelNotesData = require ( '../L.TravelNotes' );
	var _RoutesList = null;
	
	// Events handler for expand and expand list buttons

	var onClickExpandButton = function ( clickEvent ) {
		clickEvent.stopPropagation ( );
		document.getElementById ( 'TravelNotes-Control-TravelHeaderDiv' ).classList.toggle ( 'TravelNotes-Control-SmallHeader' );
		document.getElementById ( 'TravelNotes-Control-TravelDataDiv' ).classList.toggle ( 'TravelNotes-Control-HiddenList' );
		document.getElementById ( 'TravelNotes-ControlTravelButtonsDiv' ).classList.toggle ( 'TravelNotes-Control-HiddenList' );
		var hiddenList = document.getElementById ( 'TravelNotes-Control-TravelDataDiv' ).classList.contains ( 'TravelNotes-Control-HiddenList' );
		document.getElementById ( 'TravelNotes-ControlTravelExpandButton' ).innerHTML = hiddenList ? '&#x25b6;' : '&#x25bc;';
		document.getElementById ( 'TravelNotes-ControlTravelExpandButton' ).title = hiddenList ? _Translator.getText ( 'TravelEditorUI - Show' ) : _Translator.getText ( 'TravelEditorUI - Hide' );
		clickEvent.stopPropagation ( );
	};
	
	var onClickExpandListButton = function ( clickEvent ) {
		clickEvent.stopPropagation ( );
		document.getElementById ( 'TravelNotes-Control-TravelDataDiv' ).classList.toggle ( 'TravelNotes-Control-ExpandedList' );
		var expandedList = document.getElementById ( 'TravelNotes-Control-TravelDataDiv' ).classList.contains ( 'TravelNotes-Control-ExpandedList' );
		document.getElementById ( 'TravelNotes-Control-ExpandRoutesListButton' ).innerHTML = expandedList ? '&#x25b3;' : '&#x25bd;';
		document.getElementById ( 'TravelNotes-Control-ExpandRoutesListButton' ).title = expandedList ? _Translator.getText ( 'TravelEditorUI - Reduce the list' ) : _Translator.getText ( 'TravelEditorUI - Expand the list' );		
	};

	var _TimerId = null;
	
	var onMouseEnterControl = function ( event ) {
		if ( _TimerId ) {
			clearTimeout ( _TimerId );
			_TimerId = null;
		}
		document.getElementById ( 'TravelNotes-Control-MainDiv' ).classList.remove ( 'TravelNotes-Control-MainDiv-Minimize' );
		document.getElementById ( 'TravelNotes-Control-MainDiv' ).classList.add ( 'TravelNotes-Control-MainDiv-Maximize' );
	};
	
	var onTimeOut = function ( ) {
		document.getElementById ( 'TravelNotes-Control-MainDiv' ).classList.remove ( 'TravelNotes-Control-MainDiv-Maximize' );
		document.getElementById ( 'TravelNotes-Control-MainDiv' ).classList.add ( 'TravelNotes-Control-MainDiv-Minimize' );
	};
	
	var onMouseLeaveControl =function ( event ) {
		_TimerId = setTimeout(onTimeOut, _TravelNotesData.config.travelEditor.timeout );
	};
	
	var onClickPinButton = function ( event ) {
		var control = document.getElementById ( 'TravelNotes-Control-MainDiv' );
		if ( 10060 === event.target.innerHTML.charCodeAt ( 0 ) ) {
			event.target.innerHTML = '&#x1f4cc;';
			control.addEventListener ( 'mouseenter', onMouseEnterControl, false );
			control.addEventListener ( 'mouseleave', onMouseLeaveControl, false );
		}
		else
		{
			event.target.innerHTML = '&#x274c;';
			control.removeEventListener ( 'mouseenter', onMouseEnterControl, false );
			control.removeEventListener ( 'mouseleave', onMouseLeaveControl, false );
		}
	};

	var TravelEditorUI = function ( ) {
				
		/*
		--- _CreateUI function ----------------------------------------------------------------------------------------

		This function creates the UI
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _CreateUI = function ( controlDiv ){ 
		
			if ( document.getElementById ( 'TravelNotes-Control-TravelDataDiv' ) ) {
				return;
			}

			var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;
			
			// header
			var headerDiv = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-TravelHeaderDiv', 
					className : 'TravelNotes-Control-HeaderDiv'
				},
				controlDiv
			);

			// expand button
			var expandButton = htmlElementsFactory.create (
				'span',
				{ 
					innerHTML : '&#x25bc;', 
					id : 'TravelNotes-ControlTravelExpandButton', 
					className : 'TravelNotes-Control-ExpandButton'
				},
				headerDiv
			);
			expandButton.addEventListener ( 'click' , onClickExpandButton, false );

			// title
			htmlElementsFactory.create ( 
				'span', 
				{ 
					innerHTML : _Translator.getText ( 'TravelEditorUI - Travel routes' ), 
					id : 'TravelNotes-Control-TravelHeaderText', 
					className : 'TravelNotes-Control-HeaderText'
				},
				headerDiv 
			);
		
			// pin button
			var pinButton = htmlElementsFactory.create (
				'span',
				{ 
					innerHTML : '&#x274c;', 
					id : 'TravelNotes-Control-PinButton', 
				},
				headerDiv
			);
			pinButton.addEventListener ( 'click', onClickPinButton, false );

			// data div
			var dataDiv = htmlElementsFactory.create ( 
				'div',
				{ 
					id : 'TravelNotes-Control-TravelDataDiv', 
					className : 'TravelNotes-Control-DataDiv'
				},
				controlDiv 
			);
			
			// Routes list
			_RoutesList = require ( './SortableList' ) ( { minSize : 0, id : 'TravelNotes-Control-TravelRoutesList' }, dataDiv );
			_RoutesList.container.addEventListener ( 
				'SortableListDelete',
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/TravelEditor' ) ( ).removeRoute ( event.itemNode.dataObjId );
				}, 
				false
			);
			_RoutesList.container.addEventListener ( 
				'SortableListUpArrow', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/TravelEditor' ) ( ).swapRoute ( event.itemNode.dataObjId, true );
				},
				false 
			);
			_RoutesList.container.addEventListener ( 
				'SortableListDownArrow', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/TravelEditor' ) ( ).swapRoute ( event.itemNode.dataObjId, false );
				}, 
				false 
			);
			_RoutesList.container.addEventListener ( 
				'SortableListRightArrow', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/TravelEditor' ) ( ).editRoute ( event.itemNode.dataObjId );
				}, 
				false 
			);
			_RoutesList.container.addEventListener ( 
				'SortableListChange', 
				function ( event ) {
					event.stopPropagation();
					require ( '../core/TravelEditor' ) ( ).renameRoute ( event.dataObjId, event.changeValue );
				}, 
				false 
			);
			_RoutesList.container.addEventListener ( 
				'SortableListDrop', 
				function ( event ) {
					event.stopPropagation ( );
					require ( '../core/TravelEditor' ) ( ).routeDropped ( event.draggedObjId, event.targetObjId, event.draggedBefore );
				}, 
				false 
			);
			
			// buttons div
			var buttonsDiv = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-ControlTravelButtonsDiv', 
					className : 'TravelNotes-Control-ButtonsDiv'
				}, 
				controlDiv
			);

			// expand list button
			var expandListButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-ExpandRoutesListButton', 
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'TravelEditorUI - Expand the list' ), 
					innerHTML : '&#x25bd;'
				}, 
				buttonsDiv 
			);
			expandListButton.addEventListener ( 'click' , onClickExpandListButton, false );
			
			// cancel travel button
			var cancelTravelButton = htmlElementsFactory.create (
				'div', 
				{ 
					id : 'TravelNotes-Control-CancelTravelButton',
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'TravelEditorUI - Cancel travel' ), 
					innerHTML : '&#x274c'
				},
				buttonsDiv 
			);
			cancelTravelButton.addEventListener ( 
				'click', 
				function ( clickEvent ) {
					clickEvent.stopPropagation();
					require ( '../core/TravelEditor' ) ( ).clear ( );
				}, 
				false
			);

			// save travel button
			var saveTravelButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-SaveTravelButton', 
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'TravelEditorUI - Save travel' ), 
					innerHTML : '&#x1f4be;'
				}, 
				buttonsDiv 
			);
			saveTravelButton.addEventListener ( 
				'click' , 
				function ( clickEvent ) {
					clickEvent.stopPropagation ( );
					require ( '../core/TravelEditor' ) ( ).saveTravel ( );
				},
				false 
			);

			// open travel button with the well know hack....
			// See also UserInterface.js. Click events are first going to the interface div...
			var openTravelDiv = htmlElementsFactory.create ( 
				'div', 
				{ 
					id: 'TravelNotes-Control-OpenTravelDiv'
				}, 
				buttonsDiv 
			);
			var openTravelInput = htmlElementsFactory.create ( 
				'input',
				{
					id : 'TravelNotes-Control-OpenTravelInput', 
					type : 'file',
					accept : '.trv,.map'
				},
				openTravelDiv
			);
			openTravelInput.addEventListener ( 
				'change', 
				function ( clickEvent ) {
					clickEvent.stopPropagation ( );
					require ( '../core/FileLoader' ) ( ).openLocalFile ( clickEvent );
				},
				false 
			);
			var openTravelFakeDiv = htmlElementsFactory.create ( 
				'div', 
				{ 
					id: 'TravelNotes-Control-OpenTravelFakeDiv'
				}, 
				openTravelDiv 
			);
			var openTravelButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-OpenTravelButton', 
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'TravelEditorUI - Open travel' ), 
					innerHTML : '&#x1F4C2;'
				}, 
				openTravelFakeDiv 
			);
			openTravelButton.addEventListener ( 
				'click' , 
				function ( ) 
				{ 
					if ( ! require ( '../core/TravelEditor' ) ( ).confirmClose ( ) )
					{
						return;
					}
					openTravelInput.click ( );
				}, 
				false 
			);

			// import travel button with the well know hack....
			// See also UserInterface.js. Click events are first going to the interface div...
			var importTravelDiv = htmlElementsFactory.create ( 
				'div', 
				{ 
					id: 'TravelNotes-Control-ImportTravelDiv'
				}, 
				buttonsDiv 
			);
			var importTravelInput = htmlElementsFactory.create ( 
				'input',
				{
					id : 'TravelNotes-Control-ImportTravelInput', 
					type : 'file',
					accept : '.trv,.map'
				},
				importTravelDiv
			);
			importTravelInput.addEventListener ( 
				'change', 
				function ( clickEvent ) {
					clickEvent.stopPropagation ( );
					require ( '../core/FileLoader' ) ( ).mergeLocalFile ( clickEvent );
				},
				false 
			);
			var importTravelFakeDiv = htmlElementsFactory.create ( 
				'div', 
				{ 
					id: 'TravelNotes-Control-ImportTravelFakeDiv'
				}, 
				importTravelDiv 
			);
			var importTravelButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-ImportTravelButton', 
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'TravelEditorUI - Import travel' ), 
					innerHTML : '&#x1F30F;'
				}, 
				importTravelFakeDiv 
			);
			importTravelButton.addEventListener ( 
				'click' , 
				function ( event ) 
				{ 
					importTravelInput.click ( );
				}, 
				false 
			);

			// roadbook button
			var openTravelRoadbookButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-OpenTravelRoadbookButton', 
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'TravelEditorUI - Open travel roadbook' ), 
					innerHTML : '<a id="TravelNotes-Control-OpenTravelRoadbookLink" href="TravelNotesRoadbook.html?page=' + _TravelNotesData.UUID + '" target="_blank">&#x1F4CB;</a>' //'&#x23CD;'
				}, 
				buttonsDiv
			);

			// import button
			
			/*
			// Todo...
			var undoButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-UndoButton', 
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'TravelEditorUI - Undo' ), 
					innerHTML : '&#x21ba;'
				}, 
				buttonsDiv 
			);
			undoButton.addEventListener ( 
				'click' ,
				function ( clickEvent ) {
					clickEvent.stopPropagation ( );
				},
				false 
			);
			*/

			// add route button
			var addRouteButton = htmlElementsFactory.create ( 
				'div', 
				{ 
					id : 'TravelNotes-Control-AddRoutesButton', 
					className: 'TravelNotes-Control-Button', 
					title : _Translator.getText ( 'TravelEditorUI - New route' ), 
					innerHTML : '+'
				}, 
				buttonsDiv 
			);
			addRouteButton.addEventListener ( 
				'click' , 
				function ( event ) {
					event.stopPropagation();
					require ( '../core/TravelEditor' ) ( ).addRoute ( );
				},
				false
			);
			if ( _TravelNotesData.config.travelEditor.startMinimized ) {
				pinButton.innerHTML = '&#x1f4cc;';
				controlDiv.addEventListener ( 'mouseenter', onMouseEnterControl, false );
				controlDiv.addEventListener ( 'mouseleave', onMouseLeaveControl, false );
				controlDiv.classList.add ( 'TravelNotes-Control-MainDiv-Minimize' );
			}
			else {
				controlDiv.classList.add ( 'TravelNotes-Control-MainDiv-Maximize' );
			}
		};	
		
		/*
		--- _SetRoutesList function -----------------------------------------------------------------------------------

		This function fill the routes list
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _SetRoutesList = function (  ) {
			_RoutesList.removeAllItems ( );
			var routesIterator = _TravelNotesData.travel.routes.iterator;
			while ( ! routesIterator.done ) {
				_RoutesList.addItem ( routesIterator.value.name, routesIterator.value.chain ? '&#x26d3;' : '', _Translator.getText ( 'TravelEditorUI - Route' ) ,routesIterator.value.objId, false );
			}
		};

		/*
		--- TravelEditorUI object -------------------------------------------------------------------------------------

		---------------------------------------------------------------------------------------------------------------
		*/

		return {
			createUI : function ( controlDiv ) { 
				_CreateUI ( controlDiv ); 
			},
			
			setRoutesList : function (  ) {
				_SetRoutesList ( );
			}
		};
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = TravelEditorUI;
	}

}());

/*
--- End of TravelEditorUI.js file -------------------------------------------------------------------------------------
*/
},{"../L.TravelNotes":7,"../core/FileLoader":25,"../core/TravelEditor":32,"./HTMLElementsFactory":13,"./SortableList":19,"./Translator":20}],22:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- UserInterface.js file ---------------------------------------------------------------------------------------------
This file contains:
	- the UserInterface object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.1.0:
		- Issue #31 : Add a command to import from others maps
Doc reviewed 20170929
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';
	
	var UserInterface = function ( ) {

		var _MainDiv = document.getElementById ( 'TravelNotes-Control-MainDiv' );

		var _CreateUI = function ( ){ 
			_MainDiv = require ( './HTMLElementsFactory' ) ( ).create ( 'div', { id : 'TravelNotes-Control-MainDiv' } );
			require ( './HTMLElementsFactory' ) ( ).create ( 'div', { id : 'TravelNotes-Control-MainDiv-Title', innerHTML : 'Travel&nbsp;&amp;&nbsp;Notes' }, _MainDiv);
			require ( './TravelEditorUI' ) ( ).createUI ( _MainDiv ); 
			require ( './RouteEditorUI' ) ( ).createUI ( _MainDiv ); 
			require ( './ItineraryEditorUI' ) ( ).createUI ( _MainDiv ); 
			require ( './ErrorEditorUI' ) ( ).createUI ( _MainDiv ); 
			_MainDiv.addEventListener ( 
				'click',
				function ( event ) {

					if  ( event.target.classList.contains (  "TravelNotes-SortableList-ItemInput" ) ) {
						return; 
					}
					if ( event.target.id && -1 !== [ "TravelNotes-Control-OpenTravelInput", "TravelNotes-Control-OpenTravelButton", "TravelNotes-Control-ImportTravelInput", "TravelNotes-Control-ImportTravelButton", "TravelNotes-Control-OpenTravelRoadbookLink" ].indexOf ( event.target.id ) ) {
						return;
					}
					event.stopPropagation ( );
					event.preventDefault ( );
				},
				false
			);
			_MainDiv.addEventListener ( 
				'dblclick',
				function ( event ) {
					event.stopPropagation ( );
					event.preventDefault ( );
				},
				false
			);
			_MainDiv.addEventListener ( 
				'wheel',
				function ( event ) {
					event.stopPropagation ( );
					event.preventDefault ( );
				},
				false
			);
		};
		
		if ( ! _MainDiv ) {
			_CreateUI ( );
		}
		
		return {
			get UI ( ) { return _MainDiv; }
		};
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = UserInterface;
	}

}());

/*
--- End of UserInterface.js file --------------------------------------------------------------------------------------
*/	
},{"./ErrorEditorUI":12,"./HTMLElementsFactory":13,"./ItineraryEditorUI":15,"./RouteEditorUI":17,"./TravelEditorUI":21}],23:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"../UI/Translator":20,"./HTMLElementsFactory":13,"dup":9}],24:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- ErrorEditor.js file -----------------------------------------------------------------------------------------------
This file contains:
	- the ErrorEditor object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
Doc reviewed 20170927
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	var ErrorEditor = function ( ) {

		return {
			
			showError : function ( error ) {
				var header = '<span class="TravelNotes-Control-Error">';
				var footer = '</span>';
				require ( '../UI/ErrorEditorUI' ) ( ).message = header + error + footer;
			},

			clear : function ( ) {
				require ( '../UI/ErrorEditorUI' ) ( ).message = '';
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = ErrorEditor;
	}

}());

/*
--- End of ErrorEditor.js file ----------------------------------------------------------------------------------------
*/
},{"../UI/ErrorEditorUI":12}],25:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- FileLoader.js file ----------------------------------------------------------------------------------------------
This file contains:
	- the FileLoader object
	- the module.exports implementation
Changes:
	- v1.4.0:
		- created from TravelEditor
Doc reviewed ...
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	var FileLoader = function ( ) {

		var _TravelNotesData = require ( '../L.TravelNotes' );
		var _MapEditor = require ( '../core/MapEditor' ) ( );
	
		var _MergeContent = false;
		var _FileName = '';
		var _IsFileReadOnly = false;
		var _FileContent = {};
		
		/*
		--- _DecompressFileContent function --------------------------------------------------------------------------------

		This function decompress the file data
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _DecompressFileContent = function ( ) {
			
			_FileContent.routes.forEach ( 
				function ( route ) {
					route.itinerary.itineraryPoints.latLngs = require ( '@mapbox/polyline' ).decode ( route.itinerary.itineraryPoints.latLngs, 6 );
					var decompressedItineraryPoints = [];
					var latLngsCounter = 0;
					route.itinerary.itineraryPoints.latLngs.forEach (
						function ( latLng ) {
							var itineraryPoint = {};
							itineraryPoint.lat = latLng [ 0 ];
							itineraryPoint.lng = latLng [ 1 ];
							itineraryPoint.distance = route.itinerary.itineraryPoints.distances [ latLngsCounter ];
							itineraryPoint.objId = route.itinerary.itineraryPoints.objIds [ latLngsCounter ];
							itineraryPoint.objType = route.itinerary.itineraryPoints.objType;
							decompressedItineraryPoints.push ( itineraryPoint );
							latLngsCounter ++;
						}
					);
					route.itinerary.itineraryPoints = decompressedItineraryPoints;
				}
			);
			
			if ( _MergeContent ) {
				_Merge ( );
			}
			else {
				_Open ( );
			}
		};
		
		/*
		--- _Merge function -------------------------------------------------------------------------------------------

		This function merge the file data with the _TravelNotesData.travel
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _Merge = function ( ) {
			// ... and transform the data in the correct format
			var travel = require ( '../Data/Travel' ) ( );
			travel.object = _FileContent;
			
			// routes are added with their notes
			var routesIterator = travel.routes.iterator;
			while ( ! routesIterator.done ) {
				_TravelNotesData.travel.routes.add ( routesIterator.value );
			}
			// travel notes are added
			var notesIterator = travel.notes.iterator;
			while ( ! notesIterator.done ) {
				_TravelNotesData.travel.notes.add ( notesIterator.value );
			}
		
			_Display ( );
		};
		
		/*
		--- _Open function -------------------------------------------------------------------------------------------

		This function load the file data within the _TravelNotesData.travel
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _Open = function ( ) {
			_TravelNotesData.travel.object = _FileContent;
			if ( '' !== _FileName ) {
				_TravelNotesData.travel.name = _FileName.substr ( 0, _FileName.lastIndexOf ( '.' ) ) ;
			}
			_TravelNotesData.travel.readOnly = _IsFileReadOnly;			
			
			_Display ( );
		};
		
		/*
		--- _Display function -----------------------------------------------------------------------------------------

		This function update the screen
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _Display = function ( ) {
			
			// the map is cleaned
			_MapEditor.removeAllObjects ( );
			
			// routes are added with their notes
			var routesIterator = _TravelNotesData.travel.routes.iterator;
			while ( ! routesIterator.done ) {
				_MapEditor.addRoute ( routesIterator.value, true, false, _IsFileReadOnly );
			}
			
			// travel notes are added
			var notesIterator = _TravelNotesData.travel.notes.iterator;
			while ( ! notesIterator.done ) {
				_MapEditor.addNote ( notesIterator.value, _IsFileReadOnly );
			}
			
			// zoom on the travel
			_MapEditor.zoomToTravel ( );

			// Editors and roadbook are filled
			if ( ! _IsFileReadOnly ) {
			// Editors and HTML pages are filled
				require ( '../UI/TravelEditorUI' ) ( ). setRoutesList ( );
				require ( '../core/TravelEditor' ) ( ).updateRoadBook ( false );
			}
			else {
				// control is hidden
				document.getElementById ( 'TravelNotes-Control-MainDiv' ).classList.add ( 'TravelNotes-Control-MainDiv-Hidden' );
				document.getElementById ( 'TravelNotes-Control-MainDiv' ).classList.remove ( 'TravelNotes-Control-MainDiv-Maximize' );
				document.getElementById ( 'TravelNotes-Control-MainDiv' ).classList.remove ( 'TravelNotes-Control-MainDiv-Minimize' );
			}
			_TravelNotesData.map.fire ( 'travelnotesfileloaded', { readOnly : _IsFileReadOnly, name : _TravelNotesData.travel.name } );
		};
			
		/*
		--- _Display function -----------------------------------------------------------------------------------------

		This function open a local file
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _OpenLocalFile = function ( ) {
			_FileName = event.target.files [ 0 ].name;
			
			var fileReader = new FileReader( );
			fileReader.onload = function ( event ) {
				try {
					_FileContent =  JSON.parse ( fileReader.result );
					_DecompressFileContent ( );
				}
				catch ( e ) {
				}
			};
			fileReader.readAsText ( event.target.files [ 0 ] );
		};
	
		/*
		--- FileLoader object -----------------------------------------------------------------------------------------

		---------------------------------------------------------------------------------------------------------------
		*/

		return {
			openLocalFile : function ( event ) {
				_MergeContent = false;
				_IsFileReadOnly = false;
				_OpenLocalFile ( event );
			},
			mergeLocalFile : function ( event ) {
				_MergeContent = true;
				_IsFileReadOnly = false;
				_OpenLocalFile ( event );
			},
			openDistantFile : function ( fileContent ) {
				_IsFileReadOnly = true;
				_FileContent = fileContent;
				_DecompressFileContent ( );
			}
		};
		
	};
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = FileLoader;
	}

}());

/*
--- End of FileLoader.js file -----------------------------------------------------------------------------------------
*/	
},{"../Data/Travel":5,"../L.TravelNotes":7,"../UI/TravelEditorUI":21,"../core/MapEditor":28,"../core/TravelEditor":32,"@mapbox/polyline":1}],26:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- GeoCoder.js file --------------------------------------------------------------------------------------------------
This file contains:
	- the GeoCoder object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170927
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	var _RequestStarted = false;
	
	var GeoCoder = function ( ) {

		return {
			
			getAddress : function ( lat, lng, callback, context, parameter ) {
				if ( _RequestStarted ) {
					return;
				}
				_RequestStarted = true;
				var NominatimUrl = 
					'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1&accept-language=' + require ( '../L.TravelNotes' ).config.language;
				var XmlHttpRequest = new XMLHttpRequest ( );
				XmlHttpRequest.onreadystatechange = function ( ) { 
					if ( XmlHttpRequest.readyState == 4 && XmlHttpRequest.status == 200 ) {
						_RequestStarted = false;
						var response;
						try {
							response = JSON.parse( this.responseText );
						}
						catch ( e ) {
							return;
						}
						var address = '';
						if ( undefined !== response.address.house_number ) {
							address += response.address.house_number + ' ';
						}
						if ( undefined !== response.address.road ) {
							address += response.address.road + ' ';
						}
						else if ( undefined !== response.address.pedestrian ) {
							address += response.address.pedestrian + ' ';
						}
						if ( undefined !== response.address.village ) {
							address += response.address.village;
						}
						else if ( undefined !== response.address.town ) {
							address += response.address.town;
						}
						else if ( undefined !== response.address.city ) {
							address += response.address.city;
						}
						if ( 0 === address.length ) {
							address += response.address.country;
						}
						callback.call ( context, address, parameter );
					}
				};  
				XmlHttpRequest.open ( "GET", NominatimUrl, true );
				XmlHttpRequest.send ( null );
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = GeoCoder;
	}

}());

/*
--- End of GeoCoder.js file -------------------------------------------------------------------------------------------
*/
},{"../L.TravelNotes":7}],27:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
/*
--- ItineraryEditor.js file -------------------------------------------------------------------------------------------
This file contains:
	- the ItineraryEditor object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- added search and travel notes panes
Doc reviewed 20170927
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	var ItineraryEditor = function ( ) {
		
		return {
			setItinerary : function ( ) { require ( '../UI/ItineraryEditorUI' ) ( ).setItinerary (  );},
			setTravelNotes : function ( ) { require ( '../UI/ItineraryEditorUI' ) ( ).setTravelNotes (  );},
			setSearch : function ( ) { require ( '../UI/ItineraryEditorUI' ) ( ).setSearch (  );},
			
			get provider ( ) { return require ( '../L.TravelNotes' ).routing.provider;},
			set provider ( providerName ) { require ( '../UI/ItineraryEditorUI' ) ( ).provider = providerName ;},
			
			get transitMode ( ) { return require ( '../L.TravelNotes' ).routing.transitMode; },
			set transitMode ( transitMode ) { require ( '../UI/ItineraryEditorUI' ) ( ).transitMode = transitMode ; }
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = ItineraryEditor;
	}

}());

/*
--- End of ItineraryEditor.js file ------------------------------------------------------------------------------------
*/
},{"../L.TravelNotes":7,"../UI/ItineraryEditorUI":15}],28:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- MapEditor.js file -------------------------------------------------------------------------------------------------
This file contains:
	- the MapEditor object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	-v1.1.0:
		- Issue #29 : added tooltip to startpoint, waypoints and endpoint
		- Issue #30: Add a context menu with delete command to the waypoints
		- Issue #36: Add a linetype property to route
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
		- added zoomToNote, addRectangle and addSearchPointMarker methods
Doc reviewed 20170927
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';
	
	var _TravelNotesData = require ( '../L.TravelNotes' );
	var _DataSearchEngine  = require ( '../Data/DataSearchEngine' ) ( );

	var MapEditor = function ( ) {

		/*
		--- _UpdateRouteTooltip function -------------------------------------------------------------------------------------------

		This function updates the route tooltip with the distance when the mouse move on the polyline

		---------------------------------------------------------------------------------------------------------------
		*/

		var _UpdateRouteTooltip = function ( event ) { 
			var route = _DataSearchEngine.getRoute (  event.target.objId );
			var distance = require ( '../core/RouteEditor' ) ( ).getClosestLatLngDistance ( route, [ event.latlng.lat, event.latlng.lng ] ).distance;
			distance += route.chainedDistance;
			distance = require ( '../util/Utilities' ) ( ).formatDistance ( distance );
			var polyline = _TravelNotesData.mapObjects.get ( event.target.objId );
			polyline.closeTooltip ( );
			var tooltipText = _DataSearchEngine.getRoute ( event.target.objId ).name;
			tooltipText += ( 0 === tooltipText.length ? '' : ' - ' );
			tooltipText += distance;
			polyline.setTooltipContent ( tooltipText );
			polyline.openTooltip (  event.latlng );
		};
	
		/*
		--- _AddTo function -------------------------------------------------------------------------------------------

		This function add a leaflet object to the leaflet map and to the JavaScript map

		---------------------------------------------------------------------------------------------------------------
		*/

		var _AddTo = function ( objId, object ) {
			object.objId = objId;
			object.addTo ( _TravelNotesData.map );
			_TravelNotesData.mapObjects.set ( objId, object );
		};
		
		/*
		--- _RemoveFrom function --------------------------------------------------------------------------------------

		This function remove a leaflet object from the leaflet map and from the JavaScript map

		---------------------------------------------------------------------------------------------------------------
		*/

		var _RemoveFrom = function ( objId ) {
			var layer = _TravelNotesData.mapObjects.get ( objId );
			if ( layer ) {
				L.DomEvent.off ( layer );
				_TravelNotesData.map.removeLayer ( layer );
				_TravelNotesData.mapObjects.delete ( objId );
			}
		};
		
		/*
		--- _GetLatLngBounds function ---------------------------------------------------------------------------------

		This function build a L.latLngBounds object from an array of points

		---------------------------------------------------------------------------------------------------------------
		*/

		var _GetLatLngBounds = function ( latLngs ) {
			var sw = L.latLng ( [ 90, 180] );
			var ne = L.latLng ( [ -90, -180 ] );
			latLngs.forEach ( 
				function ( latLng ) {
					sw.lat = Math.min ( sw.lat, latLng [ 0 ] );
					sw.lng = Math.min ( sw.lng, latLng [ 1 ] );
					ne.lat = Math.max ( ne.lat, latLng [ 0 ] );
					ne.lng = Math.max ( ne.lng, latLng [ 1 ] );
				}
			);
			return L.latLngBounds( sw, ne );
		};
		
		/*
		--- _GetRouteLatLng function ----------------------------------------------------------------------------------

		This function returns an array of points from a route and the notes linked to the route

		---------------------------------------------------------------------------------------------------------------
		*/

		var _GetRouteLatLng = function ( route ) {
			var latLngs = [];
			route.itinerary.itineraryPoints.forEach ( 
				function ( itineraryPoint ) {
					latLngs.push ( itineraryPoint.latLng );
				}
			);
			route.notes.forEach ( 
				function ( note ) {
					latLngs.push ( note.latLng );
					latLngs.push ( note.iconLatLng );
				}
			);
			return latLngs;
		};
		
		/*
		--- _getDashArray function ----------------------------------------------------------------------------------

		This function returns the dashArray used for th epolyline representation. See also leaflet docs

		---------------------------------------------------------------------------------------------------------------
		*/

		var _getDashArray = function ( route ) {
			if ( route.dashArray >= _TravelNotesData.config.route.dashChoices.length ) {
				route.dashArray = 0;
			}
			var iDashArray = _TravelNotesData.config.route.dashChoices [ route.dashArray ].iDashArray;
			if ( iDashArray ) {
				var dashArray = '';
				var dashCounter = 0;
				for ( dashCounter = 0; dashCounter < iDashArray.length - 1; dashCounter ++ ) {
					dashArray += iDashArray [ dashCounter ] * route.width + ',';
				}
				dashArray += iDashArray [ dashCounter ] * route.width ;
				
				return dashArray;
			}
			return null;
		};
		
		/*
		--- MapEditor object ------------------------------------------------------------------------------------------

		---------------------------------------------------------------------------------------------------------------
		*/

		return {
			
			/*
			--- removeRoute method ------------------------------------------------------------------------------------

			This method remove a route and eventually the attached notes and waypoints 
			from the leaflet map and the JavaScript map
			
			parameters:
			- route : a TravelNotes route object.
			- removeNotes : a boolean. Linked notes are removed when true
			- removeWayPoints : a boolean. Linked waypoints are removed when true

			-----------------------------------------------------------------------------------------------------------
			*/
			
			removeRoute : function ( route, removeNotes, removeWayPoints ) {
				this.removeObject ( route.objId );
				if ( removeNotes ) {
					var notesIterator = route.notes.iterator;
					while ( ! notesIterator.done ) {
						this.removeObject ( notesIterator.value.objId );
					}
				}
				if ( removeWayPoints ) {
					var wayPointsIterator = route.wayPoints.iterator;
					while ( ! wayPointsIterator.done ) {
						this.removeObject ( wayPointsIterator.value.objId );
					}
				}
			},
			
			/*
			--- addRoute method ---------------------------------------------------------------------------------------

			This method add a route and eventually the attached notes and waypoints 
			to the leaflet map and the JavaScript map

			parameters:
			- route : a TravelNotes route object.
			- addNotes : a boolean. Attached notes are added when true
			- addWayPoints : a boolean. Attached waypoints are added when true
			- readOnly : a boolean. Created objects cannot be edited when true.

			-----------------------------------------------------------------------------------------------------------
			*/

			addRoute : function ( route, addNotes, addWayPoints, readOnly ) {
				readOnly = readOnly || false;
				
				// an array of points is created
				var latLng = [];
				var pointsIterator = route.itinerary.itineraryPoints.iterator;
				while ( ! pointsIterator.done ) {
					latLng.push ( pointsIterator.value.latLng );
				}
				
				// the leaflet polyline is created and added to the map
				var polyline = L.polyline ( latLng, { color : route.color, weight : route.width, dashArray : _getDashArray ( route ) } );
				_AddTo ( route.objId, polyline );
				// tooltip and popup are created
				polyline.bindTooltip ( 
					 route.name,
					{ sticky : true, direction : 'right' }
				);
				polyline.on ( 'mouseover' , _UpdateRouteTooltip	);
				polyline.on ( 'mousemove' , _UpdateRouteTooltip );
				
				polyline.bindPopup ( 
					function ( layer ) {
						var route = _DataSearchEngine.getRoute ( layer.objId );
						return require ( '../core/RouteEditor' )( ).getRouteHTML ( route, 'TravelNotes-' );
					}
				);
				
				// left click event
				L.DomEvent.on ( polyline, 'click', function ( event ) { event.target.openPopup ( event.latlng ); } );
				// right click event
				if ( ! readOnly ) {
					L.DomEvent.on ( 
						polyline, 
						'contextmenu', 
						function ( event ) {
							require ( '../UI/ContextMenu' ) ( event, require ( '../core/RouteEditor' )( ).getRouteContextMenu ( event.target.objId ) );
						}
					);
				}
				
				// notes are added
				if ( addNotes ) {
					var notesIterator = route.notes.iterator;
					while ( ! notesIterator.done ) {
						this.addNote ( notesIterator.value, readOnly );
					}
				}

				// waypoints are added
				if ( addWayPoints ) {
					var wayPointsIterator = _TravelNotesData.editedRoute.wayPoints.iterator;
					while ( ! wayPointsIterator.done ) {
						this.addWayPoint ( wayPointsIterator.value, wayPointsIterator .first ? 'A' : ( wayPointsIterator.last ? 'B' :  wayPointsIterator.index ) );
					}
				}
			},
			
			/*
			--- editRoute method --------------------------------------------------------------------------------------

			This method changes the color and width of a route

			parameters:
			- route : a TravelNotes route object.

			-----------------------------------------------------------------------------------------------------------
			*/

			editRoute : function ( route ) {
				var polyline = _TravelNotesData.mapObjects.get ( route.objId );
				polyline.setStyle( { color : route.color, weight : route.width, dashArray : _getDashArray ( route ) } );
			},
			
			/*
			--- removeObject method -----------------------------------------------------------------------------------

			This method remove an object from the leaflet map and from the JavaScript map

			parameters:
			- objId : the TravelNotes objId of the object to remove

			-----------------------------------------------------------------------------------------------------------
			*/

			removeObject : function ( objId ) {
				_RemoveFrom ( objId );
			},
			
			
			/*
			--- removeAllObjects method -------------------------------------------------------------------------------

			This method remove all the objects from the leaflet map and from the JavaScript map

			-----------------------------------------------------------------------------------------------------------
			*/

			removeAllObjects : function ( ) {
				_TravelNotesData.mapObjects.forEach ( 
					function ( travelObjectValue, travelObjectKey, travelObjects ) {
						L.DomEvent.off ( travelObjectValue );
						_TravelNotesData.map.removeLayer ( travelObjectValue );
					}
				);
				_TravelNotesData.mapObjects.clear ( );
			},
			
			
			/*
			--- zoomToPoint method ------------------------------------------------------------------------------------

			This method zoom on a given point

			-----------------------------------------------------------------------------------------------------------
			*/

			zoomToPoint : function ( latLng ) {
				_TravelNotesData.map.setView ( latLng, _TravelNotesData.config.itineraryPointZoom );
			},
			
			/*
			--- zoomToNote method ------------------------------------------------------------------------------------

			This method zoom on a note

			parameters:
			- noteObjId : the TravelNotes objId of the desired note

			-----------------------------------------------------------------------------------------------------------
			*/

			zoomToNote : function ( noteObjId ) {
				this.zoomToPoint ( _DataSearchEngine.getNoteAndRoute ( noteObjId ).note.iconLatLng );
			},
			
			/*
			--- zoomToRoute method ------------------------------------------------------------------------------------

			This method zoom on a route

			parameters:
			- routeObjId : the TravelNotes objId of the desired route

			-----------------------------------------------------------------------------------------------------------
			*/

			zoomToRoute : function ( routeObjId ) {
				var latLngs = _GetRouteLatLng (  _DataSearchEngine.getRoute ( routeObjId ) );
				if ( 0 !== latLngs.length ) {
					_TravelNotesData.map.fitBounds ( _GetLatLngBounds ( latLngs ) );
				}
			},
			
			/*
			--- zoomToTravel method -----------------------------------------------------------------------------------

			This method zoom on the entire travel

			-----------------------------------------------------------------------------------------------------------
			*/

			zoomToTravel : function ( ) {				
				var latLngs = [];
				_TravelNotesData.travel.routes.forEach (
					function ( route ) {
						latLngs = latLngs.concat ( _GetRouteLatLng ( route ) );
					}
				);
				_TravelNotesData.travel.notes.forEach (
					function ( note ) {
						latLngs.push ( note.latLng );
						latLngs.push ( note.iconLatLng );
					}
				);
				if ( 0 !== latLngs.length ) {
					_TravelNotesData.map.fitBounds ( _GetLatLngBounds ( latLngs ) );
				}
			},
			
			
			/*
			--- addItineraryPointMarker method ------------------------------------------------------------------------

			This method add a leaflet circleMarker at a given point
			
			parameters:
			- objId : a unique identifier to attach to the circleMarker
			- latLng : the center of the circleMarker

			-----------------------------------------------------------------------------------------------------------
			*/

			addItineraryPointMarker : function ( objId, latLng ) {
				_AddTo ( 
					objId,
					L.circleMarker ( latLng, _TravelNotesData.config.itineraryPointMarker )
				);
			},
			
			addRectangle : function( objId, bounds, properties ) {
				_AddTo (
					objId,
					L.rectangle ( bounds, properties )
				);
			},
			
			/*
			--- addSearchPointMarker method ---------------------------------------------------------------------------

			This method add a leaflet circleMarker at a given point
			
			parameters:
			- objId : a unique identifier to attach to the circleMarker
			- latLng : the center of the circleMarker

			-----------------------------------------------------------------------------------------------------------
			*/
			
			addSearchPointMarker : function ( objId, latLng ) {
				_AddTo ( 
					objId,
					L.circleMarker ( latLng, _TravelNotesData.config.searchPointMarker )
				);
			},
			
			
			/*
			--- addWayPoint method ------------------------------------------------------------------------------------

			This method add a TravelNotes waypoint object to the leaflet map

			parameters:
			- wayPoint : a TravelNotes waypoint object
			- letter : the letter to be displayed under the waypoint

			-----------------------------------------------------------------------------------------------------------
			*/

			addWayPoint : function ( wayPoint, letter ) {
				if ( ( 0 === wayPoint.lat ) && ( 0 === wayPoint.lng  ) ) {
					return;
				}
				
				// a HTML element is created, with different class name, depending of the waypont position. See also WayPoints.css
				var iconHtml = '<div class="TravelNotes-WayPoint TravelNotes-WayPoint' + 
				( 'A' === letter ? 'Start' : ( 'B' === letter ? 'End' : 'Via' ) ) + 
				'"></div><div class="TravelNotes-WayPointText">' + letter + '</div>';
				
				// a leaflet marker is created...
				var marker = L.marker ( 
					wayPoint.latLng,
					{ 
						icon : L.divIcon ( { iconSize: [ 40 , 40 ], iconAnchor: [ 20, 40 ], html : iconHtml, className : 'TravelNotes-WayPointStyle' } ),
						draggable : true
					} 
				);	

				marker.bindTooltip ( function ( wayPoint ) { return _DataSearchEngine.getWayPoint ( wayPoint.objId ).UIName; } );
				marker.getTooltip ( ).options.offset  = [ 20, -20 ];

				L.DomEvent.on ( 
					marker, 
					'contextmenu', 
					function ( event ) { 
						require ( '../UI/ContextMenu' ) ( event, require ( './RouteEditor' ) ( ).getWayPointContextMenu ( event.target.objId ) );	
					}
				);
				
				// ... and added to the map...
				marker.objId = wayPoint.objId;
				_AddTo ( wayPoint.objId, marker );
				
				// ... and a dragend event listener is created
				L.DomEvent.on (
					marker,
					'dragend', 
					function ( event ) {
						var wayPoint = _TravelNotesData.editedRoute.wayPoints.getAt ( event.target.objId );
						wayPoint.latLng = [ event.target.getLatLng ( ).lat, event.target.getLatLng ( ).lng ];
						require ( '../core/RouteEditor' )( ).wayPointDragEnd ( event.target.objId );
					}
				);
			},
			
			
			/*
			--- addNote method ----------------------------------------------------------------------------------------

			This method add a TravelNotes note object to the leaflet map

			parameters:
			- note : a TravelNotes note object
			- readOnly : a boolean. Created objects cannot be edited when true

			-----------------------------------------------------------------------------------------------------------
			*/

			addNote : function ( note, readOnly ) {
				
				readOnly = readOnly || false;
				
				// first a marker is created at the note position. This marker is empty and transparent, so 
				// not visible on the map but the marker can be dragged
				var bullet = L.marker ( 
					note.latLng,
					{ 
						icon : L.divIcon ( 
							{ 
								iconSize: [ 
									_TravelNotesData.config.note.grip.size , 
									_TravelNotesData.config.note.grip.size
								], 
								iconAnchor: [ 
									_TravelNotesData.config.note.grip.size / 2,
									_TravelNotesData.config.note.grip.size / 2 
								],
								html : '<div></div>'
							}
						),
						zIndexOffset : -1000 ,
						opacity : _TravelNotesData.config.note.grip.opacity,
						draggable : ! readOnly
					} 
				);	
				bullet.objId = note.objId;
				
				if ( ! readOnly ) {
					// event listener for the dragend event
					L.DomEvent.on ( 
						bullet, 
						'dragend', 
						function ( event ) {
							// the TravelNotes note and route are searched...
							var noteAndRoute = _DataSearchEngine.getNoteAndRoute ( event.target.objId );
							var note = noteAndRoute.note;
							var route = noteAndRoute.route;
							// ... then the layerGroup is searched...
							var layerGroup = _TravelNotesData.mapObjects.get ( event.target.objId );
							if ( null != route ) {
								// the note is attached to the route, so we have to find the nearest point on the route and the distance since the start of the route
								var latLngDistance = require ( '../core/RouteEditor' ) ( ).getClosestLatLngDistance ( route, [ event.target.getLatLng ( ).lat, event.target.getLatLng ( ).lng] );
								// coordinates and distance are changed in the note
								note.latLng = latLngDistance.latLng;
								note.distance = latLngDistance.distance;
								// notes are sorted on the distance
								route.notes.sort ( function ( a, b ) { return a.distance - b.distance; } );
								// the coordinates of the bullet are adapted
								layerGroup.getLayer ( layerGroup.bulletId ).setLatLng ( latLngDistance.latLng );
							}
							else {
								// the note is not attached to a route, so the coordinates of the note can be directly changed
								note.latLng = [ event.target.getLatLng ( ).lat, event.target.getLatLng ( ).lng ];
							}
							// in all cases, the polyline is updated
							layerGroup.getLayer ( layerGroup.polylineId ).setLatLngs ( [ note.latLng, note.iconLatLng ] );
							// and the HTML page is adapted
							require ( '../core/TravelEditor' ) ( ).updateRoadBook ( );
						}
 					);
					// event listener for the drag event
					L.DomEvent.on ( 
						bullet, 
						'drag', 
						function ( event ) {
							var note = _DataSearchEngine.getNoteAndRoute ( event.target.objId ).note;
							var layerGroup = _TravelNotesData.mapObjects.get ( event.target.objId );
							layerGroup.getLayer ( layerGroup.polylineId ).setLatLngs ( [ [ event.latlng.lat, event.latlng.lng ], note.iconLatLng ] );
						}
					);
				}
				
				// a second marker is now created. The icon created by the user is used for this marker
				var icon = L.divIcon (
					{ 
						iconSize: [ note.iconWidth, note.iconHeight ], 
						iconAnchor: [note.iconWidth / 2, note.iconHeight / 2 ],
						popupAnchor: [ 0, - note.iconHeight / 2 ], 
						html : note.iconContent,
						className : _TravelNotesData.config.note.style
					}
				);
				var marker = L.marker ( 
					note.iconLatLng,
					{
						icon : icon,
						draggable : ! readOnly
					}
				);	
				marker.objId = note.objId;
				
				// a popup is binded to the the marker...
				marker.bindPopup (
					function ( layer ) {
						var note = _DataSearchEngine.getNoteAndRoute ( layer.objId ).note;
						return require ( '../core/NoteEditor' )( ).getNoteHTML ( note, 'TravelNotes-' );
					}			
				);
				
				// ... and also a tooltip
				if ( 0 !== note.tooltipContent.length ) {
					marker.bindTooltip ( function ( layer ) { return _DataSearchEngine.getNoteAndRoute ( layer.objId ).note.tooltipContent; } );
					marker.getTooltip ( ).options.offset [ 0 ] = note.iconWidth / 2;
				}
				if ( ! readOnly ) {
					// event listener for the contextmenu event
					L.DomEvent.on ( 
						marker, 
						'contextmenu', 
						function ( event ) { 
							require ( '../UI/ContextMenu' ) ( event, require ( './NoteEditor' ) ( ).getNoteContextMenu ( event.target.objId ) );	
						}
					);
					// event listener for the dragend event
					L.DomEvent.on ( 
						marker, 
						'dragend',
						function ( event ) {
							// The TravelNotes note linked to the marker is searched...
							var note = _DataSearchEngine.getNoteAndRoute ( event.target.objId ).note;
							// ... new coordinates are saved in the TravelNotes note...
							note.iconLatLng = [ event.target.getLatLng ( ).lat, event.target.getLatLng ( ).lng ];
							// ... then the layerGroup is searched...
							var layerGroup = _TravelNotesData.mapObjects.get ( event.target.objId );
							// ... and finally the polyline is updated with the new coordinates
							layerGroup.getLayer ( layerGroup.polylineId ).setLatLngs ( [ note.latLng, note.iconLatLng ] );
						}
					);
					// event listener for the drag event
					L.DomEvent.on ( 
						marker, 
						'drag',
						function ( event ) {
							// The TravelNotes note linked to the marker is searched...
							var note = _DataSearchEngine.getNoteAndRoute ( event.target.objId ).note;
							// ... then the layerGroup is searched...
							var layerGroup = _TravelNotesData.mapObjects.get ( event.target.objId );
							// ... and finally the polyline is updated with the new coordinates
							layerGroup.getLayer ( layerGroup.polylineId ).setLatLngs ( [ note.latLng, [ event.latlng.lat, event.latlng.lng ] ] );
						}
					);
				}
				
				// Finally a polyline is created between the 2 markers
				var polyline = L.polyline ( [ note.latLng, note.iconLatLng ], _TravelNotesData.config.note.polyline );
				polyline.objId = note.objId;
				
				// The 3 objects are added to a layerGroup
				var layerGroup = L.layerGroup ( [ marker, polyline, bullet ] );
				layerGroup.markerId = L.Util.stamp ( marker );
				layerGroup.polylineId = L.Util.stamp ( polyline );
				layerGroup.bulletId = L.Util.stamp ( bullet );
				
				// and the layerGroup added to the leaflet map and JavaScript map
				_AddTo ( note.objId, layerGroup );
			},			
			
			/*
			--- editNote method ---------------------------------------------------------------------------------------

			This method changes a note after edition by the user

			parameters:
			- note : the TravelNotes note object modified by the user
			
			-----------------------------------------------------------------------------------------------------------
			*/

			editNote : function ( note ) {
				
				// a new icon is created
				var icon = L.divIcon (
					{ 
						iconSize: [ note.iconWidth, note.iconHeight ], 
						iconAnchor: [note.iconWidth / 2, note.iconHeight / 2 ],
						popupAnchor: [ 0, -note.iconHeight / 2 ], 
						html : note.iconContent,
						className : _TravelNotesData.config.note.style
					}
				);
				// and the marker icon replaced by the new one
				var layerGroup = _TravelNotesData.mapObjects.get ( note.objId );
				var marker = layerGroup.getLayer ( layerGroup.markerId );
				marker.setIcon ( icon );
				
				// then, the tooltip is changed
				marker.unbindTooltip ( );
				if ( 0 !== note.tooltipContent.length ) {
					marker.bindTooltip ( function ( layer ) { return _DataSearchEngine.getNoteAndRoute ( layer.objId ).note.tooltipContent; } );
					marker.getTooltip ( ).options.offset [ 0 ] = note.iconWidth / 2;
				}
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = MapEditor;
	}

}());

/*
--- End of MapEditor.js file ------------------------------------------------------------------------------------------
*/
},{"../Data/DataSearchEngine":2,"../L.TravelNotes":7,"../UI/ContextMenu":11,"../core/NoteEditor":29,"../core/RouteEditor":30,"../core/TravelEditor":32,"../util/Utilities":47,"./NoteEditor":29,"./RouteEditor":30}],29:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- NoteEditor.js file -------------------------------------------------------------------------------------------------
This file contains:
	- the NoteEditor object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
		- added newSearchNote method and modified endNoteDialog for update of the travel note pane
Doc reviewed 20170927
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	var _Translator = require ( '../UI/Translator' ) ( );
	var _TravelNotesData = require ( '../L.TravelNotes' );
	var _DataSearchEngine  = require ( '../Data/DataSearchEngine' ) ( );
	var _Utilities = require ( '../util/Utilities' ) ( );
	
	var NoteEditor = function ( ) {
		
		return {	
		
			/*
			--- newNote method ----------------------------------------------------------------------------------------

			This method create a new TravelNotes note object
			
			parameters:
			- latLng : the coordinates of the new note

			-----------------------------------------------------------------------------------------------------------
			*/

			newNote : function ( latLng ) {
				var note = require ( '../data/Note' ) ( );
				note.latLng = latLng;
				note.iconLatLng = latLng;
				
				return note;
			},
		
			/*
			--- newRouteNote method -----------------------------------------------------------------------------------

			This method start the creation of a TravelNotes note object linked with a route
			
			parameters:
			- routeObjId : the objId of the route to witch the note will be linked
			- event : the event that have triggered the method ( a right click on the 
			route polyline and then a choice in a context menu)

			-----------------------------------------------------------------------------------------------------------
			*/

			newRouteNote : function ( routeObjId, event ) {
				// the nearest point and distance on the route is searched
				var latLngDistance = require ( '../core/RouteEditor' ) ( ).getClosestLatLngDistance ( 
					_DataSearchEngine.getRoute ( routeObjId ),
					[ event.latlng.lat, event.latlng.lng ] 
				);
				
				// the note is created
				var note = this.newNote ( latLngDistance.latLng );
				note.distance = latLngDistance.distance;
				
				// and displayed in a dialog box
				require ( '../UI/NoteDialog' ) ( note, routeObjId, true );
			},
			
			/*
			--- newSearchNote method --------------------------------------------------------------------------------

			This method start the creation of a TravelNotes note object linked to a maneuver
			
			parameters:
			- searchResult : the search results with witch the note will be created

			-----------------------------------------------------------------------------------------------------------
			*/

			newSearchNote : function ( searchResult ) {
				var note = this.newNote ( [ searchResult.lat, searchResult.lon ] );
				
				note.address = ( '' !== searchResult.housenumber ? searchResult.housenumber + ' ' : '' ) +
					( '' !== searchResult.street ? searchResult.street + ' ' : '' ) +
					searchResult.city;
				
				note.url = searchResult.website;
				note.phone = searchResult.phone;
				note.tooltipContent = searchResult.name;
				note.popupContent = searchResult.name;
				
				require ( '../UI/NoteDialog' ) ( note, -1, true );
			},
		
			/*
			--- newManeuverNote method --------------------------------------------------------------------------------

			This method start the creation of a TravelNotes note object linked to a maneuver
			
			parameters:
			- maneuverObjId : the objId of the maneuver
			- latLng : the coordinates of the maneuver

			-----------------------------------------------------------------------------------------------------------
			*/

			newManeuverNote : function ( maneuverObjId, latLng ) {
				// the nearest point and distance on the route is searched
				var latLngDistance = require ( '../core/RouteEditor' ) ( ).getClosestLatLngDistance ( 
					_TravelNotesData.editedRoute,
					latLng
				);
				// the maneuver is searched
				var maneuver = _TravelNotesData.editedRoute.itinerary.maneuvers.getAt ( maneuverObjId );

				// the note is created
				var note = this.newNote ( latLng );
				note.distance = latLngDistance.distance;
				note.iconContent = "<div class='TravelNotes-ManeuverNote TravelNotes-ManeuverNote-" + maneuver.iconName + "'></div>";
				note.popupContent = maneuver.instruction;
				note.width = 40;
				note.height = 40;

				// and displayed in a dialog box
				require ( '../UI/NoteDialog' ) ( note, _TravelNotesData.editedRoute.objId, true );
			},
		
			/*
			--- newTravelNote method ----------------------------------------------------------------------------------

			This method start the creation f a TravelNotes note object
			
			parameters:
			- latLng : the coordinates of the new note

			-----------------------------------------------------------------------------------------------------------
			*/

			newTravelNote : function ( latLng ) {
				// the note is created
				var note = this.newNote ( latLng );

				// and displayed in a dialog box
				require ( '../UI/NoteDialog' ) ( note, -1, true );
			},
		
			/*
			--- endNoteDialog method ----------------------------------------------------------------------------------

			This method is called when the user push on the ok button of the note dialog
			
			parameters:
			- note : the note modified in the dialog box
			- routeObjId : the TravelNotes route objId passed to the note dialog box

			-----------------------------------------------------------------------------------------------------------
			*/

			endNoteDialog : function ( note, routeObjId ) {
				var noteAndRoute = _DataSearchEngine.getNoteAndRoute ( note.objId );
				if ( noteAndRoute.note ) {
					// it's an existing note. The note is changed on the map
					require ( '../core/MapEditor' ) ( ).editNote ( note );
					if ( ! noteAndRoute.route ) {
						// it's a travel note. UI is also adapted
						require ( '../UI/ItineraryEditorUI' ) ( ).setTravelNotes ( );
					}
				}
				else {
					// it's a new note
					if ( -1 === routeObjId ) {
						// it's a global note
						_TravelNotesData.travel.notes.add ( note );
						require ( '../UI/ItineraryEditorUI' ) ( ).setTravelNotes ( );
					}
					else {
						// the note is linked with a route, so...
						var route = _DataSearchEngine.getRoute ( routeObjId );
						route.notes.add ( note );
						// ... the chainedDistance is adapted...
						note.chainedDistance = route.chainedDistance;
						// and the notes sorted
						route.notes.sort ( function ( a, b ) { return a.distance - b.distance; } );
						// and in the itinerary is adapted...
						require ( '../core/ItineraryEditor' ) ( ).setItinerary ( );
					}
					// the note is added to the leaflet map
					require ( '../core/MapEditor' ) ( ).addNote ( note );
				}
				// and the HTML page is adapted
				require ( '../core/TravelEditor' ) ( ).updateRoadBook ( );
			},	
		
			/*
			--- editNote method ---------------------------------------------------------------------------------------

			This method start the modification of a note
			
			parameters:
			- noteObjId : the objId of the edited note

			-----------------------------------------------------------------------------------------------------------
			*/

			editNote : function ( noteObjId ) {
				var noteAndRoute = _DataSearchEngine.getNoteAndRoute ( noteObjId );
				require ( '../UI/NoteDialog' ) ( noteAndRoute.note, null === noteAndRoute.route ? -1 : noteAndRoute.route.objId, false );
			},
		
			/*
			--- removeNote method -------------------------------------------------------------------------------------

			This method removes a note
			
			parameters:
			- noteObjId : the objId of the note to remove

			-----------------------------------------------------------------------------------------------------------
			*/

			removeNote : function ( noteObjId ) {
				// the note is removed from the leaflet map
				require ( '../core/MapEditor' ) ( ).removeObject ( noteObjId );
				// the note and the route are searched
				var noteAndRoute = _DataSearchEngine.getNoteAndRoute ( noteObjId );
				if ( noteAndRoute.route ) {
					// it's a route note
					noteAndRoute.route.notes.remove ( noteObjId );
					require ( '../core/ItineraryEditor' ) ( ).setItinerary ( );
				}
				else {
					// it's a travel note
					_TravelNotesData.travel.notes.remove ( noteObjId );
				}
				// and the HTML page is adapted
				require ( '../core/TravelEditor' ) ( ).updateRoadBook ( );
			},
		
			/*
			--- hideNotes method -------------------------------------------------------------------------------------

			This method hide the notes on the map
			
			-----------------------------------------------------------------------------------------------------------
			*/

			hideNotes : function ( ) {
				var notesIterator = _TravelNotesData.travel.notes.iterator;
				while ( ! notesIterator.done ) {
					require ( '../core/MapEditor' ) ( ).removeObject ( notesIterator.value.objId );
				}
				var routesIterator = _TravelNotesData.travel.routes.iterator;
				while ( ! routesIterator.done ) {
					notesIterator = routesIterator.value.notes.iterator;
					while ( ! notesIterator.done ) {
						require ( '../core/MapEditor' ) ( ).removeObject ( notesIterator.value.objId );					
					}
				}
			},
			
			/*
			--- showNotes method -------------------------------------------------------------------------------------

			This method show the notes on the map
			
			-----------------------------------------------------------------------------------------------------------
			*/

			showNotes : function ( ) {
				this.hideNotes ( );
				var notesIterator = _TravelNotesData.travel.notes.iterator;
				while ( ! notesIterator.done ) {
					require ( '../core/MapEditor' ) ( ).addNote ( notesIterator.value );
				}
				var routesIterator = _TravelNotesData.travel.routes.iterator;
				while ( ! routesIterator.done ) {
					notesIterator = routesIterator.value.notes.iterator;
					while ( ! notesIterator.done ) {
						require ( '../core/MapEditor' ) ( ).addNote ( notesIterator.value );					
					}
				}
			},
			
			/*
			--- zoomToNote method -------------------------------------------------------------------------------------

			This method zoom to a given note
			
			-----------------------------------------------------------------------------------------------------------
			*/

			zoomToNote : function ( noteObjId ) {
				require ( '../core/MapEditor' ) ( ).zoomToPoint ( _DataSearchEngine.getNoteAndRoute ( noteObjId).note.latLng );
			},
			
			/*
			--- getMapContextMenu method ------------------------------------------------------------------------------

			This method gives the note part of the map context menu
			
			parameters:
			- latLng : the coordinates where the map was clicked

			-----------------------------------------------------------------------------------------------------------
			*/

			getMapContextMenu :function ( latLng ) {
				
				var contextMenu = [];
				contextMenu.push ( 
					{ 
						context : this, 
						name : _Translator.getText ( "NoteEditor - New travel note" ), 
						action : this.newTravelNote,
						param : latLng
					} 
				);
				contextMenu.push ( 
					{ 
						context : this, 
						name : _Translator.getText ( "NoteEditor - Hide notes" ), 
						action : this.hideNotes
					} 
				);
				contextMenu.push ( 
					{ 
						context : this, 
						name : _Translator.getText ( "NoteEditor - Show notes" ), 
						action : this.showNotes
					} 
				);
				
				return contextMenu;
			},
		
			/*
			--- getNoteContextMenu method -----------------------------------------------------------------------------

			This method gives the note context menu
			
			parameters:
			- noteObjId : the note objId that was clicked

			-----------------------------------------------------------------------------------------------------------
			*/

			getNoteContextMenu :function ( noteObjId ) {
				var contextMenu = [];
				contextMenu.push ( 
					{ 
						context : this, 
						name : _Translator.getText ( "NoteEditor - Edit this note" ), 
						action : this.editNote,
						param : noteObjId
					} 
				);
				contextMenu.push ( 
					{ 
						context : this, 
						name : _Translator.getText ( "NoteEditor - Delete this note" ), 
						action : this.removeNote,
						param : noteObjId
					} 
				);
				contextMenu.push ( 
					{ 
						context : this, 
						name : _Translator.getText ( "NoteEditor - Zoom to note" ), 
						action : this.zoomToNote,
						param : noteObjId
					} 
				);
				
				return contextMenu;
			},
			
			/*
			--- getNoteHTML method ------------------------------------------------------------------------------------

			This method returns an HTML string with the note contents. This string will be used in the
			note popup and on the roadbook page
			
			parameters:
			- note : the TravelNotes object
			- classNamePrefix : a string that will be added to all the HTML classes

			-----------------------------------------------------------------------------------------------------------
			*/

			getNoteHTML : function ( note, classNamePrefix ) {
			
			var noteText = '';
				if ( 0 !== note.tooltipContent.length ) {
					noteText += '<div class="' + classNamePrefix + 'NoteHtml-TooltipContent">' + note.tooltipContent + '</div>';
				}
				if ( 0 !== note.popupContent.length ) {
					noteText += '<div class="' + classNamePrefix + 'NoteHtml-PopupContent">' + note.popupContent + '</div>';
				}
				if ( 0 !== note.address.length ) {
					noteText += '<div class="' + classNamePrefix + 'NoteHtml-Address">' + _Translator.getText ( 'NoteEditor - Address' )  + note.address + '</div>';
				}
				if ( 0 !== note.phone.length ) {
					noteText += '<div class="' + classNamePrefix + 'NoteHtml-Phone">' + _Translator.getText ( 'NoteEditor - Phone' )  + note.phone + '</div>';
				}
				if ( 0 !== note.url.length ) {
					noteText += '<div class="' + classNamePrefix + 'NoteHtml-Url">' + _Translator.getText ( 'NoteEditor - Link' ) + '<a href="' + note.url + '" target="_blank">' + note.url.substr ( 0, 40 ) + '...' +'</a></div>';
				}
				noteText += '<div class="' + classNamePrefix + 'NoteHtml-LatLng">' + 
					_Translator.getText ( 
						'NoteEditor - Latitude Longitude',
						{ 
							lat : _Utilities.formatLat ( note.lat ),
							lng : _Utilities.formatLng ( note.lng )
						}
					) + '</div>';
					
				if ( -1 !== note.distance ) {
					noteText += '<div class="' + classNamePrefix + 'NoteHtml-Distance">' +
						_Translator.getText ( 
							'NoteEditor - Distance', 
							{ 
								distance: _Utilities.formatDistance ( note.chainedDistance + note.distance )
							}
						) + '</div>';
				}
				
				return noteText;
			}		
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = NoteEditor;
	}

}());

/*
--- End of NoteEditor.js file -----------------------------------------------------------------------------------------
*/
},{"../Data/DataSearchEngine":2,"../L.TravelNotes":7,"../UI/ItineraryEditorUI":15,"../UI/NoteDialog":16,"../UI/Translator":20,"../core/ItineraryEditor":27,"../core/MapEditor":28,"../core/RouteEditor":30,"../core/TravelEditor":32,"../data/Note":38,"../util/Utilities":47}],30:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- RouteEditor.js file -------------------------------------------------------------------------------------------------
This file contains:
	- the RouteEditor object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.1.0:
		- Issue #28 : Disable "select this point as start point " and "select this point as end point" when a start point or end point is already present
		- Issue #30 : Add a context menu with delete command to the waypoints
		- Issue #33 : Add a command to hide a route
		- Issue #34 : Add a command to show all routes
	- v1.3.0:
		- added cutRoute method (not tested...)
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170928
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';

	var _TravelNotesData = require ( '../L.TravelNotes' );
	var _DataSearchEngine  = require ( '../Data/DataSearchEngine' ) ( );
	var _Translator = require ( '../UI/Translator' ) ( );
	var _NoteEditor = require ( '../core/NoteEditor' ) ( );
	var _MapEditor = require ( '../core/MapEditor' ) ( );
	var _RouteEditorUI = require ( '../UI/RouteEditorUI' ) ( );
	var _ItineraryEditor = require ( '../core/ItineraryEditor' ) ( );
	var _Utilities = require ( '../util/Utilities' ) ( );
		
	var RouteEditor = function ( ) {
		
		/*
		--- RouteEditor object ----------------------------------------------------------------------------------------

		---------------------------------------------------------------------------------------------------------------
		*/

		return {
			cutRoute : function ( route, latLng ) {

				// an array is created with 2 clones of the route
				var routes = [ require ( '../data/Route' ) ( ), require ( '../data/Route' ) ( ) ];
				routes [ 0 ].object = route.object;
				routes [ 1 ].object = route.object;
				
				// and the itineraryPoints are removed
				routes [ 0 ].itinerary.itineraryPoints.removeAll ( );
				routes [ 1 ].itinerary.itineraryPoints.removeAll ( );
				
				// the distance between the origin and the cutting point is computed
				var cuttingPointLatLngDistance = this.getClosestLatLngDistance ( route, latLng );

				// iteration on the itineraryPoints
				var itineraryPointIterator = route.itinerary.itineraryPoints.iterator;
				var iterationDistance = 0;
				var itineraryPoint;
				var previousItineraryPoint = null;
				
				var routeCounter = 0;
				while ( ! itineraryPointIterator.done ) {
					itineraryPoint = require ( '../data/ItineraryPoint' ) ( );
					itineraryPoint.object = itineraryPointIterator.value.object;
					if ( 0 === routeCounter && 0 != iterationDistance && iterationDistance > cuttingPointLatLngDistance.distance ) {
						// we have passed the cutting point...
						var removedDistance = L.latLng ( cuttingPointLatLngDistance.latLng ).distanceTo ( L.latLng ( itineraryPointIterator.value.latLng ) );
						// a new point is created at the cutting point position and added to the first route.
						var cuttingPoint = require ( '../data/ItineraryPoint' ) ( );
						cuttingPoint.latLng = cuttingPointLatLngDistance.latLng;
						routes [ 0 ].itinerary.itineraryPoints.add ( cuttingPoint );
						routes [ 0 ].distance = iterationDistance - removedDistance;
						if ( previousItineraryPoint ) {
							previousItineraryPoint.distance -= removedDistance;
						}

						routeCounter = 1;
						
						// a new point is created at the cutting point position and added to the second route.
						cuttingPoint = require ( '../data/ItineraryPoint' ) ( );
						cuttingPoint.latLng = cuttingPointLatLngDistance.latLng;
						cuttingPoint.distance = removedDistance;
						routes [ 1 ].itinerary.itineraryPoints.add ( cuttingPoint );
						iterationDistance = removedDistance;
					}
					routes [ routeCounter ].itinerary.itineraryPoints.add ( itineraryPoint );
					iterationDistance +=itineraryPointIterator.value.distance;
					previousItineraryPoint = itineraryPoint;
				}
				routes [ routeCounter ].distance = iterationDistance;

				return routes;
			},

			/*
			--- getClosestLatLngDistance method -----------------------------------------------------------------------

			This method search the nearest point on a route from a given point and compute the distance
			between the beginning of the route and the nearest point
			
			parameters:
			- route : the TravelNotes route object to be used
			- latLng : the coordinates of the point

			-----------------------------------------------------------------------------------------------------------
			*/

			getClosestLatLngDistance : function ( route, latLng ) {
				
				// an iterator on the route points is created...
				var itineraryPointIterator = route.itinerary.itineraryPoints.iterator;
				// ... and placed on the first point
				var dummy = itineraryPointIterator.done;
				// the smallest distance is initialized ...
				var minDistance = Number.MAX_VALUE;
				// projections of points are made
				var point = L.Projection.SphericalMercator.project ( L.latLng ( latLng [ 0 ], latLng [ 1 ] ) );
				var point1 = L.Projection.SphericalMercator.project ( L.latLng ( itineraryPointIterator.value.lat, itineraryPointIterator.value.lng ) );
				// variables initialization
				var closestLatLng = null;
				var closestDistance = 0;
				var endSegmentDistance = itineraryPointIterator.value.distance;
				// iteration on the route points
				while ( ! itineraryPointIterator.done ) {
					// projection of the second point...
					var point2 = L.Projection.SphericalMercator.project ( L.latLng ( itineraryPointIterator.value.lat, itineraryPointIterator.value.lng ) );
					// and distance is computed
					var distance = L.LineUtil.pointToSegmentDistance ( point, point1, point2 );
					if ( distance < minDistance )
					{
						// we have found the smallest distance ... till now :-)
						minDistance = distance;
						// the nearest point is computed
						closestLatLng = L.Projection.SphericalMercator.unproject ( L.LineUtil.closestPointOnSegment ( point, point1, point2 ) );
						// and the distance also
						closestDistance = endSegmentDistance - closestLatLng.distanceTo ( L.latLng ( itineraryPointIterator.value.lat, itineraryPointIterator.value.lng ) );
					}
					// we prepare the iteration for the next point...
					endSegmentDistance += itineraryPointIterator.value.distance;
					point1 = point2;
				}
				
				return { latLng : [ closestLatLng.lat, closestLatLng.lng ], distance : closestDistance };
			},

			/*
			--- saveGpx method ----------------------------------------------------------------------------------------

			This method save the currently edited route to a GPX file
			
			-----------------------------------------------------------------------------------------------------------
			*/

			saveGpx : function ( ) {
				// initializations...
				var tab0 = "\n";
				var tab1 = "\n\t";
				var tab2 = "\n\t\t";
				var tab3 = "\n\t\t\t";
				var timeStamp = "time='" + new Date ( ).toISOString ( ) + "' ";
				
				// header
				var gpxString = "<?xml version='1.0'?>" + tab0;
				gpxString += "<gpx xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd' version='1.1' creator='Leaflet-Routing-Gpx'>";

				// waypoints
				var wayPointsIterator = _TravelNotesData.editedRoute.wayPoints.iterator;
				while ( ! wayPointsIterator.done )
				{
					gpxString += 
						tab1 + "<wpt lat='" + wayPointsIterator.value.lat + "' lon='" + wayPointsIterator.value.lng + "' " +
						timeStamp + "/>";
					
				}
				
				// route
				gpxString += tab1 + "<rte>";
				var maneuverIterator = _TravelNotesData.editedRoute.itinerary.maneuvers.iterator;
				while ( ! maneuverIterator.done ) {
					var wayPoint = _TravelNotesData.editedRoute.itinerary.itineraryPoints.getAt ( maneuverIterator.value.itineraryPointObjId );
					var instruction = maneuverIterator.value.instruction.replace ( '&', '&amp;' ).replace ( '\'', '&apos;' ).replace ('\"', '&quote;').replace ( '>', '&gt;' ).replace ( '<', '&lt;');
					gpxString +=
						tab2 + "<rtept lat='" + wayPoint.lat + "' lon='" + wayPoint.lng +"' " + timeStamp + "desc='" + instruction + "' />" ;
				}
				gpxString += tab1 + "</rte>";
				
				// track
				gpxString += tab1 + "<trk>";
				gpxString += tab2 + "<trkseg>";
				var itineraryPointsIterator = _TravelNotesData.editedRoute.itinerary.itineraryPoints.iterator;
				while ( ! itineraryPointsIterator.done ) {
					gpxString +=
						tab3 + "<trkpt lat='" + itineraryPointsIterator.value.lat + "' lon='" + itineraryPointsIterator.value.lng + "' " + timeStamp + " />";
				}
				gpxString += tab2 + "</trkseg>";				
				gpxString += tab1 + "</trk>";
				
				// eof
				gpxString += tab0 + "</gpx>";
				
				// file is saved
				var fileName = _TravelNotesData.editedRoute.name;
				if ( '' === fileName ) {
					fileName = 'TravelNote';
				}
				fileName += '.gpx';
				require ( '../util/Utilities' ) ( ).saveFile ( fileName, gpxString );
			},
			
			/*
			--- getRouteHTML method -----------------------------------------------------------------------------------

			This method returns an HTML string with the route contents. This string will be used in the
			route popup and on the roadbook page
			
			parameters:
			- route : the TravelNotes route object
			- classNamePrefix : a string that will be added to all the HTML classes

			-----------------------------------------------------------------------------------------------------------
			*/

			getRouteHTML : function ( route, classNamePrefix ) {
				var returnValue = '<div class="' + classNamePrefix + 'Route-Header-Name">' +
					route.name + 
					'</div>';
				if (0 !== route.distance ) {
					returnValue += '<div class="' + classNamePrefix + 'Route-Header-Distance">' +
						_Translator.getText ( 'RouteEditor - Distance', { distance : _Utilities.formatDistance ( route.distance ) } ) + '</div>' +
						'<div class="' + classNamePrefix + 'Route-Header-Duration">' +
						_Translator.getText ( 'RouteEditor - Duration', { duration : _Utilities.formatTime ( route.duration ) } ) + '</div>';
				}
				
				return returnValue;
			},
			
			/*
			--- chainRoutes method ------------------------------------------------------------------------------------

			This method recompute the distances when routes are chained
			
			-----------------------------------------------------------------------------------------------------------
			*/

			chainRoutes : function ( ) {
				var routesIterator = _TravelNotesData.travel.routes.iterator;
				var chainedDistance = 0;
				while ( ! routesIterator.done ) {
					if ( routesIterator.value.chain ) {
						routesIterator.value.chainedDistance = chainedDistance;
						chainedDistance += routesIterator.value.distance;
					}
					else {
						routesIterator.value.chainedDistance = 0;
					}
					var notesIterator = routesIterator.value.notes.iterator;
					while (! notesIterator.done ) {
						notesIterator.value.chainedDistance = routesIterator.value.chainedDistance;
					}
				}
			},
			
			/*
			--- startRouting method -----------------------------------------------------------------------------------

			This method start the router
			
			-----------------------------------------------------------------------------------------------------------
			*/

			startRouting : function ( ) {
				if ( ! _TravelNotesData.config.routing.auto ) {
					return;
				}
				require ( '../core/Router' ) ( ).startRouting ( _TravelNotesData.editedRoute );
			},
			
			/*
			--- endRouting method -------------------------------------------------------------------------------------

			This method is called by the router when a routing operation is successfully finished
			
			-----------------------------------------------------------------------------------------------------------
			*/

			endRouting : function ( ) {
				// the previous route is removed from the leaflet map
				_MapEditor.removeRoute ( _TravelNotesData.editedRoute, true, true );
				
				// the position of the notes linked to the route is recomputed
				var notesIterator = _TravelNotesData.editedRoute.notes.iterator;
				while ( ! notesIterator.done ) {
					var latLngDistance = this.getClosestLatLngDistance ( _TravelNotesData.editedRoute, notesIterator.value.latLng );
					notesIterator.value.latLng = latLngDistance.latLng;
					notesIterator.value.distance = latLngDistance.distance;
				}
				
				// and the notes sorted
				_TravelNotesData.editedRoute.notes.sort ( function ( a, b ) { return a.distance - b.distance; } );
				
				// the new route is added to the map
				_MapEditor.addRoute ( _TravelNotesData.editedRoute, true, true );
				if ( 0 !== _TravelNotesData.editedRoute.itinerary.itineraryPoints.length ) {
					_MapEditor.zoomToRoute ( _TravelNotesData.editedRoute.objId );
				}
				
				// and the itinerary and waypoints are displayed
				_ItineraryEditor.setItinerary ( );
				_RouteEditorUI.setWayPointsList ( );
				
				// the HTML page is adapted ( depending of the config.... )
				this.chainRoutes ( );
				require ( '../core/TravelEditor' ) ( ).updateRoadBook ( );
			},
			
			/*
			--- saveEdition method ------------------------------------------------------------------------------------

			This method save the current edited route
			
			-----------------------------------------------------------------------------------------------------------
			*/

			saveEdition : function ( ) {
				// the edited route is cloned
				var clonedRoute = require ( '../data/Route' ) ( );
				clonedRoute.object = _TravelNotesData.editedRoute.object;
				// and the initial route replaced with the clone
				_TravelNotesData.travel.routes.replace ( _TravelNotesData.routeEdition.routeInitialObjId, clonedRoute );
				_TravelNotesData.routeEdition.routeInitialObjId = clonedRoute.objId;
				this.clear ( );
			},
			
			/*
			--- cancelEdition method ----------------------------------------------------------------------------------

			This method cancel the current edited route
			
			-----------------------------------------------------------------------------------------------------------
			*/

			cancelEdition : function ( ) {
				this.clear ( );
			},
			
			/*
			--- clear method ------------------------------------------------------------------------------------------

			This method clean the editors and the HTML page after a save or cancel
			
			-----------------------------------------------------------------------------------------------------------
			*/

			clear : function ( ) {
				_MapEditor.removeRoute ( _TravelNotesData.editedRoute, true, true );
				_MapEditor.addRoute ( _DataSearchEngine.getRoute ( _TravelNotesData.routeEdition.routeInitialObjId ), true, false );

				_TravelNotesData.editedRoute = require ( '../data/Route' ) ( );
				_TravelNotesData.routeEdition.routeChanged = false;
				_TravelNotesData.routeEdition.routeInitialObjId = -1;
				require ( '../UI/TravelEditorUI' ) ( ).setRoutesList ( );
				_RouteEditorUI.setWayPointsList ( );
				_RouteEditorUI .reduce ( );
				_ItineraryEditor.setItinerary ( );
				// the HTML page is adapted ( depending of the config.... )
				this.chainRoutes ( );
				require ( '../core/TravelEditor' ) ( ).updateRoadBook ( );
			},
			
			/*
			--- editRoute method --------------------------------------------------------------------------------------

			This method start the edition of a route
			
			parameters:
			- routeObjId : the TravelNotes route objId to edit

			-----------------------------------------------------------------------------------------------------------
			*/

			editRoute : function ( routeObjId ) { 
				if ( _TravelNotesData.routeEdition.routeChanged ) {
					// not possible to edit - the current edited route is not saved or cancelled
					require ( '../core/ErrorEditor' ) ( ).showError ( _Translator.getText ( "RouteEditor - Not possible to edit a route without a save or cancel" ) );
					return;
				}
				if ( -1 !== _TravelNotesData.routeEdition.routeInitialObjId ) {
					// the current edited route is not changed. Cleaning the editors
					this.clear ( );
				}
				
				// We verify that the provider  for this route is available
				var initialRoute = _DataSearchEngine.getRoute ( routeObjId );
				var providerName = initialRoute.itinerary.provider;
				if ( providerName && ( '' !== providerName ) && ( ! _TravelNotesData.providers.get ( providerName.toLowerCase ( ) ) ) )
				{
					require ( '../core/ErrorEditor' ) ( ).showError ( _Translator.getText ( "RouteEditor - Not possible to edit a route created with this provider", {provider : providerName } ) );
					return;
				}
				// Provider and transit mode are changed in the itinerary editor
				_ItineraryEditor.provider = providerName;
				var transitMode = initialRoute.itinerary.transitMode;
				if ( transitMode && '' !== transitMode ) {
					_ItineraryEditor.transitMode = transitMode;
				}
				// The edited route is pushed in the editors
				_TravelNotesData.editedRoute = require ( '../data/Route' ) ( );
				// Route is cloned, so we can have a cancel button in the editor
				_TravelNotesData.editedRoute.object = initialRoute.object;
				_TravelNotesData.routeEdition.routeInitialObjId = initialRoute.objId;
				_TravelNotesData.editedRoute.hidden = false;
				initialRoute.hidden = false;
				_MapEditor.removeRoute ( initialRoute, true, false );
				_MapEditor.addRoute ( _TravelNotesData.editedRoute, true, true );
				this.chainRoutes ( );
				_RouteEditorUI .expand ( );
				_RouteEditorUI.setWayPointsList ( );
				_ItineraryEditor.setItinerary ( );
			},
			
			/*
			--- routeProperties method --------------------------------------------------------------------------------

			This method opens the RouteProperties dialog
			
			parameters:
			- routeObjId : 

			-----------------------------------------------------------------------------------------------------------
			*/

			routeProperties : function ( routeObjId ) {
				var route = _DataSearchEngine.getRoute ( routeObjId );
				require ( '../UI/RoutePropertiesDialog' ) ( route );
			},
			
			/*
			--- addWayPoint method ------------------------------------------------------------------------------------

			This method add a waypoint 
			
			parameters:
			- latLng : 

			-----------------------------------------------------------------------------------------------------------
			*/

			addWayPoint : function ( latLng, event, distance ) {
				_TravelNotesData.routeEdition.routeChanged = true;
				var newWayPoint = require ( '../data/Waypoint.js' ) ( );
				if ( latLng ) {
					newWayPoint.latLng = latLng;
					if ( _TravelNotesData.config.wayPoint.reverseGeocoding ) {
						require ( '../core/GeoCoder' ) ( ).getAddress ( latLng [ 0 ], latLng [ 1 ], this.renameWayPoint, this, newWayPoint.objId );
					}
				}
				_TravelNotesData.editedRoute.wayPoints.add ( newWayPoint );
				_MapEditor.addWayPoint ( _TravelNotesData.editedRoute.wayPoints.last, _TravelNotesData.editedRoute.wayPoints.length - 2 );
				if ( distance ) {
					var wayPointsIterator = _TravelNotesData.editedRoute.wayPoints.iterator;
					while ( ! wayPointsIterator.done ) {
						var latLngDistance = this.getClosestLatLngDistance ( 
							_TravelNotesData.editedRoute,
							wayPointsIterator.value.latLng 
						);
						if ( distance < latLngDistance.distance ) {
							_TravelNotesData.editedRoute.wayPoints.moveTo ( newWayPoint.objId, wayPointsIterator.value.objId, true );
							break;
						}
					}
				}
				else {
					_TravelNotesData.editedRoute.wayPoints.swap ( newWayPoint.objId, true );
				}
				_RouteEditorUI.setWayPointsList ( );
				this.startRouting ( );
			},
			
			/*
			--- addWayPoint method ------------------------------------------------------------------------------------

			This method add a waypoint at a given position on the edited route
			
			parameters:
			- latLng : 
			- event :

			-----------------------------------------------------------------------------------------------------------
			*/

			addWayPointOnRoute : function ( routeObjId, event ) {
				var latLngDistance = this.getClosestLatLngDistance ( 
					_DataSearchEngine.getRoute ( routeObjId ),
					[ event.latlng.lat, event.latlng.lng ] 
				);
				this.addWayPoint ( latLngDistance.latLng, null, latLngDistance.distance );
			},
			
			/*
			--- reverseWayPoints method -------------------------------------------------------------------------------

			This method reverse the waypoints order
			
			-----------------------------------------------------------------------------------------------------------
			*/

			reverseWayPoints : function ( ) {
				_TravelNotesData.routeEdition.routeChanged = true;
				var wayPointsIterator = _TravelNotesData.editedRoute.wayPoints.iterator;
				while ( ! wayPointsIterator.done ) {
					_MapEditor.removeObject ( wayPointsIterator.value.objId );
				}
				_TravelNotesData.editedRoute.wayPoints.reverse ( );
				wayPointsIterator = _TravelNotesData.editedRoute.wayPoints.iterator;
				while ( ! wayPointsIterator.done ) {
					_MapEditor.addWayPoint ( wayPointsIterator.value, wayPointsIterator .first ? 'A' : ( wayPointsIterator.last ? 'B' : wayPointsIterator.index ) );
				}
				_RouteEditorUI.setWayPointsList ( );
				this.startRouting ( );
			},
			
			/*
			--- removeAllWayPoints method -----------------------------------------------------------------------------

			This method remove all waypoints except the first and last ( see Collection to understand...)
			
			-----------------------------------------------------------------------------------------------------------
			*/

			removeAllWayPoints : function ( ) {
				_TravelNotesData.routeEdition.routeChanged = true;
				var wayPointsIterator = _TravelNotesData.editedRoute.wayPoints.iterator;
				while ( ! wayPointsIterator.done ) {
					_MapEditor.removeObject ( wayPointsIterator.value.objId );
				}
				_TravelNotesData.editedRoute.wayPoints.removeAll ( true );
				_RouteEditorUI.setWayPointsList ( );
				this.startRouting ( );
			},
			
			/*
			--- removeWayPoint method ---------------------------------------------------------------------------------

			This method remove a waypoint
			
			parameters:
			- wayPointObjId : the waypoint objId to remove

			-----------------------------------------------------------------------------------------------------------
			*/

			removeWayPoint : function ( wayPointObjId ) {
				_TravelNotesData.routeEdition.routeChanged = true;
				_MapEditor.removeObject ( wayPointObjId );
				_TravelNotesData.editedRoute.wayPoints.remove ( wayPointObjId );
				_RouteEditorUI.setWayPointsList ( );
				this.startRouting ( );
			},
			
			/*
			--- renameWayPoint method ---------------------------------------------------------------------------------

			This method rename a wayPoint
			
			parameters:
			- wayPointObjId : the waypoint objId to rename
			- wayPointName : the new name

			-----------------------------------------------------------------------------------------------------------
			*/

			renameWayPoint : function ( wayPointName, wayPointObjId ) {
				_TravelNotesData.routeEdition.routeChanged = true;
				_TravelNotesData.editedRoute.wayPoints.getAt ( wayPointObjId ).name = wayPointName;
				_RouteEditorUI.setWayPointsList ( );
			},
			
			/*
			--- swapWayPoints method ----------------------------------------------------------------------------------

			This method change the order of two waypoints
			
			parameters:
			- wayPointObjId : the waypoint objId to swap
			- swapUp : when true the waypoint is swapped with the previous one, otherwise with the next

			-----------------------------------------------------------------------------------------------------------
			*/

			swapWayPoints : function ( wayPointObjId, swapUp ) {
				_TravelNotesData.routeEdition.routeChanged = true;
				_TravelNotesData.editedRoute.wayPoints.swap ( wayPointObjId, swapUp );
				_RouteEditorUI.setWayPointsList (  );
				this.startRouting ( );
			},
			
			/*
			--- setStartPoint method ----------------------------------------------------------------------------------

			This method set the start waypoint
			
			parameters:
			- latLng : the coordinates of the start waypoint

			-----------------------------------------------------------------------------------------------------------
			*/

			setStartPoint : function ( latLng ) {
				_TravelNotesData.routeEdition.routeChanged = true;
				if ( 0 !== _TravelNotesData.editedRoute.wayPoints.first.lat ) {
					_MapEditor.removeObject ( _TravelNotesData.editedRoute.wayPoints.first.objId );
				}
				_TravelNotesData.editedRoute.wayPoints.first.latLng = latLng;
				if ( _TravelNotesData.config.wayPoint.reverseGeocoding ) {
					require ( '../core/GeoCoder' ) ( ).getAddress ( latLng [ 0 ], latLng [ 1 ], this.renameWayPoint, this, _TravelNotesData.editedRoute.wayPoints.first.objId );
				}
				_MapEditor.addWayPoint ( _TravelNotesData.editedRoute.wayPoints.first, 'A' );
				_RouteEditorUI.setWayPointsList ( );
				this.startRouting ( );
			},
			
			/*
			--- setEndPoint method ------------------------------------------------------------------------------------

			This method set the end waypoint
			
			parameters:
			- latLng : the coordinates of the end waypoint


			-----------------------------------------------------------------------------------------------------------
			*/

			setEndPoint : function ( latLng ) {
				_TravelNotesData.routeEdition.routeChanged = true;
				if ( 0 !== _TravelNotesData.editedRoute.wayPoints.last.lat ) {
					_MapEditor.removeObject ( _TravelNotesData.editedRoute.wayPoints.last.objId );
				}
				_TravelNotesData.editedRoute.wayPoints.last.latLng = latLng;
				if ( _TravelNotesData.config.wayPoint.reverseGeocoding ) {
					require ( '../core/GeoCoder' ) ( ).getAddress ( latLng [ 0 ], latLng [ 1 ], this.renameWayPoint, this, _TravelNotesData.editedRoute.wayPoints.last.objId );
				}
				_MapEditor.addWayPoint ( _TravelNotesData.editedRoute.wayPoints.last, 'B' );
				_RouteEditorUI.setWayPointsList ( );
				this.startRouting ( );
			},
			
			/*
			--- wayPointDragEnd method --------------------------------------------------------------------------------

			This method is called when the dragend event is fired on a waypoint
			
			parameters:
			- wayPointObjId : the TravelNotes waypoint objId

			-----------------------------------------------------------------------------------------------------------
			*/

			wayPointDragEnd : function ( wayPointObjId ) {
				_TravelNotesData.routeEdition.routeChanged = true;
				if ( _TravelNotesData.config.wayPoint.reverseGeocoding ) {
					var latLng = _TravelNotesData.editedRoute.wayPoints.getAt ( wayPointObjId ).latLng;
					require ( '../core/GeoCoder' ) ( ).getAddress ( latLng [ 0 ], latLng [ 1 ], this.renameWayPoint, this, wayPointObjId );
				}
				_RouteEditorUI.setWayPointsList ( );
				this.startRouting ( );
			},
			
			/*
			--- wayPointDropped method --------------------------------------------------------------------------------

			This method is called when the drop event is fired on a waypoint
			
			-----------------------------------------------------------------------------------------------------------
			*/

			wayPointDropped : function ( draggedWayPointObjId, targetWayPointObjId, draggedBefore ) {
				_TravelNotesData.routeEdition.routeChanged = true;
				if ( targetWayPointObjId === _TravelNotesData.editedRoute.wayPoints.first.objId && draggedBefore ) {
					return;
				}
				if ( targetWayPointObjId === _TravelNotesData.editedRoute.wayPoints.last.objId && ( ! draggedBefore ) )	{
					return;
				}
				_TravelNotesData.editedRoute.wayPoints.moveTo ( draggedWayPointObjId, targetWayPointObjId, draggedBefore );
				_RouteEditorUI.setWayPointsList ( );
				var wayPointsIterator = _TravelNotesData.editedRoute.wayPoints.iterator;
				while ( ! wayPointsIterator.done ) {
						_MapEditor.removeObject ( wayPointsIterator.value.objId );
						_MapEditor.addWayPoint ( wayPointsIterator.value, wayPointsIterator.first ? 'A' : ( wayPointsIterator.last ? 'B' :  wayPointsIterator.index ) );
				}
				this.startRouting ( );
			},
			
			/*
			--- hideRoute method --------------------------------------------------------------------------------------

			This method hide a route on the map
			
			parameters:
			- routeObjId : the route objId that was clicked

			-----------------------------------------------------------------------------------------------------------
			*/

			hideRoute : function ( routeObjId ) {
				var route = _DataSearchEngine.getRoute ( routeObjId );
				if ( route ) {
					_MapEditor.removeRoute ( route, true, true );
					route.hidden = true;
				}
			},
			
			/*
			--- showRoutes method -------------------------------------------------------------------------------------

			This method show all the hidden routes
			
			-----------------------------------------------------------------------------------------------------------
			*/

			showRoutes : function ( ) {
				var routesIterator = _TravelNotesData.travel.routes.iterator;
				while ( ! routesIterator.done ) {
					if ( routesIterator.value.hidden ) {
						_MapEditor.addRoute ( routesIterator.value, true, true, false );
					}
				}
			},

			/*
			--- getMapContextMenu method ------------------------------------------------------------------------------

			This method gives the route part of the map context menu
			
			parameters:
			- latLng : the coordinates where the map was clicked

			-----------------------------------------------------------------------------------------------------------
			*/

			getMapContextMenu :function ( latLng ) {
				var contextMenu = [];
				contextMenu.push ( 
					{ 
						context : this, 
						name : _Translator.getText ( "RouteEditor - Select this point as start point" ), 
						action : ( -1 !== _TravelNotesData.routeEdition.routeInitialObjId ) && ( 0 === _TravelNotesData.editedRoute.wayPoints.first.lat ) ? this.setStartPoint : null,
						param : latLng
					} 
				);
				contextMenu.push ( 
					{
						context : this, 
						name : _Translator.getText ( "RouteEditor - Select this point as way point" ), 
						action : ( -1 !== _TravelNotesData.routeEdition.routeInitialObjId ) ? this.addWayPoint : null,
						param : latLng
					}
				);
				contextMenu.push (
					{ 
						context : this, 
						name : _Translator.getText ( "RouteEditor - Select this point as end point" ), 
						action : ( -1 !== _TravelNotesData.routeEdition.routeInitialObjId ) && ( 0 === _TravelNotesData.editedRoute.wayPoints.last.lat ) ? this.setEndPoint : null,
						param : latLng
					}
				);
				return contextMenu;
			},

			/*
			--- getWayPointContextMenu method --------------------------------------------------------------------------

			This method gives the wayPoint context menu
			
			parameters:
			- wayPointObjId : the wayPoint objId that was clicked

			-----------------------------------------------------------------------------------------------------------
			*/

			getWayPointContextMenu : function ( wayPointObjId ) {
				var contextMenu = [];
				contextMenu.push ( 
					{ 
						context : this, 
						name : _Translator.getText ( "RouteEditor - Delete this waypoint" ), 
						action : ( ( _TravelNotesData.editedRoute.wayPoints.first.objId !== wayPointObjId ) && ( _TravelNotesData.editedRoute.wayPoints.last.objId !== wayPointObjId ) ) ? this.removeWayPoint : null,
						param: wayPointObjId
					} 
				);
				return contextMenu;
			},

			/*
			--- getRouteContextMenu method ----------------------------------------------------------------------------

			This method gives the route context menu
			
			parameters:
			- routeObjId : the route objId that was clicked

			-----------------------------------------------------------------------------------------------------------
			*/

			getRouteContextMenu : function ( routeObjId ) {
				var contextMenu = [];
				var travelEditor = require ( '../core/TravelEditor' ) ( );
				contextMenu.push ( 
					{ 
						context : this, 
						name : _Translator.getText ( "RouteEditor - Edit this route" ), 
						action : ( ( _TravelNotesData.routeEdition.routeInitialObjId !== routeObjId ) && ( ! _TravelNotesData.routeEdition.routeChanged ) ) ? this.editRoute : null,
						param: routeObjId
					} 
				);
				contextMenu.push ( 
					{
						context : travelEditor, 
						name : _Translator.getText ( "RouteEditor - Delete this route" ), 
						action : ( ( _TravelNotesData.routeEdition.routeInitialObjId !== routeObjId ) && ( ! _TravelNotesData.routeEdition.routeChanged ) ) ? travelEditor.removeRoute : null,
						param: routeObjId
					}
				);
				contextMenu.push ( 
					{
						context : travelEditor, 
						name : _Translator.getText ( "RouteEditor - Hide this route" ), 
						action : ( _TravelNotesData.editedRoute.objId !== routeObjId ) ? this.hideRoute : null,
						param: routeObjId
					}
				);
				contextMenu.push ( 
					{
						context : this, 
						name : _Translator.getText ( "RouteEditor - Add a waypoint on the route" ), 
						action : ( -1 !== _TravelNotesData.routeEdition.routeInitialObjId ) ? this.addWayPointOnRoute : null,
						param: routeObjId
					}
				);
				contextMenu.push ( 
					{
						context : _NoteEditor, 
						name : _Translator.getText ( "RouteEditor - Add a note on the route" ), 
						action : _NoteEditor.newRouteNote,
						param: routeObjId
					}
				);
				contextMenu.push ( 
					{
						context : this, 
						name : _Translator.getText ( "RouteEditor - Properties" ), 
						action : this.routeProperties,
						param: routeObjId
					}
				);
				contextMenu.push ( 
					{
						context : _MapEditor, 
						name : _Translator.getText ( "RouteEditor - Zoom to route" ), 
						action : _MapEditor.zoomToRoute,
						param: routeObjId
					}
				);
				contextMenu.push (
					{ 
						context : this, 
						name : _Translator.getText ( "RouteEditor - Save modifications on this route" ), 
						action : ( _TravelNotesData.editedRoute.objId === routeObjId ) ? this.saveEdition : null,
					}
				);
				contextMenu.push (
					{ 
						context : this, 
						name : _Translator.getText ( "RouteEditor - Cancel modifications on this route" ), 
						action : ( _TravelNotesData.editedRoute.objId === routeObjId ) ? this.cancelEdition : null
					}
				);
				return contextMenu;
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = RouteEditor;
	}

}());

/*
--- End of RouteEditor.js file ----------------------------------------------------------------------------------------
*/
},{"../Data/DataSearchEngine":2,"../L.TravelNotes":7,"../UI/RouteEditorUI":17,"../UI/RoutePropertiesDialog":18,"../UI/Translator":20,"../UI/TravelEditorUI":21,"../core/ErrorEditor":24,"../core/GeoCoder":26,"../core/ItineraryEditor":27,"../core/MapEditor":28,"../core/NoteEditor":29,"../core/Router":31,"../core/TravelEditor":32,"../data/ItineraryPoint":36,"../data/Route":41,"../data/Waypoint.js":46,"../util/Utilities":47}],31:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- Router.js file -------------------------------------------------------------------------------------------------
This file contains:
	- the Router object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.1.0:
		- Issue #35 : Add something to draw polylines on the map.
	- v1.3.0:
		- Reviewed way of working to use Promise
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170928
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/


( function ( ){
	
	'use strict';

	var _RequestStarted = false;
	var _RouteProvider = null;

	var _TravelNotesData = require ( '../L.TravelNotes' );
	var _Translator = require ( '../UI/Translator' ) ( );
	
	var Router = function ( ) {
		
		/*
		--- _HaveValidWayPoints function ------------------------------------------------------------------------------

		This function verify that the waypoints have coordinates

		---------------------------------------------------------------------------------------------------------------
		*/

		var _HaveValidWayPoints = function ( ) {
			return _TravelNotesData.editedRoute.wayPoints.forEach ( 
				function ( wayPoint, result ) {
					if ( null === result ) { 
						result = true;
					}
					result &= ( ( 0 !== wayPoint.lat ) &&  ( 0 !== wayPoint.lng ) );
					return result;
				}
			);
		};
		
		/*
		--- End of _HaveValidWayPoints function ---
		*/

		/*
		--- _EndError function -----------------------------------------------------------------------------------

		This function ...

		---------------------------------------------------------------------------------------------------------------
		*/

		var _EndError = function ( message ) {

			_RequestStarted = false;

			require ( '../core/ErrorEditor' ) ( ).showError ( message );
		};
	
		/*
		--- End of _EndError function ---
		*/

		/*
		--- _EndOk function -----------------------------------------------------------------------------------

		This function ...

		---------------------------------------------------------------------------------------------------------------
		*/

		var _EndOk = function ( message ) {

			_RequestStarted = false;
			
			// Computing the distance between itineraryPoints if not know ( depending of the provider...)
			var itineraryPointsIterator = _TravelNotesData.editedRoute.itinerary.itineraryPoints.iterator;
			var routeDistance = 0;
			var dummy = itineraryPointsIterator.done;
			var previousPoint = itineraryPointsIterator.value;
			while ( ! itineraryPointsIterator.done ) {
				if ( 0 === previousPoint.distance ) {
					previousPoint.distance = L.latLng ( previousPoint.latLng ).distanceTo ( L.latLng ( itineraryPointsIterator.value.latLng ));
				}
				routeDistance += previousPoint.distance;
				previousPoint = itineraryPointsIterator.value;
			}

			// Computing the complete route distance and duration based on the values given by the providers in the maneuvers
			//var routeDistance = _TravelNotesData.editedRoute.distance;
			_TravelNotesData.editedRoute.distance = 0;
			_TravelNotesData.editedRoute.duration = 0;
			var maneuverIterator = _TravelNotesData.editedRoute.itinerary.maneuvers.iterator;
			while ( ! maneuverIterator.done ) {
				_TravelNotesData.editedRoute.distance += maneuverIterator.value.distance;
				_TravelNotesData.editedRoute.duration += maneuverIterator.value.duration;
			}
			
			if ( 0 != _TravelNotesData.editedRoute.distance ) {
				// Computing a correction factor for distance betwwen itinerayPoints
				var correctionFactor = _TravelNotesData.editedRoute.distance / routeDistance;
				itineraryPointsIterator = _TravelNotesData.editedRoute.itinerary.itineraryPoints.iterator;
				while ( ! itineraryPointsIterator.done ) {
					itineraryPointsIterator.value.distance *= correctionFactor;
				}
			}
			else {
				_TravelNotesData.editedRoute.distance = routeDistance;
			}

			// Placing the waypoints on the itinerary
			var wayPointsIterator = _TravelNotesData.editedRoute.wayPoints.iterator;
			while ( ! wayPointsIterator.done )
			{
				if ( wayPointsIterator.first ) {
					wayPointsIterator.value.latLng = _TravelNotesData.editedRoute.itinerary.itineraryPoints.first.latLng;
				}
				else if ( wayPointsIterator.last ) {
					wayPointsIterator.value.latLng = _TravelNotesData.editedRoute.itinerary.itineraryPoints.last.latLng;
				}
				else{
					wayPointsIterator.value.latLng = require ( './RouteEditor' ) ( ).getClosestLatLngDistance ( _TravelNotesData.editedRoute, wayPointsIterator.value.latLng ).latLng;
				}
			}	
			
			// and calling the route editor for displaying the results
			require ( './RouteEditor' ) ( ).endRouting ( );
		};
		
		/*
		--- End of _EndOk function ---
		*/
			
		/*
		--- _StartRouting function ------------------------------------------------------------------------------------

			This function start the routing :-)

		---------------------------------------------------------------------------------------------------------------
		*/

		var _StartRouting = function ( ) {

			// We verify that another request is not loaded
			if ( _RequestStarted ) {
				return false;
			}
			
			// Control of the wayPoints
			if ( ! _HaveValidWayPoints ( ) ) {
				return false;
			}
			
			_RequestStarted = true;

			// Choosing the correct route provider
			_RouteProvider = _TravelNotesData.providers.get ( _TravelNotesData.routing.provider );

			// provider name and transit mode are added to the road
			_TravelNotesData.editedRoute.itinerary.provider = _RouteProvider.name;
			_TravelNotesData.editedRoute.itinerary.transitMode = _TravelNotesData.routing.transitMode;

			_RouteProvider.getPromiseRoute ( _TravelNotesData.editedRoute, null ).then (  _EndOk, _EndError  );

			return true;
		};
	
		/*
		--- End of _StartRouting function ---
		*/

		/*
		--- Router object ---------------------------------------------------------------------------------------------

		---------------------------------------------------------------------------------------------------------------
		*/

		return {

			/*
			--- startRouting method -----------------------------------------------------------------------------------

			This method start the routing :-)
			
			-----------------------------------------------------------------------------------------------------------
			*/

			startRouting : function ( ) {
				return _StartRouting ( );
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Router;
	}

}());

/*
--- End of Router.js file ---------------------------------------------------------------------------------------------
*/
},{"../L.TravelNotes":7,"../UI/Translator":20,"../core/ErrorEditor":24,"./RouteEditor":30}],32:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- TravelEditor.js file ----------------------------------------------------------------------------------------------
This file contains:
	- the TravelEditor object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.1.0:
		- Issue #26 : added confirmation message before leaving the page when data modified.
		- Issue #27 : push directly the route in the editor when starting a new travel
		- Issue #31 : Add a command to import from others maps
		- Issue #34 : Add a command to show all routes
		- Issue #37 : Add the file name and mouse coordinates somewhere
	- v1.3.0:
		- moved JSON.parse, due to use of Promise
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
		- moving file functions from TravelEditor to the new FileLoader
Doc reviewed 20170928
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

( function ( ){
	
	'use strict';
	
	var _Translator = require ( '../UI/Translator' ) ( );
	var _TravelNotesData = require ( '../L.TravelNotes' );
	var _DataSearchEngine  = require ( '../Data/DataSearchEngine' ) ( );
	var _MapEditor = require ( '../core/MapEditor' ) ( );
	var _TravelEditorUI = require ( '../UI/TravelEditorUI' ) ( );

	var _haveBeforeUnloadWarning = false;
	var _haveUnloadCleanStorage = false;
	
	var TravelEditor = function ( ) {
		
		/*
		--- _UpdateRoadBook function --------------------------------------------------------------------------------

		This function changes the HTML page content
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _UpdateRoadBook = function ( isNewTravel ) {

			if ( ! _haveUnloadCleanStorage ) {
				window.addEventListener( 
					'unload', 
					function ( event ) {
						localStorage.removeItem ( require ( '../L.TravelNotes' ).UUID + "-TravelNotesHTML" );
					}
				);
				_haveUnloadCleanStorage = true;
			}

			if ( ! isNewTravel && ! _haveBeforeUnloadWarning && _TravelNotesData.config.haveBeforeUnloadWarning ) {
				window.addEventListener( 
					'beforeunload', 
					function ( event ) {
						event.returnValue = 'x';
						return 'x'; 
					}
				);
				_haveBeforeUnloadWarning = true;
			}
			
			if ( require ( '../util/Utilities' ) ( ).storageAvailable ( 'localStorage' ) ) {
				var htmlViewsFactory = require ( '../UI/HTMLViewsFactory' ) ( );
				htmlViewsFactory.classNamePrefix = 'TravelNotes-Roadbook-';
				localStorage.setItem ( _TravelNotesData.UUID + "-TravelNotesHTML", htmlViewsFactory.travelHTML.outerHTML );
			}
		};

		/*
		--- TravelEditor object ---------------------------------------------------------------------------------------

		---------------------------------------------------------------------------------------------------------------
		*/

		return {

			/*
			--- updateRoadBook method -------------------------------------------------------------------------------

			This method changes the HTML page content
			
			-----------------------------------------------------------------------------------------------------------
			*/

			updateRoadBook : function ( isNewTravel ) {
				_UpdateRoadBook ( isNewTravel );
			},

			/*
			--- addRoute method ---------------------------------------------------------------------------------------

			This method add a new route
			
			-----------------------------------------------------------------------------------------------------------
			*/

			addRoute : function ( ) {
				_TravelNotesData.travel.routes.add ( require ( '../Data/Route' ) ( ) );
				_TravelEditorUI.setRoutesList ( );
				require ( '../core/RouteEditor' ) ( ).chainRoutes ( );
				this.updateRoadBook ( );
			},

			/*
			--- editRoute method --------------------------------------------------------------------------------------

			This method edit a route
			
			parameters :
			- routeObjId : the TravelNotes route objId to edit
			
			-----------------------------------------------------------------------------------------------------------
			*/

			editRoute : function ( routeObjId ) {
				require ( '../core/RouteEditor' ) ( ).editRoute ( routeObjId );
			},

			/*
			--- removeRoute method ------------------------------------------------------------------------------------

			This method remove a route

			parameters :
			- routeObjId : the TravelNotes route objId to remove
			
			-----------------------------------------------------------------------------------------------------------
			*/

			removeRoute : function ( routeObjId ) {
				if ( routeObjId === _TravelNotesData.routeEdition.routeInitialObjId && _TravelNotesData.routeEdition.routeChanged ) {
					// cannot remove the route currently edited
					require ( './ErrorEditor' ) ( ).showError ( _Translator.getText ( 'TravelEditor - Cannot remove an edited route' ) );
					return;
				}

				require ( './MapEditor' ) ( ).removeRoute ( _DataSearchEngine.getRoute ( routeObjId ), true, true );
				_TravelNotesData.travel.routes.remove ( routeObjId );
				_TravelEditorUI.setRoutesList ( );
				if ( routeObjId === _TravelNotesData.routeEdition.routeInitialObjId  ) {
					require ( './RouteEditor' ) ( ).clear ( );
				}
				require ( '../core/RouteEditor' ) ( ).chainRoutes ( );
				this.updateRoadBook ( );
			},

			/*
			--- renameRoute method ------------------------------------------------------------------------------------

			This method rename a route
			parameters :
			- routeObjId : the TravelNotes route objId to remove
			- routeName: the new name
			
			-----------------------------------------------------------------------------------------------------------
			*/

			renameRoute : function ( routeObjId, routeName ) {
				_DataSearchEngine.getRoute ( routeObjId ).name = routeName;
				_TravelEditorUI.setRoutesList ( );
				if ( routeObjId === _TravelNotesData.routeEdition.routeInitialObjId ) {
					_TravelNotesData.editedRoute.name = routeName;
				}
				this.updateRoadBook ( );
			},

			/*
			--- swapRoute method --------------------------------------------------------------------------------------

			This method changes the position of a route
			
			-----------------------------------------------------------------------------------------------------------
			*/

			swapRoute : function ( routeObjId, swapUp ) {
				_TravelNotesData.travel.routes.swap ( routeObjId, swapUp );
				_TravelEditorUI.setRoutesList ( );
				require ( '../core/RouteEditor' ) ( ).chainRoutes ( );
				this.updateRoadBook ( );
			},

			/*
			--- routeDropped method --------------------------------------------------------------------------------------

			This method changes the position of a route after a drag and drop
			
			-----------------------------------------------------------------------------------------------------------
			*/
			
			routeDropped : function ( draggedRouteObjId, targetRouteObjId, draggedBefore ) {
				_TravelNotesData.travel.routes.moveTo ( draggedRouteObjId, targetRouteObjId, draggedBefore );
				_TravelEditorUI.setRoutesList ( );
				require ( '../core/RouteEditor' ) ( ).chainRoutes ( );
				this.updateRoadBook ( );
			},
			
			/*
			--- saveTravel method -------------------------------------------------------------------------------------

			This method save the travel to a local file
			
			-----------------------------------------------------------------------------------------------------------
			*/

			saveTravel : function ( ) {
				if ( _TravelNotesData.routeEdition.routeChanged ) {
					require ( './ErrorEditor' ) ( ).showError ( _Translator.getText ( "TravelEditor - Not possible to save a travel without a save or cancel" ) );
				}
				else {
					var routesIterator = _TravelNotesData.travel.routes.iterator;
					while ( ! routesIterator.done ) {
						routesIterator.value.hidden = false;
					}
						
					// compressing the itineraryPoints
					var compressedTravel = _TravelNotesData.travel.object;
					compressedTravel.routes.forEach (
						function ( route ) {
							var objType = {};
							if ( 0 !== route.itinerary.itineraryPoints.length ) {
								objType = route.itinerary.itineraryPoints [ 0 ].objType;
							}
							var compressedItineraryPoints = { latLngs : [] , distances : [], objIds : [],objType : objType  };
							route.itinerary.itineraryPoints.forEach ( 
								function ( itineraryPoint ) {
									compressedItineraryPoints.latLngs.push ( [ itineraryPoint.lat, itineraryPoint.lng ] );
									compressedItineraryPoints.distances.push ( itineraryPoint.distance );
									compressedItineraryPoints.objIds.push ( itineraryPoint.objId );
								}
							);
							compressedItineraryPoints.latLngs = require ( '@mapbox/polyline' ).encode ( compressedItineraryPoints.latLngs, 6 );
							route.itinerary.itineraryPoints = compressedItineraryPoints;
						}
					);
					// save file
					require ( '../util/Utilities' ) ( ).saveFile ( compressedTravel.name + '.trv', JSON.stringify ( compressedTravel ) );
				}
			},

			/*
			--- confirmClose method ------------------------------------------------------------------------------------------

			This method ask a confirmation to the user
			
			-----------------------------------------------------------------------------------------------------------
			*/
			confirmClose : function ( ) {
				if ( _haveBeforeUnloadWarning ) {
					return window.confirm ( _Translator.getText ( "TravelEditor - This page ask to close; data are perhaps not saved." ) );
				}
				return true;
			},



			/*
			--- clear method ------------------------------------------------------------------------------------------

			This method remove completely the current travel
			
			-----------------------------------------------------------------------------------------------------------
			*/

			clear : function ( ) {
				if ( ! this.confirmClose ( ) )
				{
					return;
				}
				_TravelNotesData.map.fire ( 'travelnotesfileloaded', { readOnly : false, name : '' } );
				_MapEditor.removeAllObjects ( );
				_TravelNotesData.editedRoute = require ( '../Data/Route' ) ( );
				_TravelNotesData.routeEdition.routeChanged = false;
				_TravelNotesData.routeEdition.routeInitialObjId = -1;
				_TravelNotesData.travel = require ( '../Data/Travel' ) ( );
				_TravelNotesData.travel.routes.add ( require ( '../Data/Route' ) ( ) );
				require ( '../UI/TravelEditorUI' ) ( ). setRoutesList ( );
				require ( '../UI/RouteEditorUI' ) ( ).setWayPointsList (  );
				require ( '../core/ItineraryEditor' ) ( ).setItinerary ( );
				this.updateRoadBook ( true );
				if ( _TravelNotesData.config.travelEditor.startupRouteEdition ) {
					this.editRoute ( _TravelNotesData.travel.routes.first.objId );
				}
			},

			/*
			--- getMapContextMenu method ------------------------------------------------------------------------------

			This method gives the travel part of the map context menu
			
			parameters:
			- latLng : the coordinates where the map was clicked

			-----------------------------------------------------------------------------------------------------------
			*/

			getMapContextMenu :function ( latLng ) {
				var mapEditor = require ( '../core/MapEditor' ) ( );
				var routeEditor = require ( '../core/RouteEditor' ) ( );
				var contextMenu = [];
				contextMenu.push ( 
					{ 
						context : routeEditor, 
						name : _Translator.getText ( "TravelEditor - Show all routes" ), 
						action : routeEditor.showRoutes
					} 
				);
				contextMenu.push ( 
					{ 
						context : mapEditor, 
						name : _Translator.getText ( "TravelEditor - Zoom to travel" ), 
						action : mapEditor.zoomToTravel
					} 
				);
				contextMenu.push ( 
					{ 
						context : null,
						name : _Translator.getText ( "TravelEditor - About Travel & Notes" ), 
						action : require ( '../UI/AboutDialog' )
					} 
				);
				
				return contextMenu;
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = TravelEditor;
	}

}());

/*
--- End of TravelEditor.js file ---------------------------------------------------------------------------------------
*/
},{"../Data/DataSearchEngine":2,"../Data/Route":4,"../Data/Travel":5,"../L.TravelNotes":7,"../UI/AboutDialog":8,"../UI/HTMLViewsFactory":14,"../UI/RouteEditorUI":17,"../UI/Translator":20,"../UI/TravelEditorUI":21,"../core/ItineraryEditor":27,"../core/MapEditor":28,"../core/RouteEditor":30,"../util/Utilities":47,"./ErrorEditor":24,"./MapEditor":28,"./RouteEditor":30,"@mapbox/polyline":1}],33:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- Collection.js file ------------------------------------------------------------------------------------------------
This file contains:
	- the Collection object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
Doc reviewed 20170925
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';

	/*
	--- Collection object ---------------------------------------------------------------------------------------------

	Patterns : Closure

	-------------------------------------------------------------------------------------------------------------------
	*/

	var Collection = function ( objName ) {

		// Private variables and functions

		var _Array = [];

		var _ObjName = objName;

		var _Add = function ( object ) {
			if ( ( ! object.objType ) || ( ! object.objType.name ) || ( object.objType.name !== _ObjName ) ) {
				throw 'invalid object name for add function';
			}
			_Array.push ( object );

			return;
		};

		var _First = function ( ) {
			return _Array [ 0 ];
		};

		var _ForEach = function ( funct ) {
			var result = null;
			var iterator = _Iterator ( );
			while ( ! iterator.done ) {
					result = funct ( iterator.value, result );
			}
			return result;
		};

		var _GetAt = function ( objId ) {
			var index = _IndexOfObjId ( objId );
			if ( -1 === index ) {
				return null;
			}
			return _Array [ index ];
		};

		var _GetObject = function ( ) {
			var array = [ ];
			var iterator = _Iterator ( );
			while ( ! iterator.done ) {
				array.push ( iterator.value.object );
			}

			return array;
		};
		
		var _MoveTo = function ( objId, targetObjId, moveBefore ) {
			var oldPosition = _IndexOfObjId ( objId );
			var newPosition = _IndexOfObjId ( targetObjId );
			if ( ! moveBefore ) {
				newPosition ++;
			}
			_Array.splice ( newPosition, 0, _Array [ oldPosition ] );
			if ( newPosition < oldPosition )
			{
				oldPosition ++ ;
			}
			_Array.splice ( oldPosition, 1 );
		};

		var _IndexOfObjId = function ( objId ) {
			function haveObjId ( element ) {
				return element.objId === objId;
			}
			return _Array.findIndex ( haveObjId );
		};

		var _Iterator = function ( ) {
			var nextIndex = -1;
			return {
			   get value ( ) { return nextIndex < _Array.length ?  _Array [ nextIndex ] : null; },
			   get done ( ) { return ++ nextIndex  >= _Array.length; },
			   get first ( ) { return 0 === nextIndex; },
			   get last ( ) { return nextIndex  >= _Array.length - 1; },
			   get index ( ) { return nextIndex; }
			};
		};

		var _Last = function ( ) {
			return _Array [ _Array.length - 1 ];
		};

		var _Remove = function ( objId ) {
			var index = _IndexOfObjId ( objId );
			if ( -1 === index ) {
				throw 'invalid objId for remove function';
			}
			_Array.splice ( _IndexOfObjId ( objId ), 1 );
		};

		var _RemoveAll = function ( ExceptFirstLast ) {
			if ( ExceptFirstLast ) {
				_Array.splice ( 1, _Array.length - 2 );
			}
			else {
				_Array.length = 0;
			}
		};

		var _Replace = function ( oldObjId, object ) {
			var index = _IndexOfObjId ( oldObjId );
			if ( -1 === index ) {
				throw 'invalid objId for replace function';
			}
			_Array [ index ] = object;
		};

		var _Reverse = function ( ) {
			_Array.reverse ( );
		};

		var _SetObject = function ( Objects ) {
			_Array.length = 0;
			var newObject;
			for (var objectCounter = 0; objectCounter < Objects.length; objectCounter ++ ) {
				switch ( _ObjName ) {
					case 'Route' :
					newObject = require ( '../data/Route' ) ( );
					break;
					case 'Note' :
					newObject = require ( '../data/Note' ) ( );
					break;
					case 'WayPoint' :
					newObject = require ( '../data/WayPoint' ) ( );
					break;
					case 'Maneuver' :
					newObject = require ( '../data/Maneuver' ) ( );
					break;
					case 'ItineraryPoint' :
					newObject = require ( '../data/ItineraryPoint' ) ( );
					break;
					default:
					throw ( 'invalid ObjName ( ' + _ObjName +' ) in Collection._SetObject' );
				}
				newObject.object = Objects [ objectCounter ];
				_Add ( newObject );
			}
		};

		var _Sort = function ( compareFunction ) {
			_Array.sort ( compareFunction );
		};

		var _Swap = function ( objId, swapUp ) {
			var index = _IndexOfObjId ( objId );
			if ( ( -1 === index ) || ( ( 0 === index ) && swapUp ) || ( ( _Array.length - 1 === index ) && ( ! swapUp ) ) ) {
				throw 'invalid objId for swap function';
			}
			var tmp = _Array [ index ];
			_Array [ index ] = _Array [ index + ( swapUp ? -1 : 1  ) ];
			_Array [ index + ( swapUp ? -1 : 1  ) ] = tmp;
		};

		// Collection object

		return {

			/*
			--- add function ------------------------------------------------------------------------------------------

			This function add an object to the collection
			throw when the object type is invalid

			-----------------------------------------------------------------------------------------------------------
			*/

			add : function ( object ) {
				_Add ( object );
			},

			/*
			--- forEach function --------------------------------------------------------------------------------------

			This function executes a function on each object of the collection and returns the final result

			-----------------------------------------------------------------------------------------------------------
			*/

			forEach : function ( funct ) {
				return _ForEach ( funct );
			},

			/*
			--- getAt function ----------------------------------------------------------------------------------------

			This function returns the object with the given objId or null when the object is not found

			-----------------------------------------------------------------------------------------------------------
			*/

			getAt : function ( objId ) {
				return _GetAt ( objId );
			},

			/*
			--- moveTo function ----------------------------------------------------------------------------------------

			This function move the object identified by objId to the position ocuped by the object
			identified by targetObjId 

			-----------------------------------------------------------------------------------------------------------
			*/
			moveTo : function ( objId, targetObjId, moveBefore ) {
				_MoveTo ( objId, targetObjId, moveBefore );
			},
			/*
			--- remove function ---------------------------------------------------------------------------------------

			This function remove the object with the given objId
			throw when the object is not found

			-----------------------------------------------------------------------------------------------------------
			*/

			remove : function ( objId ) {
				_Remove ( objId );
			},

			/*
			--- removeAll function ------------------------------------------------------------------------------------

			This function remove all objects in the collection
			when the exceptFirstLast parameter is true, first and last objects in the collection are not removed

			-----------------------------------------------------------------------------------------------------------
			*/

			removeAll : function ( exceptFirstLast ) {
				_RemoveAll ( exceptFirstLast );
			},

			/*
			--- replace function --------------------------------------------------------------------------------------

			This function replace the object identified by oldObjId with a new object
			throw when the object type is invalid

			-----------------------------------------------------------------------------------------------------------
			*/

			replace : function ( oldObjId, object ) {
				_Replace ( oldObjId, object );
			},

			/*
			--- reverse function --------------------------------------------------------------------------------------

			This function reverse the objects in the collection

			-----------------------------------------------------------------------------------------------------------
			*/

			reverse : function ( ) {
				_Reverse ( );
			},

			/*
			--- sort function -----------------------------------------------------------------------------------------

			This function sort the collection, using the compare function

			-----------------------------------------------------------------------------------------------------------
			*/

			sort : function ( compareFunction ) {
				_Sort ( compareFunction );
			},

			/*
			--- swap function -----------------------------------------------------------------------------------------

			This function move up ( when sapUp is true ) or move down an object in the collection
			throw when the swap is not possible

			-----------------------------------------------------------------------------------------------------------
			*/

			swap : function ( objId, swapUp ) {
				_Swap ( objId, swapUp );
			},

			/*
			--- first getter ------------------------------------------------------------------------------------------

			The first object in the collection

			-----------------------------------------------------------------------------------------------------------
			*/

			get first ( ) {
				return _First ( );
			},

			/*
			--- iterator getter ---------------------------------------------------------------------------------------

			Returns an iterator on the collection.
			The iterator have the following properties:
			value : the object pointed by the iterator
			done : true when the iterator is at the end of the collection. Each time this property is called, the iterator move to the next object
			first : true when the iterator is on the first object
			last : true when the iterator is on the last object
			index : the current position of the iterator in the collection

			-----------------------------------------------------------------------------------------------------------
			*/
			get iterator ( ) {
				return _Iterator ( );
			},

			/*
			--- last getter -------------------------------------------------------------------------------------------

			The last object in the collection

			-----------------------------------------------------------------------------------------------------------
			*/

			get last ( ) {
				return _Last ( );
			},

			/*
			--- length getter -----------------------------------------------------------------------------------------

			The length of the collection

			-----------------------------------------------------------------------------------------------------------
			*/

			get length ( ) {
				return _Array.length;
			},

			/*
			--- object getter -----------------------------------------------------------------------------------------

			Transform the collection into an array that can be used with JSON

			-----------------------------------------------------------------------------------------------------------
			*/

			get object ( ) {
				return _GetObject ( );
			},

			/*
			--- object setter -----------------------------------------------------------------------------------------

			Transform an array to a collection
			throw when an object in the array have an invalid type

			-----------------------------------------------------------------------------------------------------------
			*/

			set object ( Object ) {
				_SetObject ( Object );
			}

		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Collection;
	}

} ) ( );

/*
--- End of Collection.js file -----------------------------------------------------------------------------------------
*/
},{"../data/ItineraryPoint":36,"../data/Maneuver":37,"../data/Note":38,"../data/Route":41,"../data/WayPoint":45}],34:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- Config.js file ----------------------------------------------------------------------------------------------------
This file contains:
	- the Config object
	- the module.exports implementation
Changes:
	- v1.4.0:
		- created from DataManager
		- added searchPointMarker, previousSearchLimit, nextSearchLimit to config
Doc reviewed ...
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/
( function ( ) {
	
	'use strict';

	var Config = function ( ) {

		/*
		--- _copyObjectTo method --------------------------------------------------------------------------------------

		This method:
			- search recursively all dest properties
			- foreach found property, search the same property in source
			- copy the property value from source to dest if found
			- search recursively all sources properties
			- foreach found property search the same property in dest
			- copy the property value from source to dest
			
			So: 
				- if a property is missing in the user config, the property is selected from the default config
				- if a property is in the user config but missing in the default config, the property is also added (and reminder
				  that the user can have more dashChoices than the default config )
				- if a property is changed in the user config, the property is adapted
		
		---------------------------------------------------------------------------------------------------------------
		*/

		var _copyObjectTo = function ( source, dest ) {
			if ( ( 'object' !== typeof source ) || ( 'object' !== typeof dest ) ) {
				return;
			}
			try {
				var property;
				for ( property in dest ) {
					if ( 'object' === typeof dest [ property ] ) {
						_copyObjectTo ( source [ property ], dest [ property ] );
					}
					else {
						dest [ property ] = source [ property ] || dest [ property ];
					}
				}

				for ( property in source ) {
					if ( 'object' === typeof source [ property ] ) {
						if ( Object.prototype.toString.call ( source [ property ] ) == '[object Array]' ) {
							dest [ property ] = dest [ property ] || [];
						}
						else {
							dest [ property ] = dest [ property ] || {};
						}
						_copyObjectTo ( source [ property ], dest [ property ] );
					}
					else {
						dest [ property ] = source [ property ];
					}
				}
			}
			catch ( e ) {
				console.log ( e );
				console.log ( 'Not possible to overload Config' );
			}
			
			return;
		};
		
		var _Freeze = function ( object ) {
			var property;
			for ( property in object ) {
				if ( 'object' === typeof object [ property ] ) {
					object [ property ] = _Freeze (  object [ property ] );
				}
			}
			
			return Object.freeze (object );
		};
		
		var _Overload = function ( source ) {
			_copyObjectTo ( source, _Config );
			_Config = _Freeze ( _Config );
		};

		var _Config = {
			contextMenu : {
				timeout : 1500
			},
			errorMessages : {
				timeout : 20000
			},
			routing : {
				auto : true
			},
			language : 'fr',
			itineraryPointMarker : {
				color : 'red',
				weight : 2,
				radius : 7,
				fill : false
			},
			searchPointMarker : {
				color : 'green',
				weight : 4,
				radius : 20,
				fill : false
			},
			previousSearchLimit : {
				color : "green",
				fill : false,
				weight : 1
			},
			nextSearchLimit : {
				color : "red",
				fill : false,
				weight : 1
			},
			wayPoint : {
				reverseGeocoding : false
			},
			route : {
				color : '#ff0000',
				width : 3,
				dashArray : 0,
				dashChoices : [
					{ 
						text : "——————",
						iDashArray : null
					}, 
					{
						text : "— — — — —",
						iDashArray : [ 4, 2 ] 
					}, 
					{
						text : "—‧—‧—‧—‧—",
						iDashArray : [ 4, 2, 0, 2 ] 
					}, 
					{
						text : "················",
						iDashArray : [ 0, 2 ] 
					}
				]
			},
			note : {
				reverseGeocoding : false,
				grip : { 
					size : 10,
					opacity: 0 
				},
				polyline : {
					color : 'gray',
					weight : 1
				},
				style : 'TravelNotes-NotesStyle'
			},
			itineraryPointZoom: 17,
			routeEditor : {
				displayEditionInHTMLPage : true
			},
			travelEditor : {
				clearAfterSave : true,
				startMinimized : true,
				timeout : 1000,
				startupRouteEdition:true
			},
			haveBeforeUnloadWarning : true
		};		
	
		/* 
		--- Config object ---------------------------------------------------------------------------------------------
		
		---------------------------------------------------------------------------------------------------------------
		*/

		return {
			get contextMenu ( ) { return _Config.contextMenu; },
			get errorMessages ( ) { return _Config.errorMessages; },
			get routing ( ) { return _Config.routing; },
			get language ( ) { return _Config.language; },
			get itineraryPointMarker ( ) { return _Config.itineraryPointMarker; },
			get searchPointMarker ( ) { return _Config.searchPointMarker; },
			get previousSearchLimit ( ) { return _Config.previousSearchLimit; },
			get nextSearchLimit ( ) { return _Config.nextSearchLimit; },
			get wayPoint ( ) { return _Config.wayPoint; },
			get route ( ) { return _Config.route; },
			get note ( ) { return _Config.note; },
			get itineraryPointZoom ( ) { return _Config.itineraryPointZoom; },
			get routeEditor ( ) { return _Config.routeEditor; },
			get travelEditor ( ) { return _Config.travelEditor; },
			get haveBeforeUnloadWarning ( ) { return _Config.haveBeforeUnloadWarning; },
			
			overload : function ( newConfig ) { _Overload ( newConfig ) ;}
		};
	};
	
	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Config ( );
	}
	
} ) ( );

/*
--- End of Config.js file ---------------------------------------------------------------------------------------------
*/

},{}],35:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"../data/Collection":33,"../data/ObjId":39,"../data/ObjType":40,"./Version":44,"dup":3}],36:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- ItineraryPoint.js file --------------------------------------------------------------------------------------------
This file contains:
	- the ItineraryPoint object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170925
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';

	var _ObjType = require ( '../data/ObjType' ) ( 'ItineraryPoint', require ( './Version' ) );

	/*
	--- ItineraryPoint object -----------------------------------------------------------------------------------------

	Patterns : Closure

	-------------------------------------------------------------------------------------------------------------------
	*/

	var ItineraryPoint = function ( ) {

		// Private variables

		var _Lat = 0;

		var _Lng = 0;

		var _Distance = 0;

		var _ObjId = require ( '../data/ObjId' ) ( );

		return {

			// getters and setters...

			get lat ( ) { return _Lat;},
			set lat ( Lat ) { _Lat = Lat; },

			get lng ( ) { return _Lng;},
			set lng ( Lng ) { _Lng = Lng; },

			get latLng ( ) { return [ _Lat, _Lng ];},
			set latLng ( LatLng ) { _Lat = LatLng [ 0 ]; _Lng = LatLng [ 1 ]; },

			get distance ( ) { return _Distance;},
			set distance ( Distance ) { _Distance = Distance; },

			get objId ( ) { return _ObjId; },

			get objType ( ) { return _ObjType; },

			get object ( ) {
				return {
					lat : parseFloat ( _Lat.toFixed ( 6 ) ),
					lng : parseFloat ( _Lng.toFixed ( 6 ) ),
					distance : parseFloat ( _Distance.toFixed ( 2 ) ),
					objId : _ObjId,
					objType : _ObjType.object
				};
			},
			set object ( Object ) {
				Object = _ObjType.validate ( Object );
				_Lat = Object.lat || 0;
				_Lng = Object.lng || 0;
				_Distance = Object.distance || 0;
				_ObjId = require ( '../data/ObjId' ) ( );
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = ItineraryPoint;
	}

} ) ( );

/*
--- End of ItineraryPoint.js file -------------------------------------------------------------------------------------
*/
},{"../data/ObjId":39,"../data/ObjType":40,"./Version":44}],37:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- Maneuver.js file --------------------------------------------------------------------------------------------------
This file contains:
	- the Maneuver object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170925
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';

	var _ObjType = require ( '../data/ObjType' ) ( 'Maneuver', require ( './Version' ) );

	var Maneuver = function ( ) {

		// Private variables

		var _ObjId = require ( '../data/ObjId' ) ( );

		var _IconName = '';

		var _Instruction = '';

		var _ItineraryPointObjId = -1;

		var _Distance = 0;

		var _Duration = 0;

		return {

			// getters and setters...

			get iconName ( ) { return _IconName;},
			set iconName ( IconName ) { _IconName = IconName; },

			get instruction ( ) { return _Instruction;},
			set instruction ( Instruction ) { _Instruction = Instruction; },

			get itineraryPointObjId ( ) { return _ItineraryPointObjId;},
			set itineraryPointObjId ( ItineraryPointObjId ) { _ItineraryPointObjId = ItineraryPointObjId; },

			get distance ( ) { return _Distance;},
			set distance ( Distance ) { _Distance = Distance; },

			get duration ( ) { return _Duration;},
			set duration ( Duration ) { _Duration = Duration; },

			get objId ( ) { return _ObjId; },

			get objType ( ) { return _ObjType; },

			get object ( ) {
				return {
					iconName : _IconName,
					instruction : _Instruction,
					distance : parseFloat ( _Distance.toFixed ( 2 ) ),
					duration : _Duration,
					itineraryPointObjId : _ItineraryPointObjId,
					objId : _ObjId,
					objType : _ObjType.object
				};
			},
			set object ( Object ) {
				Object = _ObjType.validate ( Object );
				_IconName = Object.iconName || '';
				_Instruction = Object.instruction || '';
				_Distance = Object.distance || 0;
				_Duration = Object.duration || 0;
				_ItineraryPointObjId = Object.itineraryPointObjId || -1;
				_ObjId = require ( '../data/ObjId' ) ( );
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Maneuver;
	}

} ) ( );

/*
--- End of Maneuver.js file -------------------------------------------------------------------------------------------
*/
},{"../data/ObjId":39,"../data/ObjType":40,"./Version":44}],38:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- Note.js file ------------------------------------------------------------------------------------------------------
This file contains:
	- the Note object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170926
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';

	var _ObjType = require ( '../data/ObjType' ) ( 'Note', require ( './Version' ) );

	var Note = function ( ) {

		// Private variables

		var _ObjId = require ( '../data/ObjId' ) ( );

		var _IconHeight = 40;

		var _IconWidth = 40;

		var _IconContent = '';

		var _PopupContent = '';

		var _TooltipContent = '';

		var _Phone = '';

		var _Url = '';

		var _Address = '';

		var _IconLat = 0;

		var _IconLng = 0;

		var _Lat = 0;

		var _Lng = 0;

		var _Distance = -1;

		var _ChainedDistance = 0;

		return {

			// getters and setters...

			get isRouteNote ( ) { return _Distance !== -1; },

			get iconHeight ( ) { return _IconHeight;},
			set iconHeight ( IconHeight ) { _IconHeight = IconHeight; },

			get iconWidth ( ) { return _IconWidth;},
			set iconWidth ( IconWidth ) { _IconWidth = IconWidth; },

			get iconContent ( ) { return _IconContent;},
			set iconContent ( IconContent ) { _IconContent = IconContent; },

			get popupContent ( ) { return _PopupContent;},
			set popupContent ( PopupContent ) { _PopupContent = PopupContent; },

			get tooltipContent ( ) { return _TooltipContent;},
			set tooltipContent ( TooltipContent ) { _TooltipContent = TooltipContent; },

			get phone ( ) { return _Phone;},
			set phone ( Phone ) { _Phone = Phone; },

			get url ( ) { return _Url;},
			set url ( Url ) { _Url = Url; },

			get address ( ) { return _Address;},
			set address ( Address ) { _Address = Address; },

			get iconLat ( ) { return _IconLat;},
			set iconLat ( IconLat ) { _IconLat = IconLat; },

			get iconLng ( ) { return _IconLng;},
			set iconLng ( IconLng ) { _IconLng = IconLng; },

			get iconLatLng ( ) { return [ _IconLat, _IconLng ];},
			set iconLatLng ( IconLatLng ) { _IconLat = IconLatLng [ 0 ]; _IconLng = IconLatLng [ 1 ]; },

			get lat ( ) { return _Lat;},
			set lat ( Lat ) { _Lat = Lat; },

			get lng ( ) { return _Lng;},
			set lng ( Lng ) { _Lng = Lng; },

			get latLng ( ) { return [ _Lat, _Lng ];},
			set latLng ( LatLng ) { _Lat = LatLng [ 0 ]; _Lng = LatLng [ 1 ]; },

			get distance ( ) { return _Distance; },
			set distance ( Distance ) { _Distance = Distance; },

			get chainedDistance ( ) { return _ChainedDistance; },
			set chainedDistance ( ChainedDistance ) { _ChainedDistance = ChainedDistance; },

			get objId ( ) { return _ObjId; },

			get objType ( ) { return _ObjType; },

			get object ( ) {
				return {
					iconHeight : _IconHeight,
                    iconWidth : _IconWidth,
                    iconContent : _IconContent,
                    popupContent : _PopupContent,
                    tooltipContent : _TooltipContent,
					phone : _Phone,
					url : _Url,
					address : _Address,
					iconLat : parseFloat ( _IconLat.toFixed ( 6 ) ),
					iconLng : parseFloat ( _IconLng.toFixed ( 6 ) ),
					lat : parseFloat ( _Lat.toFixed ( 6 ) ),
					lng : parseFloat ( _Lng.toFixed ( 6 ) ),
					distance : parseFloat ( _Distance.toFixed ( 2 ) ),
					chainedDistance : parseFloat ( _ChainedDistance.toFixed ( 2 ) ),
					objId : _ObjId,
					objType : _ObjType.object
				};
			},
			set object ( Object ) {
				Object = _ObjType.validate ( Object );
				_IconHeight = Object.iconHeight || 40;
				_IconWidth = Object.iconWidth || 40;
				_IconContent = Object.iconContent || '';
				_PopupContent = Object.popupContent || '';
				_TooltipContent = Object.tooltipContent || '';
				_Phone = Object.phone || '';
				_Url = Object.url || '';
				_Address = Object.address || '';
				_IconLat = Object.iconLat || 0;
				_IconLng = Object.iconLng || 0;
				_Lat = Object.lat || 0;
				_Lng = Object.lng || 0;
				_Distance = Object.distance || -1;
				_ChainedDistance = Object.chainedDistance;
				_ObjId = require ( '../data/ObjId' ) ( );
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Note;
	}

} ) ( );

/*
--- End of Note.js file -----------------------------------------------------------------------------------------------
*/
},{"../data/ObjId":39,"../data/ObjType":40,"./Version":44}],39:[function(require,module,exports){
(function (global){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/


/*
--- ObjId.js file -----------------------------------------------------------------------------------------------------

Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Initialization changed
Doc reviewed 20170926
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';


	var ObjId = function ( ) {
		if ( ! global.TravelNotesObjId ) {
			global.TravelNotesObjId = 0;
		}
		
		return ++ global.TravelNotesObjId;
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = ObjId;

	}

} ) ( );

/*
--- End of ObjId.js file ----------------------------------------------------------------------------------------------
*/
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],40:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- ObjType.js file ---------------------------------------------------------------------------------------------------
This file contains:
	- the ObjType object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
Doc reviewed 20170926
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';

	var ObjType = function ( name, version ) {

		// Private variables

		var _Name = name;

		var _Version = version;

		return {

			// getters and setters...

			get name ( ) { return _Name; },

			get version ( ) { return _Version; },

			get object ( ) {
				return {
					name : _Name,
					version : _Version
				};
			},

			validate : function ( object ) {
				if ( ! object.objType ) {
					throw 'No objType for ' + _Name;
				}
				if ( ! object.objType.name ) {
					throw 'No name for ' + _Name;
				}
				if ( _Name !== object.objType.name ) {
					throw 'Invalid name for ' + _Name;
				}
				if ( ! object.objType.version ) {
					throw 'No version for ' + _Name;
				}
				if ( _Version !== object.objType.version ) {
					if ( '1.0.0' === object.objType.version ) {
						//start upgrade from 1.0.0 to 1.1.0
						if ( 'Route' === object.objType.name ) {
							object.dashArray = 0;
							object.hidden = false;
						}
						object.objType.version = '1.1.0';
						//end upgrade from 1.0.0 to 1.1.0
					}
					if ( '1.1.0' === object.objType.version ) {
						object.objType.version = '1.2.0';
						//end upgrade from 1.1.0 to 1.2.0
					}
					if ( '1.2.0' === object.objType.version ) {
						object.objType.version = '1.3.0';
						//end upgrade from 1.2.0 to 1.3.0
					}
					if ( _Version !== object.objType.version ) {
						throw 'invalid version for ' + _Name;
					}
				}
				if ( ! object.objId ) {
					throw 'No objId for ' + _Name;
				}
				return object;
			}
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = ObjType;
	}

} ) ( );

/*
--- End of ObjType.js file ----------------------------------------------------------------------------------------------
*/
},{}],41:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"../L.TravelNotes":7,"../data/Collection":33,"../data/Itinerary":35,"../data/ObjId":39,"../data/ObjType":40,"../data/Waypoint":46,"./Itinerary":35,"./Version":44,"dup":4}],42:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"../data/Collection":33,"../data/ObjId":39,"../data/ObjType":40,"./Version":44,"dup":5}],43:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- TravelNotesData.js file -----------------------------------------------------------------------------------------------
This file contains:
	- the TravelNotesData object
	- the module.exports implementation
Changes:
	- v1.4.0:
		- created from DataManager
		- added searchData
Doc reviewed ...
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';

	var TravelNotesData = function ( ) {

		var _TravelNotesData = {
			config : require ( '../data/Config' ),
			map : null,
			providers : new Map ( ),
			mapObjects : new Map ( ),
			travel : require ( '../data/Travel' ) ( ),
			editedRoute : null,
			routeEdition : Object.seal ( { routeChanged : false, routeInitialObjId : -1 } ),
			routing : Object.seal ( { provider : '', transitMode : ''} ),
			searchData : [],
			UUID : require ( '../util/Utilities' ) ( ).UUID
		};
		
		return {

		/*
			--- getters and setters  ----------------------------------------------------------------------------------
			
			-----------------------------------------------------------------------------------------------------------
			*/

			get config ( ) { return _TravelNotesData.config; },
			set config ( Config ) { _TravelNotesData.config.overload ( Config ); },

			get map ( ) { return _TravelNotesData.map; },
			set map ( Map ) { _TravelNotesData.map = Map; },

			get providers ( ) { return _TravelNotesData.providers; },

			get mapObjects ( ) { return _TravelNotesData.mapObjects; },

			get travel ( ) { return _TravelNotesData.travel; },
			set travel ( Travel ) { _TravelNotesData.travel = Travel; },

			get editedRoute ( ) { return _TravelNotesData.editedRoute; },
			set editedRoute ( editedRoute ) { _TravelNotesData.editedRoute = editedRoute; },

			get routeEdition ( ) { return _TravelNotesData.routeEdition; },
			
			get routing ( ) { return _TravelNotesData.routing; },
			
			get searchData ( ) { return _TravelNotesData.searchData; },
			set searchData ( SearchData ) { _TravelNotesData.searchData = SearchData; },

			get UUID ( ) { return _TravelNotesData.UUID; },
		};
	};

	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = TravelNotesData;
	}

} ) ( );

/*
--- End of TravelNotesData.js file ------------------------------------------------------------------------------------
*/
},{"../data/Config":34,"../data/Travel":42,"../util/Utilities":47}],44:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],45:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*
--- WayPoint.js file --------------------------------------------------------------------------------------------------
This file contains:
	- the WayPoint object
	- the module.exports implementation
Changes:
	- v1.0.0:
		- created
	- v1.4.0:
		- Replacing DataManager with TravelNotesData, Config, Version and DataSearchEngine
Doc reviewed 20170926
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/

(function() {

	'use strict';

	var _ObjType = require ( '../data/ObjType' ) ( 'WayPoint', require ( './Version' ) );

	var WayPoint = function ( ) {

		// Private variables

		var _Name = '';

		var _Lat = 0;

		var _Lng = 0;

		var _ObjId = require ( '../data/ObjId' ) ( );

		return {

			// getters and setters...

			get name ( ) { return _Name; },
			set name ( Name ) { _Name = Name;},

			get UIName ( ) {
				if ( '' !== _Name ) {
					return _Name;
				}
				if ( ( 0 !== _Lat ) && ( 0 !== _Lng ) ) {
					return _Lat.toFixed ( 6 ) + ( 0 < _Lat ? ' N - ' : ' S - ' ) + _Lng.toFixed ( 6 )  + ( 0 < _Lng ? ' E' : ' W' );
				}
				return '';
			},

			get lat ( ) { return _Lat;},
			set lat ( Lat ) { _Lat = Lat; },

			get lng ( ) { return _Lng;},
			set lng ( Lng ) { _Lng = Lng; },

			get latLng ( ) { return [ _Lat, _Lng ];},
			set latLng ( LatLng ) { _Lat = LatLng [ 0 ]; _Lng = LatLng [ 1 ]; },

			get objId ( ) { return _ObjId; },

			get objType ( ) { return _ObjType; },

			get object ( ) {
				return {
					name : _Name,
					lat : parseFloat ( _Lat.toFixed ( 6 ) ),
					lng : parseFloat ( _Lng.toFixed ( 6 ) ),
					objId : _ObjId,
					objType : _ObjType.object
				};
			},
			set object ( Object ) {
				Object = _ObjType.validate ( Object );
				_Name = Object.name || '';
				_Lat = Object.lat || 0;
				_Lng = Object.lng || 0;
				_ObjId = require ( '../data/ObjId' ) ( );
			}
		};
	};


	/*
	--- Exports -------------------------------------------------------------------------------------------------------
	*/

	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = WayPoint;
	}

} ) ( );

/*
--- End of WayPoint.js file -------------------------------------------------------------------------------------------
*/
},{"../data/ObjId":39,"../data/ObjType":40,"./Version":44}],46:[function(require,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"../data/ObjId":39,"../data/ObjType":40,"./Version":44,"dup":45}],47:[function(require,module,exports){
/*
Copyright - 2017 - Christian Guyette - Contact: http//www.ouaie.be/
This  program is free software;
you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/


(function() {
	
	'use strict';
	
	var _Translator = require ( '../UI/Translator' ) ( );
	
	var getUtilities = function ( ) {

		/*
		--- getUUID function --------------------------------------------------------------------------------------------------
		
		This function returns an unique identifier like UUID
		Adapted from stackoverflow.com :-)

		------------------------------------------------------------------------------------------------------------------------
		*/

		var getUUID = function ( ) {
			function Random4 ( ) {
				return Math.floor ( ( 1 + Math.random ( ) ) * 0x10000 ).toString ( 16 ).substring ( 1 );
			}
			return Random4 ( ) + Random4 ( ) + '-' + Random4 ( ) + '-' + Random4 ( ) + '-' +Random4 ( ) + '-' + Random4 ( ) + Random4 ( ) + Random4 ( ) ;
		};

		return {
			
			/*
			--- UUID getter --------------------------------------------------------------------------------------------------------
			*/

			get UUID ( ) { return getUUID ( ); },
						
			/* 
			--- storageAvailable function ------------------------------------------------------------------------------------------
			
			This function test if the storage API is available ( the API can be deactived by user....)
			Adapted from MDN :-)

			------------------------------------------------------------------------------------------------------------------------
			*/
			
			storageAvailable: function ( type ) {
				try {
					var storage = window [ type ];
					var	x = '__storage_test__';
					storage.setItem ( x, x );
					storage.removeItem ( x );
					return true;
				}
				catch ( e ) {
					return false;
				}				
			},
			/* --- End of storageAvailable function --- */		

			/* 
			--- fileAPIAvailable function ------------------------------------------------------------------------------------------
			
			This function test if the File API is available 

			------------------------------------------------------------------------------------------------------------------------
			*/

			fileAPIAvailable : function ( ) {
				try {
					// FF...
					var testFileData = new File ( [ 'testdata' ], { type: 'text/plain' } );
					return true;
				}
				catch ( Error ) {
					if (window.navigator.msSaveOrOpenBlob ) {
					//edge IE 11...
						return true;
					}
					else {
						return false;
					}
				}
			},
			/* 
			--- saveFile function --------------------------------------------------------------------------------------------------
			
			This function data to a local file

			------------------------------------------------------------------------------------------------------------------------
			*/

			saveFile : function ( filename, text, type ) {
				if ( ! type ) {
					type = 'text/plain';
				}
				if ( window.navigator.msSaveOrOpenBlob ) {
					//https://msdn.microsoft.com/en-us/library/hh779016(v=vs.85).aspx
					//edge IE 11...
					try {
						window.navigator.msSaveOrOpenBlob ( new Blob ( [ text ] ), filename ); 
					}
					catch ( Error ) {
					}
				}
				else {
					// FF...
					// http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
					try {
						var mapFile = window.URL.createObjectURL ( new File ( [ text ], { type: type } ) );
						var element = document.createElement ( 'a' );
						element.setAttribute( 'href', mapFile );
						element.setAttribute( 'download', filename );
						element.style.display = 'none';
						document.body.appendChild ( element );
						element.click ( );
						document.body.removeChild ( element );
						window.URL.revokeObjectURL ( mapFile );
					}
					catch ( Error ) {
					}				
				}
			},
			
			formatTime : function ( time ) {
				time = Math.floor ( time );
				if ( 0 === time ) {
					return '';
				}
				var days = Math.floor ( time / 86400 );
				var hours = Math.floor ( time % 86400 / 3600 );
				var minutes = Math.floor ( time % 3600 / 60 );
				var seconds = Math.floor ( time % 60 );
				if ( 0 < days ) {
					return days + '&nbsp;' + _Translator.getText ( 'Utilities - Day' ) + '&nbsp;' + hours + '&nbsp;' + _Translator.getText ( 'Utilities - Hour' );
				}
				else if ( 0 < hours ) {
					return hours + '&nbsp;' + _Translator.getText ( 'Utilities - Hour' ) +'&nbsp;' + minutes + '&nbsp;' + _Translator.getText ( 'Utilities - Minute' );
				}
				else if ( 0 < minutes ) {
					return minutes + '&nbsp;' + _Translator.getText ( 'Utilities - Minute' );
				}
				else {
					return seconds + '&nbsp;' + _Translator.getText ( 'Utilities - Second' );
				}
				return '';
			},
			
			formatDistance : function ( distance ) {
				distance = Math.floor ( distance );
				if ( 0 === distance ) {
					return '';
				} 
				else if ( 1000 > distance ) {
					return distance.toFixed ( 0 ) + '&nbsp;m';
				}
				else {
					return Math.floor ( distance / 1000 ) +'.' + Math.floor ( ( distance % 1000 ) / 100 ) + '&nbsp;km';
				}
			},
			
			formatLat : function ( lat ) {
				return ( lat > 0 ? lat.toFixed ( 6 ) + '&nbsp;N' : ( -lat ).toFixed ( 6 ) + '&nbsp;S' );
			},
			
			formatLng : function ( lng ) {
				return ( lng > 0 ? lng.toFixed ( 6 ) + '&nbsp;E' : ( -lng ).toFixed ( 6 ) + '&nbsp;W' );
			},
			
			formatLatLng : function ( latLng ) {
				return this.formatLat ( latLng [ 0 ] ) + '&nbsp;-&nbsp;' + this.formatLng ( latLng [ 1 ] );
			}
		};
	};
	
	/* 
	--- Exports ------------------------------------------------------------------------------------------------------------
	*/
	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = getUtilities;
	}

} ) ( );

},{"../UI/Translator":20}]},{},[7]);
