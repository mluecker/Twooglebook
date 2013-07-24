require.config({  
  paths: {
    'jquery'      : 'vendor/jquery/jquery',
    'underscore'  : 'vendor/underscore-amd/underscore',
    'backbone'    : 'vendor/backbone-amd/backbone',
    'text'        : 'vendor/text/text',
    'openlayers'  : 'vendor/openlayers/openlayers',
    'facebook'    : '//connect.facebook.net/en_US/all',
    'config'      : 'config'  
  },
   shim: {
    'vendor/openlayers/openlayers': {
      exports: 'ol'
    },
    'facebook' : {
      exports: 'FB'
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
