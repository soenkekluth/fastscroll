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
    };
  }

  this.options = options || { animationFrame: true };
  this.scrollTarget = scrollTarget;
  this.init();
  return this;
};

FastScroll.___instanceMap = _instanceMap;

FastScroll.getInstance = function(scrollTarget, options) {
  return new FastScroll(scrollTarget, options);
};

FastScroll.hasScrollTarget = function(scrollTarget) {
  return _instanceMap[scrollTarget] !== undefined;
};

FastScroll.hasInstance = FastScroll.hasScrollTarget;

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
  stopFrames: 5,
  currentStopFrames: 0,
  firstRender: true,
  animationFrame: true,
  lastEvent: {
    type: null,
    scrollY: 0,
    scrollX: 0
  },

  scrolling: false,

  init: function() {
    this.dispatcher = new EventDispatcher();
    this.animationFrame = this.options.animationFrame;
    this.updateScrollPosition = (this.scrollTarget === window || this.scrollTarget === document.body) ? delegate(this, this.updateWindowScrollPosition) : delegate(this, this.updateElementScrollPosition);
    this.updateScrollPosition();
    this.trigger = this.dispatchEvent;
    this.lastEvent.scrollY = this.scrollY;
    this.lastEvent.scrollX = this.scrollX;
    this.onScroll = delegate(this, this.onScroll);
    this.onNextFrame = delegate(this, this.onNextFrame);
    this.scrollTarget.addEventListener('scroll', this.onScroll, false);
  },

  destroy: function() {
    if (_instanceMap[this.scrollTarget].listenerCount <= 0 && !this.destroyed) {
      delete(_instanceMap[this.scrollTarget]);
      this.cancelNextFrame();
      this.scrollTarget.removeEventListener('scroll', this.onScroll);
      this.dispatcher.off();
      this.dispatcher = null;
      this.onScroll = null;
      this.updateScrollPosition = null;
      this.onNextFrame = null;
      this.scrollTarget = null;
      this.destroyed = true;

      return null;
    }

    return this;
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
    this.scrollY = window.scrollY || window.pageYOffset || 0;
    this.scrollX = window.scrollX || window.pageXOffset || 0;
  },

  updateElementScrollPosition: function() {
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
      if (this.animationFrame) {
        this.nextFrameID = requestAnimationFrame(this.onNextFrame);
      }
    }
    if (!this.animationFrame) {
      clearTimeout(this.timeout);
      this.onNextFrame();
      var self = this;
      this.timeout = setTimeout(function() {
        self.onScrollStop();
      }, 100);
    }
  },

  onNextFrame: function() {
    this.updateScrollPosition();

    this.speedY = this.lastScrollY - this.scrollY;
    this.speedX = this.lastScrollX - this.scrollX;

    this.lastScrollY = this.scrollY;
    this.lastScrollX = this.scrollX;

    if (this.animationFrame && this.scrolling && this.speedY === 0 && (this.currentStopFrames++ > this.stopFrames)) {
      this.onScrollStop();
      return;
    }

    this.dispatchEvent('scroll:progress');

    if (this.animationFrame) {
      this.nextFrameID = requestAnimationFrame(this.onNextFrame);
    }
  },

  onScrollStop: function() {
    this.scrolling = false;
    if (this.animationFrame) {
      this.cancelNextFrame();
      this.currentStopFrames = 0;
    }
    this.dispatchEvent('scroll:stop');
  },

  cancelNextFrame: function() {
    cancelAnimationFrame(this.nextFrameID);
  },

  dispatchEvent: function(type, eventObject) {
    eventObject = eventObject || this.getAttributes();

    // if (this.lastEvent.type === type && this.lastEvent.scrollY === eventObject.scrollY && this.lastEvent.scrollX === eventObject.scrollX) {
    //   return;
    // }

    // this.lastEvent = {
    //   type: type,
    //   scrollY: eventObject.scrollY,
    //   scrollX: eventObject.scrollX
    // };

    // eventObject.fastScroll = this;
    eventObject.target = this.scrollTarget;
    this.dispatcher.dispatch(type, eventObject);
  },

  on: function(event, listener) {
    if (this.dispatcher.on(event, listener)) {
      _instanceMap[this.scrollTarget].listenerCount += 1;
      return true;
    }
    return false;
  },

  off: function(event, listener) {
    if (this.dispatcher.off(event, listener)) {
      _instanceMap[this.scrollTarget].listenerCount -= 1;
      return true;
    }
    return false;
  }
};

module.exports = FastScroll;
