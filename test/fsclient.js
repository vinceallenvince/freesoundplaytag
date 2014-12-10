var expect = require('expect.js');
var sinon = require('sinon');

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

      fsc.init('123', 'ocean', 3);
      expect(fsc.tag).to.equal('ocean');
      expect(fsc.page).to.equal(3);

      sinon.restore(fsc.getSounds);
      sinon.restore(fsc.playSounds);

    });
  });

  describe('getSounds', function() {

    it('should construct a query and call makeQuery.', function(done) {

      var fsc = new FSClient();

      var stubMakeQuery = sinon.stub(fsc, 'makeQuery');
      var stubDoneGetSounds = sinon.stub(fsc, 'doneGetSounds');
      var stubDoneGetPreviewsAll = sinon.stub(fsc, 'doneGetPreviewsAll');

      fsc.apikey = '123';
      fsc.tag = 'santa';
      fsc.page = 3;
      fsc.getSounds();

      setTimeout(function() {
        expect(stubMakeQuery.calledOnce).to.be(true);
        expect(stubMakeQuery.args[0][0]).to.equal('search/text/');
        expect(stubMakeQuery.args[0][1]).to.equal('?query=santa&page=3');
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
      //var stubHandlePlaylistEnd = sinon.stub(fsc, 'handlePlaylistEnd');

      fsc.playSounds(data);
      expect(stubPlayerAdd.called).to.be(true);
      expect(stubPlayerPlay.called).to.be(true);

    });
  });

});