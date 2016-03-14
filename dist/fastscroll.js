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


var FastScroll = function(scrollTarget, options) {
  scrollTarget = scrollTarget || window;
  if (_instanceMap[scrollTarget]) {
    return _instanceMap[scrollTarget].instance;
  } else {
    _instanceMap[scrollTarget] = {
      instance: this,
      listenerCount: 0
    }
  }

  this.options = options || {animationFrame: true};
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
  timeout: 0,
  speedY: 0,
  speedX: 0,
  stopFrames: 5,
  currentStopFrames: 0,
  firstRender: true,
  animationFrame: true,
  lastEvent: {
    type: null,
    scrollY:0,
    scrollX:0
  },

  _hasRequestedNextFrame: false,

  init: function() {
    this.dispatcher = new EventDispatcher();
    this.animationFrame = this.options.animationFrame;
    console.log('his.animationFrame', this.animationFrame);
    this.updateScrollPosition = (this.element === window) ? delegate(this, this.updateWindowScrollPosition) : delegate(this, this.updateElementScrollPosition);
    this.updateScrollPosition();
    this.lastEvent.scrollY = this.scrollY;
    this.lastEvent.scrollX = this.scrollX;
    this.onScrollDelegate = delegate(this, this.onScroll);
    this.onNextFrameDelegate = delegate(this, this.onNextFrame);
    this.element.addEventListener('scroll', this.onScrollDelegate, false);
  },

  destroy: function() {
    if(_instanceMap[this.element].listenerCount <= 0 && !this.destroyed){
      delete(_instanceMap[this.element]);
      this.cancelNextFrame();
      this.element.removeEventListener('scroll', this.onScrollDelegate);
      this.dispatcher.off();
      this.dispatcher = null;
      this.onScrollDelegate = null;
      this.updateScrollPosition = null;
      this.onNextFrameDelegate = null;
      this.element = null;
      this.destroyed = true;
    }
  },

  getAttributes: function() {
    return {
      scrollY: this.scrollY,
      scrollX: this.scrollX,
      speedY: this.speedY,
      speedX: this.speedX,
      angle: 0,
      directionY: this.speedY === 0 ? FastScroll.NONE : ((this.speedY > 0) ? FastScroll.UP : FastScroll.DOWN),
      directionX: this.speedX === 0 ? FastScroll.NONE : ((this.speedX > 0) ? FastScroll.RIGHT : FastScroll.LEFT)
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

    if (!this._hasRequestedNextFrame) {
      this._hasRequestedNextFrame = true;
      this.dispatchEvent('scroll:start');
      this.nextFrameID = requestAnimationFrame(this.onNextFrameDelegate);
    }
    if(!this.animationFrame){
      clearTimeout(this.timeout);
      this.onNextFrame();
      var self = this;
      this.timeout = setTimeout(function(){
        self.onScrollStop();
      }, 100);
    }
  },

  onNextFrame: function() {
    if (this.destroyed) {
      return;
    }

    if(this.animationFrame){
      this.updateScrollPosition();
    }

    this.speedY = this.lastScrollY - this.scrollY;
    this.speedX = this.lastScrollX - this.scrollX;

    this.lastScrollY = this.scrollY;
    this.lastScrollX = this.scrollX;

    if(this.animationFrame){
      if (this.speedY === 0 && this.scrolling && (this.currentStopFrames++ > this.stopFrames)) {
        this.onScrollStop();
        return;
      }
    }

    this.dispatchEvent('scroll:progress');
    if(this.animationFrame){
      this.nextFrameID = requestAnimationFrame(this.onNextFrameDelegate);
    }

  },

  onScrollStop: function() {
    this.scrolling = false;
    this.cancelNextFrame();
    this._hasRequestedNextFrame = false;
    this.currentStopFrames = 0;
    this.dispatchEvent('scroll:stop');
  },


  cancelNextFrame:function(){
    cancelAnimationFrame(this.nextFrameID);
  },

  dispatchEvent: function(type, eventObject) {
    eventObject = eventObject || this.getAttributes();

    if(this.lastEvent.type === type && this.lastEvent.scrollY === eventObject.scrollY && this.lastEvent.scrollX === eventObject.scrollX) {
      return;
    }

    this.lastEvent = {
      type: type,
      scrollY: eventObject.scrollY,
      scrollX: eventObject.scrollX
    };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVsZWdhdGVqcy9kZWxlZ2F0ZS5qcyIsInNyYy9ldmVudGRpc3BhdGNoZXIuanMiLCJzcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgU8O2bmtlIEtsdXRoXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZlxuICogdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpblxuICogdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0b1xuICogdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2ZcbiAqIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbyxcbiAqIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTU1xuICogRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SXG4gKiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVJcbiAqIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOXG4gKiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICoqL1xuXG4oZnVuY3Rpb24oZXhwb3J0cykge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGRlbGVnYXRlID0gZnVuY3Rpb24odGFyZ2V0LCBoYW5kbGVyKSB7XG4gICAgICAgIC8vIEdldCBhbnkgZXh0cmEgYXJndW1lbnRzIGZvciBoYW5kbGVyXG4gICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBkZWxlZ2F0ZSBmdW5jdGlvblxuICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgLy8gQ2FsbCBoYW5kbGVyIHdpdGggYXJndW1lbnRzXG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlci5hcHBseSh0YXJnZXQsIGFyZ3MpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFJldHVybiB0aGUgZGVsZWdhdGUgZnVuY3Rpb24uXG4gICAgICAgIHJldHVybiBmbjtcbiAgICB9O1xuXG5cbiAgICAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSA/IChtb2R1bGUuZXhwb3J0cyA9IGRlbGVnYXRlKSA6ICh0eXBlb2YgZGVmaW5lICE9IFwidW5kZWZpbmVkXCIgPyAoZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZGVsZWdhdGU7XG4gICAgfSkpIDogKGV4cG9ydHMuZGVsZWdhdGUgPSBkZWxlZ2F0ZSkpO1xuXG59KSh0aGlzKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy9JRThcbmlmICghQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbihvYmosIHN0YXJ0KSB7XG4gICAgZm9yICh2YXIgaSA9IChzdGFydCB8fCAwKSwgaiA9IHRoaXMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICBpZiAodGhpc1tpXSA9PT0gb2JqKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG4gIH07XG59XG5cbnZhciBFdmVudERpc3BhdGNoZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fZXZlbnRNYXAgPSB7fTtcbiAgdGhpcy5fZGVzdHJveWVkID0gZmFsc2U7XG59O1xuXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlID0ge1xuXG4gIGFkZExpc3RlbmVyOiBmdW5jdGlvbihldmVudCwgbGlzdGVuZXIpIHtcblxuICAgIHRoaXMuZ2V0TGlzdGVuZXIoZXZlbnQpIHx8ICh0aGlzLl9ldmVudE1hcFtldmVudF0gPSBbXSk7XG5cbiAgICBpZiAodGhpcy5nZXRMaXN0ZW5lcihldmVudCkuaW5kZXhPZihsaXN0ZW5lcikgPT0gLTEpIHtcbiAgICAgIHRoaXMuX2V2ZW50TWFwW2V2ZW50XS5wdXNoKGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBhZGRMaXN0ZW5lck9uY2U6IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIHZhciBzID0gdGhpcztcbiAgICB2YXIgZjIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGYyKTtcbiAgICAgIHJldHVybiBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZlbnQsIGYyKTtcbiAgfSxcblxuICByZW1vdmVMaXN0ZW5lcjogZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG5cbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcihldmVudCk7XG4gICAgaWYgKGxpc3RlbmVycykge1xuICAgICAgdmFyIGkgPSBsaXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgICBpZiAoaSA+IC0xKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50TWFwW2V2ZW50XSA9IGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGlmIChsaXN0ZW5lcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgZGVsZXRlKHRoaXMuX2V2ZW50TWFwW2V2ZW50XSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICByZW1vdmVBbGxMaXN0ZW5lcjogZnVuY3Rpb24oZXZlbnQpIHtcblxuICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyKGV2ZW50KTtcbiAgICBpZiAobGlzdGVuZXJzKSB7XG4gICAgICB0aGlzLl9ldmVudE1hcFtldmVudF0ubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSh0aGlzLl9ldmVudE1hcFtldmVudF0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBkaXNwYXRjaDogZnVuY3Rpb24oZXZlbnRUeXBlLCBldmVudE9iamVjdCkge1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXIoZXZlbnRUeXBlKTtcblxuICAgIGlmIChsaXN0ZW5lcnMpIHtcblxuICAgICAgLy92YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBldmVudE9iamVjdCA9IChldmVudE9iamVjdCkgPyBldmVudE9iamVjdCA6IHt9O1xuICAgICAgZXZlbnRPYmplY3QudHlwZSA9IGV2ZW50VHlwZTtcbiAgICAgIGV2ZW50T2JqZWN0LnRhcmdldCA9IGV2ZW50T2JqZWN0LnRhcmdldCB8fCB0aGlzO1xuICAgICAgdmFyIGkgPSAtMTtcbiAgICAgIHdoaWxlICgrK2kgPCBsaXN0ZW5lcnMubGVuZ3RoKSB7XG5cbiAgICAgICAgLy9hcmdzID8gbGlzdGVuZXJzW2ldLmFwcGx5KG51bGwsIGFyZ3MpIDogbGlzdGVuZXJzW2ldKCk7XG4gICAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKG51bGwsIGV2ZW50T2JqZWN0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY29uc29sZS5pbmZvKCdOb2JvZHkgaXMgbGlzdGVuaW5nIHRvICcgKyBldmVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgZ2V0TGlzdGVuZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJIGFtIGRlc3Ryb3llZCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZXZlbnRNYXBbZXZlbnRdO1xuICB9LFxuXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9ldmVudE1hcCkge1xuICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLl9ldmVudE1hcCkge1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVyKGkpO1xuICAgICAgfVxuICAgICAgLy9UT0RPIGxlYXZlIGFuIGVtcHR5IG9iamVjdCBpcyBiZXR0ZXIgdGhlbiB0aHJvd2luZyBhbiBlcnJvciB3aGVuIHVzaW5nIGEgZm4gYWZ0ZXIgZGVzdHJveT9cbiAgICAgIHRoaXMuX2V2ZW50TWFwID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgfVxufTtcblxuLy9NZXRob2QgTWFwXG5FdmVudERpc3BhdGNoZXIucHJvdG90eXBlLm9uID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5iaW5kID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcbkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUub2ZmID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS51bmJpbmQgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vbmNlID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vbmUgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmFkZExpc3RlbmVyT25jZTtcbkV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUudHJpZ2dlciA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2g7XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnREaXNwYXRjaGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKlxuICogRmFzdFNjcm9sbFxuICogaHR0cHM6Ly9naXRodWIuY29tL3NvZW5rZWtsdXRoL2Zhc3RzY3JvbGxcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgU8O2bmtlIEtsdXRoXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxudmFyIGRlbGVnYXRlID0gcmVxdWlyZSgnZGVsZWdhdGVqcycpO1xudmFyIEV2ZW50RGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vZXZlbnRkaXNwYXRjaGVyJyk7XG5cbnZhciBfaW5zdGFuY2VNYXAgPSB7fTtcblxuXG52YXIgRmFzdFNjcm9sbCA9IGZ1bmN0aW9uKHNjcm9sbFRhcmdldCwgb3B0aW9ucykge1xuICBzY3JvbGxUYXJnZXQgPSBzY3JvbGxUYXJnZXQgfHwgd2luZG93O1xuICBpZiAoX2luc3RhbmNlTWFwW3Njcm9sbFRhcmdldF0pIHtcbiAgICByZXR1cm4gX2luc3RhbmNlTWFwW3Njcm9sbFRhcmdldF0uaW5zdGFuY2U7XG4gIH0gZWxzZSB7XG4gICAgX2luc3RhbmNlTWFwW3Njcm9sbFRhcmdldF0gPSB7XG4gICAgICBpbnN0YW5jZTogdGhpcyxcbiAgICAgIGxpc3RlbmVyQ291bnQ6IDBcbiAgICB9XG4gIH1cblxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHthbmltYXRpb25GcmFtZTogdHJ1ZX07XG4gIHRoaXMuZWxlbWVudCA9IHNjcm9sbFRhcmdldDtcbiAgdGhpcy5pbml0KCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuRmFzdFNjcm9sbC5VUCA9ICd1cCc7XG5GYXN0U2Nyb2xsLkRPV04gPSAnZG93bic7XG5GYXN0U2Nyb2xsLk5PTkUgPSAnbm9uZSc7XG5GYXN0U2Nyb2xsLkxFRlQgPSAnbGVmdCc7XG5GYXN0U2Nyb2xsLlJJR0hUID0gJ3JpZ2h0JztcblxuRmFzdFNjcm9sbC5wcm90b3R5cGUgPSB7XG5cbiAgZGVzdHJveWVkOiBmYWxzZSxcbiAgc2Nyb2xsaW5nOiBmYWxzZSxcbiAgc2Nyb2xsWTogMCxcbiAgc2Nyb2xsWDogMCxcbiAgbGFzdFNjcm9sbFk6IDAsXG4gIGxhc3RTY3JvbGxYOiAwLFxuICB0aW1lb3V0OiAwLFxuICBzcGVlZFk6IDAsXG4gIHNwZWVkWDogMCxcbiAgc3RvcEZyYW1lczogNSxcbiAgY3VycmVudFN0b3BGcmFtZXM6IDAsXG4gIGZpcnN0UmVuZGVyOiB0cnVlLFxuICBhbmltYXRpb25GcmFtZTogdHJ1ZSxcbiAgbGFzdEV2ZW50OiB7XG4gICAgdHlwZTogbnVsbCxcbiAgICBzY3JvbGxZOjAsXG4gICAgc2Nyb2xsWDowXG4gIH0sXG5cbiAgX2hhc1JlcXVlc3RlZE5leHRGcmFtZTogZmFsc2UsXG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5kaXNwYXRjaGVyID0gbmV3IEV2ZW50RGlzcGF0Y2hlcigpO1xuICAgIHRoaXMuYW5pbWF0aW9uRnJhbWUgPSB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRnJhbWU7XG4gICAgY29uc29sZS5sb2coJ2hpcy5hbmltYXRpb25GcmFtZScsIHRoaXMuYW5pbWF0aW9uRnJhbWUpO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsUG9zaXRpb24gPSAodGhpcy5lbGVtZW50ID09PSB3aW5kb3cpID8gZGVsZWdhdGUodGhpcywgdGhpcy51cGRhdGVXaW5kb3dTY3JvbGxQb3NpdGlvbikgOiBkZWxlZ2F0ZSh0aGlzLCB0aGlzLnVwZGF0ZUVsZW1lbnRTY3JvbGxQb3NpdGlvbik7XG4gICAgdGhpcy51cGRhdGVTY3JvbGxQb3NpdGlvbigpO1xuICAgIHRoaXMubGFzdEV2ZW50LnNjcm9sbFkgPSB0aGlzLnNjcm9sbFk7XG4gICAgdGhpcy5sYXN0RXZlbnQuc2Nyb2xsWCA9IHRoaXMuc2Nyb2xsWDtcbiAgICB0aGlzLm9uU2Nyb2xsRGVsZWdhdGUgPSBkZWxlZ2F0ZSh0aGlzLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICB0aGlzLm9uTmV4dEZyYW1lRGVsZWdhdGUgPSBkZWxlZ2F0ZSh0aGlzLCB0aGlzLm9uTmV4dEZyYW1lKTtcbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5vblNjcm9sbERlbGVnYXRlLCBmYWxzZSk7XG4gIH0sXG5cbiAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgaWYoX2luc3RhbmNlTWFwW3RoaXMuZWxlbWVudF0ubGlzdGVuZXJDb3VudCA8PSAwICYmICF0aGlzLmRlc3Ryb3llZCl7XG4gICAgICBkZWxldGUoX2luc3RhbmNlTWFwW3RoaXMuZWxlbWVudF0pO1xuICAgICAgdGhpcy5jYW5jZWxOZXh0RnJhbWUoKTtcbiAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsRGVsZWdhdGUpO1xuICAgICAgdGhpcy5kaXNwYXRjaGVyLm9mZigpO1xuICAgICAgdGhpcy5kaXNwYXRjaGVyID0gbnVsbDtcbiAgICAgIHRoaXMub25TY3JvbGxEZWxlZ2F0ZSA9IG51bGw7XG4gICAgICB0aGlzLnVwZGF0ZVNjcm9sbFBvc2l0aW9uID0gbnVsbDtcbiAgICAgIHRoaXMub25OZXh0RnJhbWVEZWxlZ2F0ZSA9IG51bGw7XG4gICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBnZXRBdHRyaWJ1dGVzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2Nyb2xsWTogdGhpcy5zY3JvbGxZLFxuICAgICAgc2Nyb2xsWDogdGhpcy5zY3JvbGxYLFxuICAgICAgc3BlZWRZOiB0aGlzLnNwZWVkWSxcbiAgICAgIHNwZWVkWDogdGhpcy5zcGVlZFgsXG4gICAgICBhbmdsZTogMCxcbiAgICAgIGRpcmVjdGlvblk6IHRoaXMuc3BlZWRZID09PSAwID8gRmFzdFNjcm9sbC5OT05FIDogKCh0aGlzLnNwZWVkWSA+IDApID8gRmFzdFNjcm9sbC5VUCA6IEZhc3RTY3JvbGwuRE9XTiksXG4gICAgICBkaXJlY3Rpb25YOiB0aGlzLnNwZWVkWCA9PT0gMCA/IEZhc3RTY3JvbGwuTk9ORSA6ICgodGhpcy5zcGVlZFggPiAwKSA/IEZhc3RTY3JvbGwuUklHSFQgOiBGYXN0U2Nyb2xsLkxFRlQpXG4gICAgfTtcbiAgfSxcblxuICB1cGRhdGVXaW5kb3dTY3JvbGxQb3NpdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zY3JvbGxZID0gdGhpcy5lbGVtZW50LnNjcm9sbFkgfHwgdGhpcy5lbGVtZW50LnBhZ2VZT2Zmc2V0IHx8IDA7XG4gICAgdGhpcy5zY3JvbGxYID0gdGhpcy5lbGVtZW50LnNjcm9sbFggfHwgdGhpcy5lbGVtZW50LnBhZ2VYT2Zmc2V0IHx8IDA7XG4gIH0sXG5cbiAgdXBkYXRlRWxlbWVudFNjcm9sbFBvc2l0aW9uOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNjcm9sbFkgPSB0aGlzLmVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIHRoaXMuc2Nyb2xsWCA9IHRoaXMuZWxlbWVudC5zY3JvbGxMZWZ0O1xuICB9LFxuXG4gIG9uU2Nyb2xsOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbFBvc2l0aW9uKCk7XG4gICAgdGhpcy5jdXJyZW50U3RvcEZyYW1lcyA9IDA7XG4gICAgdGhpcy5zY3JvbGxpbmcgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMuZmlyc3RSZW5kZXIpIHtcbiAgICAgIGlmICh0aGlzLnNjcm9sbFkgPiAxKSB7XG4gICAgICAgIHRoaXMuY3VycmVudFN0b3BGcmFtZXMgPSB0aGlzLnN0b3BGcmFtZXMgLSAxO1xuICAgICAgfVxuICAgICAgdGhpcy5maXJzdFJlbmRlciA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5faGFzUmVxdWVzdGVkTmV4dEZyYW1lKSB7XG4gICAgICB0aGlzLl9oYXNSZXF1ZXN0ZWROZXh0RnJhbWUgPSB0cnVlO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdzY3JvbGw6c3RhcnQnKTtcbiAgICAgIHRoaXMubmV4dEZyYW1lSUQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5vbk5leHRGcmFtZURlbGVnYXRlKTtcbiAgICB9XG4gICAgaWYoIXRoaXMuYW5pbWF0aW9uRnJhbWUpe1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICB0aGlzLm9uTmV4dEZyYW1lKCk7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHNlbGYub25TY3JvbGxTdG9wKCk7XG4gICAgICB9LCAxMDApO1xuICAgIH1cbiAgfSxcblxuICBvbk5leHRGcmFtZTogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYodGhpcy5hbmltYXRpb25GcmFtZSl7XG4gICAgICB0aGlzLnVwZGF0ZVNjcm9sbFBvc2l0aW9uKCk7XG4gICAgfVxuXG4gICAgdGhpcy5zcGVlZFkgPSB0aGlzLmxhc3RTY3JvbGxZIC0gdGhpcy5zY3JvbGxZO1xuICAgIHRoaXMuc3BlZWRYID0gdGhpcy5sYXN0U2Nyb2xsWCAtIHRoaXMuc2Nyb2xsWDtcblxuICAgIHRoaXMubGFzdFNjcm9sbFkgPSB0aGlzLnNjcm9sbFk7XG4gICAgdGhpcy5sYXN0U2Nyb2xsWCA9IHRoaXMuc2Nyb2xsWDtcblxuICAgIGlmKHRoaXMuYW5pbWF0aW9uRnJhbWUpe1xuICAgICAgaWYgKHRoaXMuc3BlZWRZID09PSAwICYmIHRoaXMuc2Nyb2xsaW5nICYmICh0aGlzLmN1cnJlbnRTdG9wRnJhbWVzKysgPiB0aGlzLnN0b3BGcmFtZXMpKSB7XG4gICAgICAgIHRoaXMub25TY3JvbGxTdG9wKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3Njcm9sbDpwcm9ncmVzcycpO1xuICAgIGlmKHRoaXMuYW5pbWF0aW9uRnJhbWUpe1xuICAgICAgdGhpcy5uZXh0RnJhbWVJRCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLm9uTmV4dEZyYW1lRGVsZWdhdGUpO1xuICAgIH1cblxuICB9LFxuXG4gIG9uU2Nyb2xsU3RvcDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zY3JvbGxpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmNhbmNlbE5leHRGcmFtZSgpO1xuICAgIHRoaXMuX2hhc1JlcXVlc3RlZE5leHRGcmFtZSA9IGZhbHNlO1xuICAgIHRoaXMuY3VycmVudFN0b3BGcmFtZXMgPSAwO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc2Nyb2xsOnN0b3AnKTtcbiAgfSxcblxuXG4gIGNhbmNlbE5leHRGcmFtZTpmdW5jdGlvbigpe1xuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMubmV4dEZyYW1lSUQpO1xuICB9LFxuXG4gIGRpc3BhdGNoRXZlbnQ6IGZ1bmN0aW9uKHR5cGUsIGV2ZW50T2JqZWN0KSB7XG4gICAgZXZlbnRPYmplY3QgPSBldmVudE9iamVjdCB8fCB0aGlzLmdldEF0dHJpYnV0ZXMoKTtcblxuICAgIGlmKHRoaXMubGFzdEV2ZW50LnR5cGUgPT09IHR5cGUgJiYgdGhpcy5sYXN0RXZlbnQuc2Nyb2xsWSA9PT0gZXZlbnRPYmplY3Quc2Nyb2xsWSAmJiB0aGlzLmxhc3RFdmVudC5zY3JvbGxYID09PSBldmVudE9iamVjdC5zY3JvbGxYKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5sYXN0RXZlbnQgPSB7XG4gICAgICB0eXBlOiB0eXBlLFxuICAgICAgc2Nyb2xsWTogZXZlbnRPYmplY3Quc2Nyb2xsWSxcbiAgICAgIHNjcm9sbFg6IGV2ZW50T2JqZWN0LnNjcm9sbFhcbiAgICB9O1xuICAgIGV2ZW50T2JqZWN0LmZhc3RTY3JvbGwgPSB0aGlzO1xuICAgIGV2ZW50T2JqZWN0LnRhcmdldCA9IHRoaXMuZWxlbWVudDtcbiAgICB0aGlzLmRpc3BhdGNoZXIuZGlzcGF0Y2godHlwZSwgZXZlbnRPYmplY3QpO1xuICB9LFxuXG4gIG9uOiBmdW5jdGlvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICBpZiAodGhpcy5kaXNwYXRjaGVyLm9uKGV2ZW50LCBsaXN0ZW5lcikpIHtcbiAgICAgIF9pbnN0YW5jZU1hcFt0aGlzLmVsZW1lbnRdLmxpc3RlbmVyQ291bnQgKz0gMTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgb2ZmOiBmdW5jdGlvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICBpZih0aGlzLmRpc3BhdGNoZXIub2ZmKGV2ZW50LCBsaXN0ZW5lcikpe1xuICAgICAgX2luc3RhbmNlTWFwW3RoaXMuZWxlbWVudF0ubGlzdGVuZXJDb3VudCAtPSAxO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuRmFzdFNjcm9sbC5fX19pbnN0YW5jZU1hcCA9IF9pbnN0YW5jZU1hcDtcblxubW9kdWxlLmV4cG9ydHMgPSBGYXN0U2Nyb2xsO1xuIl19
