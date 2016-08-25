(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.FastScroll = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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

},{}],2:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _delegatejs = _dereq_('delegatejs');

var _delegatejs2 = _interopRequireDefault(_delegatejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _instanceMap = new Map();

var unprefixAnimationFrame = function unprefixAnimationFrame() {
  window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
};

var FastScroll = function () {
  function FastScroll() {
    var scrollTarget = arguments.length <= 0 || arguments[0] === undefined ? window : arguments[0];
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, FastScroll);

    if (FastScroll.hasScrollTarget(scrollTarget)) {
      return FastScroll.getInstance(scrollTarget);
    }

    this.scrollTarget = scrollTarget;
    this.options = options;

    _instanceMap.set(this.scrollTarget, this);

    if (!this.options.hasOwnProperty('animationFrame')) {
      this.options.animationFrame = true;
    }

    unprefixAnimationFrame();

    this.destroyed = false;
    this.scrollY = 0;
    this.scrollX = 0;
    this.lastScrollY = 0;
    this.lastScrollX = 0;
    this.timeout = 0;
    this.speedY = 0;
    this.speedX = 0;
    this.stopFrames = 5;
    this.currentStopFrames = 0;
    this.firstRender = true;
    this.animationFrame = true;


    this.scrolling = false;

    this.init();
  }

  FastScroll.prototype.init = function init() {

    this.updateScrollPosition = this.scrollTarget === window ? (0, _delegatejs2.default)(this, this.updateWindowScrollPosition) : (0, _delegatejs2.default)(this, this.updateElementScrollPosition);
    this.updateScrollPosition();
    this.trigger = this.dispatchEvent;
    this.attr = this.getAttributes;

    this.onScroll = (0, _delegatejs2.default)(this, this.onScroll);
    this.onNextFrame = (0, _delegatejs2.default)(this, this.onNextFrame);
    if (this.scrollTarget.addEventListener) {
      this.scrollTarget.addEventListener('scroll', this.onScroll, Can.passiveEvents ? { passive: true } : false);
    } else if (this.scrollTarget.attachEvent) {
      this.scrollTarget.attachEvent('scroll', this.onScroll);
    }
  };

  FastScroll.prototype.destroy = function destroy() {
    if (!this.destroyed) {
      this.cancelNextFrame();
      if (this.scrollTarget.addEventListener) {
        this.scrollTarget.removeEventListener('mousewheel', this.onScroll);
        this.scrollTarget.removeEventListener('scroll', this.onScroll);
      } else if (this.scrollTarget.attachEvent) {
        this.scrollTarget.detachEvent('onmousewheel', this.onScroll);
        this.scrollTarget.detachEvent('scroll', this.onScroll);
      }

      this.onScroll = null;
      this.updateScrollPosition = null;
      this.onNextFrame = null;
      this.scrollTarget = null;
      this.destroyed = true;
    }
  };

  FastScroll.prototype.getAttributes = function getAttributes() {
    return {
      scrollY: this.scrollY,
      scrollX: this.scrollX,
      speedY: this.speedY,
      speedX: this.speedX,
      angle: 0,
      directionY: this.speedY === 0 ? FastScroll.NONE : this.speedY > 0 ? FastScroll.UP : FastScroll.DOWN,
      directionX: this.speedX === 0 ? FastScroll.NONE : this.speedX > 0 ? FastScroll.RIGHT : FastScroll.LEFT
    };
  };

  FastScroll.prototype.updateWindowScrollPosition = function updateWindowScrollPosition() {
    this.scrollY = window.scrollY || window.pageYOffset || 0;
    this.scrollX = window.scrollX || window.pageXOffset || 0;
  };

  FastScroll.prototype.updateElementScrollPosition = function updateElementScrollPosition() {
    this.scrollY = this.scrollTarget.scrollTop;
    this.scrollX = this.scrollTarget.scrollLeft;
  };

  FastScroll.prototype.onScroll = function onScroll() {
    this.currentStopFrames = 0;
    if (this.firstRender) {
      this.firstRender = false;
      if (this.scrollY > 1) {
        this.updateScrollPosition();
        this.dispatchEvent(FastScroll.EVENT_SCROLL_PROGRESS);
        return;
      }
    }

    if (!this.scrolling) {
      this.scrolling = true;
      this.dispatchEvent(FastScroll.EVENT_SCROLL_START);
      if (this.options.animationFrame) {
        this.nextFrameID = window.requestAnimationFrame(this.onNextFrame);
      } else {
        clearTimeout(this.timeout);
        this.onNextFrame();
        var self = this;
        this.timeout = setTimeout(function () {
          self.onScrollStop();
        }, 100);
      }
    }
  };

  FastScroll.prototype.onNextFrame = function onNextFrame() {

    this.updateScrollPosition();

    this.speedY = this.lastScrollY - this.scrollY;
    this.speedX = this.lastScrollX - this.scrollX;

    this.lastScrollY = this.scrollY;
    this.lastScrollX = this.scrollX;

    if (this.options.animationFrame && this.scrolling && this.speedY === 0 && this.currentStopFrames++ > this.stopFrames) {
      this.onScrollStop();
      return;
    }

    this.dispatchEvent(FastScroll.EVENT_SCROLL_PROGRESS);

    if (this.options.animationFrame) {
      this.nextFrameID = requestAnimationFrame(this.onNextFrame);
    }
  };

  FastScroll.prototype.onScrollStop = function onScrollStop() {
    this.scrolling = false;
    if (this.options.animationFrame) {
      this.cancelNextFrame();
      this.currentStopFrames = 0;
    }
    this.dispatchEvent(FastScroll.EVENT_SCROLL_STOP);
  };

  FastScroll.prototype.cancelNextFrame = function cancelNextFrame() {
    window.cancelAnimationFrame(this.nextFrameID);
  };

  FastScroll.prototype.dispatchEvent = function dispatchEvent(event) {
    this.scrollTarget.dispatchEvent(event);
  };

  FastScroll.prototype.on = function on(event, listener) {
    return this.scrollTarget.addEventListener(event, listener);
  };

  FastScroll.prototype.off = function off(event, listener) {
    return this.scrollTarget.removeEventListener(event, listener);
  };

  return FastScroll;
}();

FastScroll.getInstance = function (scrollTarget, options) {
  if (!_instanceMap.has(scrollTarget)) {
    _instanceMap.set(scrollTarget, new FastScroll(scrollTarget, options));
  }
  return _instanceMap.get(scrollTarget);
};

FastScroll.hasInstance = function (scrollTarget) {
  return _instanceMap.has(scrollTarget);
};

FastScroll.hasScrollTarget = FastScroll.hasInstance;

FastScroll.clearInstance = function () {
  var scrollTarget = arguments.length <= 0 || arguments[0] === undefined ? window : arguments[0];

  if (FastScroll.hasInstance(scrollTarget)) {
    FastScroll.getInstance(scrollTarget).destroy();
    _instanceMap.delete(scrollTarget);
  }
};

FastScroll.UP = 'up';
FastScroll.DOWN = 'down';
FastScroll.NONE = 'none';
FastScroll.LEFT = 'left';
FastScroll.RIGHT = 'right';
FastScroll.EVENT_SCROLL_PROGRESS = new Event('scroll:progress');
FastScroll.EVENT_SCROLL_START = new Event('scroll:start');
FastScroll.EVENT_SCROLL_STOP = new Event('scroll:stop');
exports.default = FastScroll;

var Can = function () {
  function Can() {
    _classCallCheck(this, Can);

    this._passiveEvents = null;
  }

  _createClass(Can, [{
    key: 'animationFrame',
    get: function get() {
      return true;
    }
  }, {
    key: 'passiveEvents',
    get: function get() {
      var _this = this;

      if (!this._passiveEvents) {
        return this._passiveEvents;
      }
      this._supportsPassive = false;
      try {
        var opts = Object.defineProperty({}, 'passive', {
          get: function get() {
            _this._supportsPassive = true;
          }
        });
        window.addEventListener("test", null, opts);
      } catch (e) {}
    }
  }]);

  return Can;
}();

module.exports = exports['default'];

},{"delegatejs":1}]},{},[2])(2)
});