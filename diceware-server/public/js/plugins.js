// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// place any jquery/helper plugins in here.

// https://gist.githubusercontent.com/paulirish/5438650/raw/ff67d5657042223f6dc5194017f423a0f932f9fa/performance.now()-polyfill.js
//
// @license http://opensource.org/licenses/MIT
// // copyright Paul Irish 2015
//
//
// // Date.now() is supported everywhere except IE8. For IE8 we use the Date.now polyfill
// //   github.com/Financial-Times/polyfill-service/blob/master/polyfills/Date.now/polyfill.js
// // as Safari 6 doesn't have support for NavigationTiming, we use a Date.now() timestamp for relative values
//
// // if you want values similar to what you'd get with real perf.now, place this towards the head of the page
// // but in reality, you're just getting the delta between now() calls, so it's not terribly important where it's placed
//
//

(function(){

	if ("performance" in window == false) {
		window.performance = {};
	}

	Date.now = (Date.now || function () {  // thanks IE8
		return new Date().getTime();
	});

	if ("now" in window.performance == false){

		var nowOffset = Date.now();

		if (performance.timing && performance.timing.navigationStart){
			nowOffset = performance.timing.navigationStart
		}

		window.performance.now = function now(){
			return Date.now() - nowOffset;
		}
	}

})();

// cf. http://stackoverflow.com/a/12837315/21052
function float2int (value) {
    return value | 0;
}

// cf. http://stackoverflow.com/a/31678176/21052
function selectText(eltId) {
	advancedSelect(document.getElementById(eltId));
//    if (document.selection) {
//        var range = document.body.createTextRange();
//        range.moveToElementText(document.getElementById(eltId));
//        range.select();
//    } else if (window.getSelection) {
//        var range = document.createRange();
//        range.selectNode(document.getElementById(eltId));
//        window.getSelection().addRange(range);
//    }
}

// cf. https://github.com/ryanpcmcquen/simpleJsCopy
function advancedSelect(element) {

    var iPhoneORiPod = false,
        iPad = false,
        safari = false;
    var navAgent = navigator.userAgent;
    if (navAgent.match(/iPhone|iPod/i)) {
        iPhoneORiPod = true;
    } else if (navAgent.match(/iPad/i)) {
        iPad = true;
    } else if (/^((?!chrome).)*safari/i.test(navAgent)) {
        // ^ fancy safari detection thanks to: https://stackoverflow.com/a/23522755
        safari = true;
    }

    element.select();
    try {
        // now that we've selected the text, execute the copy command
        document.execCommand('copy');
    } catch (ignore) {
        // Nothing to do..
    }
    // this is what selects it on iOS
    element.focus();
    if (iPhoneORiPod || iPad) {
        element.selectionStart = 0;
        element.selectionEnd = element.textContent.length;
    } else {
        element.select();
    }
}

// cf. https://github.com/zenorocha/select
// cf. https://github.com/ryanpcmcquen/simpleJsCopy
function select(element) {
    var selectedText;

    if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
        element.focus();
        element.setSelectionRange(0, element.value.length);

        selectedText = element.value;
    } else {
        if (element.hasAttribute('contenteditable')) {
            element.focus();
        }

        var selection = window.getSelection();
        var range = document.createRange();

        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);

        selectedText = selection.toString();
    }

    return selectedText;
}
// cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisArg*/ ) {
        'use strict';

        if (this === void 0 || this === null) {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];

                // NOTE: Technically this should Object.defineProperty at
                //       the next index, as push can be affected by
                //       properties on Object.prototype and Array.prototype.
                //       But that method's new, and collisions should be
                //       rare, so use the more-compatible alternative.
                if (fun.call(thisArg, val, i, t)) {
                    res.push(val);
                }
            }
        }

        return res;
    };
}

// https://github.com/mrdoob/eventdispatcher.js
/**
 * @author mrdoob / http://mrdoob.com/
 */

var EventDispatcher = function () {}

EventDispatcher.prototype = {

	constructor: EventDispatcher,

	apply: function ( object ) {

		object.addEventListener = EventDispatcher.prototype.addEventListener;
		object.hasEventListener = EventDispatcher.prototype.hasEventListener;
		object.removeEventListener = EventDispatcher.prototype.removeEventListener;
		object.dispatchEvent = EventDispatcher.prototype.dispatchEvent;

	},

	addEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) this._listeners = {};

		var listeners = this._listeners;

		if ( listeners[ type ] === undefined ) {

			listeners[ type ] = [];

		}

		if ( listeners[ type ].indexOf( listener ) === - 1 ) {

			listeners[ type ].push( listener );

		}

	},

	hasEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) return false;

		var listeners = this._listeners;

		if ( listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1 ) {

			return true;

		}

		return false;

	},

	removeEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) return;

		var listeners = this._listeners;
		var listenerArray = listeners[ type ];

		if ( listenerArray !== undefined ) {

			var index = listenerArray.indexOf( listener );

			if ( index !== - 1 ) {

				listenerArray.splice( index, 1 );

			}

		}

	},

	dispatchEvent: function ( event ) {
			
		if ( this._listeners === undefined ) return;

		var listeners = this._listeners;
		var listenerArray = listeners[ event.type ];

		if ( listenerArray !== undefined ) {

			event.target = this;

			var array = [];
			var length = listenerArray.length;

			for ( var i = 0; i < length; i ++ ) {

				array[ i ] = listenerArray[ i ];

			}

			for ( var i = 0; i < length; i ++ ) {

				array[ i ].call( this, event );

			}

		}

	}

};
