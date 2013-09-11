define(['facebook', 'config'], function(){
  FB.init({
    appId : Config.facebook.appId,
    channelUrl : Config.facebook.channelUrl
  });
  FB.getLoginStatus(function(response) {
    Backbone.trigger('setAccess_Token', response.authResponse.accessToken);
  });
});