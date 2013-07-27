define([
  'backbone',
  'config',
  'text!templates/geocoding.html'
], 
function(Backbone, Config, Template) {
  
  var Geocoding = {};

  Geocoding.ReverseModel = Backbone.Model.extend({

    sync: function(method, model, options) {
      var params = _.extend({
        type:         'GET',
        dataType:     'jsonp',
        url:          model.url(),
        jsonp:        "callback",
        processData:  false
      }, options);
   
      return $.ajax(params);
    },

    url: function() {
      var latitude = this.get('latitude');
      var longitude = this.get('longitude');

      return 'http://beta.geocoding.cloudmade.com/v3/'+ Config.cloudemade.apiKey +'/api/geo.location.search.2?format=json&source=OSM&enc=UTF-8&limit=10&q='+ latitude +';'+ longitude +'';
    }, 

    parse: function(response) {
      return response;
    }
  })

  Geocoding.Model = Backbone.Model.extend({

    sync: function(method, model, options) {
      var params = _.extend({
        type:         'GET',
        dataType:     'jsonp',
        url:          model.url(),
        jsonp:        "callback",
        processData:  false
      }, options);
   
      return $.ajax(params);
    },

    url: function() {
      var querySearch = this.get('querySearch');

      return 'http://beta.geocoding.cloudmade.com/v3/'+ Config.cloudemade.apiKey +'/api/geo.location.search.2?format=json&source=OSM&enc=UTF-8&limit=10&locale=de&q=' + querySearch;
    }, 

    parse: function(response) {
      return response;
    }
  })

  Geocoding.View = Backbone.View.extend({

    template: _.template(Template),

    initialize: function() {
      this.reverseModel = new Geocoding.ReverseModel;
      this.reverseModel.on('change:latitiude', this.render, this);

      this.model = new Geocoding.Model;
    },

    events: {
      'change input': '_onInputChanged' 
    },

    render: function() {
      this.$el.empty().append(this.template(this.reverseModel));

      return this;
    },

    _onInputChanged: function(e) {
      var newLocation = $(e.target).val();

      this.model.set({ querySearch: newLocation });

      this.model.fetch({
        success: function(model, response) {
          Backbone.trigger('setNewLocation', response.places[0].position);
        }
      });
    }
  })

  return Geocoding;
}); 
