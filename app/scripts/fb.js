define(['facebook'], function(){
  FB.init({
    appId      : '285107258299628',
    channelUrl : 'http://twooglebuk.de/'
  });
  FB.getLoginStatus(function(response) {
    Backbone.trigger('setAccess_Token',response.authResponse.accessToken);
  });
});