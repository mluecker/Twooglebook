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
      var self = this;

      this.listenTo(Backbone, 'setAccess_Token', this._onReceiveAccessToken);

      this.model.on('change:access_token', this._onPrepareFacebookCollection, this);

      this.model.on('change:position', this._onPrepareFacebookCollection, this);

      this.listenTo(Backbone, 'setNewLocation', this.updateFacebook);

      this.listenTo(Backbone, 'newSearch', this.updateFacebook);

      // Facebook View
      this.facebookMainView = new Facebook.MainView();

      // Map View
      this.mapView = new Map.View();

      // Weather View
      this.weatherView = new Weather.View();

      // Geocoding View
      this.geocodingView = new Geocoding.View();

      // Search-View
      this.searchView = new Search.View();

      // get the current location
      navigator.geolocation.getCurrentPosition( function(currentPosition) {
        self.model.set({ position: currentPosition });
      });
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

    _onReceiveAccessToken: function(access_token){
      this.model.set({ access_token: access_token });
    },
    
    _onPrepareFacebookCollection: function(model){
      var hasPosition = model.get('position') ? true : false;
      var hasAccess_token = model.get('access_token') ? true : false;

      if (hasAccess_token && hasPosition){

        var self = this;
        var latitude = this.model.get('position').coords.latitude;
        var longitude = this.model.get('position').coords.longitude;
        
        var updatedFDData = {
          latitude: latitude,
          longitude: longitude,
          radiusValue: 5000,
          searchValue: 'Bar',
          access_token: this.model.get('access_token')
        }
        Backbone.trigger('updateFBCollection', updatedFDData);

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

    updateFacebook: function(model) {
      var updatedFDData = {
        access_token: this.model.get('access_token'),
        latitude: model.lat || this.model.get('position').coords.latitude,
        longitude: model.lon || this.model.get('position').coords.longitude,
        radiusValue: model.radiusValue || 5000,
        searchValue: model.searchValue || 'Bar'
      }
      Backbone.trigger('updateFBCollection', updatedFDData);
    }
  });

  return App;
});
