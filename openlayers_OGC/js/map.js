//"use strict";


ol.proj.useGeographic();

// LayerGroup
// Define view 
let view = new ol.View({
    projection: 'EPSG:4326',
    center: [33.246, 39.219],
    zoom: 6.54,
});




//  base maps
let base_maps = new ol.layer.Group({
    'title': 'Base maps',
    layers: [
        new ol.layer.Tile({
            title: 'OSM',
            type: 'base',
            visible: true,
            source: new ol.source.OSM()
        }),

        new ol.layer.Tile({
            title: 'Satellite',
            type: 'base',
            visible: true,
            source: new ol.source.XYZ({
                attributionsCollapsible: false,
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            })
        })
    ]
});








// layers 
var wms_group = new ol.layer.Group({
    'title': 'Layers',



    layers: [

        //TileWMS
        new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: 'http://localhost:8084/geoserver/osm/wms',
                params: {
                    'LAYERS': 'osm:osm_water',
                    'STYLES': 'water_s'
                },
                serverType: 'geoserver',

            }),
            title: 'TileWMS'
        }),






        //ImageWMS
        new ol.layer.Image({
            source: new ol.source.ImageWMS({
                url: 'http://localhost:8084/geoserver/osm/wms',
                params: {
                    'LAYERS': 'osm:osm_water',
                    'STYLES': 'water_s'
                },
                serverType: 'geoserver',

            }),
            title: 'ImageWMS'
        }),







        //WFS
        new ol.layer.Vector({
            source: new ol.source.Vector({

                format: new ol.format.GeoJSON,

                url: function (extent) {
                    return 'http://localhost:8084/geoserver/osm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=osm%3Aosm_water&outputFormat=application%2Fjson&sld=<water_s>'
                },

                strategy: ol.loadingstrategy.bbox // haritanın kapsadığı yerdeki veriyi yükler
            }),
            title: 'WFS',
        }),







        //WMTS 
        new ol.layer.Tile({
            source: new ol.source.WMTS({
                url: 'http://localhost:8084/geoserver/gwc/service/wmts',
                layer: 'osm:osm_water_wmts',
                matrixSet: 'EPSG:4326',
                format: 'image/png',
                projection: new ol.proj.Projection({
                    code: 'EPSG:4326',
                    units: 'degrees',
                    axisOrientation: 'neu'
                }),
                tileGrid: new ol.tilegrid.WMTS({
                    tileSize: [256, 256],
                    extent: [-180.0, -90.0, 180.0, 90.0],
                    origin: [-180.0, 90.0],
                    resolutions: [0.703125, 0.3515625, 0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625],
                    matrixIds: ['EPSG:4326:0', 'EPSG:4326:1', 'EPSG:4326:2', 'EPSG:4326:3', 'EPSG:4326:4', 'EPSG:4326:5', 'EPSG:4326:6', 'EPSG:4326:7']
                }),
                style: '',
                wrapX: true
            }),
            title: 'WMTS',
        }),





//WCS 
// new ol.layer.Tile({
//     source: new ol.source.TileWMS({
//       url: 'http://localhost:8084/geoserver/ows?service=wcs&version=1.1.0&request=GetCapabilities',
//       params: {'LAYERS': 'geo474:kozlu_sym'},
//       serverType: 'geoserver',
//     }),
//     title:'wcs'
//   })
  


    ]

});














// Create the map
let map = new ol.Map({
    target: 'map',
    view: view,
    layers: [base_maps, wms_group] // Add the base maps and WMS layers to the map
});







// Add LayerSwitcher
layerSwitcher = new ol.control.LayerSwitcher({
    activationMode: 'hover',
    startActive: false,
    tipLabel: 'Layers', // Optional label for button
    groupSelectStyle: 'children', // Can be 'children' [default], 'group' or 'none'
    collapseTipLabel: 'Collapse layers',
});
map.addControl(layerSwitcher);

layerSwitcher.renderPanel();








// Add Geocoder
var geocoder = new Geocoder('nominatim', {
    provider: 'osm',
    limit: 5,
    autoComplete: true,

});
map.addControl(geocoder);

geocoder.on('addresschosen', function (evt) {
    if (popup) {
        popup.hide();
    }
    window.setTimeout(function () {
        popup.show(evt.coordinate, evt.address.formatted);
    });
});






// //TileWMS
// // Define a WMS source
// var tileWMSSource = new ol.source.TileWMS({
//   url:'http://localhost:8084/geoserver/osm/wms',
//   params:{'LAYERS':'osm:osm_water', 'STYLES':'water_s'},
//   serverType:'geoserver', 
// })
// // Define a WMS Layer
// var tileWMSLayer = new ol.layer.Tile({
//   source:tileWMSSource
// })
// // map.addLayer(tileWMSLayer)



// //ImageWMS
// // Define a WMS source
//  var imgWMSSource = new ol.source.ImageWMS({
//     url:'http://localhost:8084/geoserver/osm/wms',
//     params:{'LAYERS':'osm:osm_water', 'STYLES':'water_s'},
//     serverType:'geoserver'
//   })
//   // Define Image WMS Layer
//   var imageWMSLayer = new ol.layer.Image({
//     source:imgWMSSource
//   })
//   map.addLayer(imageWMSLayer)



// // Adding geoserver WFS
// var WFSsource = new ol.source.Vector({
//     format: new ol.format.GeoJSON,

//      url : function(extent){ 
//       return 'http://localhost:8084/geoserver/osm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=osm%3Aosm_water&outputFormat=application%2Fjson&sld_body=<water_s>'
//    } ,
//     strategy: ol.loadingstrategy.bbox // haritanın kapsadığı yerdeki veriyi yükler
//   });
//   var WFSLayer = new ol.layer.Vector({
//     source:WFSsource
//   })
//   //map.addLayer(WFSLayer)
