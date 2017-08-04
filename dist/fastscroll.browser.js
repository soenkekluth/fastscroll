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
'use strict';Object.defineProperty(exports,'__esModule',{value:true});exports.default=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if('value'in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor}}();var _delegatejs=_dereq_('delegatejs');var _delegatejs2=_interopRequireDefault(_delegatejs);var _eventdispatcher=_dereq_('eventdispatcher');var _eventdispatcher2=_interopRequireDefault(_eventdispatcher);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _defaults(obj,defaults){var keys=Object.getOwnPropertyNames(defaults);for(var i=0;i<keys.length;i++){var key=keys[i];var value=Object.getOwnPropertyDescriptor(defaults,key);if(value&&value.configurable&&obj[key]===undefined){Object.defineProperty(obj,key,value)}}return obj}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError('Cannot call a class as a function')}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError('this hasn\'t been initialised - super() hasn\'t been called')}return call&&(typeof call==='object'||typeof call==='function')?call:self}function _inherits(subClass,superClass){if(typeof superClass!=='function'&&superClass!==null){throw new TypeError('Super expression must either be null or a function, not '+typeof superClass)}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):_defaults(subClass,superClass)}var _instanceMap={};var FastScroll=function(_EventDispatcher){_inherits(FastScroll,_EventDispatcher);FastScroll.directionToString=function directionToString(direction){switch(direction){case FastScroll.UP:return'up';case FastScroll.DOWN:return'down';case FastScroll.NONE:return'none';case FastScroll.LEFT:return'left';case FastScroll.RIGHT:return'right';}};function FastScroll(){var scrollTarget=arguments.length<=0||arguments[0]===undefined?window:arguments[0];var options=arguments.length<=1||arguments[1]===undefined?{}:arguments[1];_classCallCheck(this,FastScroll);var _this=_possibleConstructorReturn(this,_EventDispatcher.call(this));if(FastScroll.hasScrollTarget(scrollTarget)){var _ret;return _ret=FastScroll.getInstance(scrollTarget),_possibleConstructorReturn(_this,_ret)}_this.scrollTarget=scrollTarget;_this.options=options;_instanceMap[scrollTarget]=_this;_this.options.animationFrame=Can.animationFrame;if(_this.options.animationFrame){FastScroll.unprefixAnimationFrame()}_this.destroyed=false;_this._scrollY=0;_this._scrollX=0;_this.timeout=0;_this._speedY=0;_this._speedX=0;_this._lastSpeed=0;_this._lastDirection=FastScroll.NONE;_this.stopFrames=3;_this.currentStopFrames=0;_this.firstRender=true;_this.animationFrame=true;_this._directionY=FastScroll.NONE;_this._directionX=FastScroll.NONE;_this.scrolling=false;_this.firstScroll=true;_this.init();return _this}FastScroll.prototype.init=function init(){this.getScrollPosition=this.scrollTarget===window?(0,_delegatejs2.default)(this,this.getWindowScrollPosition):(0,_delegatejs2.default)(this,this.getElementScrollPosition);this.onScroll=(0,_delegatejs2.default)(this,this.onScroll);this.onNextFrame=(0,_delegatejs2.default)(this,this.onNextFrame);this._scrollY=this.scrollY;if(this.scrollTarget.addEventListener){this.scrollTarget.addEventListener('scroll',this.onScroll,Can.passiveEvents?{passive:true}:false)}else if(this.scrollTarget.attachEvent){this.scrollTarget.attachEvent('scroll',this.onScroll)}};FastScroll.prototype.destroy=function destroy(){if(!this.destroyed){this.cancelNextFrame();_EventDispatcher.prototype.destroy.call(this);if(this.scrollTarget.addEventListener){this.scrollTarget.removeEventListener('scroll',this.onScroll)}else if(this.scrollTarget.attachEvent){this.scrollTarget.detachEvent('scroll',this.onScroll)}this.onScroll=null;this.getScrollPosition=null;this.onNextFrame=null;this.scrollTarget=null;this.destroyed=true}};FastScroll.prototype.getWindowScrollPosition=function getWindowScrollPosition(){return{y:window.pageYOffset||window.scrollY||0,x:window.pageXOffset||window.scrollX||0}};FastScroll.prototype.getElementScrollPosition=function getElementScrollPosition(){return{y:this.scrollTarget.scrollTop,x:this.scrollTarget.scrollLeft}};FastScroll.prototype.onScroll=function onScroll(){this.currentStopFrames=0;if(this.firstRender){this.firstRender=false;if(this.scrollY>1){this._scrollY=this.scrollY;this._scrollX=this.scrollX;this.dispatchEvent(FastScroll.EVENT_SCROLL_PROGRESS);return}}if(!this.scrolling){this.scrolling=true;this.firstScroll=true;this.dispatchEvent(FastScroll.EVENT_SCROLL_START);if(this.options.animationFrame){this.nextFrameID=window.requestAnimationFrame(this.onNextFrame)}else{clearTimeout(this.timeout);this.onNextFrame();var self=this;this.timeout=setTimeout(function(){self.onScrollStop()},100)}}};FastScroll.prototype.onNextFrame=function onNextFrame(){this._lastDirection=this.directionY;this._speedY=this._scrollY-this.scrollY;if(this.options.animationFrame&&this.scrolling&&this.speedY===0&&this.currentStopFrames++>this.stopFrames){this.onScrollStop();return}this._scrollY=this.scrollY;if(this._lastDirection!==this.directionY){this.dispatchEvent('scroll:'+FastScroll.directionToString(this.directionY))}this.dispatchEvent(FastScroll.EVENT_SCROLL_PROGRESS);if(this.options.animationFrame){this.nextFrameID=window.requestAnimationFrame(this.onNextFrame)}};FastScroll.prototype.onScrollStop=function onScrollStop(){this.scrolling=false;this._scrollY=this.scrollY;if(this.options.animationFrame){this.cancelNextFrame();this.currentStopFrames=0}this.dispatchEvent(FastScroll.EVENT_SCROLL_STOP)};FastScroll.prototype.cancelNextFrame=function cancelNextFrame(){window.cancelAnimationFrame(this.nextFrameID);this.nextFrameID=0};_createClass(FastScroll,[{key:'attr',get:function get(){return{scrollY:this.scrollY,speedY:this.speedY,directionY:this.directionY}}},{key:'directionY',get:function get(){if(this.speedY===0&&!this.scrolling){this._directionY=FastScroll.NONE}else{if(this.speedY>0){this._directionY=FastScroll.UP}else if(this.speedY<0){this._directionY=FastScroll.DOWN}}return this._directionY}},{key:'directionX',get:function get(){if(this.speedX===0&&!this.scrolling){this._directionX=FastScroll.NONE}else{if(this.speedX>0){this._directionX=FastScroll.RIGHT}else if(this.speedX<0){this._directionX=FastScroll.LEFT}}return this._directionX}},{key:'delta',get:function get(){return this.directionY}},{key:'speedY',get:function get(){return this._speedY}},{key:'speedX',get:function get(){return this._speedX}},{key:'scrollY',get:function get(){return this.getScrollPosition().y}},{key:'y',get:function get(){return this.scrollY}},{key:'scrollX',get:function get(){return this.getScrollPosition().x}},{key:'x',get:function get(){return this.scrollX}}]);return FastScroll}(_eventdispatcher2.default);FastScroll.getInstance=function(scrollTarget,options){if(!_instanceMap[scrollTarget]){_instanceMap[scrollTarget]=new FastScroll(scrollTarget,options)}return _instanceMap[scrollTarget]};FastScroll.hasInstance=function(scrollTarget){return typeof _instanceMap[scrollTarget]!=='undefined'};FastScroll.hasScrollTarget=FastScroll.hasInstance;FastScroll.clearInstance=function(){var scrollTarget=arguments.length<=0||arguments[0]===undefined?window:arguments[0];if(FastScroll.hasInstance(scrollTarget)){FastScroll.getInstance(scrollTarget).destroy();delete _instanceMap[scrollTarget]}};FastScroll.unprefixAnimationFrame=function(){window.requestAnimationFrame=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame;window.cancelAnimationFrame=window.cancelAnimationFrame||window.mozCancelAnimationFrame||window.webkitCancelAnimationFrame||window.msCancelAnimationFrame};FastScroll.UP=-1;FastScroll.DOWN=1;FastScroll.NONE=0;FastScroll.LEFT=-2;FastScroll.RIGHT=2;FastScroll.EVENT_SCROLL_PROGRESS='scroll:progress';FastScroll.EVENT_SCROLL_START='scroll:start';FastScroll.EVENT_SCROLL_STOP='scroll:stop';FastScroll.EVENT_SCROLL_DOWN='scroll:down';FastScroll.EVENT_SCROLL_UP='scroll:up';exports.default=FastScroll;var passiveEvents=null;var Can=function(){function Can(){_classCallCheck(this,Can)}_createClass(Can,null,[{key:'animationFrame',get:function get(){return!!(window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame)}},{key:'passiveEvents',get:function get(){if(passiveEvents!==null){return passiveEvents}try{var opts=Object.defineProperty({},'passive',{get:function get(){passiveEvents=true}});window.addEventListener('test',null,opts)}catch(e){passiveEvents=false}}}]);return Can}();module.exports=exports['default'];

},{"delegatejs":1,"eventdispatcher":2}],4:[function(_dereq_,module,exports){
'use strict';var _fastscroll=_dereq_('./fastscroll');var _fastscroll2=_interopRequireDefault(_fastscroll);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}module.exports=_fastscroll2.default;

},{"./fastscroll":3}]},{},[4])(4)
});