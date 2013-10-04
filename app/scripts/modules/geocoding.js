define([
  'backbone',
  'config',
  'text!templates/geocoding.html',
  'text!templates/geocodingItem.html',
  'nprogress'
], 
function(Backbone, Config, Template, ItemTemplate) {
  
  var Geocoding = {
    locationSearch: true
  };

  Geocoding.Model = Backbone.Model.extend({

    defaults: {
      querySearch: ""
    },

    initialize: function() { },

    url: function() {
      var lat = this.get('lat');
      var lon = this.get('lon');
      var locationSearch = Geocoding.locationSearch;

      var querySearch = this.get('querySearch');
      var searchUrl = 'http://api.geonames.org/searchJSON?formatted=true&q='+querySearch+'&maxRows=10&lang=en&username='+ Config.geonames.apiKey;

      var queryLocation = "lat=" + lat + "&lng=" + lon;
      var locationUrl = 'http://api.geonames.org/findNearbyPlaceNameJSON?'+queryLocation+'&lang=de&username='+ Config.geonames.apiKey;
      
      var search = locationSearch ? locationUrl : searchUrl;

      return search;
    }, 

    parse: function(response) {
      var places = new Geocoding.Collection();

      for (var i = 0; i < response.geonames.length; i++) {
        places.add(response.geonames[i]);
      };

      response.places = places;

      return response;
    },

    clearCity: function(city) {
      var clearedCity = city.replace(/~/g,"");

      return clearedCity;
    },

    getAdress: function() {
      var adress = this.get('name') + ', ' +  this.get('adminName1');

      return  adress;
    }
  })


  Geocoding.Collection = Backbone.Collection.extend({ 
    model: Geocoding.Model
  });


  Geocoding.View = Backbone.View.extend({

    template: _.template(Template),

    initialize: function() {
      this.model = new Geocoding.Model;
      
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'change:places', this.render);
      this.listenTo(Backbone, 'updateFBCollection', this._onUpdateData);
    },

    events: {
      'submit': '_onInputChanged' 
    },

    _onUpdateData: function(data) {
      this.model.set({
        lat: data.latitude,
        lon: data.longitude
      });

      this.model.fetch();
    },

    render: function() {
      this.$el.empty().append(this.template(this.model));

      var places = this.model.get('places');

      if (places && places.length == 0) {
        this.$('#inputLocation').attr('placeholder', "Keine Ergebnisse");
        return;
      }

      if (places && places.length == 1) {
        var city = places.models[0].get('name');
        var state = places.models[0].get('adminName1');
        var adress = city + ', ' + state;
        
        this.$('#inputLocation').attr('placeholder', adress);

        // if (!Geocoding.locationSearch) {
        //   var position = {
        //     lat: this.model.get('places').models[0].get('lat'),
        //     lon: this.model.get('places').models[0].get('lng')
        //   }
        //   Geocoding.locationSearch = true;

        //   Backbone.trigger('setNewLocation', position);
        // }
      }

      if (!Geocoding.locationSearch) {
        if (places && places.length > 1) {
          for (var i = 0; i < places.length; i++) {
            
            var itemView = new Geocoding.ItemView({
              model: places.models[i]
            });
            $('.geocoading-places').append(itemView.render().el);
          };
          $('.geocoading-places').slideDown();
        }
      }

      return this;
    },

    _onInputChanged: function(e) {
      e.preventDefault();

      var newLocation = this.$('#inputLocation').val();

      Geocoding.locationSearch = false;
      
      this.model.set({ 
        querySearch: newLocation
      });

      NProgress.configure({ showSpinner: false });
      NProgress.start();

      this.model.fetch({
        success: function() {
          NProgress.done();
        }
      });
    }
  });

  Geocoding.ItemView = Backbone.View.extend({

    template: _.template(ItemTemplate),

    events: {
      'click': '_onClickItem'
    },

    render: function(){
      this.$el.empty().append(this.template(this.model));
      
      return this;
    },

    _onClickItem: function(e) {
      e.preventDefault();

      var position = {
        lat: this.model.get('lat'),
        lon: this.model.get('lng')
      };

      Geocoding.locationSearch = true;

      Backbone.trigger('setNewLocation', position);
    }

  });

  return Geocoding;
}); 
