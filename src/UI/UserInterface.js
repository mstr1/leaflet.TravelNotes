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
	
	var _MainDiv = null;

	// User interface
	
	var getControlUI = function ( ) {

		var _CreateUI = function ( ){ 

			var htmlElementsFactory = require ( './HTMLElementsFactory' ) ( ) ;
			
			_MainDiv = htmlElementsFactory.create ( 'div', { id : 'TravelControl-MainDiv' } );
			
			_MainDiv.appendChild ( require ( './RoutesListEditorUI' ) ( ).UI ); 

			_MainDiv.appendChild ( require ( './RouteEditorUI' ) ( ).UI ); 
			// Itinerary
			//var itineraryDiv = htmlElementsFactory.create ( 'div', { id : 'TravelControl-ItineraryDiv', className : 'TravelControl-Div'}, _MainDiv );

			//htmlElementsFactory.create ( 'span', { innerHTML : 'Itinéraire&nbsp;:', id : 'TravelControl-ItineraryHeaderText',className : 'TravelControl-HeaderText' }, itineraryDiv );
			
			// Errors
			_MainDiv.appendChild ( require ( './ErrorEditorUI' ) ( ).UI ); 
		};
		if ( ! _MainDiv ) {
			_CreateUI ( );
		}
		
		return {
			get UI ( ) { return _MainDiv; }
		};
	};

	
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = getControlUI;
	}

}());