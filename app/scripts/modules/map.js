define([
  'backbone',
  'config',
  'text!templates/map.html',
  'vendor/openlayers/openlayers'
], 
function(Backbone, Config, Template, Ol) {
  
  var Map = {};

  Map.Model = Backbone.Model.extend({
    defaults: {
      location: 'Hamburg'
    }
  });

  Map.View = Backbone.View.extend({

    template: _.template(Template),

    initialize: function() {
      this.model = new Map.Model();
 
      this.model.on('change:position', this.setCenterPosition, this);

      this.listenTo(Backbone, 'setPlacesToMap', this.addPlacesToMap);

      this.listenTo(Backbone, 'highlightFeature', this.highlightFeature);

      this.listenTo(Backbone, 'setNewLocation', this.setMapCenter);

      this.cloudmadeLayer = new Map.CloudMade("CloudMade", {
        key: Config.cloudmade.apiKey,
        styleId: 96931

      });

      this.map = new OpenLayers.Map({
        controls: [
          new OpenLayers.Control.Navigation(),
          new OpenLayers.Control.Zoom()
        ],
        layers: [
          this.cloudmadeLayer
          // new OpenLayers.Layer.OSM("OpenStreetMap", null, {
          //   transitionEffect: "resize"
          // })
        ]
      });

      var defaultStyle = new OpenLayers.Style({
        'externalGraphic': 'img/marker.png',
        'graphicWidth' : 28,
        'graphicHeight' : 28,
        'graphicYOffset' : -24,
        'title' : '${tooltip}'
      });

      var selectStyle = new OpenLayers.Style({
        'externalGraphic': 'img/marker_selected.png',
        'graphicWidth'    : 28,
        'graphicHeight'   : 28,
        'graphicYOffset'  : -24,
        'title'           : '${tooltip}'
      }); 

      var homeStyle = new OpenLayers.Style({
        'externalGraphic': 'img/home.png',
        'graphicWidth'    : 36,
        'graphicHeight'   : 36,
        'graphicYOffset'  : -24,
        'title'           : '${tooltip}'
      });

      this.homeLayer = new OpenLayers.Layer.Vector('HomeLayer', {
        styleMap: new OpenLayers.StyleMap({
          'default': homeStyle
        })
      });

      this.overlay = new OpenLayers.Layer.Vector('Overlay', {
        styleMap: new OpenLayers.StyleMap({
          'default': defaultStyle,
          'select': selectStyle
        })
      });

      this.overlay.events.on({
          'featureselected': function(feature) {
            Backbone.trigger('clickOnMapMarker', feature.feature.attributes.id);
          },
          'featureunselected': function(feature) {
              // console.log("Unselected");
          }
      });

      // Add a control for selecting a marker
      this.selectControl = new OpenLayers.Control.SelectFeature(
        this.overlay,
        {
          box: false,
          hover: false,
          toggle: false,
          multiple: false,
          clickout: false,
          toggleKey: "ctrlKey", // ctrl key removes from selection
          multipleKey: "shiftKey" // shift key adds to selection
        }
      )
                
      this.map.addLayer(this.overlay);

      this.map.addLayer(this.homeLayer);

      this.map.addControl(this.selectControl);

      this.getCenterPosition();
    },

    setCenterPosition: function(position) {
      this.render();
    },

    getCenterPosition: function() {
      var self = this;
      navigator.geolocation.getCurrentPosition( function(currentPosition) {
        self.model.set({ position: currentPosition });
      });
    },

    render: function() {
      this.$el.empty().append(this.template(this.model));

      if (this.model.get('position')) {
        this.renderMap();
      }

      return this;
    },

    renderMap: function(position) {
      var latitude = this.model.get('position').coords.latitude;
      var longitude = this.model.get('position').coords.longitude;

      this.map.render('map-container');

      this.map.setCenter(new OpenLayers.LonLat(longitude,latitude)
        .transform(
          new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
          new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
        ), 
        15 // Zoom level
      );

      this.setHomeMarker(latitude, longitude);
    },

    setHomeMarker: function(lat, lon) {

      var homeLocation = new OpenLayers.Geometry.Point(lon, lat).transform('EPSG:4326', 'EPSG:3857');
      
      this.homeLayer.destroyFeatures();

      this.homeLayer.addFeatures([
        new OpenLayers.Feature.Vector(homeLocation, {
          tooltip: 'Home',
          id: 'home'
        })
      ]);
    },

    setMapCenter: function(newCenter) {
      var latitude = newCenter.lat;
      var longitude = newCenter.lon;

      this.map.setCenter(new OpenLayers.LonLat(longitude,latitude)
        .transform(
          new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
          new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
        ), 
        15 // Zoom level
      );

      this.setHomeMarker(latitude, longitude);
    },

    highlightFeature: function(model){

      this.selectControl.unselectAll();

      var even = _.find(this.overlay.features, function(feature,index){
        return feature.attributes.id == model.attributes.name;
      });
      
      this.selectControl.select(even);
    },

    addPlacesToMap: function(models) {

      this.selectControl.activate();

      this.overlay.destroyFeatures();

      // Add markers to the map
      _.each(models, function(model) {
        var latitude = model.get('location').latitude;
        var longitude = model.get('location').longitude;
        var locationName = model.get('name');
        var myLocation = new OpenLayers.Geometry.Point(longitude, latitude).transform('EPSG:4326', 'EPSG:3857');
        this.overlay.addFeatures([
          new OpenLayers.Feature.Vector(myLocation, {
            tooltip: locationName,
            id: locationName
          })
        ]);
      }, this);
      this.map.zoomToExtent(this.overlay.getDataExtent()); 
    }
  });

  Map.CloudMade = OpenLayers.Class(OpenLayers.Layer.XYZ, {
    initialize: function(name, options) {
        if (!options.key) {
            throw "Please provide key property in options (your API key).";
        }
        options = OpenLayers.Util.extend({
          attribution: "Data &copy; 2009 <a href='http://openstreetmap.org/'>OpenStreetMap</a>. Rendering &copy; 2009 <a href='http://cloudmade.com'>CloudMade</a>.",
          maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
          maxResolution: 156543.0339,
          units: "m",
          projection: "EPSG:900913",
          isBaseLayer: true,
          numZoomLevels: 19,
          displayOutsideMaxExtent: true,
          wrapDateLine: true,
          styleId: 1
        }, options);
        var prefix = [options.key, options.styleId, 256].join('/') + '/';
        var url = [
          "http://a.tile.cloudmade.com/" + prefix,
          "http://b.tile.cloudmade.com/" + prefix,
          "http://c.tile.cloudmade.com/" + prefix
        ];
        var newArguments = [name, url, options];
        OpenLayers.Layer.XYZ.prototype.initialize.apply(this, newArguments);
    },

    getURL: function (bounds) {
      var res = this.map.getResolution();
      var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
      var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
      var z = this.map.getZoom();
      var limit = Math.pow(2, z);

      if (y < 0 || y >= limit) {
        return "http://cloudmade.com/js-api/images/empty-tile.png";
      } else {
        x = ((x % limit) + limit) % limit;

        var url = this.url;
        var path = z + "/" + x + "/" + y + ".png";

        if (url instanceof Array) {
          url = this.selectUrl(path, url);
        }

        return url + path;
      }
    },

    CLASS_NAME: "OpenLayers.Layer.CloudMade"
  });

  return Map;
}); 
