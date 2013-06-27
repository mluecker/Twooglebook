require.config({	
  paths: {
    'jquery': 'vendor/jquery/jquery',
    'underscore': 'vendor/underscore-amd/underscore',
    'backbone': 'vendor/backbone-amd/backbone',
    'text':'vendor/requirejs/text',
    'facebook': '//connect.facebook.net/en_US/all'
  },
   shim: {
    'facebook' : {
      export: 'FB'
    }
  }
});

require(['app'], function(App) {
	var app = new App.View;
	app.render();
});