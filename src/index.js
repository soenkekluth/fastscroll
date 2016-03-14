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
