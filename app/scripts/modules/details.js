 define([
 'backbone',
 'modules/facebook',
 'text!templates/details.html'
],
function(Backbone, Facebook, Template) {
 
 var Details = {};

 Details.Model = Backbone.Model.extend({});

 Details.View = Backbone.View.extend({

   template: _.template(Template),

   className : "details",

   model: new Details.Model,

   initialize: function() {
     this.render();
   },

   render: function() {
     this.$el.empty().append(this.template(this.model));
     
     return this;
   }

 });

 return Details;
});