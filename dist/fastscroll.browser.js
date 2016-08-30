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

 function isEmpty(obj) {
   for (var prop in obj) {
     if (obj.hasOwnProperty(prop)){
       return false;
     }
   }
   return true;
 }

var _instanceMap = {};

 var EventDispatcher = function() {
   this._eventMap = {};
   this._destroyed = false;

   //Method Map
   this.on = this.bind = this.addEventListener = this.addListener;
   this.off = this.unbind = this.removeEventListener = this.removeListener;
   this.once = this.one = this.addListenerOnce;
   this.emmit = this.trigger = this.dispatchEvent = this.dispatch;
 };

 EventDispatcher.getInstance = function(key){
  if(!key){
    throw new Error('key must be');
  }
  return _instanceMap[key] || (_instanceMap[key] =  new EventDispatcher());
 };


 EventDispatcher.prototype.addListener = function(event, listener) {
   var listeners = this.getListener(event);
   if (!listeners) {
     this._eventMap[event] = [listener];
     return true;
   }

   if (listeners.indexOf(listener) === -1) {
     listeners.push(listener);
     return true;
   }
   return false;
 };

 EventDispatcher.prototype.addListenerOnce = function(event, listener) {
   var s = this;
   var f2 = function() {
     s.removeListener(event, f2);
     return listener.apply(this, arguments);
   };
   return this.addListener(event, f2);
 };

 EventDispatcher.prototype.removeListener = function(event, listener) {

  if(typeof listener === 'undefined'){
    return this.removeAllListener(event);
  }

   var listeners = this.getListener(event);
   if (listeners) {
     var i = listeners.indexOf(listener);
     if (i > -1) {
       listeners = listeners.splice(i, 1);
       if (!listeners.length) {
         delete(this._eventMap[event]);
       }
       return true;
     }
   }
   return false;
 };

 EventDispatcher.prototype.removeAllListener = function(event) {
   var listeners = this.getListener(event);
   if (listeners) {
     this._eventMap[event].length = 0;
     delete(this._eventMap[event]);
    return true;
   }
   return false;
 };

 EventDispatcher.prototype.hasListener = function(event) {
   return this.getListener(event) !== null;
 };

 EventDispatcher.prototype.hasListeners = function() {
   return (this._eventMap !== null && this._eventMap !== undefined && !isEmpty(this._eventMap));
 };

 EventDispatcher.prototype.dispatch = function(eventType, eventObject) {
   var listeners = this.getListener(eventType);

   if (listeners) {
     eventObject = eventObject || {};
     eventObject.type = eventType;
     eventObject.target = eventObject.target || this;

     var i = -1;
     while (++i < listeners.length) {
       listeners[i](eventObject);
     }
     return true;
   }
   return false;
 };

 EventDispatcher.prototype.getListener = function(event) {
   var result = this._eventMap ? this._eventMap[event] : null;
   return (result || null);
 };

 EventDispatcher.prototype.destroy = function() {
   if (this._eventMap) {
     for (var i in this._eventMap) {
       this.removeAllListener(i);
     }
     this._eventMap = null;
   }
   this._destroyed = true;
 };

 module.exports = EventDispatcher;

},{}],3:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _delegatejs = _dereq_('delegatejs');

var _delegatejs2 = _interopRequireDefault(_delegatejs);

var _eventdispatcher = _dereq_('eventdispatcher');

var _eventdispatcher2 = _interopRequireDefault(_eventdispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

var _instanceMap = {};

var FastScroll = function (_EventDispatcher) {
  _inherits(FastScroll, _EventDispatcher);

  function FastScroll() {
    var scrollTarget = arguments.length <= 0 || arguments[0] === undefined ? window : arguments[0];

    var _this;

    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, FastScroll);

    var instance = (_this = _possibleConstructorReturn(this, _EventDispatcher.call(this)), _this);

    if (FastScroll.hasScrollTarget(scrollTarget)) {
      var _ret;

      return _ret = FastScroll.getInstance(scrollTarget), _possibleConstructorReturn(_this, _ret);
    }

    _this.scrollTarget = scrollTarget;
    _this.options = options;

    _instanceMap[scrollTarget] = _this;

    if (!_this.options.hasOwnProperty('animationFrame')) {
      _this.options.animationFrame = true;
    }

    FastScroll.unprefixAnimationFrame();

    _this.destroyed = false;
    _this.scrollY = 0;
    _this.scrollX = 0;
    _this.lastScrollY = 0;
    _this.lastScrollX = 0;
    _this.timeout = 0;
    _this.speedY = 0;
    _this.speedX = 0;
    _this.stopFrames = 5;
    _this.currentStopFrames = 0;
    _this.firstRender = true;
    _this.animationFrame = true;


    _this.scrolling = false;

    _this.init();

    return _this;
  }

  FastScroll.prototype.init = function init() {

    this.updateScrollPosition = this.scrollTarget === window ? (0, _delegatejs2.default)(this, this.updateWindowScrollPosition) : (0, _delegatejs2.default)(this, this.updateElementScrollPosition);
    this.updateScrollPosition();
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

      _EventDispatcher.prototype.destroy.call(this);

      if (this.scrollTarget.addEventListener) {
        this.scrollTarget.removeEventListener('scroll', this.onScroll);
      } else if (this.scrollTarget.attachEvent) {
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

  _createClass(FastScroll, [{
    key: 'attr',
    get: function get() {
      return this.getAttributes();
    }
  }]);

  return FastScroll;
}(_eventdispatcher2.default);

FastScroll.getInstance = function (scrollTarget, options) {
  if (!_instanceMap[scrollTarget]) {
    _instanceMap[scrollTarget] = new FastScroll(scrollTarget, options);
  }
  return _instanceMap[scrollTarget];
};

FastScroll.hasInstance = function (scrollTarget) {
  return _instanceMap[scrollTarget];
};

FastScroll.hasScrollTarget = FastScroll.hasInstance;

FastScroll.clearInstance = function () {
  var scrollTarget = arguments.length <= 0 || arguments[0] === undefined ? window : arguments[0];

  if (FastScroll.hasInstance(scrollTarget)) {
    FastScroll.getInstance(scrollTarget).destroy();
    delete _instanceMap[scrollTarget];
  }
};

FastScroll.unprefixAnimationFrame = function () {
  window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
};

FastScroll.UP = 'up';
FastScroll.DOWN = 'down';
FastScroll.NONE = 'none';
FastScroll.LEFT = 'left';
FastScroll.RIGHT = 'right';
FastScroll.EVENT_SCROLL_PROGRESS = 'scroll:progress';
FastScroll.EVENT_SCROLL_START = 'scroll:start';
FastScroll.EVENT_SCROLL_STOP = 'scroll:stop';
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
      var _this2 = this;

      if (!this._passiveEvents) {
        return this._passiveEvents;
      }
      this._supportsPassive = false;
      try {
        var opts = Object.defineProperty({}, 'passive', {
          get: function get() {
            _this2._supportsPassive = true;
          }
        });
        window.addEventListener("test", null, opts);
      } catch (e) {}
    }
  }]);

  return Can;
}();

module.exports = exports['default'];

},{"delegatejs":1,"eventdispatcher":2}],4:[function(_dereq_,module,exports){
'use strict';

var _fastscroll = _dereq_('./fastscroll');

var _fastscroll2 = _interopRequireDefault(_fastscroll);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = _fastscroll2.default;

},{"./fastscroll":3}]},{},[4])(4)
});