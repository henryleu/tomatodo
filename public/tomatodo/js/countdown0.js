/**
 * Created with JetBrains WebStorm.
 * User: henryleu
 * Date: 13-6-8
 * Time: 下午2:17
 * To change this template use File | Settings | File Templates.
 */
var cd = function(o){
    var me = this;
    if(!o){ throw new Error('need options argument'); }
    me.o = o;
    me.id = o.id;
    me.counter = o.counter; // HTML container of countdown timer board
    me.unit = String( o.timeout).charAt( o.timeout.length-1 );
    var _timeout = parseInt( o.timeout );
    var timeoutSecFactor = me._unitMap[me.unit];
    if(!timeoutSecFactor){
        throw new Error('"timeout" argument should be like "10s", "10m" or "1h"');
    }
    me.timeout = _timeout*timeoutSecFactor*1000; //timeout milliseconds
    me.timeoutUnit = _timeout*timeoutSecFactor; //timeout seconds

    if(o.step){
        me.stepUnit = String( o.step).charAt( o.step.length-1 );
        var _step = parseInt( o.step );
        var stepSecFactor = me._unitMap[me.stepUnit];
        if(!stepSecFactor){
            throw new Error('"step" argument should be like "10s", "10m" or "1h"');
        }
        me.step = _step*stepSecFactor*1000; //step milliseconds
        me.stepCount = 0;
        var stepTotal = Math.floor( me.timeout/me.step ) + 1;
        me.stepTotal = me.timeout%me.step==0 ? stepTotal : stepTotal+1;
    }
    me._initData();
    var onRefreshFn = function(){
        me._refreshData();
        if(o.refreshCallback){
            o.refreshCallback.call(me);
        }
        me._refreshStep();
    };
    var onStartFn = o.startCallback ? function(){o.startCallback.call(me);} : o.startCallback;
    var onPauseFn = o.pauseCallback ? function(){o.pauseCallback.call(me);} : o.pauseCallback;
    var onResumeFn = o.resumeCallback ? function(){o.resumeCallback.call(me);} : o.resumeCallback;
    var onStopFn = o.stopCallback ? function(){o.stopCallback.call(me);} : o.stopCallback;
    var onFinishFn = function(){
        me._finishData();
        me._updateView();
        me._updateStep();
        if(o.finishCallback){
            o.finishCallback.call(me);
        }
    };
    var onKillFn = function(){
        //me._finishData();
        me._updateView();
        me._updateStep();
        if(o.killCallback){
            o.killCallback.call(me);
        }
    };
    $.timer( me.id, onRefreshFn, me.refreshInterval, {
        timeout: me.timeout,
        startCallback: onStartFn,
        pauseCallback: onPauseFn,
        resumeCallback: onResumeFn,
        stopCallback: onStopFn,
        finishCallback: onFinishFn,
        killCallback: onKillFn
    });
    me.timer = $.timer(me.id);
};
cd.prototype = {refreshInterval: 200};
cd.prototype._unitMap = { 's': 1,  'm': 60, 'h': 3600 };
cd.prototype.onFinished = function () {};
cd.prototype.reset = function(){
    var me = this;
    me._initData();
    me._updateView();
};
cd.prototype.start = function(){this.timer.start();};
cd.prototype.stop = function(){this.timer.stop();};
cd.prototype.pause = function(){this.timer.pause();};
cd.prototype.resume = function(){this.timer.resume();};
cd.prototype.kill = function(){this.timer.kill();};
cd.prototype.getStatus = function(){return this.timer.status();};
cd.prototype.getProgress = function(){return this.progress;};
cd.prototype._initData = function(){
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
};
cd.prototype._finishData = function(){
    var me = this;
    me.passed = me.timeout;
    me.left = 0;
    me.progress = 100.0;
    me.passedUnit = me.timeoutUnit;
    me.leftUnit = 0;
    me.leftSeconds = 0;
    me.leftMinutes = 0;
    me.leftHours = 0;
    me.stepCount = me.stepTotal;
};
cd.prototype._refreshData = function(){
    var me = this;
    var passed = $.timer(me.id).getPassedTime();
    var left = me.timeout-passed;
    me.passed = passed;
    me.left = left;
    me.progress = 100*me.passed/me.timeout;
    me.passedUnit = passed%1000>900?Math.ceil( passed/1000 ):Math.floor( passed/1000 );
    var leftUnit = me.timeoutUnit - me.passedUnit;
    if(leftUnit!=me.leftUnit){
        me.leftUnit = leftUnit;
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
                        me._updateView('hms' );
                    }
                }
                else{
                    me._updateView('ms' );
                }
            }
        }
        else{
            me._updateView('s' );
        }
    }
};
cd.prototype._refreshStep = function(){
    var me = this;
    if(me.o.step){
        var stepCount = Math.floor(me.passed/me.step)+1;
        if( stepCount<=me.stepTotal && stepCount!=me.stepCount){
            me.stepCount = stepCount;
            me._updateStep();
        }
    }
};
cd.prototype._updateView = function (unit) {
    var me = this;
    $( '#'+me.counter).html( me._pad(me.leftMinutes, 2) + ':' + me._pad(me.leftSeconds, 2) );
};
cd.prototype._updateStep = function(){
    var me = this;
    if(me.o.stepCallback){
        me.o.stepCallback.call(me);
    }
};
cd.prototype._pad = function (num, size) {
    var s = ""+num;
    while (s.length < size) s = "0" + s;
    return s;
};
window.countdown = cd;