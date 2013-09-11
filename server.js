var express = require('express')
  , app = express.createServer();

app.use(express.static(__dirname+'/public'));

app.listen(80);