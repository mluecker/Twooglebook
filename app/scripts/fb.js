define(['facebook', 'config'], function(){
  
  FB.Event.subscribe('auth.statusChange', function (response) {
    var hasAccessToken = response.authResponse ? true : false;
    if(hasAccessToken){
      Backbone.trigger('setAccess_Token',response.authResponse.accessToken);
    }
    
  });

  FB.init({
    appId : Config.facebook.appId,
    channelUrl : Config.facebook.channelUrl,
    status: true, // check login status
    cookie: true, // enable cookies to allow the server to access the session
    xfbml: true  // parse XFBML
  });

});