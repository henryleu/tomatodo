/**
 * Created with JetBrains WebStorm.
 * User: henryleu
 * Date: 13-6-23
 * Time: 上午8:11
 * To change this template use File | Settings | File Templates.
 */

(function(){
    var container = window || exports || {};
    //Wrap console object to adapt all browsers for logging
    var f = function () {};
    if (!container.console) { container.console = {log:f, info:f, warn:f, debug:f, error:f}; }

    //Check module namespace usage
    var moduleName = 'clock';
    var namespaceOwner = 'Tomato Labs';
    if(!container.tl){ container.tl ={}; }
    if(container.tl[moduleName]){
        console.warn('"' + moduleName + '" namespace has used by other libraries and will be overwritten by ' + namespaceOwner);
    }
    //TODO: check dependencies: crysto
    var Crysto = container.tl.crysto;

    /* * * * * * * * * * * *
     * Utils of this module
     * * * * * * * * * * * */
    var _apply = function(a, b){
        for(var p in b){
            a[p] = b[p];
        }
    };

    var clock = window.tl[moduleName] = function(o){
        this.id = ++(clock.instanceIndex);
        if(o){
            this.config(o);
            this.reset();
        }
    };
    clock.status = {
        inited: 'i',
        running: 'r',
        stopped: 's'
    };
    clock.instanceIndex = 0;
    clock.prototype = {
        o: {
            engine: null, //clock object as a clock engine
            engineInterval: 200,
            startCallback: null,
            stopCallback: null,
            secondCallback: null,
            minuteCallback: null,
            hourCallback: null
        },
        status: clock.status.inited,
        startTime: 0,
        endTime: 0,
        second: 0,
        minute: 0,
        hour: 0
    };
    clock.prototype.config = function(o){
        if(o && o instanceof Object ){
            this.o = {};
            _apply(this.o, clock.prototype.o);
            _apply(this.o, o);
        }
        else{
            throw Error('needs options object for configuring clock');
        }

        var emptyFn = function(){};
        this.o.startCallback = this.o.startCallback || emptyFn;
        this.o.stopCallback = this.o.stopCallback || emptyFn;
        this.o.secondCallback = this.o.secondCallback || emptyFn;
        this.o.minuteCallback = this.o.minuteCallback || emptyFn;
        this.o.hourCallback = this.o.hourCallback || emptyFn;

        var me = this;
        var engineStopCb = null;
        if(!this.o.engine){
            this.internalEngine = true;
            var itvl = this.o.engineInterval;
            var crysto = new Crysto({
                interval: itvl
            });
            this.o.engine = crysto;
        }
        else{
            this.internalEngine = false;
            var engine = this.o.engine;
            var oldEngineStopCb = engine.o.stopCallback;
            engineStopCb = function(){
                oldEngineStopCb.call(engine);
                me.onStop();
            };
            engine.o.stopCallback = engineStopCb;
        }
    };

    /**
     *  Init state after configuring, it is not supposed to call it on running.
     *  it could be called after configuring and before starting, or be called
     *  after stopping an reconfiguring
     */
    clock.prototype.reset = function(){
        if(this.status===clock.status.running){
            console.warn('the clock[' + this.id + '] is running now, cannot be reset');
            return null;
        }
        console.info('the clock[' + this.id + '] is reset');

        /*
         *  if the clock is just stopped, return its internal state.
         */
        var oldState = null;
        if(this.status == clock.status.stopped){
            oldState = {
                engineInterval: this.o.interval,
                startTime: this.startTime,
                endTime: this.endTime,
                passedTime: this.passedTime,
                second: this.second,
                minute: this.minute,
                hour: this.hour
            };
        }

        /*
         *  Init state to prepare for new starting
         */
        this.status = clock.status.inited;
        this.startTime = -1;
        this.endTime = -1;
        this.passedTime = 0;
        this.second = 0;
        this.minute = 0;
        this.hour = 0;

        return oldState;
    };
    clock.prototype.getEngine = function(){
        return this.o.engine;
    };
    clock.prototype.start = function(){
        if(this.status===clock.status.running){
            console.warn('the clock[' + this.id + '] is running, cannot be started again until stopped.');
            return;
        }

        var nowDate = new Date();
        this.startTime = nowDate.getTime();
        this.status = clock.status.running;
        var second = nowDate.getSeconds();
        var minute = nowDate.getMinutes();
        var hour = nowDate.getHours();
        this.onSecondChanged(second);
        this.onMinuteChanged(minute);
        this.onHourChanged(hour);

        var clockProcessorKey = this.getClockProcessorKey();
        if(this.o.engine.existIntervalCallback(clockProcessorKey)){
            if(this.o.engine.isEnabledIntervalCallback(clockProcessorKey)){

            }
            else{
                this.o.engine.enableIntervalCallback(clockProcessorKey);
            }
        }
        else{
            this.o.engine.setIntervalCallback(clockProcessorKey, this.clockProcessor, this);
        }

        //make sure the engine is running
        if(this.o.engine.status==Crysto.status.inited){
            this.o.engine.start();
        }
        else if(this.o.engine.status==Crysto.status.stopped){
            this.o.engine.reset();
            this.o.engine.start();
        }
        else if(this.o.engine.status==Crysto.status.running){}

        console.info('the clock[' + this.id + '] is started');
        this.o.startCallback.call(this);
    };

    clock.prototype.stop = function(){
        this.onStop();
    };
    clock.prototype.onStop = function(){
        if(this.status!==clock.status.running){
            console.warn('the clock[' + this.id + '] is not running, no need to stop it');
            return;
        }
        var now = new Date().getTime();
        this.status = clock.status.stopped;
        this.endTime = now;
        this.passedTime = now - this.startTime;
        if(this.internalEngine){
            this.o.engine.stop();
        }
        else{
            this.o.engine.disableIntervalCallback(this.getClockProcessorKey());
        }

        console.info('the clock[' + this.id + '] is stopped');
        this.o.stopCallback.call(this);
    };
    clock.prototype.clockProcessor = function(){
        var time = this.o.engine.nowDate;
        var second = time.getSeconds();
        if(this.second!=second){
            this.onSecondChanged(second);
            var minute = time.getMinutes();
            if(this.minute!=minute){
                this.onMinuteChanged(minute);
                var hour = time.getHours();
                if(this.hour!=hour){
                    this.onHourChanged(hour);
                }
            }
        }
    };
    clock.prototype.onSecondChanged = function(newSecond){
        var oldSecond = this.second;
        this.second = newSecond;
        this.o.secondCallback.call(this, oldSecond, newSecond);
    };
    clock.prototype.onMinuteChanged = function(newMinute){
        var oldMinute = this.minute;
        this.minute = newMinute;
        this.o.minuteCallback.call(this, oldMinute, newMinute);
    };
    clock.prototype.onHourChanged = function(newHour){
        var oldHour = this.hour;
        this.hour = newHour;
        this.o.hourCallback.call(this, oldHour, newHour);
    };
    clock.prototype.getClockProcessorKey = function(){
        return 'clockProcessor' + this.id;
    };
})();
