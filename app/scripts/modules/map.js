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

  Map.GeocodingModel = Backbone.Model.extend({

    sync: function(method, model, options) {
      var params = _.extend({
        type:         'GET',
        dataType:     'jsonp',
        url:          model.url(),
        jsonp:        "callback",
        processData:  false
      }, options);
   
      // Make the request.
      return $.ajax(params);
    },

    url: function() {

      console.log(this);

      var latitude = this.get('latitude');
      var longitude = this.get('longitude');

      return 'http://beta.geocoding.cloudmade.com/v3/'+ Config.cloudemade.apiKey +'/api/geo.location.search.2?format=json&source=OSM&enc=UTF-8&limit=10&q='+ latitude +';'+ longitude +'';
    }, 

    parse: function(response) {

      console.log(response);

      return response;
    }
  })

  Map.View = Backbone.View.extend({

    template: _.template(Template),

    initialize: function() {
      this.model = new Map.Model();
 
      this.model.on('change:position', this.setCenterPosition, this);

      this.listenTo(Backbone, 'setPlacesToMap', this.addPlacesToMap);

      this.listenTo(Backbone, 'highlightFeature', this.highlightFeature);

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

      this.geoCodeModel = new Map.GeocodingModel();
      this.geoCodeModel.set({
        latitude: latitude,
        longitude: longitude
      })
      this.geoCodeModel.fetch({
        success: function(response) {
          console.log(response);
          $('#adress').text(response.get('places')[0].street)
        }
      });


      this.map = new OpenLayers.Map({
        div: "map-container",
        controls: [
          new OpenLayers.Control.Attribution(),
          new OpenLayers.Control.Navigation(),
          new OpenLayers.Control.Zoom()
        ],
        layers: [
          new OpenLayers.Layer.OSM("OpenStreetMap", null, {
            transitionEffect: "resize"
          })
        ]
      });

      this.map.setCenter(new OpenLayers.LonLat(longitude,latitude)
        .transform(
          new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
          new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
        ), 
        15 // Zoom level
      );   

      var defaultStyle = new OpenLayers.Style({
        'externalGraphic': 'img/home.png',
        'graphicWidth'    : 36,
        'graphicHeight'   : 36,
        'graphicYOffset'  : -24,
        'title'           : '${tooltip}'
      });

      var homeLayer = new OpenLayers.Layer.Vector('HomeLayer', {
        styleMap: new OpenLayers.StyleMap({
          'default': defaultStyle
        })
      }); 

       // Add home marker
      var homeLatitude = this.model.get('position').coords.latitude;
      var homeLongitude = this.model.get('position').coords.longitude;
      var homeLocation = new OpenLayers.Geometry.Point(homeLongitude, homeLatitude).transform('EPSG:4326', 'EPSG:3857');
      
      homeLayer.addFeatures([
        new OpenLayers.Feature.Vector(homeLocation, {
          tooltip: 'Home',
          id: 'home'
        })
      ]);

      this.map.addLayer(homeLayer);
      
    },

    highlightFeature: function(model){

      this.selectControl.unselectAll();

      var even = _.find(this.overlay.features, function(feature,index){
        return feature.attributes.id == model.attributes.name;
      });
      
      this.selectControl.select(even);
    },

    addPlacesToMap: function(models) {
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
                
      this.map.addControl(this.selectControl);
      this.selectControl.activate();

      this.map.addLayer(this.overlay);

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
    }
  });

  return Map;
}); 
