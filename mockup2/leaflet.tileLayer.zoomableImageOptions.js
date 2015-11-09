/**
 * Created by boris on 11/6/15.
 */

//////////////////////////////////////////////
// Taken from Nathan's prototype with minimum modification for now.
//////////////////////////////////////////////
var columns = 4;
var rows = 3;
var boxIsLocated;
var circleIsLocated;
var rasterLayer;

//Specify the tiles where each shape is located
var shapeLocations = {
	b: ['0100', '0200', '0101', '0201'],
	c: ['0201', '0301', '0202', '0302']
};

//Onload of <body> add the map to the DOM
function init() {
	var mapMinZoom = 0;
	var mapMaxZoom = 2;
	var map = L.map('map', {
		maxZoom: mapMaxZoom,
		minZoom: mapMinZoom/*,
		crs: L.CRS.Simple*/ // Not found out yet why it is not working with Simple CRS. It does not matter if you do not have to add anything else onto the map.
	});

	var mapSize = map.getSize();

	var mapBounds = L.latLngBounds(
		map.unproject([0, 0], mapMaxZoom),
		map.unproject([mapSize.x - 1, mapSize.y - 1], mapMaxZoom));

	console.log(mapBounds.toBBoxString());
	console.log(mapBounds.pad(1).toBBoxString());

    //map.setMaxBounds(mapBounds.pad(1));
	map.fitBounds(mapBounds);
	updateSelection();

	var url = 'http://79.170.44.117/nateprototype.com/Prototype/{z}/{x}{y}B{b}C{c}.jpg';

	rasterLayer = new L.TileLayer.ZoomableImageOptions(url, {
		minZoom: mapMinZoom,
		maxZoom: mapMaxZoom,
		bounds: mapBounds,
		noWrap: true
	});

	rasterLayer.addTo(map);
}

document.addEventListener("DOMContentLoaded", init);

//Create an array with either "00" or the "user selection" depending on whether the shape is in that tile
function updateSelection() {
	boxIsLocated = shapeIsLocated(getSelected().box, shapeLocations.b);
	circleIsLocated = shapeIsLocated(getSelected().circle, shapeLocations.c);
}

//Grabs the user inputs
function getSelected() {
	return {
		box: document.querySelector('input[name = "boxSelect"]:checked').value,
		circle: document.querySelector('input[name = "circleSelect"]:checked').value
	};
}

//Returns an array which is either '00' if the shape is not in the tile or the user selection if it is
function shapeIsLocated(shapeSelected, matchArray) {
	var shapeOutput = [],
	    a, b;

	for (a = 0; a < rows; a++) {
		for (b = 0; b < columns; b++) {
			var matchString = pad(b, 2) + pad(a, 2);
			var selectionInput = pad(0, 2);

			if (inQuadrant(matchString, matchArray)) {
				selectionInput = shapeSelected;
			}

			shapeOutput[coordToArray(b, a, columns)] = selectionInput;
		}
	}

	return shapeOutput;
}

//Checks to see if that shape appears in the tile
function inQuadrant(tileString, matchTiles) {
	for (var d = 0; d < matchTiles.length; d++) {
		if (matchTiles[d] === tileString) {
			return true;
		}
	}
	return false;
}

//Converts x, y coordinates in map into position in array
function coordToArray(x, y, columns) {
	return (y * columns + x);
}

//Adds leading zeros
function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	var result = '',
	    i = width;
	for (; i > n.length; i -= 1) {
		result += z;
	}
	return result + n;
}

function changeTiles() {
	updateSelection();
	rasterLayer.redraw();
}

//////////////////////////////////////////////
// New TileLayer type to handle changing tileSize depending on zoom level.
//////////////////////////////////////////////

L.TileLayer.ZoomableImageOptions = L.TileLayer.extend({

	options: {
		zoomTileSize: [
			64,
			128,
			256,
			512
		]
	},

	initialize: function (url, options) {
		options = L.setOptions(this, options);

		// detecting retina displays, adjusting tileSize and zoom levels
		if (options.detectRetina && L.Browser.retina && options.maxZoom > 0) {

			this._adjustZoomTileSizeForRetina();
			options.zoomOffset++;

			if (options.minZoom > 0) {
				options.minZoom--;
			}
			this.options.maxZoom--;
		}

		if (options.bounds) {
			options.bounds = L.latLngBounds(options.bounds);
		}

		this._url = url;

		var subdomains = this.options.subdomains;

		if (typeof subdomains === 'string') {
			this.options.subdomains = subdomains.split('');
		}
	},

	_adjustZoomTileSizeForRetina: function () {
		var zoomTileSize = this.options.zoomTileSize;

		for (var i = 0; i < zoomTileSize.length; i++) {
			zoomTileSize[i] /= 2;
		}
	},

	_getTileSize: function () {
		var map = this._map,
		    mapZoom = map.getZoom() + this.options.zoomOffset,
		    zoomTileSize = this.options.zoomTileSize,
		    maxNativeZoom = Math.min(zoomTileSize.length - 1, this.options.maxNativeZoom || Infinity),
		    availableTileZoom = Math.min(mapZoom, maxNativeZoom),
		    tileSize = zoomTileSize[availableTileZoom];

		if (maxNativeZoom && mapZoom > maxNativeZoom) {
			tileSize = Math.round(map.getZoomScale(mapZoom) / map.getZoomScale(maxNativeZoom) * tileSize);
		}

		return tileSize;
	},

	getTileUrl: function (tilePoint) {
		var pad = this._pad;

		//////////////////////////////////////////
		// Taken from Nathan's prototype with minimum modification for now.
		//////////////////////////////////////////

		return L.Util.template(this._url, L.extend({
			x: pad(tilePoint.x,2),
			y: pad(tilePoint.y,2),
			z: tilePoint.z,
			b: boxIsLocated[coordToArray(tilePoint.x, tilePoint.y, columns)],
			c: circleIsLocated[coordToArray(tilePoint.x, tilePoint.y, columns)]
		}, this.options));
	},

	_pad: function (n, width, z) {
		z = z || '0';
		n = n + '';
		var result = '',
			i = width;
		for (; i > n.length; i -= 1) {
			result += z;
		}
		return result + n;
	}

});
