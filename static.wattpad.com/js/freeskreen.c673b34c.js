/**
 * Slimcut Outstream Video Wrapper - Updated 4/11/2019
 */
var parentAccessible = true;
try {
    window.parent.id
} catch (e) {
    parentAccessible = false;
};
fskWindow = "undefined" != typeof inDapIF && inDapIF && parentAccessible ? window.parent : ("undefined" != typeof window.parent && window.parent != window && parentAccessible ? window.parent : window);
var _timeout = 800,
    _vendors = null,
    _gdprTimeoutConsent = "0";
fskWindow._FskWPTag = function() {
    var a = 20;
    try {
        var b = JSON.parse(fskWindow.jQuery('.advertisement.outstream_video')[0].getAttribute('data-targeting'));
        a = b.category;
    } catch (c) {}
    return a;
};
fskWindow._FskRefresh = function() {
    console.log("_FskRefresh called");
    try {
        fskWindow.clearTimeout(fskWindow._FskTimeout);
    } catch (a) {}
    try {
        if (typeof fskWindow._FskAds !== 'undefined') {
            fskWindow._FskAds.cleanup();
            if (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame) {
                window.removeEventListener("scroll", _FskAds.onScroll);
                window.removeEventListener("resize", _FskAds.onScroll);
                window.removeEventListener("focus", _FskAds.onScroll);
                window.removeEventListener("blur", _FskAds.onScroll);
            }
            delete fskWindow._FskAds;
        }
        fskWindow.FskHasLoaded = undefined;
        if (typeof fskWindow._fskadsparameters !== 'undefined') {
            for (var b in fskWindow._fskadsparameters._confs)
                if (typeof b != 'undefined' && typeof(fskWindow._fskadsparameters._confs[b]._spIDs) != 'undefined') {
                    for (var c = 0; c < fskWindow._fskadsparameters._confs[b]._spIDs.length; c++)
                        if (!fskWindow.document.getElementById(fskWindow._fskadsparameters._confs[b]._spIDs[c])) fskWindow._fskadsparameters._confs[b][fskWindow._fskadsparameters._confs[b]._spIDs[c]] = {};
                    fskWindow._fskadsparameters._confs[b]._spIDs = [];
                }
            delete fskWindow._fskadsparameters;
        }
        setTimeout(function() {
            fskWindow._FskInit();
        }, 500);
    } catch (a) {
        console.log("FSK Failed " + a);
    }
};
fskWindow._FskInit = function() {
    if (fskWindow.document.getElementsByClassName('outstream_video').length === 0) fskWindow._FskTimeout = fskWindow.setTimeout(function() {
        fskWindow._FskInit();
    }, 200);
    else {
        console.log("Found outstream div");
        var a = typeof fskWindow.context != 'undefined' && typeof fskWindow.context.data != 'undefined' && typeof fskWindow.context.data.ampSlotIndex != 'undefined';
        if (a) {
            try {
                window.frameElement.style.display = 'none';
            } catch (b) {}
            fskWindow.fskLib = {};
            var c = '.fsk_splitbox_onscreen { width: 100%; position:absolute; top:50%; left:50%; -ms-transform: translateX(-50%) translateY(-50%); -webkit-transform: translate(-50%,-50%); transform: translate(-50%,-50%); }',
                d = fskWindow.document.head || fskWindow.document.getElementsByTagName('head')[0],
                e = fskWindow.document.createElement('style');
            e.type = 'text/css';
            if (e.styleSheet) e.styleSheet.cssText = c;
            else e.appendChild(document.createTextNode(c));
            d.appendChild(e);
        }
        fskWindow.FSK_getExtraParameters = function() {
            var a = {};
            a.p_tlr_sc = '&streamCode=__config-id__';
            return a;
        };
        if (typeof(fskWindow.FskHasLoaded) == "undefined") {
            fskWindow.FskHasLoaded = true;
            "undefined" == typeof fskWindow._fskparameters && (fskWindow._fskparameters = []);
            fskWindow._fskparameters._pid = fskWindow._fskparameters._pid || "3513";
            (function() {
                var b = function(c) {
                    if (fskWindow.jQuery || fskWindow.fskLib) {
                        for (var d = "", e = "fsk_ut_" + fskWindow._fskparameters._pid + "=", f = "", g = "fsk_uts=", h = 0, i = 0, j = fskWindow.document.cookie.split(";"), k = 0; k < j.length; k++) {
                            for (var l = j[k];
                                " " == l.charAt(0);) l = l.substring(1, l.length);
                            if (0 == l.indexOf(e)) {
                                d = l.substring(e.length, l.length);
                                h = 1;
                            } else if (0 == l.indexOf(g)) {
                                f = l.substring(g.length, l.length);
                                i = 1;
                            }
                            if (h && i) break;
                        }
                        e = window.location.protocol + "//sb.freeskreen.com/publisher/script.js?pid=" + fskWindow._fskparameters._pid;
                        if (a) {
                            e += "&amp=1";
                            if (typeof fskWindow.context.data.ffc != 'undefined') e += "&ffc=" + fskWindow.context.data.ffc;
                        }
                        fskWindow._fskparameters._sid && (e += "&sid=" + fskWindow._fskparameters._sid);
                        e += "&ut=" + d + "&uts=" + f;
                        if (typeof(fskWindow.FSK_getExtraParameters) != 'undefined') {
                            var m = fskWindow.FSK_getExtraParameters();
                            if (m)
                                for (var n in m) {
                                    var o = n,
                                        p = m[n];
                                    if (o.indexOf('p_') != 0) o = 'p_' + o;
                                    e += '&' + o + '=' + encodeURIComponent(p);
                                }
                        }
                        var q = '',
                            r = '',
                            s = '20';
                        try {
                            var t = JSON.parse(fskWindow.jQuery('.advertisement.outstream_video')[0].getAttribute('data-targeting'));
                            if (typeof t.KV1 === 'undefined') q = t.KV3;
                            else q = t.KV1 + "-" + t.KV2;
                            s = t.category;
                        } catch (j) {}
                        e += "&flc=" + q;
                        e += "&tag=" + s;
                        if (navigator.userAgent.indexOf('Chrom') == -1 && navigator.userAgent.indexOf('Safari') > -1) {
                            _fskGetData = function(a) {
                                return fskWindow.localStorage.getItem(a) ? decodeURIComponent(fskWindow.localStorage.getItem(a)) : "";
                            };
                            e += "&a=" + encodeURIComponent(_fskGetData("fsk_a")) + "&vs=" + encodeURIComponent(_fskGetData("fsk_vs"));
                        }
                        _fskParseGetParameters = function u(a) {
                            var b = undefined,
                                c = [];
                            fskWindow.location.search.substr(1).split("&").forEach(function(d) {
                                c = d.split("=");
                                if (c[0] === a) b = decodeURIComponent(c[1]);
                            });
                            return b;
                        };
                        fskffc = _fskParseGetParameters('fsk_force_campaign');
                        if (typeof fskffc != 'undefined') e += "&ffc=" + fskffc;
                        fskcfc = window._FskCFC || fskWindow._FskCFC;
                        if (typeof fskcfc != 'undefined' && fskcfc != '') e += "&cfc=" + fskcfc;
                        if (a) e += '&windowlocation=' + encodeURIComponent(fskWindow.context.canonicalUrl);
                        else e += '&windowlocation=' + encodeURIComponent(fskWindow.location.href);
                        _fskInsertScript = function(a) {
                            d = fskWindow.document.createElement("script");
                            d.type = "text/javascript";
                            d.async = !0;
                            d.src = a;
                            d.id = "fskTag";
                            as = fskWindow.document.getElementsByTagName("script")[0];
                            as.parentNode.insertBefore(d, as);
                        };
                        if (typeof fskWindow.__cmp === 'undefined' || typeof fskWindow.__cmp !== 'function')
                            if (typeof fskWindow._fskExternalConsent !== 'undefined') _fskInsertScript(e + "&gdpr=-1&cs=" + encodeURIComponent(fskWindow._fskExternalConsent));
                            else _fskInsertScript(e + "&gdpr=-1&cs=-1");
                        else try {
                            fskWindow.__cmp("getConsentData", _vendors, function(a, b) {
                                if (!b) {
                                    if (typeof fskWindow._FskScriptLoaded === 'undefined') {
                                        fskWindow._FskScriptLoaded = true;
                                        if (typeof fskWindow._fskExternalConsent !== 'undefined') _fskInsertScript(e + "&gdpr=-1&cs=" + encodeURIComponent(fskWindow._fskExternalConsent));
                                        else _fskInsertScript(e + "&gdpr=-1&cs=-1");
                                    }
                                } else {
                                    if (typeof fskWindow._FskScriptLoaded === 'undefined') {
                                        fskWindow._FskScriptLoaded = true;
                                        _fskInsertScript(e + "&gdpr=" + (a.gdprApplies ? 1 : 0) + "&cs=" + encodeURIComponent(a.consentData));
                                    }
                                    fskWindow._FskConsentData = a;
                                }
                            });
                            setTimeout(function() {
                                if (typeof fskWindow._FskScriptLoaded === 'undefined') {
                                    fskWindow._FskScriptLoaded = true;
                                    _fskInsertScript(e + "&gdpr=-1&cs=" + _gdprTimeoutConsent);
                                }
                            }, _timeout);
                        } catch (v) {
                            _fskInsertScript(e + "&gdpr=-1&cs=-1");
                        }
                    } else window.setTimeout(function() {
                        b(c);
                    }, 100);
                };
                b();
            })();
        }
    }
};
fskWindow._FskInit();