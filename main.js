var config = require('./config');
var Q = require('q');

var API_KEY = config.api_key;
var tag = config.tag;
var page = 1;
var page_size = config.page_size;
var logging = config.logging;

var FSClient = require('./src/fsclient');
var fsc = new FSClient();
fsc.init(API_KEY, tag, page, page_size, logging);
fsc.getSounds();

// uncomment to create public interface
/*var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('todo: create an interface to control the player')
});

app.use(express.static('public'));

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

});*/

