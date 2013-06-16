define([
  'backbone',
	'text!templates/facebook.html'
  ], function(Backbone, Template) {

  window.Facebook={};

  Facebook.Model = Backbone.Model.extend({
  });

  Facebook.Collection = Backbone.Collection.extend({
    model: Facebook.Model,
  	initialize: function(models, options){
  		this.query="NBA";
    },
    url: function(){
  		return "https://graph.facebook.com/search?q="+this.query+"&type=post";
  	},
  	parse : function(response){
  		return response.data;
  	}
  });

  Facebook.ItemView = Backbone.View.extend({
    template: _.template(Template),
    tagName: 'li',
    className: 'post',

    render: function(){
      this.$el.empty().append(this.template(this.model));
      return this;
    }
  });

  Facebook.ListView = Backbone.View.extend({
    initialize: function(){
      var self = this;
      this.collection = new Facebook.Collection;
      this.collection.fetch({
        success: function(){
          self.render();
        }
      });
    },
    render: function(){
      this.collection.each(function(post){
        var ItemView=new Facebook.ItemView({model: post});
        $('.post-list').prepend(ItemView.render().el);
      });
      return this;
    }
  });

  return Facebook;
});