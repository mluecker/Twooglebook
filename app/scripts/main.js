require.config({  
  paths: {
    'jquery'      : 'vendor/jquery/jquery',
    'bootstrap'   : 'vendor/bootstrap/dist/js/bootstrap',
    'underscore'  : 'vendor/underscore-amd/underscore',
    'backbone'    : 'vendor/backbone-amd/backbone',
    'text'        : 'vendor/text/text',
    'openlayers'  : 'vendor/openlayers/openlayers',
    'facebook'    : '//connect.facebook.net/en_US/all',
    'config'      : 'config',
    'nprogress'   : 'vendor/nprogress/nprogress'
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
    },
    'nprogress' : {
      deps: ['jquery'],
      exports: 'nprogress'
    }
  }
});

require(['app'], function(App) {
  var app = new App.View;
  app.render();
});
