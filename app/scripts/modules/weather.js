define([
 'backbone',
 'config',
 'text!templates/weather.html',
 'text!templates/weatherItem.html'
],
function(Backbone, Config, Template, ItemTemplate) {
 
  var Weather = {};

  Weather.Model = Backbone.Model.extend({

    url: function(){
      var lat = '?lat='+ this.get('latitude');
      var lon = '&lon='+ this.get('longitude');
      var appId = Config.openweather.appId;
      var path = 'http://openweathermap.org/data/2.5/forecast/daily';

      return path + lat + lon +'&cnt=3&units=metric&lang=de&callback=?&APPID='+appId;
    },
  
    parse: function(response){
      return response;
    }
  });

  Weather.ItemModel = Backbone.Model.extend({
    getDate: function(timestamp) {
      return new Date(timestamp*1000).toLocaleDateString();
    }
  });

  Weather.ItemView = Backbone.View.extend({

    template: _.template(ItemTemplate),

    className: 'weather-item',

    render: function() {
      this.$el.empty().append(this.template(this.model));

      return this;
    }
  });

  Weather.View = Backbone.View.extend({

    template: _.template(Template),

    className : "weather",

    initialize: function() {
      this.model = new Weather.Model;

      this.listenTo(Backbone, 'setNewLocation', this.setNewLocation);

      this.width = 0;
    },

    events: {
      'click .go-right': '_onClickArrow',
      'click .go-left': '_onClickArrow'
    },
   
    render: function() {
      this.$el.empty().append(this.template(this.model));
      
      var weatherItems = this.model.get('list');

      for (var i = weatherItems.length-1; i >= 0; i--) {
        var itemViewModel = new Weather.ItemModel(weatherItems[i]);
        var itemView = new Weather.ItemView({
          model: itemViewModel
        })
        this.$el.find('.weather-list').prepend(itemView.render().el);
      };
     
      return this;
    },

    setNewLocation: function(newLocation) {
      var self = this;

      this.model.set({ 
        latitude: newLocation.lat,
        longitude: newLocation.lon
      });

      this.model.fetch({
        success: function(model, response) {
          self.render();
        }
      });
    },

    _onClickArrow: function(e) {
      var $el = $(e.currentTarget);
      var direction = $el.data('moving');
      var width = this.width;

      if (direction === 'right') {
        if (width !== 600) width = width + 300;
      } else {
        if (width !== 0) width = width - 300;
      }

      this.width = width;

      $('.weather-list').animate({ right: width}, 300, 'swing');
    }

  });

  return Weather;
});
