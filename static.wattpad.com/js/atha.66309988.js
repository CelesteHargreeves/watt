// atha.js
//
// this file contains all the functions available to send atha (ad tech health assesment)
// events into our backend for tracking.
//
var __atha = function() {
    var startTimeField = "start_time";

    // returns true if we should be sending atha events
    var shouldSendEvents = function() {
        return _.get(
            window,
            "wattpad.testGroups.ADS_PROMETHEUS_METRICS",
            false
        );
    }

    // actually send the event using track everything
    var sendMessage = function(eventType, message) {
        window.te.push("event", "ad", "internal", null, eventType, message);
    }

    var buildVariation = function() {
        var variations = [];
        if (wattpad.testGroups.DELAY_ADS) {
            variations.push('image_moderation=true')
        }
        if (wattpad.testGroups.EXCLUDE_PREBID_PARTNERS) {
            variations.push('exclude_prebid_partners=true')
        }
        if (wattpad.testGroups.USE_KEVEL) {
            variations.push('use_kevel=true');
        }
        if (wattpad.testGroups.USE_33ACROSS) {
            variations.push("use_33across=true");
        }
        return variations.join('&');
    }

    // return an object with the common message fields for atha events defined.
    // this creates the event_id for this event as well, and returns it as a part
    // of the message. All our ads are associated with a story, and possibly a part
    var getCommonMessageFields = function(page, storyId, partId, groupModel, partModel) {
        var device = wattpad.utils.getDeviceType();
        var eventId = wattpad.utils.generateUUID();
        var isGdprUser = _.get(window, "wattpad.testGroups.GDPR_USER", false);
        // data common to all atha messages
        var message = {
            id: eventId,
            created_at: new Date().toISOString(), // ms resolution
            username: wattpad.utils.getCurrentUserAttr("username"),
            external_id: wattpad.utils.getCurrentUserAttr("externalId"),
            country_code: wattpad.userCountryCode,
            app_version: wattpad.revision, // indicates how fresh their javascript is
            platform: device === "mobile" ? "mobile-web" : "desktop-web",
            gdpr_is_eu: isGdprUser,
            storyid: storyId,
            page: page,
            is_brand_safe: window.ads.is_brand_safe,
            is_mature: window.ads.is_mature,
            content_rating: window.ads.content_rating,
            brand_safety_source: window.ads.brand_safety_source,
            brand_safety_level: window.ads.brand_safety_level,
            variation: buildVariation()
        };
        if (groupModel !== undefined) {
            message["is_brand_safe"] = !!groupModel.isBrandSafe;
            message["is_mature"] = wattpad.utils.isMatureStory(groupModel);
            message["brand_safety_source"] = groupModel.brandSafetySource;
            message["brand_safety_level"] = groupModel.brandSafetyLevel;
        }
        if (partModel !== undefined) {
            message["brand_safety_source"] = partModel.brandSafetySource;
            message["brand_safety_level"] = partModel.brandSafetyLevel;
        }
        if (partId !== undefined) {
            message["part_id"] = partId
        }
        return message;
    }

    // A page view event is generated when a user "loads a page".  This could
    // be through a server side, or client side render.
    // in:
    //   page: the type of page being rendered
    //   storyId: the id of the story that this page is for
    //   partId: the id of the story part that this page is for, which can be undefined
    //   groupModel: the model for the story associated with the storyId
    //   partModel: the model for the part associated with the storyId
    // out:
    //   this function returns a UUID for the event that was sent
    // side effects:
    //   this function caches some data from the models in window.ads, so that it can be
    //   easily read by the other functions later.
    var sendPageView = function(page, storyId, partId, groupModel, partModel) {
        if (!shouldSendEvents()) {
            return '';
        }
        window.ads = window.ads || {};
        var message = getCommonMessageFields(page, storyId, partId, groupModel, partModel);
        // cache page data
        window.ads["page"] = page;
        window.ads["story_id"] = storyId;
        window.ads["part_id"] = partId;
        window.ads["page_view_id"] = message.id;
        window.ads["is_brand_safe"] = message.is_brand_safe;
        window.ads["is_mature"] = message.is_mature;
        window.ads["content_rating"] = message.content_rating;
        window.ads["brand_safety_level"] = message.brand_safety_level;
        window.ads["brand_safety_source"] = message.brand_safety_source;

        // page_view specific fields
        message["user_is_premium"] = !!wattpad.utils.getCurrentUserAttr("isPremium");
        message["story_tags"] = groupModel && Array.isArray(groupModel.tags) ? groupModel.tags.join(" ") : "";
        message["is_paid_story"] = groupModel ? groupModel.isPaywalled : void 0;
        message["device_type"] = wattpad.utils.getDeviceType();

        sendMessage("page_view", message);

        return message["id"];
    };

    // Request events are sent when we start dealing with one of the external services
    // that are involved in our ad stack. This means when we start doing header bidding
    // with index, or prebid, as well as when we talk to adzerk to see if we should
    // render our auction winner, or something from their end.
    // in:
    //   adUnitId: the id on the div that this ad is going to render in
    //   adPartner: the name of the "partner" that we are talking to about the ad for the adUnitId
    //   placementDetail: this is an object that contains some adzerk config for the ad
    // out:
    //   this function returns a UUID for the event that was sent
    // side effects:
    //   this function copies the the page, storyId and partId from window.ads into a cache specific
    //   to this adUnitId.  It ads the partner, and the id for this request to that cache as well.
    var sendRequest = function(adUnitId, adPartner, placementDetail) {
        if (!shouldSendEvents()) {
            return '';
        }

        // copy page, story_id and page_id from the cache into the ad specific cache
        window.ads = window.ads || {};
        window.ads[adUnitId] = window.ads[adUnitId] || {};
        var page = window.ads[adUnitId]["page"] = window.ads["page"];
        var storyId = window.ads[adUnitId]["story_id"] = window.ads["story_id"];
        var partId = window.ads[adUnitId]["part_id"] = window.ads["part_id"];
        var requestOffset = 0;

        // on the first request event, we cache the time, to be used to calculate offset timing
        // for the events that follow
        if (!window.ads[adUnitId].hasOwnProperty(startTimeField)) {
            window.ads[adUnitId][startTimeField] = Date.now();
        } else {
            requestOffset = Date.now() - window.ads[adUnitId][startTimeField];
        }

        var message = getCommonMessageFields(page, storyId, partId);

        // request specific fields
        message["zone_id"] = placementDetail.zoneId.toString();
        message["placement"] = placementDetail.htSlotName;
        message["page_view_id"] = window.ads.page_view_id;
        message["adunit_id"] = adUnitId;
        message["request_offset"] = requestOffset;
        // stick these into the cache
        message["ad_partner"] = window.ads[adUnitId]["ad_partner"] = adPartner;
        window.ads[adUnitId][adPartner + '_request'] = message["id"];

        sendMessage("request", message);

        return message["id"];
    };

    // Bid events are sent when we receive a bid back from a bidder.
    // in:
    //   adUnitId: the id on the div that this ad is going to render in
    //   partnerId: an identifier for who the bid came from. ideally human readable.
    //   price: the price bid for the ad, CPM in cents in USD
    //   dimensions: the size of the ad in the bid. (check this)
    // out:
    //   this function returns a UUID for the event that was sent
    // side effects:
    //   none
    // notes:
    //   this reads adPartner out of the window.ads cache, and uses that to pull the "right"
    //   request id out of the cache for this request. It is theoretically possible that adPartner
    //   could be overwritten by a subsequent request, and this will return the wrong, or potentialy
    //   no requestId at all.
    var sendBid = function(adUnitId, partnerId, price, dimensions) {
        if (!shouldSendEvents()) {
            return '';
        }

        // load common data from the adUnitId cache
        var page = window.ads[adUnitId]["page"];
        var storyId = window.ads[adUnitId]["story_id"];
        var partId = window.ads[adUnitId]["part_id"];
        var adPartner = window.ads[adUnitId]["ad_partner"];
        var requestId = window.ads[adUnitId][adPartner + "_request"];
        var message = getCommonMessageFields(page, storyId, partId);
        var requestOffset = Date.now() - window.ads[adUnitId][startTimeField];

        // bid specific fields
        message["ad_partner"] = adPartner;
        message["page_view_id"] = window.ads.page_view_id;
        message["adunit_id"] = adUnitId;
        message["partner_id"] = partnerId;
        message["price"] = price;
        message["dimensions"] = dimensions;
        message["request_id"] = requestId;
        message["request_offset"] = requestOffset;
        // there is a response_id field in the bid table, but it doesn't really make any sense.
        // These bids are the responses from the "request"

        sendMessage("bid", message);

        return message["id"];
    };

    // An Auction Result event is sent when the auction ends, and we have determined which
    // bid is the winning bid.
    // in:
    //   adUnitId: the id on the div that this ad is going to render in
    //   bestBid: the bid object for the best bid from the auction
    //   bids: all the bids that were received
    // out:
    //   this function returns a UUID for the event that was sent
    // side effects:
    //   none
    // notes:
    //   similarly to the bid request, the requestId is loaded based on the adPartner in the ads cache and
    //   there is potential for that to be overwritten if things execute unexpectedly. The impact of that
    //   happening are fairly minimal though.
    var sendAuctionResult = function(adUnitId, bestBid, bids) {
        if (!shouldSendEvents()) {
            return '';
        }

        var page = window.ads[adUnitId]["page"];
        var storyId = window.ads[adUnitId]["story_id"];
        var partId = window.ads[adUnitId]["part_id"];
        var adPartner = window.ads[adUnitId]["ad_partner"];
        var requestOffset = Date.now() - window.ads[adUnitId][startTimeField];

        var message = getCommonMessageFields(page, storyId, partId);

        // auction_result specific fields
        message["ad_partner"] = adPartner;
        message["page_view_id"] = window.ads.page_view_id;
        message["request_id"] = window.ads[adUnitId][adPartner + "_request"];
        message["adunit_id"] = adUnitId;
        message["num_bids"] = bids ? bids.length : 0;
        message["price"] = bestBid ?
            bestBid.bic :
            0;
        message["best_bid_id"] = bestBid ? bestBid.id : null;
        message["request_offset"] = requestOffset;

        sendMessage("auction_result", message);

        return message["id"];
    };

    // An Impression event is sent when an advertisement is added to the DOM, or we otherwise
    // think that an impression has occured
    // in:
    //   adUnitId: the id on the div that this ad is going to render in
    //   zoneId: the adzerk zone, if applicable
    //   flightId: this is an indentifier for who won the ad
    //   price: the revenue in USD associated with this ad. May not be accurate for ads that
    //          are not from header bidding
    // out:
    //   this function returns a UUID for the event that was sent
    // side effects:
    //   none
    var sendImpression = function(adUnitId, zoneId, flightId, price) {
        if (!shouldSendEvents()) {
            return '';
        }

        // load common data from the adUnitId cache
        var page = window.ads[adUnitId]["page"];
        var storyId = window.ads[adUnitId]["story_id"];
        var partId = window.ads[adUnitId]["part_id"];
        var adPartner = window.ads[adUnitId]["ad_partner"];
        var requestId = window.ads[adUnitId][adPartner + "_request"];
        var message = getCommonMessageFields(page, storyId, partId);
        var requestOffset = Date.now() - window.ads[adUnitId][startTimeField];

        // impression specific fields
        message["ad_partner"] = adPartner;
        message["page_view_id"] = window.ads.page_view_id;
        message["adunit_id"] = adUnitId;
        message["price"] = price;
        message["request_id"] = requestId;
        message["placement"] = adUnitId.split("-")[0];
        message["zone_id"] = zoneId;
        message["flight_id"] = flightId;
        message["request_offset"] = requestOffset;

        sendMessage("impression", message);

        return message["id"];
    };

    // the actual user interface for ATHA
    return {
        sendPageView: sendPageView,
        sendRequest: sendRequest,
        sendBid: sendBid,
        sendAuctionResult: sendAuctionResult,
        sendImpression: sendImpression,
    }
}();

if (typeof module !== "undefined") {
    module.exports = __atha;
}