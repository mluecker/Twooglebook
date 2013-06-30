 define([
 'backbone',
 'text!templates/search.html'
],
function(Backbone, Template) {
 
 var Search = {};

 Search.Model = Backbone.Model.extend({});

 Search.View = Backbone.View.extend({

   template: _.template(Template),

   className : "search",

   model: new Search.Model,

   initialize: function() {
     this.render();
   },

   events: {
     'click .search-place': '_onSubmit'
   },
   
   render: function() {
     this.$el.empty().append(this.template(this.model));
     
     return this;
   },

   _onSubmit: function(e) {
     e.preventDefault();

     var searchValue = this.$el.find('#appendedInputButton').val();
     //var whereValue = this.$el.find('#where').val();
     var radiusValue = this.$el.find('#radius').val();

     if(radiusValue == ""){
      radiusValue=5000;
     }

     this.model.set({ 
        searchValue: searchValue,
        //whereValue: whereValue,
        radiusValue: radiusValue
      });
   }

 });

 return Search;
});