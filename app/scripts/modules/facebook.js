define([
  'backbone',
  'modules/details',
  'text!templates/facebookMain.html',
  'text!templates/facebookItem.html',
  'text!templates/facebookDropdownItem.html'
], function(
  Backbone, 
  Details, 
  TemplateMain, 
  TemplateItem, 
  TemplateDropdownItem
) {

  var Facebook = {};

  Facebook.Model = Backbone.Model.extend({ });

  Facebook.Collection = Backbone.Collection.extend({

    initialize: function(){
      this.updatedData = {
        lat          : 0,
        lon          : 0,
        query        : '',
        radius       : 0,
        access_token : ''
      };
    },

    url: function(){
      return "https://graph.facebook.com/search?q="+ this.updatedData.query +"&type=place&limit=1000&center="+ this.updatedData.lat +","+ this.updatedData.lon +"&distance="+this.updatedData.radius+"&access_token=" + this.updatedData.access_token;
    },
    
    parse : function(response){
      var point1 = {
        lat: parseFloat(this.updatedData.lat),
        lon: parseFloat(this.updatedData.lon)
      }

      _.each(response.data, function(place) {

        var point2 = {
          lat: parseFloat(place.location.latitude),
          lon: parseFloat(place.location.longitude)
        }        

        // Calculate the distance between the place and the current location
        place.distance = parseInt(this.calculateDistance(point1, point2) * 1000);
      
        // set the class for the icon
        place.iconClass = this.getIconClass(place.category, place.name);
      
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

    getIconClass: function(category, name) {
      this.category = category;

      var barPattern = name.match(/bar/gi);
      var pubPattern = name.match(/pub/gi);
      var hotelPattern = name.match(/hotel/gi);

      if (hotelPattern || pubPattern) {
        this.category = 'Hotel';
      } 
      if (barPattern || pubPattern) {
        this.category = 'Bar';
      } 

      var icon = {
        "Bar": "beer",
        "Inn": "suitcase",
        "Club": "music",
        "Beach": "umbrella",
        "Hotel": "suitcase",
        "Lounge": "glass",
        "Gay Bar": "glass",
        "Company": "briefcase",
        "Restaurant": "food",
        "Bar & Grill": "beer",
        "Food/grocery": "shopping-cart",
        "Food/beverages": "shopping-cart",
        "Restaurant/cafe": "food",
        "Tours & Sightseeing": "camera",
        "Public Places & Attractions": "camera",
        "Event planning/event services": "calendar"
      };

      var knownCategory = _.has(icon, this.category);

      if (!knownCategory) {
        return 'map-marker';
      }

      return icon[this.category];
    }
  });

  Facebook.MainView = Backbone.View.extend({

    template: _.template(TemplateMain),

    initialize: function() {
      this.model = new Facebook.Model;

      this.collection = new Facebook.Collection();

      this.listenTo(Backbone, 'updateFBCollection', this._onUpdateFBData);    

      this.listenTo(this.collection, 'reset', this.initSubviews); 
    },

    _onUpdateFBData: function(update) {
      this.collection.updatedData = {
        lat          : update.latitude,
        lon          : update.longitude,
        query        : update.searchValue,
        radius       : update.radiusValue,
        access_token : update.access_token
      };
      this.collection.fetch({reset :true});
    },

    render: function(){
      this.$el.empty().append(this.template(this.model));    
      
      return this;
    },

    events: {
      'click .dropdown-trigger': '_onClickDropdownMenu'
    },

    _onClickDropdownMenu: function(e) {
      var $el = $(e.target);

      $el.toggleClass('active')
      $el.siblings('.dropdown-menu').toggle();
    },

    initSubviews: function(collection) {
      // Init ListView
      this.listView = new Facebook.ListView({
        collection: collection
      });
      this.listView.setElement(this.$el.find('.post-list'));
      this.listView.render();

      // Init DropdownView
      this.dropdownListView = new Facebook.DropdownListView({
        collection: collection
      });
      this.dropdownListView.setElement(this.$el.find('.dropdown-menu'));
      this.dropdownListView.render();
      this.dropdownListView.model.on('change:filterItem', this._onUpdateFilter, this);
    },

    _onUpdateFilter: function(filterItems) {
      this.listView.applyFilter(filterItems)
    }

  });

  Facebook.DropdownItemView = Backbone.View.extend({
    
    template: _.template(TemplateDropdownItem),
    
    tagName: 'li',
    
    className: 'list-item',

    initialize: function() {
      this.filterArray = [];
    },

    render: function(){
      this.$el.empty().append(this.template(this.model));
      
      return this;
    },

    events: {
      'change input.category-checkbox': '_onChangeCheckbox'
    },
    
    _onChangeCheckbox:function(e) {
      var item = $(e.target);
      var isChecked = item.is(":checked");
      var category;
      
      if (isChecked) {
        category = this.model.get('category');
      } else {
        category = null;
      }

      this.model.set({ filterItem: category });
    },
    
    getIconClass: function(category) {
      this.category = category;
      
      // if (category === 'Local business') {
      //   console.log(category);
      //   // this.category = category.get('category_list')[0];
      // }

      var barPattern = name.match(/bar/gi);
      var pubPattern = name.match(/pub/gi);

      if (barPattern || pubPattern) {
        this.category = 'Bar';
      } 

      var icon = {
        "Bar": "beer",
        "Inn": "suitcase",
        "Club": "music",
        "Beach": "umbrella",
        "Hotel": "suitcase",
        "Lounge": "glass",
        "Gay Bar": "glass",
        "Company": "briefcase",
        "Restaurant": "food",
        "Bar & Grill": "beer",
        "Food/grocery": "shopping-cart",
        "Food/beverages": "shopping-cart",
        "Restaurant/cafe": "food",
        "Tours & Sightseeing": "camera",
        "Public Places & Attractions": "camera",
        "Event planning/event services": "calendar"
      };

      var knownCategory = _.has(icon, this.category);

      if (!knownCategory) {
        return 'map-marker';
      }

      return icon[this.category];
    },
  });

  Facebook.DropdownListView = Backbone.View.extend({

    initialize: function() { 
      this.model = new Facebook.Model;

      this.collection.on('reset', this.render, this);

      this.filterArray = [];
    },

    render: function(){
      var types = [];
      _.each(this.collection.models, function(model) {
        types.push(model.get('category'));
      })

      var uniqueTypes = _.unique(types);

      for(var i = 0; i < uniqueTypes.length; i++){
        var dropdownItemView = new Facebook.DropdownItemView({
          model: new Facebook.Model
        });
        dropdownItemView.model.set({ category: uniqueTypes[i] })
        $('.dropdown-menu').prepend(dropdownItemView.render().el);
        dropdownItemView.model.on('change:filterItem', this._onUpdateFilter, this);
      };

      return this;
    },

    _onUpdateFilter: function(model) {
      var isChecked = model.get('filterItem');
      var category = model.get('category');
      
      if (isChecked) {
        this.filterArray.push(category);
      } else {
        this.filterArray = _.without(this.filterArray, category);
      }
      this.model.trigger('change:filterItem', this.filterArray, this);
    }
  });

  Facebook.ItemView = Backbone.View.extend({
    
    template: _.template(TemplateItem),
    
    tagName: 'li',
    
    className: 'list-group-item btn btn-small btn-info post-item post',

    initialize: function() {
      this.collection = Facebook.Collection;
    },

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

      Backbone.trigger('highlightFeature', this.model);

      detailsView.setElement($el.find('#details'));
      detailsView.render();
    }
  });

  Facebook.ListView = Backbone.View.extend({
    
    initialize: function(){
      this.listenTo(Backbone, 'clickOnMapMarker', this.clickOnMapMarker);

      this.filterItems = [];
    },

    render: function(){
      $('.post-list').empty();

      if (this.filterItems.length !== 0) {
        var filteredList = this.collection.filter(function(place) {
          var contains = _.contains(this.filterItems, place.get('category'));
          if (contains) {
            return place;
          }
        }, this);
      } else {
        filteredList = this.collection.models;
      }
      
      $('#resultHead span').html(filteredList.length);

      filteredList.forEach(function(place){
        // if (place.get('category') === 'Local business') {
        //   place.set({ category: place.get('category_list')[0].name });
        // }

        var ItemView = new Facebook.ItemView({
          model: place
        });
        $('.post-list').prepend(ItemView.render().el);
      });

      Backbone.trigger('setPlacesToMap', filteredList);

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
    },

    applyFilter: function(filterItems) {
      this.filterItems = filterItems;

      this.render();
    }
  });

  return Facebook;
});