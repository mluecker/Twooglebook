require.config({
  paths: {
    'jquery': 'vendor/jquery/jquery',
    'underscore': 'vendor/underscore-amd/underscore',
    'backbone': 'vendor/backbone-amd/backbone',
    'text':'vendor/requirejs/text'
  }
});

require(['modules/facebook'], function(Facebook) {
	new Facebook.ListView;
});