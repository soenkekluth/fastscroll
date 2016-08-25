
import delegate from 'delegatejs';
const _instanceMap = new Map();

const unprefixAnimationFrame = () => {
  window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
}

export default class FastScroll {

  static getInstance = (scrollTarget, options) => {
    if(!_instanceMap.has(scrollTarget)){
      _instanceMap.set(scrollTarget, new FastScroll(scrollTarget, options));
    }
    return _instanceMap.get(scrollTarget);
  };

  static hasInstance = (scrollTarget) => {
    return _instanceMap.has(scrollTarget);
  };

  static hasScrollTarget = FastScroll.hasInstance;

  static clearInstance = (scrollTarget = window) => {
    if (FastScroll.hasInstance(scrollTarget)) {
      FastScroll.getInstance(scrollTarget).destroy();
      _instanceMap.delete(scrollTarget);
    }
  };

  static UP = 'up';
  static DOWN = 'down';
  static NONE = 'none';
  static LEFT = 'left';
  static RIGHT = 'right';

  static EVENT_SCROLL_PROGRESS = new Event('scroll:progress');
  static EVENT_SCROLL_START = new Event('scroll:start');
  static EVENT_SCROLL_STOP = new Event('scroll:stop');

  constructor(scrollTarget = window, options = {}) {
    if(FastScroll.hasScrollTarget(scrollTarget)) {
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
    // this.lastEvent= {
    //   type: null,
    //   scrollY: 0,
    //   scrollX: 0
    // };

    this.scrolling= false;

    this.init();

  }


  init() {

    this.updateScrollPosition = (this.scrollTarget === window) ? delegate(this, this.updateWindowScrollPosition) : delegate(this, this.updateElementScrollPosition);
    this.updateScrollPosition();
    this.trigger = this.dispatchEvent;
    this.attr = this.getAttributes;
    // this.lastEvent.scrollY = this.scrollY;
    // this.lastEvent.scrollX = this.scrollX;
    this.onScroll = delegate(this, this.onScroll);
    this.onNextFrame = delegate(this, this.onNextFrame);
    if (this.scrollTarget.addEventListener) {
      // this.scrollTarget.addEventListener('mousewheel', this.onScroll, Can.passiveEvents ? { passive: true } : false);
      this.scrollTarget.addEventListener('scroll', this.onScroll, Can.passiveEvents ? { passive: true } : false);
    } else if (this.scrollTarget.attachEvent) {
      // this.scrollTarget.attachEvent('onmousewheel', this.onScroll);
      this.scrollTarget.attachEvent('scroll', this.onScroll);
    }
  }




  destroy () {
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
  }

  getAttributes () {
    return {
      scrollY: this.scrollY,
      scrollX: this.scrollX,
      speedY: this.speedY,
      speedX: this.speedX,
      angle: 0,
      directionY: this.speedY === 0 ? FastScroll.NONE : ((this.speedY > 0) ? FastScroll.UP : FastScroll.DOWN),
      directionX: this.speedX === 0 ? FastScroll.NONE : ((this.speedX > 0) ? FastScroll.RIGHT : FastScroll.LEFT)
    };
  }

  updateWindowScrollPosition () {
    this.scrollY = window.scrollY || window.pageYOffset || 0;
    this.scrollX = window.scrollX || window.pageXOffset || 0;
  }

  updateElementScrollPosition () {
    this.scrollY = this.scrollTarget.scrollTop;
    this.scrollX = this.scrollTarget.scrollLeft;
  }

  onScroll () {
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
      }    else {
      clearTimeout(this.timeout);
      this.onNextFrame();
      var self = this;
      this.timeout = setTimeout(function() {
        self.onScrollStop();
      }, 100);
    }}
  }

  onNextFrame () {

    this.updateScrollPosition();

    this.speedY = this.lastScrollY - this.scrollY;
    this.speedX = this.lastScrollX - this.scrollX;

    this.lastScrollY = this.scrollY;
    this.lastScrollX = this.scrollX;

    if (this.options.animationFrame && (this.scrolling && this.speedY === 0 && (this.currentStopFrames++ > this.stopFrames))) {
      this.onScrollStop();
      return;
    }

    this.dispatchEvent(FastScroll.EVENT_SCROLL_PROGRESS);

    if (this.options.animationFrame) {
      this.nextFrameID = requestAnimationFrame(this.onNextFrame);
    }
  }

  onScrollStop () {
    this.scrolling = false;
    if (this.options.animationFrame) {
      this.cancelNextFrame();
      this.currentStopFrames = 0;
    }
    this.dispatchEvent(FastScroll.EVENT_SCROLL_STOP);
  }

  cancelNextFrame () {
    window.cancelAnimationFrame(this.nextFrameID);
  }

  dispatchEvent (event) {
    // eventObject = eventObject || this.getAttributes();

    // if (this.lastEvent.type === type && this.lastEvent.scrollY === eventObject.scrollY && this.lastEvent.scrollX === eventObject.scrollX) {
    //   return;
    // }

    // this.lastEvent = {
    //   type: type,
    //   scrollY: eventObject.scrollY,
    //   scrollX: eventObject.scrollX
    // };

    // // eventObject.fastScroll = this;
    // eventObject.target = this.scrollTarget;
    // this.dispatcher.dispatch(type, eventObject);
    //
    this.scrollTarget.dispatchEvent(event);
  }

  on (event, listener) {
    return this.scrollTarget.addEventListener(event, listener);
  }

  off (event, listener) {
    return this.scrollTarget.removeEventListener(event, listener);
  }

}


class Can {
  constructor(){
    this._passiveEvents = null;
  }


  get animationFrame(){
    return true;
    // console.log((window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame) )
    //return typeof (window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame) === 'function';
  }


  get passiveEvents() {
    if(!this._passiveEvents){
      return this._passiveEvents;
    }
    this._supportsPassive = false;
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: () => {
          this._supportsPassive = true;
        }
      });
      window.addEventListener("test", null, opts);
    } catch (e) {}
  }



}
