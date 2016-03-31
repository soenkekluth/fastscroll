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
var EventDispatcher = require('eventdispatcher');
var _instanceMap = {};

function unprefixAnimationFrame() {
  window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
}

var FastScroll = function(scrollTarget, options) {

  scrollTarget = scrollTarget || window;

  if (FastScroll.hasScrollTarget(scrollTarget)) {
    return FastScroll.getInstance(scrollTarget);
  }

  _instanceMap[scrollTarget] = this;

  this.options = options || {};

  if (!this.options.hasOwnProperty('animationFrame')) {
    this.options.animationFrame = true;
  }

  unprefixAnimationFrame();
  if (typeof window.requestAnimationFrame !== 'function') {
    this.options.animationFrame = false;
  }

  this.scrollTarget = scrollTarget;
  this.init();
};

FastScroll.___instanceMap = _instanceMap;

FastScroll.getInstance = function(scrollTarget, options) {
  scrollTarget = scrollTarget || window;
  return _instanceMap[scrollTarget] || (new FastScroll(scrollTarget, options));
};

FastScroll.hasInstance = function(scrollTarget) {
  return _instanceMap[scrollTarget] !== undefined;
};

FastScroll.hasScrollTarget = FastScroll.hasInstance;

FastScroll.clearInstance = function(scrollTarget) {
  scrollTarget = scrollTarget || window;
  if (FastScroll.hasInstance(scrollTarget)) {
    FastScroll.getInstance(scrollTarget).destroy();
    delete(_instanceMap[scrollTarget]);
  }
};

FastScroll.UP = 'up';
FastScroll.DOWN = 'down';
FastScroll.NONE = 'none';
FastScroll.LEFT = 'left';
FastScroll.RIGHT = 'right';

FastScroll.prototype = {

  destroyed: false,
  scrollY: 0,
  scrollX: 0,
  lastScrollY: 0,
  lastScrollX: 0,
  timeout: 0,
  speedY: 0,
  speedX: 0,
  currentStopFrames: 0,
  firstRender: true,
  animationFrame: true,
  // lastEvent: {
  //   type: null,
  //   scrollY: 0,
  //   scrollX: 0
  // },

  scrolling: false,

  init: function() {
    this.dispatcher = new EventDispatcher();
    this.updateScrollPosition = (this.scrollTarget === window) ? delegate(this, this.updateWindowScrollPosition) : delegate(this, this.updateElementScrollPosition);
    this.updateScrollPosition();
    this.trigger = this.dispatchEvent;
    this.onScroll = delegate(this, this.onScroll);
    this.onScrollStop = delegate(this, this.onScrollStop);
    this.onNextFrame = delegate(this, this.onNextFrame);
    if (this.scrollTarget.addEventListener) {
      this.scrollTarget.addEventListener('mousewheel', this.onScroll, false);
      this.scrollTarget.addEventListener('scroll', this.onScroll, false);
    } else if (this.scrollTarget.attachEvent) {
      this.scrollTarget.attachEvent('onmousewheel', this.onScroll);
      this.scrollTarget.attachEvent('scroll', this.onScroll);
    }
  },

  destroy: function() {
    if (!this.destroyed) {
      this.cancelNextFrame();
      if (this.scrollTarget.addEventListener) {
        this.scrollTarget.removeEventListener('mousewheel', this.onScroll);
        this.scrollTarget.removeEventListener('scroll', this.onScroll);
      } else if (this.scrollTarget.attachEvent) {
        this.scrollTarget.detachEvent('onmousewheel', this.onScroll);
        this.scrollTarget.detachEvent('scroll', this.onScroll);
      }
      this.dispatcher.off();
      this.dispatcher = null;
      this.onScroll = null;
      this.updateScrollPosition = null;
      this.onNextFrame = null;
      this.scrollTarget = null;
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

  updateLastScrollPosition: function() {
    this.lastScrollY = this.scrollY;
    this.lastScrollX = this.scrollX;
  },

  updateWindowScrollPosition: function() {
    this.updateLastScrollPosition();
    this.scrollY = window.scrollY || window.pageYOffset || 0;
    this.scrollX = window.scrollX || window.pageXOffset || 0;
  },

  updateElementScrollPosition: function() {
    this.updateLastScrollPosition();
    this.scrollY = this.scrollTarget.scrollTop;
    this.scrollX = this.scrollTarget.scrollLeft;
  },

  onScroll: function() {
    this.currentStopFrames = 0;
    if (this.firstRender) {
      this.firstRender = false;
      if (this.scrollY > 1) {
        this.updateScrollPosition();
        this.dispatchEvent('scroll:progress');
        return;
      }
    }

    if (!this.scrolling) {
      this.scrolling = true;
      this.dispatchEvent('scroll:start');
      if (this.options.animationFrame) {
        this.nextFrameID = window.requestAnimationFrame(this.onNextFrame);
      }
    }
    if (!this.options.animationFrame) {
      clearTimeout(this.timeout);
      this.onNextFrame();
      this.timeout = setTimeout(this.onScrollStop, 100);
    }
  },

  onNextFrame: function() {

    this.updateScrollPosition();

    this.speedY = this.lastScrollY - this.scrollY;
    this.speedX = this.lastScrollX - this.scrollX;

    if (this.options.animationFrame) {
      if (this.currentStopFrames < 2) {
        this.dispatchEvent('scroll:progress');
        this.currentStopFrames += 1;
        this.nextFrameID = window.requestAnimationFrame(this.onNextFrame);
      }else {
        this.onScrollStop();
      }

    }else if (this.lastScrollY !== this.scrollY || this.lastScrollX !== this.scrollX) {
      this.dispatchEvent('scroll:progress');
    }

  },

  onScrollStop: function() {
    this.scrolling = false;
    this.currentStopFrames = 0;
    if (this.options.animationFrame) {
      this.cancelNextFrame();
    }
    this.dispatchEvent('scroll:stop');
  },

  cancelNextFrame: function() {
    window.cancelAnimationFrame(this.nextFrameID);
  },

  dispatchEvent: function(type, eventObject) {
    eventObject = eventObject || this.getAttributes();
    eventObject.target = this.scrollTarget;
    this.dispatcher.dispatch(type, eventObject);
  },

  on: function(event, listener) {
    return this.dispatcher.addListener(event, listener);
  },

  off: function(event, listener) {
    return this.dispatcher.removeListener(event, listener);
  }
};

module.exports = FastScroll;

},{"delegatejs":1,"eventdispatcher":2}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVsZWdhdGVqcy9kZWxlZ2F0ZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGRpc3BhdGNoZXIvc3JjL2luZGV4LmpzIiwic3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0IFPDtm5rZSBLbHV0aFxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2ZcbiAqIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW5cbiAqIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cbiAqIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mXG4gKiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXG4gKiBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1NcbiAqIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUlxuICogQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSXG4gKiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxuICogQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqKi9cblxuKGZ1bmN0aW9uKGV4cG9ydHMpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBkZWxlZ2F0ZSA9IGZ1bmN0aW9uKHRhcmdldCwgaGFuZGxlcikge1xuICAgICAgICAvLyBHZXQgYW55IGV4dHJhIGFyZ3VtZW50cyBmb3IgaGFuZGxlclxuICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcblxuICAgICAgICAvLyBDcmVhdGUgZGVsZWdhdGUgZnVuY3Rpb25cbiAgICAgICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vIENhbGwgaGFuZGxlciB3aXRoIGFyZ3VtZW50c1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIuYXBwbHkodGFyZ2V0LCBhcmdzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGRlbGVnYXRlIGZ1bmN0aW9uLlxuICAgICAgICByZXR1cm4gZm47XG4gICAgfTtcblxuXG4gICAgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykgPyAobW9kdWxlLmV4cG9ydHMgPSBkZWxlZ2F0ZSkgOiAodHlwZW9mIGRlZmluZSAhPSBcInVuZGVmaW5lZFwiID8gKGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlO1xuICAgIH0pKSA6IChleHBvcnRzLmRlbGVnYXRlID0gZGVsZWdhdGUpKTtcblxufSkodGhpcyk7XG4iLCIgJ3VzZSBzdHJpY3QnO1xuXG4gZnVuY3Rpb24gaXNFbXB0eShvYmopIHtcbiAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpe1xuICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgfVxuICAgfVxuICAgcmV0dXJuIHRydWU7XG4gfVxuXG52YXIgX2luc3RhbmNlTWFwID0ge307XG5cbiB2YXIgRXZlbnREaXNwYXRjaGVyID0gZnVuY3Rpb24oKSB7XG4gICB0aGlzLl9ldmVudE1hcCA9IHt9O1xuICAgdGhpcy5fZGVzdHJveWVkID0gZmFsc2U7XG4gfTtcblxuIEV2ZW50RGlzcGF0Y2hlci5nZXRJbnN0YW5jZSA9IGZ1bmN0aW9uKGtleSl7XG4gIGlmKCFrZXkpe1xuICAgIHRocm93IG5ldyBFcnJvcigna2V5IG11c3QgYmUnKTtcbiAgfVxuICByZXR1cm4gX2luc3RhbmNlTWFwW2tleV0gfHwgKF9pbnN0YW5jZU1hcFtrZXldID0gIG5ldyBFdmVudERpc3BhdGNoZXIoKSk7XG4gfTtcblxuXG4gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXIoZXZlbnQpO1xuICAgaWYgKCFsaXN0ZW5lcnMpIHtcbiAgICAgdGhpcy5fZXZlbnRNYXBbZXZlbnRdID0gW2xpc3RlbmVyXTtcbiAgICAgcmV0dXJuIHRydWU7XG4gICB9XG5cbiAgIGlmIChsaXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcikgPT09IC0xKSB7XG4gICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICAgcmV0dXJuIHRydWU7XG4gICB9XG4gICByZXR1cm4gZmFsc2U7XG4gfTtcblxuIEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuYWRkTGlzdGVuZXJPbmNlID0gZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICB2YXIgcyA9IHRoaXM7XG4gICB2YXIgZjIgPSBmdW5jdGlvbigpIHtcbiAgICAgcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgZjIpO1xuICAgICByZXR1cm4gbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgIH07XG4gICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldmVudCwgZjIpO1xuIH07XG5cbiBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG5cbiAgaWYodHlwZW9mIGxpc3RlbmVyID09PSAndW5kZWZpbmVkJyl7XG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXIoZXZlbnQpO1xuICB9XG5cbiAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyKGV2ZW50KTtcbiAgIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgdmFyIGkgPSBsaXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgIGlmIChpID4gLTEpIHtcbiAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgIGlmICghbGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgICAgZGVsZXRlKHRoaXMuX2V2ZW50TWFwW2V2ZW50XSk7XG4gICAgICAgfVxuICAgICAgIHJldHVybiB0cnVlO1xuICAgICB9XG4gICB9XG4gICByZXR1cm4gZmFsc2U7XG4gfTtcblxuIEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXIoZXZlbnQpO1xuICAgaWYgKGxpc3RlbmVycykge1xuICAgICB0aGlzLl9ldmVudE1hcFtldmVudF0ubGVuZ3RoID0gMDtcbiAgICAgZGVsZXRlKHRoaXMuX2V2ZW50TWFwW2V2ZW50XSk7XG4gICAgcmV0dXJuIHRydWU7XG4gICB9XG4gICByZXR1cm4gZmFsc2U7XG4gfTtcblxuIEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuaGFzTGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgcmV0dXJuIHRoaXMuZ2V0TGlzdGVuZXIoZXZlbnQpICE9PSBudWxsO1xuIH07XG5cbiBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmhhc0xpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICAgcmV0dXJuICh0aGlzLl9ldmVudE1hcCAhPT0gbnVsbCAmJiB0aGlzLl9ldmVudE1hcCAhPT0gdW5kZWZpbmVkICYmICFpc0VtcHR5KHRoaXMuX2V2ZW50TWFwKSk7XG4gfTtcblxuIEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuZGlzcGF0Y2ggPSBmdW5jdGlvbihldmVudFR5cGUsIGV2ZW50T2JqZWN0KSB7XG4gICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcihldmVudFR5cGUpO1xuXG4gICBpZiAobGlzdGVuZXJzKSB7XG4gICAgIGV2ZW50T2JqZWN0ID0gZXZlbnRPYmplY3QgfHwge307XG4gICAgIGV2ZW50T2JqZWN0LnR5cGUgPSBldmVudFR5cGU7XG4gICAgIGV2ZW50T2JqZWN0LnRhcmdldCA9IGV2ZW50T2JqZWN0LnRhcmdldCB8fCB0aGlzO1xuXG4gICAgIHZhciBpID0gLTE7XG4gICAgIHdoaWxlICgrK2kgPCBsaXN0ZW5lcnMubGVuZ3RoKSB7XG4gICAgICAgbGlzdGVuZXJzW2ldKGV2ZW50T2JqZWN0KTtcbiAgICAgfVxuICAgICByZXR1cm4gdHJ1ZTtcbiAgIH1cbiAgIHJldHVybiBmYWxzZTtcbiB9O1xuXG4gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5nZXRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICB2YXIgcmVzdWx0ID0gdGhpcy5fZXZlbnRNYXAgPyB0aGlzLl9ldmVudE1hcFtldmVudF0gOiBudWxsO1xuICAgcmV0dXJuIChyZXN1bHQgfHwgbnVsbCk7XG4gfTtcblxuIEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgaWYgKHRoaXMuX2V2ZW50TWFwKSB7XG4gICAgIGZvciAodmFyIGkgaW4gdGhpcy5fZXZlbnRNYXApIHtcbiAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVyKGkpO1xuICAgICB9XG4gICAgIHRoaXMuX2V2ZW50TWFwID0gbnVsbDtcbiAgIH1cbiAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gfTtcblxuXG4gLy9NZXRob2QgTWFwXG4gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuYmluZCA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG4gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnVuYmluZCA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IEV2ZW50RGlzcGF0Y2hlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG4gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vbmNlID0gRXZlbnREaXNwYXRjaGVyLnByb3RvdHlwZS5vbmUgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmFkZExpc3RlbmVyT25jZTtcbiBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLnRyaWdnZXIgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQgPSBFdmVudERpc3BhdGNoZXIucHJvdG90eXBlLmRpc3BhdGNoO1xuXG4gbW9kdWxlLmV4cG9ydHMgPSBFdmVudERpc3BhdGNoZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qXG4gKiBGYXN0U2Nyb2xsXG4gKiBodHRwczovL2dpdGh1Yi5jb20vc29lbmtla2x1dGgvZmFzdHNjcm9sbFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNCBTw7Zua2UgS2x1dGhcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG52YXIgZGVsZWdhdGUgPSByZXF1aXJlKCdkZWxlZ2F0ZWpzJyk7XG52YXIgRXZlbnREaXNwYXRjaGVyID0gcmVxdWlyZSgnZXZlbnRkaXNwYXRjaGVyJyk7XG52YXIgX2luc3RhbmNlTWFwID0ge307XG5cbmZ1bmN0aW9uIHVucHJlZml4QW5pbWF0aW9uRnJhbWUoKSB7XG4gIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc0NhbmNlbEFuaW1hdGlvbkZyYW1lO1xufVxuXG52YXIgRmFzdFNjcm9sbCA9IGZ1bmN0aW9uKHNjcm9sbFRhcmdldCwgb3B0aW9ucykge1xuXG4gIHNjcm9sbFRhcmdldCA9IHNjcm9sbFRhcmdldCB8fCB3aW5kb3c7XG5cbiAgaWYgKEZhc3RTY3JvbGwuaGFzU2Nyb2xsVGFyZ2V0KHNjcm9sbFRhcmdldCkpIHtcbiAgICByZXR1cm4gRmFzdFNjcm9sbC5nZXRJbnN0YW5jZShzY3JvbGxUYXJnZXQpO1xuICB9XG5cbiAgX2luc3RhbmNlTWFwW3Njcm9sbFRhcmdldF0gPSB0aGlzO1xuXG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgaWYgKCF0aGlzLm9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2FuaW1hdGlvbkZyYW1lJykpIHtcbiAgICB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRnJhbWUgPSB0cnVlO1xuICB9XG5cbiAgdW5wcmVmaXhBbmltYXRpb25GcmFtZSgpO1xuICBpZiAodHlwZW9mIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRnJhbWUgPSBmYWxzZTtcbiAgfVxuXG4gIHRoaXMuc2Nyb2xsVGFyZ2V0ID0gc2Nyb2xsVGFyZ2V0O1xuICB0aGlzLmluaXQoKTtcbn07XG5cbkZhc3RTY3JvbGwuX19faW5zdGFuY2VNYXAgPSBfaW5zdGFuY2VNYXA7XG5cbkZhc3RTY3JvbGwuZ2V0SW5zdGFuY2UgPSBmdW5jdGlvbihzY3JvbGxUYXJnZXQsIG9wdGlvbnMpIHtcbiAgc2Nyb2xsVGFyZ2V0ID0gc2Nyb2xsVGFyZ2V0IHx8IHdpbmRvdztcbiAgcmV0dXJuIF9pbnN0YW5jZU1hcFtzY3JvbGxUYXJnZXRdIHx8IChuZXcgRmFzdFNjcm9sbChzY3JvbGxUYXJnZXQsIG9wdGlvbnMpKTtcbn07XG5cbkZhc3RTY3JvbGwuaGFzSW5zdGFuY2UgPSBmdW5jdGlvbihzY3JvbGxUYXJnZXQpIHtcbiAgcmV0dXJuIF9pbnN0YW5jZU1hcFtzY3JvbGxUYXJnZXRdICE9PSB1bmRlZmluZWQ7XG59O1xuXG5GYXN0U2Nyb2xsLmhhc1Njcm9sbFRhcmdldCA9IEZhc3RTY3JvbGwuaGFzSW5zdGFuY2U7XG5cbkZhc3RTY3JvbGwuY2xlYXJJbnN0YW5jZSA9IGZ1bmN0aW9uKHNjcm9sbFRhcmdldCkge1xuICBzY3JvbGxUYXJnZXQgPSBzY3JvbGxUYXJnZXQgfHwgd2luZG93O1xuICBpZiAoRmFzdFNjcm9sbC5oYXNJbnN0YW5jZShzY3JvbGxUYXJnZXQpKSB7XG4gICAgRmFzdFNjcm9sbC5nZXRJbnN0YW5jZShzY3JvbGxUYXJnZXQpLmRlc3Ryb3koKTtcbiAgICBkZWxldGUoX2luc3RhbmNlTWFwW3Njcm9sbFRhcmdldF0pO1xuICB9XG59O1xuXG5GYXN0U2Nyb2xsLlVQID0gJ3VwJztcbkZhc3RTY3JvbGwuRE9XTiA9ICdkb3duJztcbkZhc3RTY3JvbGwuTk9ORSA9ICdub25lJztcbkZhc3RTY3JvbGwuTEVGVCA9ICdsZWZ0JztcbkZhc3RTY3JvbGwuUklHSFQgPSAncmlnaHQnO1xuXG5GYXN0U2Nyb2xsLnByb3RvdHlwZSA9IHtcblxuICBkZXN0cm95ZWQ6IGZhbHNlLFxuICBzY3JvbGxZOiAwLFxuICBzY3JvbGxYOiAwLFxuICBsYXN0U2Nyb2xsWTogMCxcbiAgbGFzdFNjcm9sbFg6IDAsXG4gIHRpbWVvdXQ6IDAsXG4gIHNwZWVkWTogMCxcbiAgc3BlZWRYOiAwLFxuICBjdXJyZW50U3RvcEZyYW1lczogMCxcbiAgZmlyc3RSZW5kZXI6IHRydWUsXG4gIGFuaW1hdGlvbkZyYW1lOiB0cnVlLFxuICAvLyBsYXN0RXZlbnQ6IHtcbiAgLy8gICB0eXBlOiBudWxsLFxuICAvLyAgIHNjcm9sbFk6IDAsXG4gIC8vICAgc2Nyb2xsWDogMFxuICAvLyB9LFxuXG4gIHNjcm9sbGluZzogZmFsc2UsXG5cbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5kaXNwYXRjaGVyID0gbmV3IEV2ZW50RGlzcGF0Y2hlcigpO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsUG9zaXRpb24gPSAodGhpcy5zY3JvbGxUYXJnZXQgPT09IHdpbmRvdykgPyBkZWxlZ2F0ZSh0aGlzLCB0aGlzLnVwZGF0ZVdpbmRvd1Njcm9sbFBvc2l0aW9uKSA6IGRlbGVnYXRlKHRoaXMsIHRoaXMudXBkYXRlRWxlbWVudFNjcm9sbFBvc2l0aW9uKTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbFBvc2l0aW9uKCk7XG4gICAgdGhpcy50cmlnZ2VyID0gdGhpcy5kaXNwYXRjaEV2ZW50O1xuICAgIHRoaXMub25TY3JvbGwgPSBkZWxlZ2F0ZSh0aGlzLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICB0aGlzLm9uU2Nyb2xsU3RvcCA9IGRlbGVnYXRlKHRoaXMsIHRoaXMub25TY3JvbGxTdG9wKTtcbiAgICB0aGlzLm9uTmV4dEZyYW1lID0gZGVsZWdhdGUodGhpcywgdGhpcy5vbk5leHRGcmFtZSk7XG4gICAgaWYgKHRoaXMuc2Nyb2xsVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuc2Nyb2xsVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCB0aGlzLm9uU2Nyb2xsLCBmYWxzZSk7XG4gICAgICB0aGlzLnNjcm9sbFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsLCBmYWxzZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnNjcm9sbFRhcmdldC5hdHRhY2hFdmVudCkge1xuICAgICAgdGhpcy5zY3JvbGxUYXJnZXQuYXR0YWNoRXZlbnQoJ29ubW91c2V3aGVlbCcsIHRoaXMub25TY3JvbGwpO1xuICAgICAgdGhpcy5zY3JvbGxUYXJnZXQuYXR0YWNoRXZlbnQoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGwpO1xuICAgIH1cbiAgfSxcblxuICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuZGVzdHJveWVkKSB7XG4gICAgICB0aGlzLmNhbmNlbE5leHRGcmFtZSgpO1xuICAgICAgaWYgKHRoaXMuc2Nyb2xsVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIHRoaXMub25TY3JvbGwpO1xuICAgICAgICB0aGlzLnNjcm9sbFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zY3JvbGxUYXJnZXQuYXR0YWNoRXZlbnQpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxUYXJnZXQuZGV0YWNoRXZlbnQoJ29ubW91c2V3aGVlbCcsIHRoaXMub25TY3JvbGwpO1xuICAgICAgICB0aGlzLnNjcm9sbFRhcmdldC5kZXRhY2hFdmVudCgnc2Nyb2xsJywgdGhpcy5vblNjcm9sbCk7XG4gICAgICB9XG4gICAgICB0aGlzLmRpc3BhdGNoZXIub2ZmKCk7XG4gICAgICB0aGlzLmRpc3BhdGNoZXIgPSBudWxsO1xuICAgICAgdGhpcy5vblNjcm9sbCA9IG51bGw7XG4gICAgICB0aGlzLnVwZGF0ZVNjcm9sbFBvc2l0aW9uID0gbnVsbDtcbiAgICAgIHRoaXMub25OZXh0RnJhbWUgPSBudWxsO1xuICAgICAgdGhpcy5zY3JvbGxUYXJnZXQgPSBudWxsO1xuICAgICAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBnZXRBdHRyaWJ1dGVzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2Nyb2xsWTogdGhpcy5zY3JvbGxZLFxuICAgICAgc2Nyb2xsWDogdGhpcy5zY3JvbGxYLFxuICAgICAgc3BlZWRZOiB0aGlzLnNwZWVkWSxcbiAgICAgIHNwZWVkWDogdGhpcy5zcGVlZFgsXG4gICAgICBhbmdsZTogMCxcbiAgICAgIGRpcmVjdGlvblk6IHRoaXMuc3BlZWRZID09PSAwID8gRmFzdFNjcm9sbC5OT05FIDogKCh0aGlzLnNwZWVkWSA+IDApID8gRmFzdFNjcm9sbC5VUCA6IEZhc3RTY3JvbGwuRE9XTiksXG4gICAgICBkaXJlY3Rpb25YOiB0aGlzLnNwZWVkWCA9PT0gMCA/IEZhc3RTY3JvbGwuTk9ORSA6ICgodGhpcy5zcGVlZFggPiAwKSA/IEZhc3RTY3JvbGwuUklHSFQgOiBGYXN0U2Nyb2xsLkxFRlQpXG4gICAgfTtcbiAgfSxcblxuICB1cGRhdGVMYXN0U2Nyb2xsUG9zaXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubGFzdFNjcm9sbFkgPSB0aGlzLnNjcm9sbFk7XG4gICAgdGhpcy5sYXN0U2Nyb2xsWCA9IHRoaXMuc2Nyb2xsWDtcbiAgfSxcblxuICB1cGRhdGVXaW5kb3dTY3JvbGxQb3NpdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy51cGRhdGVMYXN0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICB0aGlzLnNjcm9sbFkgPSB3aW5kb3cuc2Nyb2xsWSB8fCB3aW5kb3cucGFnZVlPZmZzZXQgfHwgMDtcbiAgICB0aGlzLnNjcm9sbFggPSB3aW5kb3cuc2Nyb2xsWCB8fCB3aW5kb3cucGFnZVhPZmZzZXQgfHwgMDtcbiAgfSxcblxuICB1cGRhdGVFbGVtZW50U2Nyb2xsUG9zaXRpb246IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudXBkYXRlTGFzdFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgdGhpcy5zY3JvbGxZID0gdGhpcy5zY3JvbGxUYXJnZXQuc2Nyb2xsVG9wO1xuICAgIHRoaXMuc2Nyb2xsWCA9IHRoaXMuc2Nyb2xsVGFyZ2V0LnNjcm9sbExlZnQ7XG4gIH0sXG5cbiAgb25TY3JvbGw6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3VycmVudFN0b3BGcmFtZXMgPSAwO1xuICAgIGlmICh0aGlzLmZpcnN0UmVuZGVyKSB7XG4gICAgICB0aGlzLmZpcnN0UmVuZGVyID0gZmFsc2U7XG4gICAgICBpZiAodGhpcy5zY3JvbGxZID4gMSkge1xuICAgICAgICB0aGlzLnVwZGF0ZVNjcm9sbFBvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc2Nyb2xsOnByb2dyZXNzJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuc2Nyb2xsaW5nKSB7XG4gICAgICB0aGlzLnNjcm9sbGluZyA9IHRydWU7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3Njcm9sbDpzdGFydCcpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb25GcmFtZSkge1xuICAgICAgICB0aGlzLm5leHRGcmFtZUlEID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLm9uTmV4dEZyYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRnJhbWUpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgdGhpcy5vbk5leHRGcmFtZSgpO1xuICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLm9uU2Nyb2xsU3RvcCwgMTAwKTtcbiAgICB9XG4gIH0sXG5cbiAgb25OZXh0RnJhbWU6IGZ1bmN0aW9uKCkge1xuXG4gICAgdGhpcy51cGRhdGVTY3JvbGxQb3NpdGlvbigpO1xuXG4gICAgdGhpcy5zcGVlZFkgPSB0aGlzLmxhc3RTY3JvbGxZIC0gdGhpcy5zY3JvbGxZO1xuICAgIHRoaXMuc3BlZWRYID0gdGhpcy5sYXN0U2Nyb2xsWCAtIHRoaXMuc2Nyb2xsWDtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRnJhbWUpIHtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRTdG9wRnJhbWVzIDwgMikge1xuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3Njcm9sbDpwcm9ncmVzcycpO1xuICAgICAgICB0aGlzLmN1cnJlbnRTdG9wRnJhbWVzICs9IDE7XG4gICAgICAgIHRoaXMubmV4dEZyYW1lSUQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMub25OZXh0RnJhbWUpO1xuICAgICAgfWVsc2Uge1xuICAgICAgICB0aGlzLm9uU2Nyb2xsU3RvcCgpO1xuICAgICAgfVxuXG4gICAgfWVsc2UgaWYgKHRoaXMubGFzdFNjcm9sbFkgIT09IHRoaXMuc2Nyb2xsWSB8fCB0aGlzLmxhc3RTY3JvbGxYICE9PSB0aGlzLnNjcm9sbFgpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc2Nyb2xsOnByb2dyZXNzJyk7XG4gICAgfVxuXG4gIH0sXG5cbiAgb25TY3JvbGxTdG9wOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNjcm9sbGluZyA9IGZhbHNlO1xuICAgIHRoaXMuY3VycmVudFN0b3BGcmFtZXMgPSAwO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRnJhbWUpIHtcbiAgICAgIHRoaXMuY2FuY2VsTmV4dEZyYW1lKCk7XG4gICAgfVxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc2Nyb2xsOnN0b3AnKTtcbiAgfSxcblxuICBjYW5jZWxOZXh0RnJhbWU6IGZ1bmN0aW9uKCkge1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLm5leHRGcmFtZUlEKTtcbiAgfSxcblxuICBkaXNwYXRjaEV2ZW50OiBmdW5jdGlvbih0eXBlLCBldmVudE9iamVjdCkge1xuICAgIGV2ZW50T2JqZWN0ID0gZXZlbnRPYmplY3QgfHwgdGhpcy5nZXRBdHRyaWJ1dGVzKCk7XG4gICAgZXZlbnRPYmplY3QudGFyZ2V0ID0gdGhpcy5zY3JvbGxUYXJnZXQ7XG4gICAgdGhpcy5kaXNwYXRjaGVyLmRpc3BhdGNoKHR5cGUsIGV2ZW50T2JqZWN0KTtcbiAgfSxcblxuICBvbjogZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2hlci5hZGRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpO1xuICB9LFxuXG4gIG9mZjogZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2hlci5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhc3RTY3JvbGw7XG4iXX0=
