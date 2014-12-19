var Q = require('q');
var request = require('request');
var Player = require('player');
var fs = require('fs');
var Log = require('log');
var path = require('path');
var appDir = path.dirname(require.main.filename);
console.log(appDir);

// TODO: check if we should delete some log files

/**
 * Creates a new FSClient. An FSClient makes queries against
 * the freesound.org api and plays sounds based on the results.
 * @constructor
 */
function FSClient() {
  this.baseURL = 'http://www.freesound.org/apiv2/';
  this.basePreviewURL = 'http://www.freesound.org/data/previews/'
  this.previews = null;
  this.player = null;
  this.count = null;
  this.totalSoundsPlayed = 0;
  this.logger = new Log();
}

/**
 * Initializes an instance of FSClient.
 * @param {string} apikey A freesound.org api key.
 * @param {string} [opt_tag='bark'] A freesounds tag describing sounds.
 * @param {number} [opt_page=1] The initial page of returned results.
 * @param {number} [opt_page_size=15] The number of results per page.
 * @param {boolean} [opt_logging=false] Set to true to enable logging.
 */
FSClient.prototype.init = function(apikey, opt_tag, opt_page, opt_page_size, opt_logging) {
  if (!apikey) throw new Error('FSClient.init requires apikey argument.');
  this.apikey = apikey;
  this.tag = opt_tag || 'bark';
  this.page = opt_page || 1;
  this.page_size = opt_page_size || 15;
  this.logging = !!opt_logging;
  if (this.logging) {
    this.logger = new Log('debug', fs.createWriteStream(appDir + '/logs/fsclient' + Date.now() + '.log'));
  }
};

/**
 * Construct a query to retrieve sounds ids.
 */
FSClient.prototype.getSounds = function() {

  this.logger.debug('getting %d sound ids for page %d', this.page_size, this.page);

  var endpoint = "search/text/";
  var query = "?query=" + this.tag + "&page=" + this.page + "&page_size=" + this.page_size;

  Q.fcall(this.makeQuery.bind(this, endpoint, query)).
  then(this.handleGetSounds.bind(this)). // TODO: rename handleGetSoundIds
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

  if (!data) {
    var msg = 'FSClient.playSounds missing data argument';
    this.fail({message: msg});
  }
  this.logger.debug('received %d preview urls', data.previews.length);

  var previews = data.previews;

  if (!this.player) {
    this.player = new Player(previews);
    this.addPlayerEvents();
    this.player.play(this.handlePlaylistEnd.bind(this));
  } else {
    this.player.stop();
    for (var i = 0, max = previews.length; i < max; i++) {
      this.player.add(previews[i]);
    }
    this.player.play();
  }
};

/**
 * Iterates over passed data and creates a list of soundIds.
 * @param {Object} data Response from freesound api.
 */
FSClient.prototype.handleGetSounds = function(data) {

  if (!data) {
    var msg = 'FSClient.handleGetSounds missing data argument';
    this.fail({message: msg});
  }

  if (!this.totalSoundsPlayed) {
      this.logger.info('%d total sounds for tag \'%s\'', data.data.count, this.tag);
  }
  this.logger.debug('received %d sound ids', data.data.results.length);

  var deferred = Q.defer();

  this.count = data.data.count;

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

/**
 * Iterates over passed sounds ids, makes queries and joins
 * all the returned promises.
 * @param  {Object} data A map of properties.
 * @return {Object}      A promise.
 * @throws {Error} If data is not passed.
 */
FSClient.prototype.getPreviewsAll = function(data) {

  if (!data) {
    var msg = 'FSClient.getPreviewsAll missing data argument';
    this.fail({message: msg});
  }
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

/**
 * Iterates over passed data and builds an array
 * of preview urls.
 * @param  {Object} deferred A promise.
 * @param  {Object} data     A map of properties.
 */
FSClient.prototype.handleGetPreviewsAll = function(deferred, data) {
  if (!data) {
    var msg = 'FSClient.handleGetPreviewsAll missing data argument';
    this.fail({message: msg});
  }

  var previews = [];
  for (var i = 0, max = data.length; i < max; i++) {
    previews.push(data[i].data.previews["preview-lq-mp3"]);
  }

  deferred.resolve({
    previews: previews
  });
};

/**
 * Makes an api call.
 * @param  {string} endpoint An api endpoint.
 * @param  {string} query    A query.
 * @return {Object}          A promise.
 */
FSClient.prototype.makeQuery = function(endpoint, query) {

  if (!endpoint || !query) {
    var msg = 'FSClient.makeQuery requires endpoint and query arguments';
    this.fail({message: msg});
  }

  var deferred = Q.defer();
  var key = "&token=" + this.apikey;
  request(this.baseURL + endpoint + query + key, this.handleMakeQuery.bind(this, deferred));
  return deferred.promise;
};

/**
 * Checks for query errors and parses response.
 * @param  {Object} deferred A promise.
 * @param  {Object} error    An error.
 * @param  {number} response A response code.
 * @param  {string} body     Query results.
 */
FSClient.prototype.handleMakeQuery = function(deferred, error, response, body) {
  if (!error && response.statusCode == 200) {
    var data = JSON.parse(body);
    deferred.resolve({
      data: data
    });
  } else if (error) {
    deferred.reject(error);
  } else {
    deferred.reject({
      message: 'statusCode: ' + response.statusCode
    });
  }
  this.logger.debug('handleMakeQuery statusCode: %d', response.statusCode);
};

/**
 * Should check page limit and make calls to
 * get more sounds.
 * @param  {Object} error An error object.
 */
FSClient.prototype.handlePlaylistEnd = function(error) {
  if (error) {
    this.logger.error('handlePlaylistEnd %s', error.message);
    throw new Error('handlePlaylistEnd', error);
  }
  this.logger.debug('playlist ended');
  this.logger.info('played %d total sounds', this.totalSoundsPlayed);
  var totalPages = Math.ceil(this.count / this.page_size);
  if (this.page === totalPages) {
    this.page = 1;
    this.player = null;
    this.logger.info('played all available sounds');
    this.logger.info('resetting player');
    this.logger.info('setting current page to 1');
  } else {
    this.page++;
  }
  this.getSounds();
};

/**
 * Adds events to the player.
 */
FSClient.prototype.addPlayerEvents = function() {
  this.player.on('playing', this.handlePlayerPlaying.bind(this));
  this.player.on('error', this.handlePlayerError.bind(this));
};

/**
 * Logs currently playing song.
 * @param  {Object} song A map of properties representing a song.
 */
FSClient.prototype.handlePlayerPlaying = function(song) {
  this.logger.info('playing %s', song.src.replace(this.basePreviewURL, ''));
  this.totalSoundsPlayed++; // TODO: test this
};

/**
 * Logs player errors.
 * @param  {Object} error An error object.
 */
FSClient.prototype.handlePlayerError = function(error) {
  this.logger.error(error.message);
};

/**
 * Logs query failures.
 * @param  {Object} error An error object.
 */
FSClient.prototype.fail = function(error) {
  var msg = error ? error.message : 'unknown error';
  this.logger.error('FSClient.fail ', msg);
  throw new Error('FSClient.fail ', msg);
};

module.exports = FSClient;
