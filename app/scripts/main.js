require.config({	
  paths: {
    'jquery': 'vendor/jquery/jquery',
    'underscore': 'vendor/underscore-amd/underscore',
    'backbone': 'vendor/backbone-amd/backbone',
    'text':'vendor/requirejs/text',
    'facebook': '//connect.facebook.net/en_US/all',
    'config'      : 'config'  
  },
   shim: {
    'facebook' : {
      export: 'FB'
    },
    'config': {
      exports: 'Config'
    }
  }
});

require(['app'], function(App) {
	var app = new App.View;
	app.render();
});