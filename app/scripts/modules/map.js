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

      this.initializeMap();
 
      // get the places from the facebook-Module
      // ToDo: If there a now playes, who will center the map?
      this.listenTo(Backbone, 'setPlacesToMap', this.addPlacesToMap);
      
      // the current location of the browser is located
      this.model.on('change:homePosition', this.setHomeMarker, this);
      
      // highlight a feature in the map, if the user clicks on a list-item
      this.listenTo(Backbone, 'highlightFeature', this.highlightFeature);
      
      // after setting a new Location, set a new Location
      this.listenTo(Backbone, 'setNewLocation', this.setNewLocation); 

      // ToDo: use the openlayers getLocation-Functionality
      this.getCenterPosition();
    },

    render: function() {
      this.$el.empty().append(this.template(this.model));

      this.map.render('map-container');

      return this;
    },

    initializeMap: function() {
      /*
       * Create Styles for the homeLayer and featureLayer
       */
      var defaultFeatureStyle = new OpenLayers.Style({
        'externalGraphic' : 'img/marker.png',
        'graphicWidth'    : 28,
        'graphicHeight'   : 28,
        'graphicYOffset'  : -24,
        'title'           : '${tooltip}'
      });

      var selectedFeatureStyle = new OpenLayers.Style({
        'externalGraphic' : 'img/marker_selected.png',
        'graphicWidth'    : 28,
        'graphicHeight'   : 28,
        'graphicYOffset'  : -24,
        'title'           : '${tooltip}'
      }); 

      var homeLayersStyle = new OpenLayers.Style({
        'externalGraphic' : 'img/home.png',
        'graphicWidth'    : 36,
        'graphicHeight'   : 36,
        'graphicYOffset'  : -24,
        'title'           : '${tooltip}'
      });

      /*
       * Initialize Layers
       *
       * homeLayer      --> Layer for the home marker
       * featureLayer   --> Layer for the facebook-features
       * cloudmadeLayer --> Background-Layer
       */
      this.cloudmadeLayer = new Map.CloudMade("CloudMade", {
        key: Config.cloudmade.apiKey,
        styleId: 96931
      });

      this.homeLayer = new OpenLayers.Layer.Vector('HomeLayer', {
        styleMap: new OpenLayers.StyleMap({
          'default': homeLayersStyle
        })
      });

      this.featureLayer = new OpenLayers.Layer.Vector('featureLayer', {
        styleMap: new OpenLayers.StyleMap({
          'default': defaultFeatureStyle,
          'select': selectedFeatureStyle
        })
      });

      /*
       * Create a new Map
       */
      this.map = new OpenLayers.Map({
        controls: [
          new OpenLayers.Control.Navigation(),
          new OpenLayers.Control.Zoom()
        ],
        layers: [
          this.cloudmadeLayer,
          this.featureLayer,
          this.homeLayer
        ]
      });

      /*
       * Add a control for selecting a marker
       */
      this.selectControl = new OpenLayers.Control.SelectFeature(
        this.featureLayer,
        {
          box: false,
          hover: false,
          toggle: false,
          multiple: false,
          clickout: false,
          toggleKey: "ctrlKey", // ctrl key removes from selection
          multipleKey: "shiftKey" // shift key adds to selection
        }
      );
      
      /*
       * Add and activate the select control
       */
      this.map.addControl(this.selectControl);
      this.selectControl.activate();
      
      /*
       * Events for the featureLayer-Layer
       */
      this.featureLayer.events.on({
        'featureselected': function(feature) {
          Backbone.trigger('clickOnMapMarker', feature.feature.attributes.id);
        },
        'featureunselected': function(feature) {
          // ToDo: Unselect the feature
        }
      });
    },

    addPlacesToMap: function(models) {
      // reset the featureLayer
      this.featureLayer.destroyFeatures();

      if (models.length > 0) {
        // Add markers to the map
        _.each(models, function(model) {
          var latitude = model.get('location').latitude;
          var longitude = model.get('location').longitude;
          var locationName = model.get('name');
          var myLocation = new OpenLayers.Geometry.Point(longitude, latitude).transform('EPSG:4326', 'EPSG:3857');
          
          this.featureLayer.addFeatures([
            new OpenLayers.Feature.Vector(myLocation, {
              id: locationName,
              tooltip: locationName
            })
          ]);
        }, this);

        // ToDo: calculate the extent from the home location and the places

        this.map.zoomToExtent(this.featureLayer.getDataExtent());

      } else {

        var position = {
          lat: this.model.get('homePosition').lat,
          lon: this.model.get('homePosition').lon,
          reCenter: true
        }
        this.setHomeMarker(position);
      }
    },

    getCenterPosition: function() {
      var self = this;

      navigator.geolocation.getCurrentPosition( function(currentPosition) {
        var newLocation = {
          lat: currentPosition.coords.latitude,
          lon: currentPosition.coords.longitude,
          reCenter: true
        }
        self.model.set({ homePosition: newLocation });
      });
    },

    setNewLocation: function(model) {
      var newLocation = {
        lat: model.lat,
        lon: model.lon,
        reCenter: false
      }
      this.model.set({ homePosition: newLocation });
    },

    setHomeMarker: function(position) {
      var lat = position.lat || position.get('homePosition').lat;
      var lon = position.lon || position.get('homePosition').lon;
      var homeLocation = new OpenLayers.Geometry.Point(lon, lat).transform('EPSG:4326', 'EPSG:3857');
      
      this.homeLayer.destroyFeatures();

      this.homeLayer.addFeatures([
        new OpenLayers.Feature.Vector(homeLocation, {
          id: 'home',
          tooltip: 'Home'
        })
      ]);

      if (position.reCenter) {
        this.map.setCenter(new OpenLayers.LonLat(lon,lat)
        .transform(
          new OpenLayers.Projection("EPSG:4326"),
          new OpenLayers.Projection("EPSG:900913")
        ), 
        13
      );
      }
    },

    highlightFeature: function(model){
      this.selectControl.unselectAll();

      var even = _.find(this.featureLayer.features, function(feature,index){
        return feature.attributes.id == model.attributes.name;
      });
      
      this.selectControl.select(even);
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
