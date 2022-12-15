// ad-config.js
//
// this file contains all the functions related to the ad configuration on the website
//
// definitions:
// - placement: A string representing a place an ad can appear on our website. A single placement
//              can show ads of multiple sizes, based on the placements configuration
// - adUnitId: An html id representing an instance of a placement on a page. an adUnitId looks like
//             a placement then a dash, then a timestamp.
//
var __adConfig = (function() {
    // this chunk of configuration comes from the server right now.
    var inventoryDetails = wattpad.adzerkHeaderBiddingUnitMap;

    // return all the sets of sizes that a placement supports
    var getPlacementSizes = function(placement) {
        var placementDetails = getPlacementDetails(placement);
        if (!placementDetails) {
            return [];
        }
        return Object.values(placementDetails.sizes);
    };

    // return the configuration for this placement
    var getPlacementDetails = function(placement) {
        if (!inventoryDetails.hasOwnProperty(placement)) {
            return undefined;
        }
        return inventoryDetails[placement];
    };

    // get the placement that an adUnitId is for.
    var getPlacementFromAdUnitId = function(adUnitId) {
        return adUnitId.split("-")[0];
    };

    // global prebid configuration things.
    // setup user_id module
    // add event listeners
    var configurePrebid = function(pbjs) {
        // these are things we only want to do once
        if (pbjs && pbjs.getEvents && pbjs.getEvents().length === 0) {
            var userIdConfig = [{
                    name: "criteo"
                },
                {
                    name: "pubCommonId",
                    storage: {
                        type: "cookie",
                        name: "_pubcid",
                        expires: 365
                    }
                }
            ];
            if (_.get(window, "wattpad.testGroups.USE_33ACROSS", false)) {
                userIdConfig.push({
                    name: "33acrossId",
                    params: {
                        pid: "0015a0000341H3PAAU"
                    },
                    storage: {
                        name: "33acrossId",
                        type: "html5",
                        expires: 90,
                        refreshInSeconds: 8 * 3600
                    }
                });
            }
            var PWT = PWT || window.PWT || {};
            if (PWT && PWT.getUserIds) {
                var userIds = PWT.getUserIds();
                if (userIds.tdid) {
                    userIdConfig.push({
                        name: "unifiedId",
                        value: {
                            tdid: userIds.tdid
                        }
                    });
                }
            }
            pbjs.onEvent('bidResponse', function(bid) {
                var normalizedBid = wattpad.utils.normalizeBids(
                    [bid],
                    wattpad.utils.getBidFormat("prebid")
                )[0];
                if (typeof __atha !== "undefined") {
                    var id = __atha.sendBid(
                        bid.adUnitCode,
                        _.get(normalizedBid, "partner", "unknown"),
                        _.get(normalizedBid, "bic", undefined), // bid price in cents (CPM*100)
                        normalizedBid.dimensions
                    );
                    // this id is used later in the auction_result. Setting this attribute on
                    // the bid persists it into the prebid bid object, which will be returned
                    // when the auction ends and a winner is decided, so the auction result
                    // message can still get at it.
                    bid.id = id;
                }
            });

            var prebidConfig = {
                consentManagement: {
                    usp: {
                        cmpApi: 'iab',
                        timeout: 100
                    }
                },
                userSync: {
                    userIds: userIdConfig,
                    filterSettings: {
                        iframe: {
                            bidders: "*", // '*' represents all bidders
                            filter: "include"
                        }
                    }
                }
            }
            if (_.get(window, "wattpad.testGroups.GDPR_ADS_EXPERIENCE", false)) {
                prebidConfig.consentManagement.gdpr = {
                    cmpApi: 'iab',
                    timeout: 8000,
                    defaultGdprScope: true
                };
            }
            pbjs.setConfig(prebidConfig);
        }
    };

    var getBidderList = function(placement, placementDetails) {
        var ixBidders = wattpad.utils.getIxPrebidSizes(placementDetails);
        var bidders = [{
                gdprEnabled: true,
                exclude: {},
                config: {
                    bidder: "rubicon",
                    params: {
                        accountId: 7941,
                        siteId: 346974,
                        zoneId: placementDetails.rubiconZone
                        // optional parameters we should probably do something with
                        // see: http://docs.prebid.org/dev-docs/bidders/rubicon.html
                        //keywords: "string",
                        //inventory: "json object",
                        //visitor: "json object",
                        //position: "atf/btf",
                        //userId: "wattpad.utils.external_id (wp_id)",
                        //floor
                        //latLong
                        //video
                    }
                }
            },
            {
                gdprEnabled: true,
                exclude: {
                    desktop: ["AE"],
                    mobile: ["SA"]
                },
                config: {
                    bidder: "pubmatic",
                    params: {
                        publisherId: "159971",
                        adSlot: placementDetails.pubmaticSlot ? placementDetails.pubmaticSlot.toString() : null // not optional, must be string
                        // additional optional parameters
                        // see: http://docs.prebid.org/dev-docs/bidders/pubmatic.html
                        // pmzoneid
                        // lat
                        // lon
                        // yob (year of birth)
                        // gender
                        // kadpageurl
                        // kadfloor
                        // currency
                        // dctr
                        // bcat (blocked IAB categories)
                        // deals
                        // outstreamAU (for outstream)
                    }
                },
            },
            {
                gdprEnabled: true,
                exclude: {
                    desktop: ["BR", "IN", "TR"]
                },
                config: {
                    bidder: "criteo",
                    params: {
                        networkId: 10933
                        // see:  https://docs.prebid.org/dev-docs/bidders#criteo
                        // zoneId (deprecated)
                        // nativeCallback
                        // integrationMode
                    }
                },
            },
            {
                gdprEnabled: true,
                exclude: {},
                config: {
                    bidder: "triplelift",
                    params: {
                        inventoryCode: placementDetails.tripleliftInvCode,
                        // additional optional parameters
                        // see: https://docs.prebid.org/dev-docs/bidders/triplelift.html
                        // floor
                        //
                    }
                },
            },
            {
                gdprEnabled: true,
                exclude: {
                    desktop: ["IN", "AR", "PL"],
                    mobile: ["PL", "CL"]
                },
                config: {
                    bidder: "openx",
                    params: {
                        unit: placementDetails.openXUnitId,
                        delDomain: "wattpad-d.openx.net"
                        // customParams: User-defined targeting key-value pairs
                        // customFloor:	Minimum price in USD
                        // doNotTrack: Prevents advertiser from using data for this user.
                        // coppa: Enables Child's Online Privacy Protection Act (COPPA) regulations
                    }
                },
            },
            {
                gdprEnabled: false,
                exclude: {
                    desktop: ["IN"],
                    mobile: []
                },
                config: {
                    bidder: "sovrn",
                    params: {
                        tagid: placementDetails.sovrnTag ? placementDetails.sovrnTag.toString() : null
                        // additional optional parameters
                        // see: https://docs.prebid.org/dev-docs/bidders/sovrn.html
                        // bidfloor
                    }
                },
            },
            {
                gdprEnabled: false,
                exclude: {
                    desktop: ["AE"],
                    mobile: []
                },
                config: {
                    bidder: "onemobile",
                    params: {
                        dcn: '8a9690f1017575bc3e53bd52ec5100bc',
                        pos: placement
                        // additional optional parameters
                        // see: https://docs.prebid.org/dev-docs/bidders/onemobile.html
                        // ext
                    }
                },
            },
            {
                gdprEnabled: true,
                exclude: {},
                config: {
                    bidder: "appnexus",
                    params: {
                        placementId: placementDetails.appnexusPlacementId
                        // optional parameters we should probably do something with
                        // see: http://docs.prebid.org/dev-docs/bidders/appnexus.html
                        // member
                        // invCode: "this with member is an alternative for placementId"
                        // publisherId: "another way to identify publisher"
                        // frameworks: [] array of integers for api frameworks for banners we support
                        // user: obj, user details
                        // allowSmallerSizes: bool
                        // usePaymentRule
                        // keywords
                        // video: obj
                        // app: obj
                        // reserve: (floor)
                        // position: (above/below)
                        // supplyType: (web/mobile_web/mobile_app)
                        // pubClick: url to tracker
                        // extInvCode: for reporting
                        // externalImpId: external auction id
                        //
                    }
                },
            },
            {
                gdprEnabled: true,
                exclude: {},
                config: {
                    bidder: "sharethrough",
                    params: {
                        pkey: placementDetails.sharethroughPKey
                        // optional parameters
                        // see: https://docs.prebid.org/dev-docs/bidders/sharethrough
                        // bidfloor
                        // iframe: Render ad in iframe
                        // iframeSize: size of the iframe
                        // bcat:  blocked IAB categories
                        // badv: array of blocked advertisers by domain.  Might be useful
                    }
                }
            }
        ];

        ixBidders.forEach(function(bidder) {
            bidders.push({
                gdprEnabled: false,
                exclude: {},
                config: bidder
            })
        })

        return bidders;
    }

    // generate list of bidders based on any eligibility criteria required
    var configureBidders = function(placement, placementDetails) {
        var isInGdprGeo = _.get(wattpad, "testGroups.GDPR_ADS_EXPERIENCE", false);
        var shouldExcludeBidders = _.get(wattpad, "testGroups.EXCLUDE_PREBID_PARTNERS", false);
        var userDeviceType = wattpad && wattpad.utils ? wattpad.utils.getDeviceType() : "";
        var userCountry = _.get(wattpad, "userCountryCode", "");
        var available_bidders = getBidderList(placement, placementDetails);
        var reqParams = {
            'rubicon': ['accountId', 'siteId', 'zoneId'],
            'pubmatic': ['publisherId', 'adSlot'],
            'criteo': ['networkId'],
            'triplelift': ['inventoryCode'],
            'openx': ['unit', 'delDomain'],
            'sovrn': ['tagid'],
            'onemobile': ['dcn', 'pos'],
            'appnexus': ['placementId'],
            'sharethrough': ['pkey'],
            'ix': ['siteId', 'size']
        };

        var hasValidConfig = function(bidder) {
            var config = bidder['config'];
            var valid = true;
            reqParams[config['bidder']].forEach(function(param) {
                if (!config.params.hasOwnProperty(param) || !config.params[param]) {
                    valid = false;
                }
            });
            return valid;
        }
        var isInGDPRFilter = function(bidder) {
            return !isInGdprGeo || bidder.gdprEnabled
        }
        var onlyInCountryFilter = function(bidder) {
            // Check if bidder has onlyInCountry
            if (!bidder.onlyInCountry) {
                return true
            } else {
                //Bidder has onlyInCountry so return if the value contains users country
                return bidder.onlyInCountry.includes(userCountry);
            }
        }
        var isExcludedByDeviceAndCountry = function(bidder) {
            //Check user device and country on exclude list
            var excludedCountries = bidder.exclude[userDeviceType] || []
            return shouldExcludeBidders && excludedCountries.includes(userCountry);
        };
        var reducer = function(accumulator, currentValue) {
            if (hasValidConfig(currentValue) && isInGDPRFilter(currentValue) && !isExcludedByDeviceAndCountry(currentValue) && onlyInCountryFilter(currentValue)) {
                accumulator.push(currentValue.config)
            }
            return accumulator;
        }
        return available_bidders.reduce(reducer, []);
    };

    // generate an array of adUnit configuration for prebid for an array of adUnits we need ads for.
    var getPrebidAdUnits = function(adUnitIds) {
        var adUnits = [];

        adUnitIds.forEach(function(adUnitId) {
            var placement = getPlacementFromAdUnitId(adUnitId);
            var sizes = getPlacementSizes(placement);
            var placementDetails = getPlacementDetails(placement);
            var configuredBidders = configureBidders(placement, placementDetails);
            var adUnit = {
                code: adUnitId,
                mediaTypes: {
                    banner: {
                        sizes: sizes
                    }
                },
                bids: configuredBidders
            };

            adUnits.push(adUnit);
        });

        return adUnits;
    };

    var getAdCommentFromPrebidBid = function(bid) {
        return wattpad.utils.sprintf('p:%s c:%s m:%s', [bid.bidder, bid.creativeId, JSON.stringify(bid.meta)])
    }

    // these are the options we use to lazy load ads. This will run the auction when the ad
    // is 50px from the bottom of the users viewport.
    var auctionRunnerOptions = {
        rootMargin: '0px 0px',
        root: null,
        threshold: 0
    };

    // this is the callback that will start an auction on a lazy loaded ad through intersection observer
    var auctionCallback = function auctionCallback(entries, observer) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                if (!entry.target.classList.contains('hasRun')) {
                    // if we're intersecting, and an auction hasn't started, start an auction.
                    entry.target.classList.add('hasRun');
                    // once the auction has started, stop observing this entry
                    observer.unobserve(entry.target);
                    runAuction(entry.target.getAttribute('id'));
                }
            }
        });
    };
    var clientSupportsIO = window.IntersectionObserver && window.IntersectionObserverEntry && window.IntersectionObserverEntry.prototype &&
        'intersectionRatio' in window.IntersectionObserverEntry.prototype;
    var auctionRunner;
    if (clientSupportsIO) {
        auctionRunner = new IntersectionObserver(auctionCallback, auctionRunnerOptions);
    }

    // Construct a valid ad request
    // And pass to ad loading code
    var adsMessageHandler = function(e) {
        if (e.detail !== null) {
            var shouldDelayAds = e.detail.shouldDelayAds;
            var shouldShowAds = e.detail.shouldShowAds;
            var shouldRenderHardcodedCreative = shouldDelayAds || !shouldShowAds
            var lazyLoadAd = e.detail.lazyLoadAd;
            var adContainer = document.getElementById(e.detail.adUnitId);

            if (!adContainer) {
                console.error('unable to find ' + e.detail.adUnitId + ' in the DOM');
            } else if (shouldRenderHardcodedCreative) {
                wattpad.utils.generateAndRenderHardcodedCreative(e.detail.adUnitId);
            } else if (lazyLoadAd && clientSupportsIO && !adContainer.classList.contains('hasIO')) {
                adContainer.classList.add('hasIO');
                auctionRunner.observe(adContainer);
            } else {
                if (!adContainer.classList.contains('hasRun')) {
                    adContainer.classList.add('hasRun');
                    runAuction(e.detail.adUnitId);
                } else {
                    console.warn('auction already ran on adUnitId: ' + e.detail.adUnitId);
                }
            }

            // handle call without details, scan dom for ads that have not been loaded
        } else {
            // :not explanation
            // .hasRun, .hasIO           - don't do anything if this ad has already been processed in some way
            // .outstream_video          - we don't do hb things to this
            // .hc                       - excludes bottom house ad
            // .storylanding_top         - prevent double firing of auction for react component
            // .storylanding_bottom_mweb - prevent double firing of auction for react component
            var adsToLoad = document.querySelectorAll('.advertisement:not(.hasRun):not(.hasIO):not(.outstream_video):not(.hc):not(.storylanding_top):not(.storylanding_bottom_mweb)');
            if (!!adsToLoad.length) {
                for (var i = 0; i < adsToLoad.length; i++) {
                    var el = adsToLoad[i];
                    if (clientSupportsIO && el.classList.contains('lazyAd') && !el.classList.contains('hasIO')) {
                        el.classList.add('hasIO');
                        auctionRunner.observe(document.getElementById(el.id));
                    } else {
                        el.classList.add('hasRun');
                        runAuction(el.id);
                    }
                };
            }
        }

    };

    // run an auction for an adUnitId
    var runAuction = function(adUnitId) {
        var placementsObj = {
            "placements": {}
        };
        var placementName = getPlacementFromAdUnitId(adUnitId);
        var unitMeta = wattpad.utils.getPlacementConfiguration(placementName);
        placementsObj.placements[adUnitId] = {
            "zoneId": unitMeta.zone,
            "htSlotName": placementName
        };
        var rawModel, storyGroup, storyPart;
        if (app && app.currentView && app.currentView.model) {
            rawModel = app.currentView.model.attributes;
            storyGroup = rawModel.group ? rawModel.group : rawModel;
            storyPart = rawModel.group ? rawModel : undefined;
        }
        // Construct MVP Adzerk parameters
        var adzerkPlacementMeta = {
            siteId: 1025452,
            networkId: 9660,
            adTypes: Object.keys(_.get(unitMeta, "sizes", {})).map(function(sz) {
                return parseInt(sz, 10)
            }),
            targeting: wattpad.utils.getAdzerkTargeting(storyGroup, storyPart, wattpad.utils.currentUser().toJSON() || {})
        }
        _.merge(placementsObj.placements[adUnitId], adzerkPlacementMeta);

        wattpad.utils.loadHbAdPrebid(placementsObj);
    }

    // Adds a listener for a custom event that indicates an ad should be loaded
    var setupMessageListener = function() {
        window.addEventListener('ad-available', adsMessageHandler);
    };

    var init = function() {
        // Set up passive loading of ads
        setupMessageListener();
    }

    init();

    // the actual user interface for adConfig
    return {
        getPrebidAdUnits: getPrebidAdUnits,
        configurePrebid: configurePrebid,
        getAdCommentFromPrebidBid: getAdCommentFromPrebidBid
    };
})();

if (typeof module !== "undefined") {
    module.exports = __adConfig;
}