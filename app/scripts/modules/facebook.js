define([
  'backbone',
  'modules/details',
	'text!templates/facebook.html'
  ], function(Backbone, Details, Template) {

  window.Facebook={};

  Facebook.Model = Backbone.Model.extend({
  });

  Facebook.Collection = Backbone.Collection.extend({
  	initialize: function(models, options){
  		this.query=options.query;
      this.radius=options.radius;
      this.access_token=options.access_token;
      this.lat=options.lat;
      this.lon=options.lon;
    },
    url: function(){
      return "https://graph.facebook.com/search?q=" + this.query + "&type=place&limit=5000&center="+ this.lat +","+ this.lon +"&distance="+this.radius+"&access_token=" + this.access_token;
  	},
  	parse : function(response){
  		return response.data;
  	},
    fetch: function(options) {
     options    = options || {};
     var self   = this;
     var params = _.clone(options);

     if (params.data) {
       this.query = params.data.query;
       this.radius=params.data.radius;
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
    _onClickItem:function(e){
      var $el = $('#main');
      var detailsView = new Details.View({
          model : this.model
      });

      detailsView.setElement($el.find('#details'));
      detailsView.render();
    }
  });

  Facebook.ListView = Backbone.View.extend({
    initialize: function(){
      this.collection.on('reset', this.render,this);
    },
    render: function(){
      $('.post-list').empty();
      $('#resultHead').html('Ergebnisse ('+this.collection.length+')');
      this.collection.each(function(post){
        var ItemView=new Facebook.ItemView({model: post});
        $('.post-list').prepend(ItemView.render().el);
      });
      return this;
    }
  });

  return Facebook;
});