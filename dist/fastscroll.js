(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.FastScroll = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Sönke Kluth
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 **/

(function(exports) {

    'use strict';

    var delegate = function(target, handler) {
        // Get any extra arguments for handler
        var args = [].slice.call(arguments, 2);

        // Create delegate function
        var fn = function() {

            // Call handler with arguments
            return handler.apply(target, args);
        };

        // Return the delegate function.
        return fn;
    };


    (typeof module != "undefined" && module.exports) ? (module.exports = delegate) : (typeof define != "undefined" ? (define(function() {
        return delegate;
    })) : (exports.delegate = delegate));

})(this);

},{}],2:[function(require,module,exports){
'use strict';

//IE8
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(obj, start) {
    for (var i = (start || 0), j = this.length; i < j; i++) {
      if (this[i] === obj) {
        return i;
      }
    }
    return -1;
  };
}

var EventDispatcher = function() {
  this._eventMap = {};
  this._destroyed = false;
};

EventDispatcher.prototype = {

  addListener: function(event, listener) {

    this.getListener(event) || (this._eventMap[event] = []);

    if (this.getListener(event).indexOf(listener) == -1) {
      this._eventMap[event].push(listener);
    }

    return this;
  },

  addListenerOnce: function(event, listener) {
    var s = this;
    var f2 = function() {
      s.removeListener(event, f2);
      return listener.apply(this, arguments);
    };
    return this.addListener(event, f2);
  },

  removeListener: function(event, listener) {

    var listeners = this.getListener(event);
    if (listeners) {
      var i = listeners.indexOf(listener);
      if (i > -1) {
        this._eventMap[event] = listeners.splice(i, 1);
        if (listeners.length === 0) {
          delete(this._eventMap[event]);
        }
      }
    }

    return this;
  },

  removeAllListener: function(event) {

    var listeners = this.getListener(event);
    if (listeners) {
      this._eventMap[event].length = 0;
      delete(this._eventMap[event]);
    }
    return this;
  },

  dispatch: function(eventType, eventObject) {

    var listeners = this.getListener(eventType);

    if (listeners) {

      //var args = Array.prototype.slice.call(arguments, 1);
      eventObject = (eventObject) ? eventObject : {};
      eventObject.type = eventType;
      eventObject.target = eventObject.target || this;
      var i = -1;
      while (++i < listeners.length) {

        //args ? listeners[i].apply(null, args) : listeners[i]();
        listeners[i].call(null, eventObject);
      }
    } else {
      // console.info('Nobody is listening to ' + event);
    }

    return this;
  },

  getListener: function(event) {
    if (this._destroyed) {
      throw new Error('I am destroyed');
    }
    return this._eventMap[event];
  },

  destroy: function() {
    if (this._eventMap) {
      for (var i in this._eventMap) {
        this.removeAllListener(i);
      }
      //TODO leave an empty object is better then throwing an error when using a fn after destroy?
      this._eventMap = null;
    }
    this._destroyed = true;
  }
};

//Method Map
EventDispatcher.prototype.on = EventDispatcher.prototype.bind = EventDispatcher.prototype.addEventListener = EventDispatcher.prototype.addListener;
EventDispatcher.prototype.off = EventDispatcher.prototype.unbind = EventDispatcher.prototype.removeEventListener = EventDispatcher.prototype.removeListener;
EventDispatcher.prototype.once = EventDispatcher.prototype.one = EventDispatcher.prototype.addListenerOnce;
EventDispatcher.prototype.trigger = EventDispatcher.prototype.dispatchEvent = EventDispatcher.prototype.dispatch;

module.exports = EventDispatcher;

},{}],3:[function(require,module,exports){
'use strict';

/*
 * FastScroll
 * https://github.com/soenkekluth/fastscroll
 *
 * Copyright (c) 2014 Sönke Kluth
 * Licensed under the MIT license.
 */

var delegate = require('delegatejs');
var EventDispatcher = require('./eventdispatcher');

var _instanceMap = {};


var FastScroll = function(scrollTarget) {
  scrollTarget = scrollTarget || window;
  if (_instanceMap[scrollTarget]) {
    return _instanceMap[scrollTarget].instance;
  } else {
    _instanceMap[scrollTarget] = {
      instance: this,
      listenerCount: 0
    }
  }

  this.element = scrollTarget;
  this.init();
  return this;
};

FastScroll.UP = 'up';
FastScroll.DOWN = 'down';
FastScroll.NONE = 'none';
FastScroll.LEFT = 'left';
FastScroll.RIGHT = 'right';

FastScroll.prototype = {

  destroyed: false,
  scrolling: false,
  scrollY: 0,
  scrollX: 0,
  lastScrollY: 0,
  lastScrollX: 0,
  speedY: 0,
  speedX: 0,
  stopFrames: 5,
  currentStopFrames: 0,
  firstRender: true,

  _hasRequestedAnimationFrame: false,

  init: function() {
    this.dispatcher = new EventDispatcher();
    this.updateScrollPosition = (this.element === window) ? delegate(this, this.updateWindowScrollPosition) : delegate(this, this.updateElementScrollPosition);
    this.onScrollDelegate = delegate(this, this.onScroll);
    this.onAnimationFrameDelegate = delegate(this, this.onAnimationFrame);
    this.element.addEventListener('scroll', this.onScrollDelegate, false);
  },

  destroy: function() {
    if(_instanceMap[this.element].listenerCount <= 0 && !this.destroyed){
      this.element.removeEventListener('scroll', this.onScrollDelegate);
      this.dispatcher.off();
      this.dispatcher = null;
      this.onScrollDelegate = null;
      this.updateScrollPosition = null;
      this.onAnimationFrameDelegate = null;
      this.element = null;
      this.destroyed = true;
    }
  },

  getAttributes: function() {
    return {
      scrollX: this.scrollX,
      scrollY: this.scrollY,
      speedY: this.speedY,
      speedX: this.speedX,
      angle: 0,
      speedY: this.speedY === 0 ? FastScroll.NONE : ((this.speedY > 0) ? FastScroll.UP : FastScroll.DOWN),
      speedX: this.speedX === 0 ? FastScroll.NONE : ((this.speedX > 0) ? FastScroll.RIGHT : FastScroll.LEFT)
    };
  },

  updateWindowScrollPosition: function() {
    this.scrollY = this.element.scrollY || this.element.pageYOffset || 0;
    this.scrollX = this.element.scrollX || this.element.pageXOffset || 0;
  },

  updateElementScrollPosition: function() {
    this.scrollY = this.element.scrollTop;
    this.scrollX = this.element.scrollLeft;
  },

  onScroll: function() {
    this.updateScrollPosition();
    this.currentStopFrames = 0;
    this.scrolling = true;

    if (this.firstRender) {
      if (this.scrollY > 1) {
        this.currentStopFrames = this.stopFrames - 1;
      }
      this.firstRender = false;
    }

    if (!this._hasRequestedAnimationFrame) {
      this._hasRequestedAnimationFrame = true;
      this.dispatchEvent('scroll:start');
      requestAnimationFrame(this.onAnimationFrameDelegate);
    }
  },

  onAnimationFrame: function() {
    if (this.destroyed) {
      return;
    }

    this.updateScrollPosition();

    this.speedY = this.lastScrollY - this.scrollY;
    this.speedX = this.lastScrollX - this.scrollX;

    this.lastScrollY = this.scrollY;
    this.lastScrollX = this.scrollX;

    if (this.speedY === 0 && this.scrolling && (this.currentStopFrames++ > this.stopFrames)) {
      this.onScrollStop();
      return;
    }

    this.dispatchEvent('scroll:progress');
    requestAnimationFrame(this.onAnimationFrameDelegate);
  },

  onScrollStop: function() {
    this.scrolling = false;
    this._hasRequestedAnimationFrame = false;
    this.currentStopFrames = 0;
    this.dispatchEvent('scroll:stop');
  },

  dispatchEvent: function(type, eventObject) {
    eventObject = eventObject || this.getAttributes();
    eventObject.fastScroll = this;
    eventObject.target = this.element;
    this.dispatcher.dispatch(type, eventObject);
  },

  on: function(event, listener) {
    if (this.dispatcher.on(event, listener)) {
      _instanceMap[this.element].listenerCount += 1;
      return true;
    }
    return false;
  },

  off: function(event, listener) {
    if(this.dispatcher.off(event, listener)){
      _instanceMap[this.element].listenerCount -= 1;
      return true;
    }
    return false;
  }
};

FastScroll.___instanceMap = _instanceMap;

module.exports = FastScroll;

},{"./eventdispatcher":2,"delegatejs":1}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVsZWdhdGVqcy9kZWxlZ2F0ZS5qcyIsInNyYy9ldmVudGRpc3BhdGNoZXIuanMiLCJzcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0IFPDtm5rZSBLbHV0aFxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2ZcbiAqIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW5cbiAqIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cbiAqIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mXG4gKiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXG4gKiBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1NcbiAqIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUlxuICogQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSXG4gKiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxuICogQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqKi9cblxuKGZ1bmN0aW9uKGV4cG9ydHMpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBkZWxlZ2F0ZSA9IGZ1bmN0aW9uKHRhcmdldCwgaGFuZGxlcikge1xuICAgICAgICAvLyBHZXQgYW55IGV4dHJhIGFyZ3VtZW50cyBmb3IgaGFuZGxlclxuICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcblxuICAgICAgICAvLyBDcmVhdGUgZGVsZWdhdGUgZnVuY3Rpb25cbiAgICAgICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vIENhbGwgaGFuZGxlciB3aXRoIGFyZ3VtZW50c1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIuYXBwbHkodGFyZ2V0LCBhcmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGRlbGVnYXRlIGZ1bmN0aW9uLlxuICAgICAgICByZXR1cm4gZm47XG4gICAgfTtcblxuXG4gICAgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykgPyAobW9kdWxlLmV4cG9ydHMgPSBkZWxlZ2F0ZSkgOiAodHlwZW9mIGRlZmluZSAhPSBcInVuZGVmaW5lZFwiID8gKGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlO1xuICAgIH0pKSA6IChleHBvcnRzLmRlbGVnYXRlID0gZGVsZWdhdGUpKTtcblxufSkodGhpcyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vSUU4XG5pZiAoIUFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24ob2JqLCBzdGFydCkge1xuICAgIGZvciAodmFyIGkgPSAoc3RhcnQgfHwgMCksIGogPSB0aGlzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgaWYgKHRoaXNbaV0gPT09IG9iaikge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9O1xufVxuXG52YXIgRXZlbnREaXNwYXRjaGVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2V2ZW50TWFwID0ge307XG4gIHRoaXMuX2Rlc3Ryb3llZCA9IGZhbHNlO1xufTtcblxuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZSA9IHtcblxuICBhZGRMaXN0ZW5lcjogZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG5cbiAgICB0aGlzLmdldExpc3RlbmVyKGV2ZW50KSB8fCAodGhpcy5fZXZlbnRNYXBbZXZlbnRdID0gW10pO1xuXG4gICAgaWYgKHRoaXMuZ2V0TGlzdGVuZXIoZXZlbnQpLmluZGV4T2YobGlzdGVuZXIpID09IC0xKSB7XG4gICAgICB0aGlzLl9ldmVudE1hcFtldmVudF0ucHVzaChsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgYWRkTGlzdGVuZXJPbmNlOiBmdW5jdGlvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICB2YXIgcyA9IHRoaXM7XG4gICAgdmFyIGYyID0gZnVuY3Rpb24oKSB7XG4gICAgICBzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmMik7XG4gICAgICByZXR1cm4gbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2ZW50LCBmMik7XG4gIH0sXG5cbiAgcmVtb3ZlTGlzdGVuZXI6IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXIoZXZlbnQpO1xuICAgIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgIHZhciBpID0gbGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgICAgaWYgKGkgPiAtMSkge1xuICAgICAgICB0aGlzLl9ldmVudE1hcFtldmVudF0gPSBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpZiAobGlzdGVuZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGRlbGV0ZSh0aGlzLl9ldmVudE1hcFtldmVudF0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgcmVtb3ZlQWxsTGlzdGVuZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcihldmVudCk7XG4gICAgaWYgKGxpc3RlbmVycykge1xuICAgICAgdGhpcy5fZXZlbnRNYXBbZXZlbnRdLmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUodGhpcy5fZXZlbnRNYXBbZXZlbnRdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgZGlzcGF0Y2g6IGZ1bmN0aW9uKGV2ZW50VHlwZSwgZXZlbnRPYmplY3QpIHtcblxuICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyKGV2ZW50VHlwZSk7XG5cbiAgICBpZiAobGlzdGVuZXJzKSB7XG5cbiAgICAgIC8vdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgZXZlbnRPYmplY3QgPSAoZXZlbnRPYmplY3QpID8gZXZlbnRPYmplY3QgOiB7fTtcbiAgICAgIGV2ZW50T2JqZWN0LnR5cGUgPSBldmVudFR5cGU7XG4gICAgICBldmVudE9iamVjdC50YXJnZXQgPSBldmVudE9iamVjdC50YXJnZXQgfHwgdGhpcztcbiAgICAgIHZhciBpID0gLTE7XG4gICAgICB3aGlsZSAoKytpIDwgbGlzdGVuZXJzLmxlbmd0aCkge1xuXG4gICAgICAgIC8vYXJncyA/IGxpc3RlbmVyc1tpXS5hcHBseShudWxsLCBhcmdzKSA6IGxpc3RlbmVyc1tpXSgpO1xuICAgICAgICBsaXN0ZW5lcnNbaV0uY2FsbChudWxsLCBldmVudE9iamVjdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGNvbnNvbGUuaW5mbygnTm9ib2R5IGlzIGxpc3RlbmluZyB0byAnICsgZXZlbnQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGdldExpc3RlbmVyOiBmdW5jdGlvbihldmVudCkge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSSBhbSBkZXN0cm95ZWQnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2V2ZW50TWFwW2V2ZW50XTtcbiAgfSxcblxuICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fZXZlbnRNYXApIHtcbiAgICAgIGZvciAodmFyIGkgaW4gdGhpcy5fZXZlbnRNYXApIHtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcihpKTtcbiAgICAgIH1cbiAgICAgIC8vVE9ETyBsZWF2ZSBhbiBlbXB0eSBvYmplY3QgaXMgYmV0dGVyIHRoZW4gdGhyb3dpbmcgYW4gZXJyb3Igd2hlbiB1c2luZyBhIGZuIGFmdGVyIGRlc3Ryb3k/XG4gICAgICB0aGlzLl9ldmVudE1hcCA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gIH1cbn07XG5cbi8vTWV0aG9kIE1hcFxuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuYmluZCA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUudW5iaW5kID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUub25jZSA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUub25lID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lck9uY2U7XG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnRyaWdnZXIgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RGlzcGF0Y2hlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLypcbiAqIEZhc3RTY3JvbGxcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2Vua2VrbHV0aC9mYXN0c2Nyb2xsXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0IFPDtm5rZSBLbHV0aFxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbnZhciBkZWxlZ2F0ZSA9IHJlcXVpcmUoJ2RlbGVnYXRlanMnKTtcbnZhciBFdmVudERpc3BhdGNoZXIgPSByZXF1aXJlKCcuL2V2ZW50ZGlzcGF0Y2hlcicpO1xuXG52YXIgX2luc3RhbmNlTWFwID0ge307XG5cblxudmFyIEZhc3RTY3JvbGwgPSBmdW5jdGlvbihzY3JvbGxUYXJnZXQpIHtcbiAgc2Nyb2xsVGFyZ2V0ID0gc2Nyb2xsVGFyZ2V0IHx8IHdpbmRvdztcbiAgaWYgKF9pbnN0YW5jZU1hcFtzY3JvbGxUYXJnZXRdKSB7XG4gICAgcmV0dXJuIF9pbnN0YW5jZU1hcFtzY3JvbGxUYXJnZXRdLmluc3RhbmNlO1xuICB9IGVsc2Uge1xuICAgIF9pbnN0YW5jZU1hcFtzY3JvbGxUYXJnZXRdID0ge1xuICAgICAgaW5zdGFuY2U6IHRoaXMsXG4gICAgICBsaXN0ZW5lckNvdW50OiAwXG4gICAgfVxuICB9XG5cbiAgdGhpcy5lbGVtZW50ID0gc2Nyb2xsVGFyZ2V0O1xuICB0aGlzLmluaXQoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5GYXN0U2Nyb2xsLlVQID0gJ3VwJztcbkZhc3RTY3JvbGwuRE9XTiA9ICdkb3duJztcbkZhc3RTY3JvbGwuTk9ORSA9ICdub25lJztcbkZhc3RTY3JvbGwuTEVGVCA9ICdsZWZ0JztcbkZhc3RTY3JvbGwuUklHSFQgPSAncmlnaHQnO1xuXG5GYXN0U2Nyb2xsLnByb3RvdHlwZSA9IHtcblxuICBkZXN0cm95ZWQ6IGZhbHNlLFxuICBzY3JvbGxpbmc6IGZhbHNlLFxuICBzY3JvbGxZOiAwLFxuICBzY3JvbGxYOiAwLFxuICBsYXN0U2Nyb2xsWTogMCxcbiAgbGFzdFNjcm9sbFg6IDAsXG4gIHNwZWVkWTogMCxcbiAgc3BlZWRYOiAwLFxuICBzdG9wRnJhbWVzOiA1LFxuICBjdXJyZW50U3RvcEZyYW1lczogMCxcbiAgZmlyc3RSZW5kZXI6IHRydWUsXG5cbiAgX2hhc1JlcXVlc3RlZEFuaW1hdGlvbkZyYW1lOiBmYWxzZSxcblxuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBuZXcgRXZlbnREaXNwYXRjaGVyKCk7XG4gICAgdGhpcy51cGRhdGVTY3JvbGxQb3NpdGlvbiA9ICh0aGlzLmVsZW1lbnQgPT09IHdpbmRvdykgPyBkZWxlZ2F0ZSh0aGlzLCB0aGlzLnVwZGF0ZVdpbmRvd1Njcm9sbFBvc2l0aW9uKSA6IGRlbGVnYXRlKHRoaXMsIHRoaXMudXBkYXRlRWxlbWVudFNjcm9sbFBvc2l0aW9uKTtcbiAgICB0aGlzLm9uU2Nyb2xsRGVsZWdhdGUgPSBkZWxlZ2F0ZSh0aGlzLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICB0aGlzLm9uQW5pbWF0aW9uRnJhbWVEZWxlZ2F0ZSA9IGRlbGVnYXRlKHRoaXMsIHRoaXMub25BbmltYXRpb25GcmFtZSk7XG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxEZWxlZ2F0ZSwgZmFsc2UpO1xuICB9LFxuXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgIGlmKF9pbnN0YW5jZU1hcFt0aGlzLmVsZW1lbnRdLmxpc3RlbmVyQ291bnQgPD0gMCAmJiAhdGhpcy5kZXN0cm95ZWQpe1xuICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxEZWxlZ2F0ZSk7XG4gICAgICB0aGlzLmRpc3BhdGNoZXIub2ZmKCk7XG4gICAgICB0aGlzLmRpc3BhdGNoZXIgPSBudWxsO1xuICAgICAgdGhpcy5vblNjcm9sbERlbGVnYXRlID0gbnVsbDtcbiAgICAgIHRoaXMudXBkYXRlU2Nyb2xsUG9zaXRpb24gPSBudWxsO1xuICAgICAgdGhpcy5vbkFuaW1hdGlvbkZyYW1lRGVsZWdhdGUgPSBudWxsO1xuICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0QXR0cmlidXRlczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjcm9sbFg6IHRoaXMuc2Nyb2xsWCxcbiAgICAgIHNjcm9sbFk6IHRoaXMuc2Nyb2xsWSxcbiAgICAgIHNwZWVkWTogdGhpcy5zcGVlZFksXG4gICAgICBzcGVlZFg6IHRoaXMuc3BlZWRYLFxuICAgICAgYW5nbGU6IDAsXG4gICAgICBzcGVlZFk6IHRoaXMuc3BlZWRZID09PSAwID8gRmFzdFNjcm9sbC5OT05FIDogKCh0aGlzLnNwZWVkWSA+IDApID8gRmFzdFNjcm9sbC5VUCA6IEZhc3RTY3JvbGwuRE9XTiksXG4gICAgICBzcGVlZFg6IHRoaXMuc3BlZWRYID09PSAwID8gRmFzdFNjcm9sbC5OT05FIDogKCh0aGlzLnNwZWVkWCA+IDApID8gRmFzdFNjcm9sbC5SSUdIVCA6IEZhc3RTY3JvbGwuTEVGVClcbiAgICB9O1xuICB9LFxuXG4gIHVwZGF0ZVdpbmRvd1Njcm9sbFBvc2l0aW9uOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNjcm9sbFkgPSB0aGlzLmVsZW1lbnQuc2Nyb2xsWSB8fCB0aGlzLmVsZW1lbnQucGFnZVlPZmZzZXQgfHwgMDtcbiAgICB0aGlzLnNjcm9sbFggPSB0aGlzLmVsZW1lbnQuc2Nyb2xsWCB8fCB0aGlzLmVsZW1lbnQucGFnZVhPZmZzZXQgfHwgMDtcbiAgfSxcblxuICB1cGRhdGVFbGVtZW50U2Nyb2xsUG9zaXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2Nyb2xsWSA9IHRoaXMuZWxlbWVudC5zY3JvbGxUb3A7XG4gICAgdGhpcy5zY3JvbGxYID0gdGhpcy5lbGVtZW50LnNjcm9sbExlZnQ7XG4gIH0sXG5cbiAgb25TY3JvbGw6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsUG9zaXRpb24oKTtcbiAgICB0aGlzLmN1cnJlbnRTdG9wRnJhbWVzID0gMDtcbiAgICB0aGlzLnNjcm9sbGluZyA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5maXJzdFJlbmRlcikge1xuICAgICAgaWYgKHRoaXMuc2Nyb2xsWSA+IDEpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50U3RvcEZyYW1lcyA9IHRoaXMuc3RvcEZyYW1lcyAtIDE7XG4gICAgICB9XG4gICAgICB0aGlzLmZpcnN0UmVuZGVyID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9oYXNSZXF1ZXN0ZWRBbmltYXRpb25GcmFtZSkge1xuICAgICAgdGhpcy5faGFzUmVxdWVzdGVkQW5pbWF0aW9uRnJhbWUgPSB0cnVlO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdzY3JvbGw6c3RhcnQnKTtcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLm9uQW5pbWF0aW9uRnJhbWVEZWxlZ2F0ZSk7XG4gICAgfVxuICB9LFxuXG4gIG9uQW5pbWF0aW9uRnJhbWU6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlU2Nyb2xsUG9zaXRpb24oKTtcblxuICAgIHRoaXMuc3BlZWRZID0gdGhpcy5sYXN0U2Nyb2xsWSAtIHRoaXMuc2Nyb2xsWTtcbiAgICB0aGlzLnNwZWVkWCA9IHRoaXMubGFzdFNjcm9sbFggLSB0aGlzLnNjcm9sbFg7XG5cbiAgICB0aGlzLmxhc3RTY3JvbGxZID0gdGhpcy5zY3JvbGxZO1xuICAgIHRoaXMubGFzdFNjcm9sbFggPSB0aGlzLnNjcm9sbFg7XG5cbiAgICBpZiAodGhpcy5zcGVlZFkgPT09IDAgJiYgdGhpcy5zY3JvbGxpbmcgJiYgKHRoaXMuY3VycmVudFN0b3BGcmFtZXMrKyA+IHRoaXMuc3RvcEZyYW1lcykpIHtcbiAgICAgIHRoaXMub25TY3JvbGxTdG9wKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdzY3JvbGw6cHJvZ3Jlc3MnKTtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5vbkFuaW1hdGlvbkZyYW1lRGVsZWdhdGUpO1xuICB9LFxuXG4gIG9uU2Nyb2xsU3RvcDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zY3JvbGxpbmcgPSBmYWxzZTtcbiAgICB0aGlzLl9oYXNSZXF1ZXN0ZWRBbmltYXRpb25GcmFtZSA9IGZhbHNlO1xuICAgIHRoaXMuY3VycmVudFN0b3BGcmFtZXMgPSAwO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc2Nyb2xsOnN0b3AnKTtcbiAgfSxcblxuICBkaXNwYXRjaEV2ZW50OiBmdW5jdGlvbih0eXBlLCBldmVudE9iamVjdCkge1xuICAgIGV2ZW50T2JqZWN0ID0gZXZlbnRPYmplY3QgfHwgdGhpcy5nZXRBdHRyaWJ1dGVzKCk7XG4gICAgZXZlbnRPYmplY3QuZmFzdFNjcm9sbCA9IHRoaXM7XG4gICAgZXZlbnRPYmplY3QudGFyZ2V0ID0gdGhpcy5lbGVtZW50O1xuICAgIHRoaXMuZGlzcGF0Y2hlci5kaXNwYXRjaCh0eXBlLCBldmVudE9iamVjdCk7XG4gIH0sXG5cbiAgb246IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIGlmICh0aGlzLmRpc3BhdGNoZXIub24oZXZlbnQsIGxpc3RlbmVyKSkge1xuICAgICAgX2luc3RhbmNlTWFwW3RoaXMuZWxlbWVudF0ubGlzdGVuZXJDb3VudCArPSAxO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBvZmY6IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIGlmKHRoaXMuZGlzcGF0Y2hlci5vZmYoZXZlbnQsIGxpc3RlbmVyKSl7XG4gICAgICBfaW5zdGFuY2VNYXBbdGhpcy5lbGVtZW50XS5saXN0ZW5lckNvdW50IC09IDE7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG5GYXN0U2Nyb2xsLl9fX2luc3RhbmNlTWFwID0gX2luc3RhbmNlTWFwO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhc3RTY3JvbGw7XG4iXX0=
