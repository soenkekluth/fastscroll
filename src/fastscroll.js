import delegate from 'delegatejs';
import EventDispatcher from 'eventdispatcher';

const _instanceMap = {};


export default class FastScroll extends EventDispatcher {

  static getInstance = (scrollTarget, options) => {
    if (!_instanceMap[scrollTarget]) {
      _instanceMap[scrollTarget] = new FastScroll(scrollTarget, options);
    }
    return _instanceMap[scrollTarget];
  };

  static hasInstance = (scrollTarget) => {
    return (typeof _instanceMap[scrollTarget] !== 'undefined');
  };

  static hasScrollTarget = FastScroll.hasInstance;

  static clearInstance = (scrollTarget = window) => {
    if (FastScroll.hasInstance(scrollTarget)) {
      FastScroll.getInstance(scrollTarget).destroy();
      delete _instanceMap[scrollTarget];
    }
  };


  static unprefixAnimationFrame = () => {
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
  };

  static UP = -1;
  static DOWN = 1;
  static NONE = 0;
  static LEFT = -2;
  static RIGHT = 2;

  static EVENT_SCROLL_PROGRESS = 'scroll:progress';
  static EVENT_SCROLL_START = 'scroll:start';
  static EVENT_SCROLL_STOP = 'scroll:stop';
  static EVENT_SCROLL_DOWN = 'scroll:down';
  static EVENT_SCROLL_UP = 'scroll:up';


  static directionToString(direction) {
    switch (direction) {
      case FastScroll.UP:
        return 'up';
      case FastScroll.DOWN:
        return 'down';
      case FastScroll.NONE:
        return 'none';
      case FastScroll.LEFT:
        return 'left';
      case FastScroll.RIGHT:
        return 'right';
    }
  }

  constructor(scrollTarget = window, options = {}) {

    super();

    if (FastScroll.hasScrollTarget(scrollTarget)) {
      return FastScroll.getInstance(scrollTarget);
    }

    this.scrollTarget = scrollTarget;
    this.options = options;

    _instanceMap[scrollTarget] = this;

    this.options.animationFrame = Can.animationFrame;
    if (this.options.animationFrame) {
      FastScroll.unprefixAnimationFrame();
    }

    this.destroyed = false;
    this._scrollY = 0;
    this._scrollX = 0;
    this.timeout = 0;
    this._speedY = 0;
    this._speedX = 0;
    this._lastSpeed = 0;
    this._lastDirection = FastScroll.NONE;
    this.stopFrames = 3;
    this.currentStopFrames = 0;
    this.firstRender = true;
    this.animationFrame = true;
    this._directionY = FastScroll.NONE;
    this._directionX = FastScroll.NONE;

    this.scrolling = false;
    this.firstScroll = true;

    this.init();

  }

  init() {

    this.getScrollPosition = (this.scrollTarget === window) ? delegate(this, this.getWindowScrollPosition) : delegate(this, this.getElementScrollPosition);
    this.onScroll = delegate(this, this.onScroll);
    this.onNextFrame = delegate(this, this.onNextFrame);

    this._scrollY = this.scrollY;
    // this._scrollX = this.scrollX;

    if (this.scrollTarget.addEventListener) {
      // this.scrollTarget.addEventListener('mousewheel', this.onScroll, Can.passiveEvents ? { passive: true } : false);
      this.scrollTarget.addEventListener('scroll', this.onScroll, Can.passiveEvents ? { passive: true } : false);
    } else if (this.scrollTarget.attachEvent) {
      // this.scrollTarget.attachEvent('onmousewheel', this.onScroll);
      this.scrollTarget.attachEvent('scroll', this.onScroll);
    }
  }




  destroy() {
    if (!this.destroyed) {
      this.cancelNextFrame();

      super.destroy();

      if (this.scrollTarget.addEventListener) {
        // this.scrollTarget.removeEventListener('mousewheel', this.onScroll);
        this.scrollTarget.removeEventListener('scroll', this.onScroll);
      } else if (this.scrollTarget.attachEvent) {
        // this.scrollTarget.detachEvent('onmousewheel', this.onScroll);
        this.scrollTarget.detachEvent('scroll', this.onScroll);
      }

      this.onScroll = null;
      this.getScrollPosition = null;
      this.onNextFrame = null;
      this.scrollTarget = null;
      this.destroyed = true;
    }
  }

  get attr() {
    return {
      scrollY: this.scrollY,
      // scrollX: this.scrollX,
      speedY: this.speedY,
      // speedX: this.speedX,
      // angle: 0,
      directionY: this.directionY
      // directionX: this.directionX
    };
  }


  get directionY() {
    if (this.speedY === 0 && !this.scrolling) {
      this._directionY = FastScroll.NONE;
    } else {
      if (this.speedY > 0) {
        this._directionY = FastScroll.UP;
      } else if (this.speedY < 0) {
        this._directionY = FastScroll.DOWN;
      }
    }
    return this._directionY;
  }

  get directionX() {
    if (this.speedX === 0 && !this.scrolling) {
      this._directionX = FastScroll.NONE;
    } else {
      if (this.speedX > 0) {
        this._directionX = FastScroll.RIGHT;
      } else if (this.speedX < 0) {
        this._directionX = FastScroll.LEFT;
      }
    }
    return this._directionX;
  }


  get delta() {
    return this.directionY;
  }

  get speedY() {
    return this._speedY;
  }

  get speedX() {
    return this._speedX;
  }


  get scrollY() {
    return this.getScrollPosition().y;
  }

  get y() {
    return this.scrollY;
  }

  get scrollX() {
    return this.getScrollPosition().x;
  }

  get x() {
    return this.scrollX;
  }

  getWindowScrollPosition() {
    return {
      y: (window.pageYOffset || window.scrollY  || 0),
      x: (window.pageXOffset || window.scrollX || 0)
    }
  }

  getElementScrollPosition() {
    return {
      y: this.scrollTarget.scrollTop,
      x: this.scrollTarget.scrollLeft
    }
  }

  onScroll() {
    this.currentStopFrames = 0;
    if (this.firstRender) {
      this.firstRender = false;
      if (this.scrollY > 1) {

        this._scrollY = this.scrollY;
        this._scrollX = this.scrollX;
        // this.getScrollPosition();
        this.dispatchEvent(FastScroll.EVENT_SCROLL_PROGRESS);
        return;
      }
    }

    if (!this.scrolling) {
      this.scrolling = true;
      this.firstScroll = true;
      this.dispatchEvent(FastScroll.EVENT_SCROLL_START);
      if (this.options.animationFrame) {
        this.nextFrameID = window.requestAnimationFrame(this.onNextFrame);
      } else {
        clearTimeout(this.timeout);
        this.onNextFrame();
        var self = this;
        this.timeout = setTimeout(function() {
          self.onScrollStop();
        }, 100);
      }
    }
  }

  onNextFrame() {

    this._lastDirection = this.directionY;
    // this._lastSpeed = this.speedY;
    this._speedY = this._scrollY - this.scrollY;
    // this._speedX = this._scrollX - this.scrollX;



    // if(this.options.animationFrame && this.scrolling && ((this._scrollY === this.scrollY ) && (this._lastSpeed === 0 && this.speedY === 0) && (this.directionY === this._lastDirection) && (++this.currentStopFrames > this.stopFrames) /*&& this.directionY === this._lastDirection*/) ){
    //   this.onScrollStop();
    //   return;
    // }


    if (this.options.animationFrame && (this.scrolling && (this.speedY === 0 && (this.currentStopFrames++ > this.stopFrames)))) {
      this.onScrollStop();
      return;
    }


    this._scrollY = this.scrollY;
    // this._scrollX = this.scrollX;

    // console.log(this._lastDirection, this.directionY);
    if (this._lastDirection !== this.directionY) {
      // this.firstScroll = false;
      this.dispatchEvent('scroll:' + FastScroll.directionToString(this.directionY));
    }

    this.dispatchEvent(FastScroll.EVENT_SCROLL_PROGRESS);

    if (this.options.animationFrame) {
      this.nextFrameID = window.requestAnimationFrame(this.onNextFrame);
    }
  }

  onScrollStop() {
    this.scrolling = false;
    this._scrollY = this.scrollY;

    // this.dispatchEvent('scroll:none');

    // this._scrollX = this.scrollX;
    if (this.options.animationFrame) {
      this.cancelNextFrame();
      this.currentStopFrames = 0;
    }
    this.dispatchEvent(FastScroll.EVENT_SCROLL_STOP);
  }

  cancelNextFrame() {
    window.cancelAnimationFrame(this.nextFrameID);
    this.nextFrameID = 0;
  }

}


var passiveEvents = null;

class Can {


  static get animationFrame() {
    return !!(window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame);
  };


  static get passiveEvents() {
    if (passiveEvents !== null) {
      return passiveEvents;
    }
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: () => {
          passiveEvents = true;
        }
      });
      window.addEventListener("test", null, opts);
    } catch (e) {
      passiveEvents = false;
    }
  }
}
