/*
* UMD Plugin template
*
* Influenced by: https://gist.github.com/cferdinandi/ece94569aefcffa5f7fa
*            
* Licensed under the terms of the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*/

(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([], factory(root));
    } else if ( typeof exports === 'object' ) {
        module.exports = factory(root);
    } else {
        root.myPluginName = factory(root);
    }
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

    'use strict';

    //
    // Variables
    //

    var supports = !!document.querySelector && !!root.addEventListener; // Feature tests
    var $ = window.jQuery; // Check for jQuery
    var opts; // Base options variable

    // Default options
    var defaults = {
		initClass: 'my-plugin-class',
		afterCreateFunction : null,
		beforeCreateFunction : null
    };

	//////////////////////////////////////
    // HELPER FUNCTIONS
    //////////////////////////////////////

    /**
	 * A simple forEach() implementation for Arrays, Objects and NodeLists
	 * @private
	 * @param {Array|Object|NodeList} collection Collection of items to iterate
	 * @param {Function} callback Callback function for each iteration
	 * @param {Array|Object|NodeList} scope Object/NodeList/Array that forEach is iterating over (aka `this`)
	 */
	var forEach = function (collection, callback, scope) {
		if (Object.prototype.toString.call(collection) === '[object Object]') {
			for (var prop in collection) {
				if (Object.prototype.hasOwnProperty.call(collection, prop)) {
					callback.call(scope, collection[prop], prop, collection);
				}
			}
		} else {
			for (var i = 0, len = collection.length; i < len; i++) {
				callback.call(scope, collection[i], i, collection);
			}
		}
	};

    /**
     * Merge defaults with user options
     * @private
     * @param {Object} defaults Default settings
     * @param {Object} options User options
     * @returns {Object} Merged values of defaults and options
     */
    var extend = function ( defaults, options ) {
        var extended = {};
        forEach(defaults, function (value, prop) {
            extended[prop] = defaults[prop];
        });
        forEach(options, function (value, prop) {
            extended[prop] = options[prop];
        });
        return extended;
    };

	/**
     * To set multiple style properties on either a single DOM object or multiple DOM objects:
     * (pass properties in as an object of property/value pairs)
     */
    var setProperties = function(objArray, properties) {

        var setProp = function(obj, prop, val) {
            obj.style[prop] = val;
        }

        if(objArray.length) {
            forEach(objArray, function (obj) {
                for (var property in properties)
                    setProp(obj, property, properties[property]);
            });
        }
        else {
            for (var property in properties)
                setProp(objArray, property, properties[property]);
        }
        return objArray;
    };

	/**
     * To check that a DOM object has a matching selector:
     * (courtesy of https://davidwalsh.name/element-matches-selector)
     */
    var matchSelector = function(obj, selector) {
		var proto = Element.prototype;
		var func = proto.matches || proto.webkitMatchesSelector || proto.mozMatchesSelector || proto.msMatchesSelector || function(s) {
			return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
		};
		return func.call(obj, selector);
	};

    /**
     * To get children by selector:
     */
    var selectChildren = function (obj, selector) {
        var children = obj.children;

        return Array.prototype.filter.call(children, function(obj_l2) {
        	return matchSelector(obj_l2, selector);
        });
    };

	/**
     * To get offset values for a DOM object:
     */
    var getOffsets = function (obj) {
        var rect = obj.getBoundingClientRect();
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		return {
		  top : parseInt(rect.top) + scrollTop,
		  left : parseInt(rect.left) + scrollLeft
		}
    };

    /**
     * Get default (pre-styled) CSS property for a DOM object
     */
    function getDefaultProperty(obj, property) {
        var nodeName = obj.nodeName;
        var temp = document.body.appendChild( document.createElement( nodeName ) );
        var prop = window.getComputedStyle(temp).getPropertyValue(property);

        temp.parentNode.removeChild( temp );

        return prop;
    }

    /**
     * Document ready function
     */
    var documentReady = function(fn) {
	  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
	    fn();
	  } else {
	    document.addEventListener('DOMContentLoaded', fn);
	  }
	}

	/**
	* Throttle & Debounce functions
	* Nicked from underscore JS library: https://github.com/jashkenas/underscore
	*/
	// Returns a function, that, when invoked, will only be triggered at most once
	// during a given window of time. Normally, the throttled function will run
	// as much as it can, without ever going more than once per `wait` duration;
	// but if you'd like to disable the execution on the leading edge, pass
	// `{leading: false}`. To disable execution on the trailing edge, ditto.
	var throttle = function(func, wait, options) {
		var context, args, result;
		var timeout = null;
		var previous = 0;

		if (!options) 
			options = {};

		var later = function() {
			previous = options.leading === false ? 0 : (Date.now || function(){ return new Date().getTime(); } )();
			timeout = null;
			result = func.apply(context, args);
			if (!timeout) 
				context = args = null;
		};
		return function() {
			var now = (Date.now || function(){ return new Date().getTime(); } )();
			if (!previous && options.leading === false) 
				previous = now;
			var remaining = wait - (now - previous);
			context = this;
			args = arguments;

			if (remaining <= 0 || remaining > wait) {
			  if (timeout) {
			    clearTimeout(timeout);
			    timeout = null;
			  }
			  previous = now;
			  result = func.apply(context, args);

			  if (!timeout) 
			  	context = args = null;

			} else if (!timeout && options.trailing !== false) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	};
	
	// Returns a function, that, as long as it continues to be invoked, will not
	// be triggered. The function will be called after it stops being called for
	// N milliseconds. If `immediate` is passed, trigger the function on the
	// leading edge, instead of the trailing.
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};

	//////////////////////////////////////
    // CONSTRUCTOR FUNCTION
    //////////////////////////////////////
    var myPluginName = function (selector, options) {


    	var myPluginNameObj = {}; // Object for public APIs
    	var domObj = selector || [];

    	if ( typeof domObj == 'string' ) {
		    domObj = document.querySelectorAll(domObj);
		}

    	// handle multiple objects
    	if (domObj.length > 1) {
			var arr = new Array();
			forEach(domObj, function(obj) {
				if (obj.nodeType === 1)
					arr.push(myPluginName(obj, options));
			});
			return arr;
		}

		// extract the DOM object from the query selector
		domObj = domObj[0] || domObj;

		//
		// Variables here
		//
		var myVar;

		//
		// Private functions here
		//
		var myFunc = function() {
			return;
		}
		

		//
		// Public functions here
		//

    	/**
	     * destroy() public method
	     */
	    myPluginNameObj.destroy = function () {

	        // Return if plugin isn't already initialized
	        if ( !opts ) return;

	        // Do destroy stuff here


	        // Remove init class
	        domObj.classList.remove( opts.initClass );

	        // Reset variables
	        opts = null;
	    };

		/**
	     * update() public method
	     */
	    myPluginNameObj.update = function (options) {

			myPluginNameObj.destroy();
			
			myPluginNameObj.init(options);
		};

	    /**
	     * Initialise
	     */
	    myPluginNameObj.init = function (options) {

	    	// return if no dom object
	    	if (domObj.length<1) {
	    		return false;
	    	}

	        // feature test
	        if ( !supports ) return;

	        // Merge user options with defaults
	        opts = extend( defaults, options || {} );

	        // beforeCreateFunction
			if (opts.beforeCreateFunction != null && typeof opts.beforeCreateFunction === "function") {
				opts.beforeCreateFunction.call(domObj);
 			}

	        // Add init class to HTML element
	        domObj.classList.add(opts.initClass);

	        //
	        // main plugin functionality here
	        //

			// afterCreateFunction
			if (opts.afterCreateFunction != null && typeof opts.afterCreateFunction === "function") {
				opts.afterCreateFunction.call(domObj);
 			}
			
	    };

	    myPluginNameObj.init(options);

	    return myPluginNameObj;

    }

    // -------------------------- for jQuery -------------------------- //

	if ($) {
		$.fn.myPluginName = function(options) {
			return new myPluginName(this, options);
		};
	}

	// ---------------------------------------------------------------- //
    
    return myPluginName;
    
});
