var expect = require('expect.js');
var sinon = require('sinon');
var Q = require('q');

var FSClient = require('../src/fsclient');
var Player = require('player');

describe('FSClient', function() {

  describe('Basics', function() {

    it('should load.', function() {
      var fsc = new FSClient();
      expect(fsc instanceof FSClient).to.be(true);
    });
  });

  describe('Init', function() {

    it('should initialize.', function() {
      var fsc = new FSClient();
      var fnA = function() {
        fsc.init();
      }
      expect(fnA).to.throwError();

      var stubGetSounds = sinon.stub(fsc, 'getSounds');
      var stubPlaySounds = sinon.stub(fsc, 'playSounds');

      fsc.init('123');
      expect(fsc.tag).to.equal('bark');
      expect(fsc.page).to.equal(1);
      expect(fsc.page_size).to.equal(15);

      fsc.init('123', 'ocean', 3, 20);
      expect(fsc.tag).to.equal('ocean');
      expect(fsc.page).to.equal(3);
      expect(fsc.page_size).to.equal(20);

      sinon.restore(fsc.getSounds);
      sinon.restore(fsc.playSounds);

    });
  });

  describe('getSounds', function() {

    it('should construct a query and call makeQuery.', function(done) {

      var fsc = new FSClient();

      var stubMakeQuery = sinon.stub(fsc, 'makeQuery');
      var stubHandleGetSounds = sinon.stub(fsc, 'handleGetSounds');
      var stubGetPreviewsAll = sinon.stub(fsc, 'getPreviewsAll');
      var stubPlaySounds = sinon.stub(fsc, 'playSounds');

      fsc.apikey = '123';
      fsc.tag = 'santa';
      fsc.page = 3;
      fsc.page_size = 15;
      fsc.getSounds();

      setTimeout(function() {
        expect(stubMakeQuery.calledOnce).to.be(true);
        expect(stubMakeQuery.args[0][0]).to.equal('search/text/');
        expect(stubMakeQuery.args[0][1]).to.equal('?query=santa&page=3&page_size=15');

        sinon.restore(fsc.makeQuery);
        sinon.restore(fsc.handleGetSounds);
        sinon.restore(fsc.getPreviewsAll);
        sinon.restore(fsc.playSounds);

        done();
      }, 10);
    });
  });

  describe('playSounds', function() {

    it('should creates a new Player instance with the passed data as a list of preview urls.', function() {

      var fsc = new FSClient();
      fsc.apikey = '123';
      fsc.tag = 'santa';
      fsc.page = 3;

      fnA = function() {
        fsc.playSounds();
      };
      expect(fnA).to.throwError();

      var data = {
        previews: [
          'http://mypreviews/1.mp3',
          'http://mypreviews/2.mp3',
          'http://mypreviews/3.mp3'
        ]
      };
      var stubAddPlayerEvents = sinon.stub(fsc, 'addPlayerEvents');
      var stubHandlePlaylistEnd = sinon.stub(fsc, 'handlePlaylistEnd');
      fsc.playSounds(data);
      expect(fsc.player instanceof Player).to.be(true);
      expect(stubAddPlayerEvents.called).to.be(true);

      // Call when player already exists.
      var fsc = new FSClient();
      fsc.apikey = '123';
      fsc.tag = 'santa';
      fsc.page = 3;
      fsc.player = new Player(data.previews);
      var stubPlayerPlay = sinon.stub(fsc.player, 'play');
      var stubPlayerAdd = sinon.stub(fsc.player, 'add');

      fsc.playSounds(data);
      expect(stubPlayerAdd.called).to.be(true);
      expect(stubPlayerPlay.called).to.be(true);

      sinon.restore(fsc, 'addPlayerEvents');
      sinon.restore(fsc, 'handlePlaylistEnd');
    });
  });

  describe('handleGetSounds', function() {

    it('should iterates over passed data and creates a list of soundIds.', function() {

      var fsc = new FSClient();
      var data = {
        data: {
          count: 345,
          results: [
            {id: 100},
            {id: 200},
            {id: 300}
          ]
        }
      };
      var fnA = function() {
        fsc.handleGetSounds();
      }
      expect(fnA).to.throwError();

      fsc.handleGetSounds(data);
      expect(fsc.count).to.be(345);

      //
      fsc.totalSoundsPlayed = 100;
      var spyLog = sinon.spy(fsc.logger, 'debug');
      fsc.handleGetSounds(data);
      expect(spyLog.calledOnce).to.be(true);

      fsc.logger.debug.restore();
    });
  });

  describe('getPreviewsAll', function() {

    it('should iterate over passed sounds ids, make queries and join all the returned promises.', function() {

      var fsc = new FSClient();
      var data = {
        soundIds: [1, 2, 3, 4, 5]
      };
      var fnA = function() {
        fsc.getPreviewsAll();
      }
      expect(fnA).to.throwError();

      var stubMakeQuery = sinon.stub(fsc, 'makeQuery');
      var stubHandleGetPreviewsAll = sinon.stub(fsc, 'handleGetPreviewsAll');
      var promise = fsc.getPreviewsAll(data);
      expect(stubMakeQuery.args.length).to.be(5);
    });
  });

  describe('handleGetPreviewsAll', function() {

    it('should iterate over passed data and build an array of preview urls.', function() {

      var fsc = new FSClient();
      var fnA = function() {
        fsc.handleGetPreviewsAll();
      }
      expect(fnA).to.throwError();

      var data = [
        {
          data: {
            previews: {
              "preview-lq-mp3": "http://mypreviews/1.mp3"
            }
          }
        }
      ];
      var resolved = false;
      var resolve = function() {
        resolved = true;
      };

      fsc.handleGetPreviewsAll({resolve: resolve}, data);
      expect(resolved).to.be(true);
    });
  });

  describe('makeQuery', function() {

    it('should make an api call.', function() {

      var fsc = new FSClient();
      var fnA = function() {
        fsc.makeQuery();
      }
      expect(fnA).to.throwError();

      var endpoint = "search/text/";
      var query = "?query=dogs&page=1";

      fsc.makeQuery(endpoint, query);

    });
  });

  describe('handleMakeQuery', function() {

    it('should make an api call.', function() {

      var fsc = new FSClient();
      var resolved = false;
      var resolve = function() {
        resolved = true;
      };
      var rejected = false;
      var reject = function() {
        rejected = true;
      };

      fsc.handleMakeQuery({resolve: resolve, reject: reject}, null, {statusCode: 200}, "{}");
      expect(resolved).to.be(true);

      fsc.handleMakeQuery({resolve: resolve, reject: reject}, {}, {statusCode: 200}, "{}");
      expect(rejected).to.be(true);
    });
  });

  describe('handlePlaylistEnd', function() {

    it('Should check page limit and make calls to get more sounds.', function() {
      var fsc = new FSClient();
      var fnA = function() {
        fsc.handlePlaylistEnd({message: 'error!'});
      }
      expect(fnA).to.throwError();

      var stubGetSounds = sinon.stub(fsc, 'getSounds');
      fsc.page = 2;
      fsc.count = 100;
      fsc.page_size = 15;
      fsc.handlePlaylistEnd();
      expect(fsc.page).to.be(3);
      expect(stubGetSounds.called).to.be(true);

      fsc.page = 7;
      fsc.count = 100;
      fsc.page_size = 15;
      fsc.handlePlaylistEnd();
      expect(fsc.page).to.be(1);
      expect(fsc.player).to.be(null);

      sinon.restore(fsc, 'getSounds');
    });
  });

  describe('addPlayerEvents', function() {

    it('Should check page limit and make calls to get more sounds.', function() {
      var fsc = new FSClient();

      var stubHandlePlayerPlaying = sinon.stub(fsc, 'handlePlayerPlaying');

      fsc.player = new Player();
      fsc.addPlayerEvents();
      expect(fsc.player._events['playing']).to.be.ok();
      expect(fsc.player._events['error']).to.be.ok();

      sinon.restore(fsc, 'handlePlayerPlaying');
    });
  });

  describe('handlePlayerPlaying', function() {

    it('Logs currently playing song.', function() {
      var fsc = new FSClient();
      var stubLog = sinon.stub(fsc.logger, 'info');
      fsc.handlePlayerPlaying({src: 'http://mypreviews/1.mp3'});
      expect(stubLog.called).to.be(true);
      sinon.restore(fsc.logger, 'info');
    });
  });

  describe('handlePlayerError', function() {

    it('Logs currently playing song.', function() {
      var fsc = new FSClient();
      var stubLog = sinon.stub(fsc.logger, 'error');
      fsc.handlePlayerError({message: 'error!'});
      expect(stubLog.called).to.be(true);
      sinon.restore(fsc.logger, 'error');
    });
  });

  describe('fail', function() {

    it('Logs currently playing song.', function() {
      var fsc = new FSClient();
      var stubLog = sinon.stub(fsc.logger, 'error');
      fsc.fail({message: 'error!'});
      expect(stubLog.called).to.be(true);
      sinon.restore(fsc.logger, 'error');
    });
  });

});