define([
  'backbone',
  'modules/facebook',
  'modules/map',
  'modules/weather',
  'modules/search',
  'modules/geocoding',
  'text!templates/main.html',
  'fb'
  ], function(Backbone, Facebook, Map, Weather, Search, Geocoding, Template) {

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

      // FacebookMain View
      this.facebookMainView = new Facebook.MainView();

      this.facebookCollection = new Facebook.Collection([], {
          query: 'Bar',
          radius: '5000',
          lat: 0,
          lon: 0,
          access_token: null
        });

      this.facebookMainView = new Facebook.MainView({
        collection: self.facebookCollection
      });
      this.facebookMainView.setElement(this.$el.find('.post-list'));
      this.facebookMainView.render();

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

    events: {
      'click .login': '_onFBLogin'
    },

    render: function(){
      this.$el.empty().append(this.template(this.model));

      // render the facebookMainvView
      this.facebookMainView.setElement(this.$el.find('#facebook'));
      this.facebookMainView.render();

      // render the mapView
      this.mapView.setElement(this.$el.find('#map'));
      this.mapView.render();

      // render the searchView
      this.searchView.setElement(this.$el.find('#search'));
      this.searchView.render();

      return this;
    },

    _onFBLogin: function() {
      FB.login(function(response) {
        console.log(response);
         if (response.authResponse) {
           console.log('Welcome!  Fetching your information.... ');
           FB.api('/me', function(response) {
             console.log('Good to see you, ' + response.name + '.');
             console.log(response);
           });
         } else {
           console.log('User cancelled login or did not fully authorize.');
         }
       });
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
          radius: '2000',
          lat: latitude,
          lon: longitude,
          access_token: this.model.get('access_token')
        });

        this.facebookCollection.fetch({
          success: function(response, model){
            Backbone.trigger('collectionFetched', response);
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

      var access_token = this.model.get('access_token');

      this.facebookMainView.collection.access_token = access_token;
      this.facebookMainView.collection.lat = newLocation.lat;
      this.facebookMainView.collection.lon = newLocation.lon;
      this.facebookMainView.collection.remove();
      this.facebookMainView.collection.fetch({
        success: function(model, response) {
          Backbone.trigger('updateCollection', response);
        }
      });
    },

    _onChangeSearchValue: function(model) {
      var self = this;
      var searchValue = model.get('searchValue');
      var radiusValue = model.get('radiusValue');

      this.facebookMainView.collection.remove();

      this.facebookMainView.collection.fetch({
        data: {query: searchValue,
        radius: radiusValue},
        success: function() {
          self.facebookMainView.render();
        }
      });
    }
  });

  return App;
});
