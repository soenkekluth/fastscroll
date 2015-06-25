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
      this.element.addEventListener(event, listener, false);
    }
  }
};

module.exports = FastScroll;
