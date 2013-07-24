define([
 'backbone',
 'config',
 'text!templates/weather.html'
],
function(Backbone, Config, Template) {
 
 var Weather = {};

 Weather.Model = Backbone.Model.extend({
    sync: function(method, model, options) {
    // Default JSON-request options.
    var params = _.extend({
      type:         'GET',
      dataType:     'jsonp',
      url:      model.url(),
      jsonp:    "callback",   // the api requires the jsonp callback name to be this exact name
      processData:  false
    }, options);
 
    // Make the request.
    return $.ajax(params);
  },
  url: function(){
    return 'http://openweathermap.org/data/2.5/weather?lat='+this.get('latitude')+'&lon='+this.get('longitude')+'&APPID='+Config.openweather.appId;
  },
  parse: function(response){
    console.log(response);
    return response;
  }
 });

 Weather.View = Backbone.View.extend({

   template: _.template(Template),

   className : "weather",

   //model: new Weather.Model,

   initialize: function() {
    this.model = new Weather.Model;
   },
   
   render: function() {
     
     var temp_deg = (parseFloat(this.model.get('main').temp)-273.15).toFixed(1);

     this.model.set({
      temp_deg: temp_deg
     });

     this.$el.empty().append(this.template(this.model));
     
     return this;
   }

 });

 return Weather;
});