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
    e.stopPropagation();

    var searchValue = this.$el.find('#appendedInputButton').val();
    var radiusValue = this.$el.find('#radius').val();

    if(radiusValue == ""){
      radiusValue = 5000;
    }
  
    if(parseInt(radiusValue) > 50000){
      radiusValue = 50000;
      this.$el.find('#radius').val('50000');
    }

    var searchValues = {
      searchValue: searchValue,
      radiusValue: radiusValue
    }

    Backbone.trigger('newSearch', searchValues);
    // this.model.set({ 
    //   searchValue: searchValue,
    //   radiusValue: radiusValue
    // });
   }

 });

 return Search;
});
