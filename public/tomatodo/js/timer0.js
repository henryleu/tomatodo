/**
 * Created with JetBrains WebStorm.
 * User: henryleu
 * Date: 13-6-8
 * Time: 下午2:17
 * To change this template use File | Settings | File Templates.
 */

(function($){
    //Wrap console object to adapt all browsers for logging
    var f = function () {};
    if (!window.console) { window.console = {log:f, info:f, warn:f, debug:f, error:f}; }

    //Check module namespace usage
    var moduleName = 'timer';
    var namespaceOwner = 'Tomato Labs';
    if(!window.tl){ window.tl ={}; }
    if(window.tl[moduleName]){
        console.warn('"' + moduleName + '" namespace has used by other libraries and will be overwritten by ' + namespaceOwner);
    }

    var timer = window.tl[moduleName] = function(o){
        this.callbackQueue = [];
        this.data = {};
        if(o) {
            this.config(o);
            this.init();
        }
    };
    timer.unitMap = { 's': 1,  'm': 60, 'h': 3600 };
    timer.prototype = {interval: 200};
    timer.prototype.config = function(o){
        var me = this;
        var emptyFn = function(){};

        //copy options
        me.o = me.o||{};
        me.optionChanged = true;
        if(o && o instanceof Object ){
            for(var p in o){
                me.o[p] = o[p];
            }
        }
        else{
            throw Error('no options object is input as the single argument');
        }
        me.id = o.id;

        me.o.resetCallback = me.o.resetCallback ? me.o.resetCallback : emptyFn;
        me.o.startCallback = me.o.startCallback ? me.o.startCallback : emptyFn;
        me.o.stopCallback = me.o.stopCallback ? me.o.stopCallback : emptyFn;
        me.o.pauseCallback = me.o.pauseCallback ? me.o.pauseCallback : emptyFn;
        me.o.resumeCallback = me.o.resumeCallback ? me.o.resumeCallback : emptyFn;
        me.o.finishCallback = me.o.finishCallback ? me.o.finishCallback : emptyFn;
        me.o.killCallback = me.o.killCallback ? me.o.killCallback : emptyFn;

        me.o.moveCallback = me.o.moveCallback ? me.o.moveCallback : emptyFn;
        me.o.secondBeatCallback = me.o.secondBeatCallback ? me.o.secondBeatCallback : emptyFn;
        me.o.minuteBeatCallback = me.o.minuteBeatCallback ? me.o.minuteBeatCallback : emptyFn;
        me.o.hourBeatCallback = me.o.hourBeatCallback ? me.o.hourBeatCallback : emptyFn;
        me.o.stepCallback = me.o.stepCallback ? me.o.stepCallback : emptyFn;

        me.configInterval(o.interval);
        me.configTimeout(o.timeout);

        if(o.step){
            me.configStep(o.step);
        }
    };
    timer.prototype.configOption = function(name, value){
        var me = this;
        me.o = me.o||{};
        me.o[name] = value;

        if(name=='interval'){
            me.configInterval(value);
        }
        else if(name=='timeout'){
            me.configTimeout(value);
            if(me.o.step){
                me.configStep(value);
            }
        }
        else if(name=='step'){
            me.configStep(value);
        }
        else{
            //no needs to reconfigure
        }
    };
    timer.prototype.init = function(){
        this.apply();
        this.reset();
    };
    timer.prototype.apply = function(){
        var me = this;
        if(me.optionChanged){
            var onInterval = function(){me.computeState();};
            var onStart = function(){me.o.startCallback.call(me);};
            var onPause = function(){me.o.pauseCallback.call(me);};
            var onResume = function(){me.o.resumeCallback.call(me);};
            var onStop = function(){me.o.stopCallback.call(me);};
            var onFinish = function(){
                me.onTimeout();
                me.computeState();
                me.o.finishCallback.call(me);
            };
            var onKill = function(){
                me.computeState();
                me.o.killCallback.call(me);
            };
            me.timer = $.timer( me.id, onInterval, me.interval, {
                timeout: me.timeout,
                startCallback: onStart,
                pauseCallback: onPause,
                resumeCallback: onResume,
                stopCallback: onStop,
                finishCallback: onFinish,
                killCallback: onKill
            });
            me.optionChanged = false;
        }
    };
    timer.prototype.reset = function(){
        var me = this;

        me.passed = 0;
        me.left = me.timeout;
        me.progress = 0.0;
        me.passedUnit = 0;
        me.leftUnit = me.timeoutUnit;
        me.leftSeconds = me.leftUnit % 60;
        me.leftMinutes = Math.floor(me.leftUnit/60)%60;
        me.leftHours = Math.floor(me.leftUnit/3600)%60;
        me.stepCount = 0;
        me.lastInterval = false;
        me.lastAction = 'reset';
        /*
         *  After resetting state, Trigger reset event for callback
         */
        me.o.resetCallback.call(me);
    };
    timer.prototype.start = function(){this.timer.start(); this.lastAction = 'start';};
    timer.prototype.stop = function(){this.timer.stop(); this.lastAction = 'stop';};
    timer.prototype.pause = function(){this.timer.pause(); this.lastAction = 'pause';};
    timer.prototype.resume = function(){this.timer.resume(); this.lastAction = 'resume';};
    timer.prototype.kill = function(){this.timer.kill(); this.lastAction = 'kill';};
    timer.prototype.getStatus = function(){return this.timer.status();};
    timer.prototype.getPassed = function(){return this.passed;};
    timer.prototype.getLeft = function(){return this.left;};
    timer.prototype.getProgress = function(){return this.progress;};
    timer.prototype.getLeftSeconds = function(){return this.leftSeconds;};
    timer.prototype.getLeftMinutes = function(){return this.leftMinutes;};
    timer.prototype.getLeftHours = function(){return this.leftHours;};
    timer.prototype.getStepCount = function(){return this.stepCount;};
    timer.prototype.getLastAction = function(){return this.lastAction;};

    timer.prototype.setData = function(name, value){
        if(name instanceof Object){
            var o = name;
            for(var p in o){
                this.data[p] = o[p];
            }
        }
        else{
            this.data[name] = value;
        }
    };
    timer.prototype.getData = function(name){
        return this.data[name];
    };
    timer.prototype.clearData = function(){
        return this.data = {};
    };

    /**
     * Configure interval option
     * @private
     * @param interval
     */
    timer.prototype.configInterval = function(interval){
        var me = this;
        me.interval = interval;
        //interval option is changed, so an option is changed (but not applied)
        me.optionChanged = true;
    };
    /**
     * Configure timeout option
     * @private
     * @param timeout
     */
    timer.prototype.configTimeout = function(timeout){
        var me = this;
        var unit = String(timeout).charAt(timeout.length-1 );
        var _timeout = parseInt(timeout);
        var timeoutSecFactor = timer.unitMap[unit];
        if(!timeoutSecFactor){
            throw new Error('"timeout" argument should be like "10s", "10m" or "1h"');
        }
        me.timeout = _timeout*timeoutSecFactor*1000; //timeout milliseconds
        me.timeoutUnit = _timeout*timeoutSecFactor; //timeout seconds

        //timeout option is changed, so an option is changed (but not applied)
        me.optionChanged = true;
    };
    /**
     * Configure step option
     * @private
     * @param step
     */
    timer.prototype.configStep = function(step){
        var me = this;
        me.stepUnit = String(step).charAt(step.length-1);
        var _step = parseInt(step);
        var stepSecFactor = timer.unitMap[me.stepUnit];
        if(!stepSecFactor){
            throw new Error('"step" argument should be like "10s", "5m" or "1h"');
        }
        me.step = _step*stepSecFactor*1000; //step milliseconds
        me.stepCount = 0;
        var stepTotal = Math.floor( me.timeout/me.step ) + 1;
        me.stepTotal = me.timeout%me.step==0 ? stepTotal : stepTotal+1;

        //step option is changed, so an option is changed (but not applied)
        me.optionChanged = true;
    };

    timer.prototype.onMove = function(){this.o.moveCallback.call(this);};
    timer.prototype.onSecondBeat = function() {this.o.secondBeatCallback.call(this);};
    timer.prototype.onMinuteBeat = function() {this.o.minuteBeatCallback.call(this);};
    timer.prototype.onHourBeat = function() {this.o.hourBeatCallback.call(this);};
    timer.prototype.onStep = function(){this.o.stepCallback.call(this);};

    /**
     * When timer timeout, invoke this method to set whole state to be timeout state
     * (including passed, left, progress, passedUnit, and all else)
     * @private
     */
    timer.prototype.onTimeout = function(){
        var me = this;
        me.passed = me.timeout;
        me.left = 0;
        me.progress = 100;
        me.passedUnit = me.timeoutUnit;
        me.leftUnit = 0;
        me.leftSeconds = 0;
        me.leftMinutes = 0;
        me.leftHours = 0;
        me.stepCount = me.stepTotal;
        me.lastAction = 'timeout';
    };
    timer.prototype.computeState = function(){
        var me = this;
        var passed, left;
        var leftUnit, oldLeftUnit;
        if(me.passed == me.timeout){
            if(!me.lastInterval){
                me.lastInterval = true;

                leftUnit = me.leftUnit;
                oldLeftUnit = me.leftUnit;
            }
            else if(me.timer.getPassedTime()==0) {
                return; //to skip the last interval call because $timer will reset passTime before finishCallback is invoked
            }
        }
        else{
            me.lastInterval = false;
            passed = me.timer.getPassedTime();
            left = me.timeout-passed;
            me.passed = passed;
            me.left = left;

            me.progress = 100*me.passed/me.timeout;
            me.passedUnit = passed%1000>900?Math.ceil( passed/1000 ):Math.floor( passed/1000 );
            leftUnit = me.timeoutUnit - me.passedUnit;
            oldLeftUnit = me.leftUnit;
            me.leftUnit = leftUnit;
        }

        /*
         *  Pre-call onMove before computing beat state
         */
        me.pushCallback(me.onMove);

        if(leftUnit!=oldLeftUnit){
            var oldLeftSeconds = me.leftSeconds;
            me.leftSeconds = leftUnit % 60;
            if( oldLeftSeconds==0 ){
                var oldLeftMinutes = me.leftMinutes;
                var leftMinutes = Math.floor(leftUnit/60)%60;
                if(leftMinutes!=oldLeftMinutes){
                    me.leftMinutes = leftMinutes;
                    if( oldLeftMinutes==0 ){
                        var oldLeftHours = me.leftHours;
                        var leftHours = Math.floor(leftUnit/3600)%60;
                        if(leftHours!=oldLeftHours){
                            me.leftHours = leftHours;
                            me.pushCallback(me.onSecondBeat);
                            me.pushCallback(me.onMinuteBeat);
                            me.pushCallback(me.onHourBeat);
                        }
                    }
                    else{
                        me.pushCallback(me.onSecondBeat);
                        me.pushCallback(me.onMinuteBeat);
                    }
                }
            }
            else{
                me.pushCallback(me.onSecondBeat);
            }
        }
        else if(me.passedUnit == me.timeoutUnit){
            me.pushCallback(me.onSecondBeat);
        }

        if(me.o.step){
            if(me.stepCount==me.stepTotal){
                me.pushCallback(me.onStep);
            }
            else{
                var stepCount = Math.floor(me.passed/me.step)+1;
                if(stepCount!=me.stepCount){
                    me.stepCount = stepCount;
                    me.pushCallback(me.onStep);
                }
            }
        }

        me.runCallbacks(); //invoke all queued callbacks in the way of first-come-first-serve
    };

    timer.prototype.pushCallback = function (callback) {
        this.callbackQueue.push(callback);
    };
    timer.prototype.runCallbacks = function () {
        var cb = null;
        while(this.callbackQueue.length!=0){
            cb = this.callbackQueue.shift();
            cb.call(this);
        }
    };

    /**
     * TODO Move it out as a util method
     * @private
     * @param num
     * @param size
     * @returns {string}
     */
    timer.prototype.pad = function (num, size) {
        var s = ""+num;
        while (s.length < size) s = "0" + s;
        return s;
    };

})(jQuery);
