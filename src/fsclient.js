var Q = require('q');
var request = require('request');
var Player = require('player');

/**
 * Creates a new FSClient. An FSClient makes queries against
 * the freesound.org api and plays sounds based on the results.
 * @constructor
 */
function FSClient() {
  this.baseURL = "http://www.freesound.org/apiv2/";
  this.page = 1;
  this.previews = null;
  this.player = null;
}

/**
 * Initializes an instance of FSClient.
 * @param {string} apikey A freesound.org api key.
 * @param {string} [opt_tag='bark'] A freesounds tag describing sounds.
 * @param {number} [opt_page=1] The initial page of returned results.
 */
FSClient.prototype.init = function(apikey, opt_tag, opt_page) {
  if (!apikey) throw new Error('FSClient.init requires apikey argument.');
  this.apikey = apikey;
  this.tag = opt_tag || "bark";
  this.page = opt_page || 1;

};

/**
 * Construct a query to retrieve sounds ids.
 */
FSClient.prototype.getSounds = function() {

  console.log('getting sound ids...');

  var endpoint = "search/text/";
  var query = "?query=" + this.tag + "&page=" + this.page;

  Q.fcall(this.makeQuery.bind(this, endpoint, query)).
  then(this.doneGetSounds.bind(this)). // TODO: rename handleGetSoundIds
  then(this.getPreviewsAll.bind(this)).
  fail(this.fail.bind(this)).
  done(this.playSounds.bind(this));
};

/**
 * If a Player instance does not exist, creates a new Player instance
 * with the passed data as a list of preview urls. If player exists,
 * the function appends the previews to the current playlist.
 * @param {Object} data An a array of preview urls.
 */
FSClient.prototype.playSounds = function(data) {
  if (!data) throw Error('playSounds requires data.');

  console.log('received ' + data.previews.length + ' previews.');

  var previews = data.previews;

  if (!this.player) {
    this.player = new Player(previews);
    this.addPlayerEvents();
  } else {
    this.player.add(previews);
  }

  this.player.play(this.handlePlaylistEnd.bind(this));
};

/**
 * Iterates over passed data and creates a list of soundIds.
 * @param {Object} data Response from freesound api.
 */
FSClient.prototype.doneGetSounds = function(data) {

  console.log('fetching ' + data.data.results.length + ' of ' + data.data.count + ' total sounds...');

  var deferred = Q.defer();

  var results = data.data.results;
  var soundIds = [];
  for (var i = 0, max = results.length; i < max; i++) {
    soundIds.push(results[i].id);
  }

  deferred.resolve({
    soundIds: soundIds
  });

  return deferred.promise;
};

FSClient.prototype.getPreviewsAll = function(data) {

  var deferred = Q.defer();

  var soundIds = data.soundIds;
  var promises = [];
  for (var i = 0, max = soundIds.length; i < max; i++) {

    var endpoint = "sounds/" + soundIds[i] + "/";
    var query = "?query=";

    promises.push(this.makeQuery(endpoint, query));
  }

  var allPromise = Q.all(promises);
  allPromise.
    then(this.handleGetPreviewsAll.bind(this, deferred)).
    fail(this.fail.bind(this)).
    done(function(data) {
      deferred.resolve({
        data: data
      });
    });

  return deferred.promise;
};

FSClient.prototype.handleGetPreviewsAll = function(deferred, data) {

  var previews = [];
  for (var i = 0, max = data.length; i < max; i++) {
    previews.push(data[i].data.previews["preview-lq-mp3"]);
  }

  deferred.resolve({
    previews: previews
  });

};

FSClient.prototype.makeQuery = function(endpoint, query) {
  console.log(endpoint);
  var deferred = Q.defer();
  var key = "&token=" + this.apikey;
  request(this.baseURL + endpoint + query + key, this.handleMakeQuery.bind(this, deferred));
  return deferred.promise;
};

FSClient.prototype.handleMakeQuery = function(deferred, error, response, body) {
  if (!error && response.statusCode == 200) {
    var data = JSON.parse(body);
    deferred.resolve({
      data: data
    });
  } else if (error) {
    deferred.reject(error);
  }
};

FSClient.prototype.handlePlaylistEnd = function(error) {
  console.log('all songs play end');
  this.page++; // TODO: check if we've reached the last page
  this.getSounds();
};

FSClient.prototype.addPlayerEvents = function() {
  this.player.on('playing', this.handlePlayerPlaying);
  this.player.on('error', this.handlePlayerError);
};

FSClient.prototype.handlePlayerPlaying = function(song) {
  console.log('playing: ' + song.src);
};

FSClient.prototype.handlePlayerError = function(error) {
  console.log(error);
};

FSClient.prototype.fail = function(error) {
  console.log(error);
};

module.exports = FSClient;
