define([
  'backbone',
  'modules/facebook',
  'modules/map',
  'modules/weather',
  'modules/search',
  'text!templates/main.html'
  ], function(Backbone, Facebook, Map, Weather, Search, Template ) {

  window.App={};

  App.Model = Backbone.Model.extend({
  });

  App.View = Backbone.View.extend({

    template: _.template(Template),

    el : '#main',

    model: new App.Model(),

    initialize: function(){
      OAuth.initialize('h7CfdBhjN4lmcwXB7wrej3rvRog');
      OAuth.popup('facebook', function(error, result) {
        self._onReceiveAccessToken(result.access_token);
      });
      //OAuth.popup('twitter', function(error, result) {
      // console.log(result);
      //});
      var self = this;
      //this.listenTo(Backbone, 'setAccess_Token',this._onReceiveAccessToken);
      this.model.on('change:access_token',this._onPrepareFacebookCollection,this);

      // Map-View
      this.mapView = new Map.View();

      this.weatherView = new Weather.View();

      // Search-View
      this.searchView = new Search.View();
      this.searchView.model.on('change:searchValue',this._onChangeSearchValue, this);
      this.searchView.model.on('change:radiusValue',this._onChangeSearchValue, this);

      // get the current location
      navigator.geolocation.getCurrentPosition( function(currentPosition) {
        self.model.set({ position: currentPosition });
      });
      this.model.on('change:position',this._onPrepareFacebookCollection,this);
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
      var hasAccess_token = model.get('access_token') ? true : false;
      var hasPosition = model.get('position') ? true : false;
      if(hasAccess_token && hasPosition){

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

        this.weatherView.setElement(this.$el.find('#weather'));

        this.weatherView.model.set({
          latitude: this.model.get('position').coords.latitude,
          longitude: this.model.get('position').coords.longitude
        });
        this.weatherView.model.fetch({
          success: function(){
            self.weatherView.render();
          }
        });
      }
    },
    _onChangeSearchValue: function(model) {
     var searchValue = model.get('searchValue');
     var radiusValue = model.get('radiusValue');
     var self = this;

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