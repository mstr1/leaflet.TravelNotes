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
Doc reviewed 20170928
Tests ...

-----------------------------------------------------------------------------------------------------------------------
*/


( function ( ){
	
	'use strict';

	var _RequestStarted = false;
	var _RouteProvider = null;

	var _DataManager = require ( '../Data/DataManager' ) ( );
	var _Translator = require( '../UI/Translator' ) ( );
	
	var Router = function ( ) {
		
		/*
		--- _HaveValidWayPoints function ------------------------------------------------------------------------------

		This function verify that the waypoints have coordinates

		---------------------------------------------------------------------------------------------------------------
		*/

		var _HaveValidWayPoints = function ( ) {
			return _DataManager.editedRoute.wayPoints.forEach ( 
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
		--- _StartRequest function ------------------------------------------------------------------------------------

		This function launch the http request

		---------------------------------------------------------------------------------------------------------------
		*/

		var _StartRequest = function ( ) {

			/*
			--- _EndRequest function -----------------------------------------------------------------------------------

			This function ...

			---------------------------------------------------------------------------------------------------------------
			*/

			var _EndRequest = function ( responses ) {

				_RequestStarted = false;
				//( 0 <= tasks.length - 2 ) ? [ tasks.length - 2 ] : [ 0 ]
				console.log ( responses );
				
				if ( responses [ 0 ] && responses [ 0 ].status && 0 != responses [ 0 ].status  && responses [ 0 ].statusText ) {
					require ( '../core/ErrorEditor' ) ( ).showError ( _Translator.getText ( 'Router - An error occurs when sending the request', responses [ 0 ] ) );
					return;
				}
				// the response is passed to the routeProvider object for parsing. 
				if ( ! _RouteProvider.parseResponse ( responses [ 0 ], _DataManager.editedRoute, _DataManager.config.language ) ) {
					require ( '../core/ErrorEditor' ) ( ).showError ( _Translator.getText ( 'Router - An error occurs when parsing the response' ) );
					return;
				}
				
				// provider name and transit mode are added to the road
				_DataManager.editedRoute.itinerary.provider = _RouteProvider.name;
				_DataManager.editedRoute.itinerary.transitMode = _DataManager.routing.transitMode;

				// Computing the distance between itineraryPoints if not know ( depending of the provider...)
				var itineraryPointsIterator = _DataManager.editedRoute.itinerary.itineraryPoints.iterator;
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
				
				// Computing the complete route distance ad duration based on the values given by the providers in the maneuvers
				_DataManager.editedRoute.distance = 0;
				_DataManager.editedRoute.duration = 0;
				var maneuverIterator = _DataManager.editedRoute.itinerary.maneuvers.iterator;
				while ( ! maneuverIterator.done ) {
					_DataManager.editedRoute.distance += maneuverIterator.value.distance;
					_DataManager.editedRoute.duration += maneuverIterator.value.duration;
				}

				// Computing a correction factor for distance betwwen itinerayPoints
				var correctionFactor = _DataManager.editedRoute.distance / routeDistance;
				itineraryPointsIterator = _DataManager.editedRoute.itinerary.itineraryPoints.iterator;
				while ( ! itineraryPointsIterator.done ) {
					itineraryPointsIterator.value.distance *= correctionFactor;
				}

				// Placing the waypoints on the itinerary
				var wayPointsIterator = _DataManager.editedRoute.wayPoints.iterator;
				while ( ! wayPointsIterator.done )
				{
					if ( wayPointsIterator.first ) {
						wayPointsIterator.value.latLng = _DataManager.editedRoute.itinerary.itineraryPoints.first.latLng;
					}
					else if ( wayPointsIterator.last ) {
						wayPointsIterator.value.latLng = _DataManager.editedRoute.itinerary.itineraryPoints.last.latLng;
					}
					else{
						wayPointsIterator.value.latLng = require ( './RouteEditor' ) ( ).getClosestLatLngDistance ( _DataManager.editedRoute, wayPointsIterator.value.latLng ).latLng;
					}
				}		

				// and calling the route editor for displaying the results
				require ( './RouteEditor' ) ( ).endRouting ( );
			};
			
			/*
			--- End of _ParseResponse function ---
			*/
				
			_RequestStarted = true;

			// Choosing the correct route provider
			_RouteProvider = _DataManager.providers.get ( _DataManager.routing.provider );

			// Searching the provider key
			var providerKey = '';
			if ( require ( '../util/Utilities' ) ( ).storageAvailable ( 'sessionStorage' ) ) {
				providerKey = atob ( sessionStorage.getItem ( _RouteProvider.name.toLowerCase ( ) ) );
			}
			var tasks = _RouteProvider.getTasks ( _DataManager.editedRoute.wayPoints, _DataManager.routing.transitMode, providerKey, _DataManager.config.language, null );

			tasks.push ( 
				{	
					task: 'run',
					func : _EndRequest,
					context : null,
					useResponses : ( 0 <= tasks.length - 2 ) ? [ tasks.length - 2 ] : [ 0 ]
				}	
			);
			
			require ( './TaskLoader' ) ( ).start ( tasks );
		};
		
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
			
			
			// Controle of the wayPoints
			if ( ! _HaveValidWayPoints ( ) ) {
				return false;
			}
			
			_StartRequest ( );

			return true;
		};
	
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