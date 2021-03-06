/** @module adaptermanger */

var RubiconAdapter = require('./adapters/rubicon.js');
var AppNexusAdapter = require('./adapters/appnexus.js');
var AolAdapter = require('./adapters/aol');
var OpenxAdapter = require('./adapters/openx');
var PubmaticAdapter = require('./adapters/pubmatic.js');
var CriteoAdapter = require('./adapters/criteo');
var YieldbotAdapter = require('./adapters/yieldbot');
var IndexExchange = require('./adapters/indexExchange');
var Sovrn = require('./adapters/sovrn');
var PulsePointAdapter = require('./adapters/pulsepoint.js');
var SpringServeAdapter = require('./adapters/springserve.js');
var bidmanager = require('./bidmanager.js');
var utils = require('./utils.js');
var CONSTANTS = require('./constants.json');
var events = require('./events');

var _bidderRegistry = {};
exports.bidderRegistry = _bidderRegistry;


exports.callBids = function(bidderArr) {
	for (var i = 0; i < bidderArr.length; i++) {
		//use the bidder code to identify which function to call
		var bidder = bidderArr[i];
		if (bidder.bidderCode && _bidderRegistry[bidder.bidderCode]) {
			utils.logMessage('CALLING BIDDER ======= ' + bidder.bidderCode);
			var currentBidder = _bidderRegistry[bidder.bidderCode];
			//emit 'bidRequested' event
			events.emit(CONSTANTS.EVENTS.BID_REQUESTED, bidder);
			currentBidder.callBids(bidder);

			// if the bidder didn't explicitly set the number of bids
			// expected, default to the number of bids passed into the bidder
			if (bidmanager.getExpectedBidsCount(bidder.bidderCode) === undefined) {
				bidmanager.setExpectedBidsCount(bidder.bidderCode, bidder.bids.length);
			}

			var currentTime = new Date().getTime();
			bidmanager.registerBidRequestTime(bidder.bidderCode, currentTime);

			if (currentBidder.defaultBidderSettings) {
				bidmanager.registerDefaultBidderSetting(bidder.bidderCode, currentBidder.defaultBidderSettings);
			}
		}
		else{
			utils.logError('Adapter trying to be called which does not exist: ' + bidder.bidderCode, 'adaptermanager.callBids');
		}
	}
};


exports.registerBidAdapter = function(bidAdaptor, bidderCode) {
	if (bidAdaptor && bidderCode) {

		if (typeof bidAdaptor.callBids === CONSTANTS.objectType_function) {
			_bidderRegistry[bidderCode] = bidAdaptor;

		} else {
			utils.logError('Bidder adaptor error for bidder code: ' + bidderCode + 'bidder must implement a callBids() function');
		}
		
	} else {
		utils.logError('bidAdaptor or bidderCode not specified');
	}
};

exports.aliasBidAdapter = function(bidderCode, alias){
	var existingAlias = _bidderRegistry[alias];

	if(typeof existingAlias === CONSTANTS.objectType_undefined){
		var bidAdaptor = _bidderRegistry[bidderCode];

		if(typeof bidAdaptor === CONSTANTS.objectType_undefined){
			utils.logError('bidderCode "' + bidderCode + '" is not an existing bidder.', 'adaptermanager.aliasBidAdapter');
		}else{
			try{
				var newAdapter = bidAdaptor.createNew();
				newAdapter.setBidderCode(alias);
				this.registerBidAdapter(newAdapter,alias);
			}catch(e){
				utils.logError(bidderCode + ' bidder does not currently support aliasing.', 'adaptermanager.aliasBidAdapter');
			}
		}
	}else{
		utils.logMessage('alias name "' + alias + '" has been already specified.');
	}
};


// Register the bid adaptors here
this.registerBidAdapter(RubiconAdapter(), 'rubicon');
this.registerBidAdapter(AppNexusAdapter.createNew(), 'appnexus');
this.registerBidAdapter(OpenxAdapter(), 'openx');
this.registerBidAdapter(PubmaticAdapter(), 'pubmatic');
this.registerBidAdapter(CriteoAdapter(), 'criteo');
this.registerBidAdapter(YieldbotAdapter(), 'yieldbot');
this.registerBidAdapter(IndexExchange(), 'indexExchange');
this.registerBidAdapter(SpringServeAdapter(), 'springserve');
this.registerBidAdapter(Sovrn(),'sovrn');
this.registerBidAdapter(AolAdapter(), 'aol');
this.registerBidAdapter(PulsePointAdapter(),'pulsepoint');
