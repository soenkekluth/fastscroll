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

var delegate = require('delegatejs');

var FastScroll = function(options) {
  this.options = (options || {});
  this.element = this.options.el ||  window;
  this.init();
};

FastScroll.prototype = {

  scrolling: false,
  scrollY: 0,
  scrollX: 0,
  lastScrollY: 0,
  lastScrollX: 0,
  speedY: 0,
  speedX: 0,

  _hasRequestedAnimationFrame: false,

  init: function() {
    this.element.addEventListener('scroll', delegate(this, this.onScroll), false);
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
    this.scrollY = this.element.scrollY;
    this.scrollX = this.element.scrollX;
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVsZWdhdGVqcy9kZWxlZ2F0ZS5qcyIsInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNCBTw7Zua2UgS2x1dGhcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mXG4gKiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluXG4gKiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvXG4gKiB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZlxuICogdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLFxuICogc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTXG4gKiBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1JcbiAqIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUlxuICogSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU5cbiAqIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKiovXG5cbihmdW5jdGlvbihleHBvcnRzKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZGVsZWdhdGUgPSBmdW5jdGlvbih0YXJnZXQsIGhhbmRsZXIpIHtcbiAgICAgICAgLy8gR2V0IGFueSBleHRyYSBhcmd1bWVudHMgZm9yIGhhbmRsZXJcbiAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGRlbGVnYXRlIGZ1bmN0aW9uXG4gICAgICAgIHZhciBmbiA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAvLyBDYWxsIGhhbmRsZXIgd2l0aCBhcmd1bWVudHNcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVyLmFwcGx5KHRhcmdldCwgYXJncyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBkZWxlZ2F0ZSBmdW5jdGlvbi5cbiAgICAgICAgcmV0dXJuIGZuO1xuICAgIH07XG5cblxuICAgICh0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpID8gKG1vZHVsZS5leHBvcnRzID0gZGVsZWdhdGUpIDogKHR5cGVvZiBkZWZpbmUgIT0gXCJ1bmRlZmluZWRcIiA/IChkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZTtcbiAgICB9KSkgOiAoZXhwb3J0cy5kZWxlZ2F0ZSA9IGRlbGVnYXRlKSk7XG5cbn0pKHRoaXMpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKlxuICogRmFzdFNjcm9sbFxuICogaHR0cHM6Ly9naXRodWIuY29tL3NvZW5rZWtsdXRoL2Zhc3RzY3JvbGxcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgU8O2bmtlIEtsdXRoXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxudmFyIGRlbGVnYXRlID0gcmVxdWlyZSgnZGVsZWdhdGVqcycpO1xuXG52YXIgRmFzdFNjcm9sbCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zID0gKG9wdGlvbnMgfHwge30pO1xuICB0aGlzLmVsZW1lbnQgPSB0aGlzLm9wdGlvbnMuZWwgfHwgwqB3aW5kb3c7XG4gIHRoaXMuaW5pdCgpO1xufTtcblxuRmFzdFNjcm9sbC5wcm90b3R5cGUgPSB7XG5cbiAgc2Nyb2xsaW5nOiBmYWxzZSxcbiAgc2Nyb2xsWTogMCxcbiAgc2Nyb2xsWDogMCxcbiAgbGFzdFNjcm9sbFk6IDAsXG4gIGxhc3RTY3JvbGxYOiAwLFxuICBzcGVlZFk6IDAsXG4gIHNwZWVkWDogMCxcblxuICBfaGFzUmVxdWVzdGVkQW5pbWF0aW9uRnJhbWU6IGZhbHNlLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBkZWxlZ2F0ZSh0aGlzLCB0aGlzLm9uU2Nyb2xsKSwgZmFsc2UpO1xuICB9LFxuXG4gIGdldEF0dHJpYnV0ZXM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY3JvbGxZOiB0aGlzLnNjcm9sbFksXG4gICAgICBzY3JvbGxYOiB0aGlzLnNjcm9sbFgsXG4gICAgICBzcGVlZFk6IHRoaXMuc3BlZWRZLFxuICAgICAgc3BlZWRYOiB0aGlzLnNwZWVkWCxcbiAgICAgIGFuZ2xlOiAwLFxuICAgICAgLy9UT0RPIG5vdCBzYXZlIGZvciBub3cuLi4gZG8gbGlrZSBjaGVja1Njcm9sbHN0b3BcbiAgICAgIGRpcmVjdGlvbjogdGhpcy5zcGVlZFkgPT09IDAgPyAnbm9uZScgOiAodGhpcy5zcGVlZFkgPiAwKSA/ICd1cCcgOiAnZG93bidcbiAgICB9O1xuICB9LFxuXG4gIG9uU2Nyb2xsOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNjcm9sbFkgPSB0aGlzLmVsZW1lbnQuc2Nyb2xsWTtcbiAgICB0aGlzLnNjcm9sbFggPSB0aGlzLmVsZW1lbnQuc2Nyb2xsWDtcbiAgICB0aGlzLnNjcm9sbGluZyA9IHRydWU7XG5cbiAgICBpZiAoIXRoaXMuX2hhc1JlcXVlc3RlZEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgICB0aGlzLl9oYXNSZXF1ZXN0ZWRBbmltYXRpb25GcmFtZSA9IHRydWU7XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRlbGVnYXRlKHRoaXMsIHRoaXMub25BbmltYXRpb25GcmFtZSkpO1xuICAgICAgdmFyIGF0dHIgPSB0aGlzLmdldEF0dHJpYnV0ZXMoKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc2Nyb2xsOnN0YXJ0JywgYXR0cik7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnN0YXJ0KSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5zdGFydC5jYWxsKHRoaXMsIGF0dHIpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBvbkFuaW1hdGlvbkZyYW1lOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNwZWVkWSA9IHRoaXMubGFzdFNjcm9sbFkgLSB0aGlzLnNjcm9sbFk7XG4gICAgdGhpcy5zcGVlZFggPSB0aGlzLmxhc3RTY3JvbGxYIC0gdGhpcy5zY3JvbGxYO1xuXG4gICAgdGhpcy5sYXN0U2Nyb2xsWSA9IHRoaXMuc2Nyb2xsWTtcbiAgICB0aGlzLmxhc3RTY3JvbGxYID0gdGhpcy5zY3JvbGxYO1xuXG4gICAgdmFyIGF0dHIgPSB0aGlzLmdldEF0dHJpYnV0ZXMoKTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3Njcm9sbDpwcm9ncmVzcycsIHRoaXMuZ2V0QXR0cmlidXRlcygpKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuc2Nyb2xsaW5nKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuc2Nyb2xsaW5nLmNhbGwodGhpcywgYXR0cik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3BlZWRZID09PSAwICYmIHRoaXMuc3BlZWRYID09PSAwKSB7XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRlbGVnYXRlKHRoaXMsIHRoaXMub25DaGVja1Njcm9sbFN0b3ApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShkZWxlZ2F0ZSh0aGlzLCB0aGlzLm9uQW5pbWF0aW9uRnJhbWUpKTtcbiAgICB9XG4gIH0sXG5cbiAgb25DaGVja1Njcm9sbFN0b3A6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3BlZWRZID0gdGhpcy5sYXN0U2Nyb2xsWSAtIHRoaXMuc2Nyb2xsWTtcbiAgICB0aGlzLnNwZWVkWCA9IHRoaXMubGFzdFNjcm9sbFggLSB0aGlzLnNjcm9sbFg7XG4gICAgaWYgKHRoaXMuc3BlZWRZID09PSAwICYmIHRoaXMuc3BlZWRYID09PSAwKSB7XG4gICAgICB0aGlzLnNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5faGFzUmVxdWVzdGVkQW5pbWF0aW9uRnJhbWUgPSBmYWxzZTtcbiAgICAgIHZhciBhdHRyID0gdGhpcy5nZXRBdHRyaWJ1dGVzKCk7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3Njcm9sbDpzdG9wJywgYXR0cik7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnN0b3ApIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnN0b3AuY2FsbCh0aGlzLCBhdHRyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vbkFuaW1hdGlvbkZyYW1lKCk7XG4gICAgfVxuICB9LFxuXG4gIGRpc3BhdGNoRXZlbnQ6IGZ1bmN0aW9uKHR5cGUsIGV2ZW50T2JqZWN0KSB7XG4gICAgLy8gY3JlYXRlIGFuZCBkaXNwYXRjaCB0aGUgZXZlbnRcbiAgICB2YXIgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQodHlwZSwge1xuICAgICAgZGV0YWlsOiBldmVudE9iamVjdFxuICAgIH0pO1xuICAgIHRoaXMuZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgfSxcblxuICBvbjogZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHRoaXMuZWxlbWVudCkge1xuICAgICAgLy9UT0RPIGNoZWNrIGZvciBldmVudHM6IGV2ZW50XG4gICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIsIGZhbHNlKTtcbiAgICB9XG4gIH0sXG5cbiAgb2ZmOiBmdW5jdGlvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICBpZiAodGhpcy5lbGVtZW50KSB7XG4gICAgICAvL1RPRE8gY2hlY2sgZm9yIGV2ZW50czogZXZlbnRcbiAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcik7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhc3RTY3JvbGw7XG4iXX0=
