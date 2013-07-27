define([
  'backbone',
  'modules/facebook',
  'modules/map',
  'modules/weather',
  'modules/search',
  'modules/geocoding',
  'text!templates/main.html',
  'fb'
  ], function(Backbone, Facebook, Map, Weather, Search, Geocoding, Template ) {

  window.App={};

  App.Model = Backbone.Model.extend({
  });

  App.View = Backbone.View.extend({

    template: _.template(Template),

    el : '#main',

    model: new App.Model(),

    initialize: function(){
      // OAuth.initialize('h7CfdBhjN4lmcwXB7wrej3rvRog');
      // OAuth.popup('facebook', function(error, result) {
      //   // self._onReceiveAccessToken(result.access_token);
      // });
      //OAuth.popup('twitter', function(error, result) {
      // console.log(result);
      //});

      var self = this;

      this.listenTo(Backbone, 'setAccess_Token', this._onReceiveAccessToken);

      this.model.on('change:access_token', this._onPrepareFacebookCollection, this);

      this.model.on('change:position', this._onPrepareFacebookCollection, this);

      this.listenTo(Backbone, 'setNewLocation', this.setNewLocation);

      // Map View
      this.mapView = new Map.View();

      // Weather View
      this.weatherView = new Weather.View();

      // Geocoding View
      this.geocodingView = new Geocoding.View();

      // Search-View
      this.searchView = new Search.View();
      this.searchView.model.on('change:searchValue',this._onChangeSearchValue, this);
      this.searchView.model.on('change:radiusValue',this._onChangeSearchValue, this);

      // get the current location
      navigator.geolocation.getCurrentPosition( function(currentPosition) {
        self.model.set({ position: currentPosition });
      });
    },

    render: function(){
      this.$el.empty().append(this.template(this.model));

      // render the map-view
      this.mapView.setElement(this.$el.find('#map'));
      this.mapView.render();

      // render the search-view
      this.searchView.setElement(this.$el.find('#search'));
      this.searchView.render();

      return this;
    },

    _onReceiveAccessToken: function(access_token){
      this.model.set({access_token:access_token});
    },
    
    _onPrepareFacebookCollection: function(model){
      var hasPosition = model.get('position') ? true : false;
      var hasAccess_token = model.get('access_token') ? true : false;

      if (hasAccess_token && hasPosition){

        var self = this;
        var latitude = this.model.get('position').coords.latitude;
        var longitude = this.model.get('position').coords.longitude;
        
        this.facebookCollection = new Facebook.Collection([], {
          query: 'bar',
          radius: '10000',
          lat: latitude,
          lon: longitude,
          access_token: this.model.get('access_token')
        });

        this.facebookCollection.fetch({
          success: function(){
            self.facebookView = new Facebook.ListView({
              collection: self.facebookCollection
            });
            self.facebookView.setElement(self.$el.find('.post-list'));
            self.facebookView.render();
          }
        });

        // Set the Properties to render the Weather-View
        this.weatherView.setElement(this.$el.find('#weather'));
        this.weatherView.model.set({
          latitude: latitude,
          longitude: longitude
        });
        this.weatherView.model.fetch({
          success: function(){
            self.weatherView.render();
          }
        });

        // Set the Properties to render the Geocoding-View
        this.geocodingView.setElement(this.$el.find('#geocoding'));
        this.geocodingView.reverseModel.set({
          latitude: latitude,
          longitude: longitude
        });
        this.geocodingView.reverseModel.fetch({
          success: function(){
            self.geocodingView.render();
          }
        });
      }
    },

    setNewLocation: function(newLocation) {
      var self = this;

      this.facebookView.collection.lat = newLocation.lat;
      this.facebookView.collection.lon = newLocation.lon;

      this.facebookView.collection.remove();

      this.facebookView.collection.fetch({
        success: function(model, response) {
          self.facebookView.render();
        }
      });
    },

    _onChangeSearchValue: function(model) {
      var self = this;
      var searchValue = model.get('searchValue');
      var radiusValue = model.get('radiusValue');

      this.facebookView.collection.remove();

      this.facebookView.collection.fetch({
        data: {query: searchValue,
        radius: radiusValue},
        success: function() {
          self.facebookView.render();
        }
      });
    }
  });

  return App;
});
