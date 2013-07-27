define([
  'backbone',
  'modules/details',
  'text!templates/facebook.html'
  ], function(Backbone, Details, Template) {

  window.Facebook={};

  Facebook.Model = Backbone.Model.extend({ });

  Facebook.Collection = Backbone.Collection.extend({

    initialize: function(models, options){
      this.lat = options.lat;
      this.lon = options.lon;
      this.query = options.query;
      this.radius = options.radius;
      this.access_token = options.access_token;
    },

    url: function(){
      return "https://graph.facebook.com/search?q=" + this.query + "&type=place&limit=5000&center="+ this.lat +","+ this.lon +"&distance="+this.radius+"&access_token=" + this.access_token;
    },
    
    parse : function(response){

      var point1 = {
        lat: parseFloat(this.lat),
        lon: parseFloat(this.lon)
      }

      _.each(response.data, function(place) {

        var point2 = {
          lat: parseFloat(place.location.latitude),
          lon: parseFloat(place.location.longitude)
        }        

        place.distance = parseInt(this.calculateDistance(point1, point2) * 1000);
      }, this);

      return response.data;
    },

    comparator: function(item) {
      return -item.get("distance");
    },

    calculateDistance: function(point1, point2) {
      var point1_lat = point1.lat;
      var point1_lon = point1.lon;
      var point2_lat = point2.lat;
      var point2_lon = point2.lon;

      var R = 6371; // km
      var dLat = this.toRad(point2_lat - point1_lat);
      var dLon = this.toRad(point2_lon - point1_lon);
      var lat1 = this.toRad(point1_lat);
      var lat2 = this.toRad(point2_lat);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var distance = R * c;

      return distance;
    },

    toRad: function(Value) {
      /** Converts numeric degrees to radians */
      return Value * Math.PI / 180;
    },
    
    fetch: function(options) {
     options = options || {};
     var self = this;
     var params = _.clone(options);

     if (params.data) {
       this.query = params.data.query;
       this.radius = params.data.radius;
     }

     params.error = function() {
     };

     params.success = function(model, resp, options) {
     };

     return Backbone.Collection.prototype.fetch.call(this, options);
   }
  });

  Facebook.ItemView = Backbone.View.extend({
    
    template: _.template(Template),
    
    tagName: 'li',
    
    className: 'post',

    render: function(){
      this.$el.empty().append(this.template(this.model));
      return this;
    },
    
    events : {
      'click': '_onClickItem'
    },
    
    _onClickItem:function(){
      var $el = $('#main');
      var detailsView = new Details.View({
          model : this.model
      });

      Backbone.trigger('highlightFeature', this.model);

      detailsView.setElement($el.find('#details'));
      detailsView.render();
    }
  });

  Facebook.ListView = Backbone.View.extend({
    
    initialize: function(){
      this.collection.on('reset', this.render,this);

      this.listenTo(Backbone, 'clickOnMapMarker', this.clickOnMapMarker);
    },

    render: function(){
      $('.post-list').empty();

      $('#resultHead').html('Ergebnisse ('+this.collection.length+')');
      
      this.collection.each(function(post){
        var ItemView = new Facebook.ItemView({
          model: post
        });
        $('.post-list').prepend(ItemView.render().el);
      });

      Backbone.trigger('setPlacesToMap', this.collection.models);

      return this;
    },

    clickOnMapMarker: function(selectedMarker) {
      var marker = _.find(this.collection.models, function(model) {
        var name = model.get('name');
        if(name === selectedMarker) {
          return model;
        }
      });

      var $el = $('#main');
      var detailsView = new Details.View({
          model : marker
      });
      detailsView.setElement($el.find('#details'));
      detailsView.render();
    }
  });

  return Facebook;
});