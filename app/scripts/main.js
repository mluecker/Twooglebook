require.config({	
  paths: {
<<<<<<< HEAD
    'jquery': 'vendor/jquery/jquery',
    'underscore': 'vendor/underscore-amd/underscore',
    'backbone': 'vendor/backbone-amd/backbone',
    'text':'vendor/requirejs/text',
    'openlayers'  : 'vendor/openlayers/ol',
    'facebook': '//connect.facebook.net/en_US/all',
=======
    'jquery'      : 'vendor/jquery/jquery',
    'underscore'  : 'vendor/underscore-amd/underscore',
    'backbone'    : 'vendor/backbone-amd/backbone',
    'text'        :'vendor/requirejs/text',
    'openlayers'  : 'vendor/openlayers/ol',
    'facebook'    : '//connect.facebook.net/en_US/all',
>>>>>>> c5de947228f73558adc2fcf91d1151229584d1ab
    'config'      : 'config'  
  },
   shim: {
    'vendor/openlayers/openlayers': {
      exports: 'ol'
    },
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