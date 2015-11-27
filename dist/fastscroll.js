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

/*
 * FastScroll
 * https://github.com/soenkekluth/fastscroll
 *
 * Copyright (c) 2014 Sönke Kluth
 * Licensed under the MIT license.
 */

 /**
  * [CustomEvent Polyfill]
  */

 var ceSupport = true;

 try {
   new CustomEvent();
 }catch(e){
   ceSupport = false;
 }

 if (!ceSupport || typeof window.CustomEvent === 'undefined') {
   (function() {
     'use strict';
     window.CustomEvent = function(event, params) {
       var evt;
       params = params || {
         bubbles: false,
         cancelable: false,
         detail: undefined
       };
       evt = document.createEvent('CustomEvent');
       evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
       return evt;
     };

     window.CustomEvent.prototype = window.Event.prototype;
   }());
 }


var delegate = require('delegatejs');

var FastScroll = function(options) {
  this.options = (options || {});
  this.element = this.options.el ||  window;
  this.init();
};

FastScroll.prototype = {

  destroyed: false,
  scrolling: false,
  scrollY: 0,
  scrollX: 0,
  lastScrollY: 0,
  lastScrollX: 0,
  speedY: 0,
  speedX: 0,

  _hasRequestedAnimationFrame: false,

  init: function() {
    this.onScrollDelegate = delegate(this, this.onScroll);
    this.element.addEventListener('scroll', this.onScrollDelegate, false);
  },

  destroy: function() {
    this.element.removeEventListener('scroll', this.onScrollDelegate);
    this.onScrollDelegate = null;
    this.element = null;
    this.options = null;
    this.destroyed = true;
  },

  getAttributes: function() {
    return {
      scrollY: this.scrollY,
      scrollX: this.scrollX,
      speedY: this.speedY,
      speedX: this.speedX,
      angle: 0,
      //TODO not save for now... do like checkScrollstop
      direction: this.speedY === 0 ? 'none' : (this.speedY > 0) ? 'up' : 'down'
    };
  },

  onScroll: function() {
    this.scrollY = this.element.scrollY || this.element.pageYOffset || 0;
    this.scrollX = this.element.scrollX || this.element.pageXOffset || 0;
    this.scrolling = true;


    if (!this._hasRequestedAnimationFrame) {
      this._hasRequestedAnimationFrame = true;
      window.requestAnimationFrame(delegate(this, this.onAnimationFrame));
      var attr = this.getAttributes();
      this.dispatchEvent('scroll:start', attr);
      if (this.options.start) {
        this.options.start.call(this, attr);
      }
    }
  },

  onAnimationFrame: function() {

    if (this.destroyed) {
      return;
    }

    this.speedY = this.lastScrollY - this.scrollY;
    this.speedX = this.lastScrollX - this.scrollX;

    this.lastScrollY = this.scrollY;
    this.lastScrollX = this.scrollX;

    var attr = this.getAttributes();
    this.dispatchEvent('scroll:progress', this.getAttributes());

    if (this.options.scrolling) {
      this.options.scrolling.call(this, attr);
    }

    if (this.speedY === 0 && this.speedX === 0) {
      window.requestAnimationFrame(delegate(this, this.onCheckScrollStop));
    } else {
      window.requestAnimationFrame(delegate(this, this.onAnimationFrame));
    }
  },

  onCheckScrollStop: function() {

    this.speedY = this.lastScrollY - this.scrollY;
    this.speedX = this.lastScrollX - this.scrollX;
    if (this.speedY === 0 && this.speedX === 0) {
      this.scrolling = false;
      this._hasRequestedAnimationFrame = false;
      var attr = this.getAttributes();
      this.dispatchEvent('scroll:stop', attr);
      if (this.options.stop) {
        this.options.stop.call(this, attr);
      }
    } else {
      this.onAnimationFrame();
    }
  },

  dispatchEvent: function(type, eventObject) {
    // create and dispatch the event
    var event = new CustomEvent(type, {
      detail: eventObject
    });
    this.element.dispatchEvent(event);
  },

  on: function(event, listener) {
    if (this.element) {
      //TODO check for events: event
      this.element.addEventListener(event, listener, false);
    }
  },

  off: function(event, listener) {
    if (this.element) {
      //TODO check for events: event
      this.element.removeEventListener(event, listener);
    }
  }
};

module.exports = FastScroll;

},{"delegatejs":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVsZWdhdGVqcy9kZWxlZ2F0ZS5qcyIsInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0IFPDtm5rZSBLbHV0aFxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2ZcbiAqIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW5cbiAqIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cbiAqIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mXG4gKiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXG4gKiBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1NcbiAqIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUlxuICogQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSXG4gKiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxuICogQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqKi9cblxuKGZ1bmN0aW9uKGV4cG9ydHMpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBkZWxlZ2F0ZSA9IGZ1bmN0aW9uKHRhcmdldCwgaGFuZGxlcikge1xuICAgICAgICAvLyBHZXQgYW55IGV4dHJhIGFyZ3VtZW50cyBmb3IgaGFuZGxlclxuICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcblxuICAgICAgICAvLyBDcmVhdGUgZGVsZWdhdGUgZnVuY3Rpb25cbiAgICAgICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vIENhbGwgaGFuZGxlciB3aXRoIGFyZ3VtZW50c1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIuYXBwbHkodGFyZ2V0LCBhcmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGRlbGVnYXRlIGZ1bmN0aW9uLlxuICAgICAgICByZXR1cm4gZm47XG4gICAgfTtcblxuXG4gICAgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykgPyAobW9kdWxlLmV4cG9ydHMgPSBkZWxlZ2F0ZSkgOiAodHlwZW9mIGRlZmluZSAhPSBcInVuZGVmaW5lZFwiID8gKGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlO1xuICAgIH0pKSA6IChleHBvcnRzLmRlbGVnYXRlID0gZGVsZWdhdGUpKTtcblxufSkodGhpcyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qXG4gKiBGYXN0U2Nyb2xsXG4gKiBodHRwczovL2dpdGh1Yi5jb20vc29lbmtla2x1dGgvZmFzdHNjcm9sbFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNCBTw7Zua2UgS2x1dGhcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG4gLyoqXG4gICogW0N1c3RvbUV2ZW50IFBvbHlmaWxsXVxuICAqL1xuXG4gdmFyIGNlU3VwcG9ydCA9IHRydWU7XG5cbiB0cnkge1xuICAgbmV3IEN1c3RvbUV2ZW50KCk7XG4gfWNhdGNoKGUpe1xuICAgY2VTdXBwb3J0ID0gZmFsc2U7XG4gfVxuXG4gaWYgKCFjZVN1cHBvcnQgfHwgdHlwZW9mIHdpbmRvdy5DdXN0b21FdmVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgIChmdW5jdGlvbigpIHtcbiAgICAgJ3VzZSBzdHJpY3QnO1xuICAgICB3aW5kb3cuQ3VzdG9tRXZlbnQgPSBmdW5jdGlvbihldmVudCwgcGFyYW1zKSB7XG4gICAgICAgdmFyIGV2dDtcbiAgICAgICBwYXJhbXMgPSBwYXJhbXMgfHwge1xuICAgICAgICAgYnViYmxlczogZmFsc2UsXG4gICAgICAgICBjYW5jZWxhYmxlOiBmYWxzZSxcbiAgICAgICAgIGRldGFpbDogdW5kZWZpbmVkXG4gICAgICAgfTtcbiAgICAgICBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICAgICBldnQuaW5pdEN1c3RvbUV2ZW50KGV2ZW50LCBwYXJhbXMuYnViYmxlcywgcGFyYW1zLmNhbmNlbGFibGUsIHBhcmFtcy5kZXRhaWwpO1xuICAgICAgIHJldHVybiBldnQ7XG4gICAgIH07XG5cbiAgICAgd2luZG93LkN1c3RvbUV2ZW50LnByb3RvdHlwZSA9IHdpbmRvdy5FdmVudC5wcm90b3R5cGU7XG4gICB9KCkpO1xuIH1cblxuXG52YXIgZGVsZWdhdGUgPSByZXF1aXJlKCdkZWxlZ2F0ZWpzJyk7XG5cbnZhciBGYXN0U2Nyb2xsID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB0aGlzLm9wdGlvbnMgPSAob3B0aW9ucyB8fCB7fSk7XG4gIHRoaXMuZWxlbWVudCA9IHRoaXMub3B0aW9ucy5lbCB8fCDCoHdpbmRvdztcbiAgdGhpcy5pbml0KCk7XG59O1xuXG5GYXN0U2Nyb2xsLnByb3RvdHlwZSA9IHtcblxuICBkZXN0cm95ZWQ6IGZhbHNlLFxuICBzY3JvbGxpbmc6IGZhbHNlLFxuICBzY3JvbGxZOiAwLFxuICBzY3JvbGxYOiAwLFxuICBsYXN0U2Nyb2xsWTogMCxcbiAgbGFzdFNjcm9sbFg6IDAsXG4gIHNwZWVkWTogMCxcbiAgc3BlZWRYOiAwLFxuXG4gIF9oYXNSZXF1ZXN0ZWRBbmltYXRpb25GcmFtZTogZmFsc2UsXG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5vblNjcm9sbERlbGVnYXRlID0gZGVsZWdhdGUodGhpcywgdGhpcy5vblNjcm9sbCk7XG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGxEZWxlZ2F0ZSwgZmFsc2UpO1xuICB9LFxuXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsRGVsZWdhdGUpO1xuICAgIHRoaXMub25TY3JvbGxEZWxlZ2F0ZSA9IG51bGw7XG4gICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICB0aGlzLm9wdGlvbnMgPSBudWxsO1xuICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgfSxcblxuICBnZXRBdHRyaWJ1dGVzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2Nyb2xsWTogdGhpcy5zY3JvbGxZLFxuICAgICAgc2Nyb2xsWDogdGhpcy5zY3JvbGxYLFxuICAgICAgc3BlZWRZOiB0aGlzLnNwZWVkWSxcbiAgICAgIHNwZWVkWDogdGhpcy5zcGVlZFgsXG4gICAgICBhbmdsZTogMCxcbiAgICAgIC8vVE9ETyBub3Qgc2F2ZSBmb3Igbm93Li4uIGRvIGxpa2UgY2hlY2tTY3JvbGxzdG9wXG4gICAgICBkaXJlY3Rpb246IHRoaXMuc3BlZWRZID09PSAwID8gJ25vbmUnIDogKHRoaXMuc3BlZWRZID4gMCkgPyAndXAnIDogJ2Rvd24nXG4gICAgfTtcbiAgfSxcblxuICBvblNjcm9sbDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zY3JvbGxZID0gdGhpcy5lbGVtZW50LnNjcm9sbFkgfHwgdGhpcy5lbGVtZW50LnBhZ2VZT2Zmc2V0IHx8IDA7XG4gICAgdGhpcy5zY3JvbGxYID0gdGhpcy5lbGVtZW50LnNjcm9sbFggfHwgdGhpcy5lbGVtZW50LnBhZ2VYT2Zmc2V0IHx8IDA7XG4gICAgdGhpcy5zY3JvbGxpbmcgPSB0cnVlO1xuXG5cbiAgICBpZiAoIXRoaXMuX2hhc1JlcXVlc3RlZEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgICB0aGlzLl9oYXNSZXF1ZXN0ZWRBbmltYXRpb25GcmFtZSA9IHRydWU7XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRlbGVnYXRlKHRoaXMsIHRoaXMub25BbmltYXRpb25GcmFtZSkpO1xuICAgICAgdmFyIGF0dHIgPSB0aGlzLmdldEF0dHJpYnV0ZXMoKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc2Nyb2xsOnN0YXJ0JywgYXR0cik7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnN0YXJ0KSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5zdGFydC5jYWxsKHRoaXMsIGF0dHIpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBvbkFuaW1hdGlvbkZyYW1lOiBmdW5jdGlvbigpIHtcblxuICAgIGlmICh0aGlzLmRlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3BlZWRZID0gdGhpcy5sYXN0U2Nyb2xsWSAtIHRoaXMuc2Nyb2xsWTtcbiAgICB0aGlzLnNwZWVkWCA9IHRoaXMubGFzdFNjcm9sbFggLSB0aGlzLnNjcm9sbFg7XG5cbiAgICB0aGlzLmxhc3RTY3JvbGxZID0gdGhpcy5zY3JvbGxZO1xuICAgIHRoaXMubGFzdFNjcm9sbFggPSB0aGlzLnNjcm9sbFg7XG5cbiAgICB2YXIgYXR0ciA9IHRoaXMuZ2V0QXR0cmlidXRlcygpO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc2Nyb2xsOnByb2dyZXNzJywgdGhpcy5nZXRBdHRyaWJ1dGVzKCkpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5zY3JvbGxpbmcpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5zY3JvbGxpbmcuY2FsbCh0aGlzLCBhdHRyKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zcGVlZFkgPT09IDAgJiYgdGhpcy5zcGVlZFggPT09IDApIHtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZGVsZWdhdGUodGhpcywgdGhpcy5vbkNoZWNrU2Nyb2xsU3RvcCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRlbGVnYXRlKHRoaXMsIHRoaXMub25BbmltYXRpb25GcmFtZSkpO1xuICAgIH1cbiAgfSxcblxuICBvbkNoZWNrU2Nyb2xsU3RvcDogZnVuY3Rpb24oKSB7XG5cbiAgICB0aGlzLnNwZWVkWSA9IHRoaXMubGFzdFNjcm9sbFkgLSB0aGlzLnNjcm9sbFk7XG4gICAgdGhpcy5zcGVlZFggPSB0aGlzLmxhc3RTY3JvbGxYIC0gdGhpcy5zY3JvbGxYO1xuICAgIGlmICh0aGlzLnNwZWVkWSA9PT0gMCAmJiB0aGlzLnNwZWVkWCA9PT0gMCkge1xuICAgICAgdGhpcy5zY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuX2hhc1JlcXVlc3RlZEFuaW1hdGlvbkZyYW1lID0gZmFsc2U7XG4gICAgICB2YXIgYXR0ciA9IHRoaXMuZ2V0QXR0cmlidXRlcygpO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdzY3JvbGw6c3RvcCcsIGF0dHIpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdG9wKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5zdG9wLmNhbGwodGhpcywgYXR0cik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub25BbmltYXRpb25GcmFtZSgpO1xuICAgIH1cbiAgfSxcblxuICBkaXNwYXRjaEV2ZW50OiBmdW5jdGlvbih0eXBlLCBldmVudE9iamVjdCkge1xuICAgIC8vIGNyZWF0ZSBhbmQgZGlzcGF0Y2ggdGhlIGV2ZW50XG4gICAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHtcbiAgICAgIGRldGFpbDogZXZlbnRPYmplY3RcbiAgICB9KTtcbiAgICB0aGlzLmVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH0sXG5cbiAgb246IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIGlmICh0aGlzLmVsZW1lbnQpIHtcbiAgICAgIC8vVE9ETyBjaGVjayBmb3IgZXZlbnRzOiBldmVudFxuICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyLCBmYWxzZSk7XG4gICAgfVxuICB9LFxuXG4gIG9mZjogZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHRoaXMuZWxlbWVudCkge1xuICAgICAgLy9UT0RPIGNoZWNrIGZvciBldmVudHM6IGV2ZW50XG4gICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpO1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGYXN0U2Nyb2xsO1xuIl19
