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

var FastScroll = function(options) {
  this.options = (options || {});
  this.element = this.options.el ||  window;
  if(this.element){
    this.init();
  }
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
    this.dispatcher = new EventDispatcher();
    this.onScrollDelegate = delegate(this, this.onScroll);
    this.onAnimationFrameDelegate = delegate(this, this.onAnimationFrame);
    this.onCheckScrollStopDelegate = delegate(this, this.onCheckScrollStop);
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
      requestAnimationFrame(this.onAnimationFrameDelegate);
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
      requestAnimationFrame(this.onCheckScrollStopDelegate);
    } else {
      requestAnimationFrame(this.onAnimationFrameDelegate);
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
    eventObject.target = this.element;
    eventObject.detail = eventObject;
    this.dispatcher.dispatch(type, eventObject);
  },

  on: function(event, listener) {
    return this.dispatcher.on(event, listener);
  },

  off: function(event, listener) {
    return this.dispatcher.off(event, listener);
  }
};

module.exports = FastScroll;
