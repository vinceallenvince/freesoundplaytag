var Q = require('q');
var request = require('request');

function FSClient() {
  this.baseURL = "http://www.freesound.org/apiv2/";
}

FSClient.prototype.init = function(apikey) {
  if (!apikey) throw new Error('FSClient.init requires apikey argument.');
  this.apikey = apikey;
};

FSClient.prototype.getSounds = function(opt_tag, opt_page) {
  console.log('getting sounds...');
  var deferred = Q.defer();

  var tag = opt_tag || "bark";
  var endpoint = "search/text/";
  var page = opt_page || 1;
  var query = "?query=" + tag + "&page=" + page;

  Q.fcall(this.makeQuery.bind(this, endpoint, query)).
  then(this.doneGetSounds.bind(this)).
  fail(this.fail.bind(this)).
  done(function(data) {
    deferred.resolve({
      previews: data.previews
    })
  });

  return deferred.promise;
};

FSClient.prototype.doneGetSounds = function(data) {

  console.log('fetching ' + data.data.results.length + ' of ' + data.data.count + ' total sounds...');

  var deferred = Q.defer();

  var results = data.data.results;
  var soundIds = [];
  for (var i = 0, max = results.length; i < max; i++) {
    soundIds.push(results[i].id);
  }
  this.getPreviewsAll(soundIds, deferred);
  return deferred.promise;
};

FSClient.prototype.getPreviewsAll = function(soundIds, deferred) {
  var promises = [];
  for (var i = 0, max = soundIds.length; i < max; i++) {

    var endpoint = "sounds/" + soundIds[i] + "/";
    var query = "?query=";

    promises.push(this.makeQuery(endpoint, query));
  }

  var allPromise = Q.all(promises);
  allPromise.
    then(this.handleGetPreviewsAll.bind(this, deferred)).
    fail(this.fail.bind(this));
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

FSClient.prototype.fail = function(error) {
  console.log('FAIL!');
  console.log(error);
};

module.exports = FSClient;
