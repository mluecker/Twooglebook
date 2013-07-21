define([
  'backbone',
  'text!templates/map.html',
  'vendor/openlayers/openlayers'
], 
function(Backbone, Template, Ol, Lf) {
  
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

      this.map = new OpenLayers.Map({
        div: "map-container",
        controls: [
          new OpenLayers.Control.Attribution(),
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
        16 // Zoom level
      );      
    },

    addPlacesToMap: function(models) {
      var defaultStyle = new OpenLayers.Style({
        'externalGraphic': 'img/marker.png',
        'graphicWidth'    : 28,
        'graphicHeight'   : 28,
        'graphicYOffset'  : -24,
        'title'           : '${tooltip}'
      });

      var selectStyle = new OpenLayers.Style({
        'externalGraphic': 'img/marker_selected.png',
        'graphicWidth'    : 28,
        'graphicHeight'   : 28,
        'graphicYOffset'  : -24,
        'title'           : '${tooltip}'
      });

      var overlay = new OpenLayers.Layer.Vector('Overlay', {
        styleMap: new OpenLayers.StyleMap({
          'default': defaultStyle,
          'select': selectStyle
        })
      });

      overlay.events.on({
          'featureselected': function(feature) {
            Backbone.trigger('clickOnMapMarker', feature.feature.attributes.id);
          },
          'featureunselected': function(feature) {
              // console.log("Unselected");
          }
      });

      // Add a control for selecting a marker
      var selectControl = new OpenLayers.Control.SelectFeature(
        overlay,
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
                
      this.map.addControl(selectControl);
      selectControl.activate();

      this.map.addLayer(overlay);

      // Add markers to the map
      _.each(models, function(model) {
        var latitude = model.get('location').latitude;
        var longitude = model.get('location').longitude;
        var locationName = model.get('name');
        var myLocation = new OpenLayers.Geometry.Point(longitude, latitude).transform('EPSG:4326', 'EPSG:3857');

        overlay.addFeatures([
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