define([
  'backbone',
  'modules/facebook',
  'modules/search',
	'text!templates/main.html',
  'fb'
  ], function(Backbone, Facebook,Search,Template ) {

  window.App={};

  App.Model = Backbone.Model.extend({
  });

  App.View = Backbone.View.extend({
    template: _.template(Template),
    el : '#main',
    model: new App.Model(),
    initialize: function(){
      var self = this;
      this.listenTo(Backbone, 'setAccess_Token',this._onReceiveAccessToken);
      this.model.on('change:access_token',this._onPrepareFacebookCollection,this);

      this.searchView = new Search.View();
      this.searchView.model.on('change:searchValue',this._onChangeSearchValue, this);

      navigator.geolocation.getCurrentPosition( function(currentPosition) {
        self.model.set({ position: currentPosition });
      });
      this.model.on('change:position',this._onPrepareFacebookCollection,this);
    },
    render: function(){
      this.$el.empty().append(this.template(this.model));

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
      }
    },
    _onChangeSearchValue: function(model) {
     var searchValue = model.get('searchValue');
     var self = this;

     this.facebookView.collection.remove();

     this.facebookView.collection.fetch({
       data: {query: searchValue},
       success: function() {
         self.facebookView.render();
       }
     });
   }
  });

  return App;
});