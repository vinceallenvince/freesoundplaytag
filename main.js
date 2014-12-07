var Q = require('q');
var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.use(express.static('public'));

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

});

//
var API_KEY = "f374d3f2ba6edc42051212d1f84268f02a63e222";

var Player = require('player');
var FSClient = require('./src/fsclient');

var previews;
var tag = "dogs";
var page = 1;

var fsc = new FSClient();
fsc.init(API_KEY);

function getSounds(tag, page) {
  Q.fcall(fsc.getSounds.bind(fsc, tag, page)).
  fail(fail).
  done(playSounds);
}

function playSounds(data) {

  console.log('received ' + data.previews.length + ' sounds.');

  previews = data.previews;

  var player = new Player(previews);

  player.play(function(error) {
    console.log('all songs play end');
    page++;
    getSounds(tag, page);
  });

  player.on('playing', function(song) {
    console.log('playing: ' + song.src);
  });

  player.on('error', function(error) {
    //console.log(error);
  });
}

function fail(error) {
  console.log(error);
}

getSounds(tag, page);


