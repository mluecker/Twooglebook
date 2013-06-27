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

     var searchValue = this.$el.find('.search-query').val();

     this.model.set({ searchValue: searchValue });
   }

 });

 return Search;
});