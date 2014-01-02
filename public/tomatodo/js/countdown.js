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
    var moduleName = 'countdown';
    var namespaceOwner = 'Tomato Labs';
    if(!container.tl){ container.tl ={}; }
    if(container.tl[moduleName]){
        console.warn('"' + moduleName + '" namespace has used by other libraries and will be overwritten by ' + namespaceOwner);
    }

    /* * * * * * * * * * * *
     * Utils of this module
     * * * * * * * * * * * */
    var _apply = function(a, b){
        for(var p in b){
            a[p] = b[p];
        }
    };
    var _parseHmsTimeToMillis = function(hmsTimeString){
        var milliseconds = 0;
        var units = ['h','m','s'];
        var unitMap = { 's': 1000,  'm': 60000, 'h': 3600000 };
        for(var i = 0, timeExpr = hmsTimeString; i < units.length && timeExpr.length!=0; i++){
            var index = timeExpr.indexOf(units[i]);
            if(index!=-1){
                var digit = timeExpr.slice(0,index);
                timeExpr = timeExpr.slice(index+1);
                milliseconds += parseInt(digit, 10) * unitMap[units[i]];
            }
        }
        return milliseconds;
    };

    var _time = window.tl.time = function(s, m, h){};
    _time.unitMap = {
        s: 1000,
        m: 60000,
        h: 3600000
    };
    _time.divide = function(millis){
        var rest = millis;
        var h = Math.floor(rest / _time.unitMap.h);
        rest = rest % _time.unitMap.h;
        var m = Math.floor(rest / _time.unitMap.m);
        rest = rest % _time.unitMap.m;
        var s =Math.ceil( rest / _time.unitMap.s);
        return {
            s: s,
            m: m,
            h: h
        };
    };
    _time.combine = function(s, m, h){
        return _time.unitMap.s*s + _time.unitMap.m*m + _time.unitMap.h*h;
    };
    _time.fromTime = function(millis){
        var t = new _time();
        t.milliseconds = millis;
        var timeObj = _time.divide(millis);
        _apply(t, timeObj);
        return t;
    };
    _time.fromTimeMap = function(map){
        var t = new _time();
        _apply(t, map);
        t.milliseconds = _time.combine(map.s, map.m, map.h);
        return t;
    };
    _time.fromTimeParts = function(s, m, h){
        var t = new _time();
        t.s = s;
        t.m = m;
        t.h = h;
        t.milliseconds = _time.combine(s, m, h);
        return t;
    };
    _time.prototype.setTime = function(millis){
        this.milliseconds = millis;
        _apply(this, _time.divide(millis));
    };
    _time.prototype.setTimeMap = function(map){
        _apply(this, map);
        this.milliseconds = _time.combine(map.s, map.m, map.h);
    };
    _time.prototype.setTimeParts = function(s, m, h){
        this.s = s;
        this.m = m;
        this.h = h;
        this.milliseconds = _time.combine(s, m, h);
    };
    _time.prototype.getSeconds = function(){return this.s};
    _time.prototype.getMinutes = function(){return this.m};
    _time.prototype.getHours = function(){return this.h};

    //TODO: check dependencies: crysto
    var Crysto = container.tl.crysto;
    var Time = container.tl.time;
    var countdown = window.tl[moduleName] = function(o){
        this.id = ++(countdown.instanceIndex);
        if(o){
            this.config(o);
            this.reset();
        }
    };
    countdown.status = {
        inited: 'i',
        running: 'r',
        stopped: 's',
        aborted: 'a',
        timeout: 't'
    };
    countdown.instanceIndex = 0;
    countdown.prototype = {
        o: {
            engine: null, //countdown object as a countdown engine
            engineInterval: 200,
            timeout: '', //format is '##h##m##s' i.e. '10h2m' or '1m30s'
            startCallback: null,
            stopCallback: null,
            abortCallback: null,
            timeoutCallback: null,
            secondCallback: null,
            minuteCallback: null,
            hourCallback: null
        },
        status: countdown.status.inited,
        timeout: 0, //timeout millisecond
        timeoutTime: 0, //the calculated timeout time
        startTime: 0, //the time when the countdown is started
        endTime: 0, ////the real end time including on timeout time, on stop time and on abort time
        passed: 0, //passed milliseconds from start to now
        left:0, //left milliseconds from now to end
        second: 0,
        minute: 0,
        hour: 0
    };
    countdown.prototype.config = function(o){
        if(o && o instanceof Object ){
            this.o = {};
            _apply(this.o, countdown.prototype.o);
            _apply(this.o, o);
        }
        else{
            throw Error('needs options object for configuring countdown');
        }

        var emptyFn = function(){};
        this.o.startCallback = this.o.startCallback || emptyFn;
        this.o.stopCallback = this.o.stopCallback || emptyFn;
        this.o.abortCallback = this.o.abortCallback || emptyFn;
        this.o.timeoutCallback = this.o.timeoutCallback || emptyFn;
        this.o.secondCallback = this.o.secondCallback || emptyFn;
        this.o.minuteCallback = this.o.minuteCallback || emptyFn;
        this.o.hourCallback = this.o.hourCallback || emptyFn;

        var me = this;
        var engineStopCb = null;
        if(!this.o.engine){
            this.internalEngine = true;
            this.o.engine = new Crysto({
                interval: this.o.engineInterval
            });
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
        this.timeout = _parseHmsTimeToMillis(this.o.timeout);
    };
    /**
     *  Init state after configuring, it is not supposed to call it on running.
     *  it could be called after configuring and before starting, or be called
     *  after stopping an reconfiguring
     */
    countdown.prototype.reset = function(){
        if(this.status===countdown.status.running){
            console.warn('the countdown[' + this.id + '] is running now, it cannot be reset');
            return null;
        }
        console.info('the countdown[' + this.id + '] is reset');

        /*
         *  if the countdown is just stopped, return its internal state.
         */
        var oldState = null;
        if(this.status == countdown.status.stopped){
            oldState = {
                engineInterval: this.o.engineInterval,
                timeout: this.timeout,
                timeoutTime: this.timeoutTime,
                startTime: this.startTime,
                endTime: this.endTime,
                passed: this.passed,
                left: this.left,
                second: this.second,
                minute: this.minute,
                hour: this.hour
            };
        }

        /*
         *  Init state to prepare for new starting
         */
        this.status = countdown.status.inited;
        //this.timeout = 0; //No need to change it until next reconfiguring
        this.timeoutTime = -1;
        this.startTime = -1;
        this.endTime = -1;
        this.passed = 0;
        this.left = this.timeout;

        var timeLeft = Time.fromTime(this.left);
        this.second = timeLeft.s;
        this.minute = timeLeft.m;
        this.hour = timeLeft.h;

        return oldState;
    };
    countdown.prototype.getEngine = function(){
        return this.o.engine;
    };
    countdown.prototype.start = function(){
        if(this.status===countdown.status.running){
            console.warn('the countdown[' + this.id + '] is running, it cannot be started again until stopped.');
            return;
        }

        var nowDate = new Date();
        this.status = countdown.status.running;
        this.startTime = nowDate.getTime();
        this.timeoutTime = this.startTime + this.timeout;
        this.passed = 0;
        this.left = this.timeout;

        /*
         *  Calculate and trigger time callbacks
         */
        var timeLeft = Time.fromTime(this.left);
        this.onSecondChanged(timeLeft.s);
        this.onMinuteChanged(timeLeft.m);
        this.onHourChanged(timeLeft.h);

        var countdownProcessorKey = this.getCountdownProcessorKey();
        if(this.o.engine.existIntervalCallback(countdownProcessorKey)){
            if(this.o.engine.isEnabledIntervalCallback(countdownProcessorKey))
                {}
            else
                this.o.engine.enableIntervalCallback(countdownProcessorKey);
        }
        else{
            this.o.engine.setIntervalCallback(countdownProcessorKey, this.countdownProcessor, this);
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

        console.info('the countdown[' + this.id + '] is started');
        this.o.startCallback.call(this);
    };

    countdown.prototype.stop = function(){
        this.onStop();
    };
    countdown.prototype.abort = function(){
        if(this.status!==countdown.status.running){
            console.warn('the countdown[' + this.id + '] is not running, it cannot be aborted.');
            return;
        }
        var now = new Date().getTime();
        this.status = countdown.status.aborted;
        this.endTime = now;
        this.passed = now - this.startTime;
        this.left = this.timeout-this.passed;

        if(this.internalEngine){
            this.o.engine.stop();
        }
        else{
            this.o.engine.disableIntervalCallback(this.getCountdownProcessorKey());
        }

        console.info('the countdown[' + this.id + '] is aborted');
        this.o.abortCallback.call(this);
    };
    countdown.prototype.onStop = function(){
        if(this.status!==countdown.status.running){
            console.warn('the countdown[' + this.id + '] is not running, it cannot be stopped.');
            return;
        }
        var now = new Date().getTime();
        this.status = countdown.status.stopped;
        this.endTime = now;
        this.passed = now - this.startTime;
        this.left = this.timeout-this.passed;

        if(this.internalEngine){
            this.o.engine.stop();
        }
        else{
            this.o.engine.disableIntervalCallback(this.getCountdownProcessorKey());
        }

        console.info('the countdown[' + this.id + '] is stopped');
        this.o.stopCallback.call(this);
    };
    countdown.prototype.onTimeout = function(){
        if(this.status!==countdown.status.running){
            console.warn('the countdown[' + this.id + '] is not running, it should not timeout');
            return;
        }
        this.status = countdown.status.timeout;

        if(this.internalEngine){
            this.o.engine.stop();
        }
        else{
            this.o.engine.disableIntervalCallback(this.getCountdownProcessorKey());
        }

        console.info('the countdown[' + this.id + '] timeouts');
        this.o.stopCallback.call(this);
    };
    countdown.prototype.countdownProcessor = function(){
        var now = this.o.engine.now;
        var isTimeout = now>this.timeoutTime;
        if(isTimeout){
            this.endTime = now;
            this.passed = now - this.startTime;
            this.left = 0;
        }
        else{
            this.passed = now - this.startTime;
            this.left = this.timeout-this.passed;
        }

        /*
         *  Calculate and trigger time callbacks
         */
        var timeLeft = Time.fromTime(this.left);
        if(this.second!=timeLeft.getSeconds()){
            this.onSecondChanged(timeLeft.getSeconds());
            if(this.minute!=timeLeft.getMinutes()){
                this.onMinuteChanged(timeLeft.getMinutes());
                if(this.hour!=timeLeft.getHours()){
                    this.onHourChanged(timeLeft.getHours());
                }
            }
        }

        if(isTimeout) this.onTimeout();
    };
    countdown.prototype.onSecondChanged = function(newSecond){
        var oldSecond = this.second;
        this.second = newSecond;
        this.o.secondCallback.call(this, oldSecond, newSecond);
    };
    countdown.prototype.onMinuteChanged = function(newMinute){
        var oldMinute = this.minute;
        this.minute = newMinute;
        this.o.minuteCallback.call(this, oldMinute, newMinute);
    };
    countdown.prototype.onHourChanged = function(newHour){
        var oldHour = this.hour;
        this.hour = newHour;
        this.o.hourCallback.call(this, oldHour, newHour);
    };
    countdown.prototype.getCountdownProcessorKey = function(){
        return 'countdownProcessor' + this.id;
    };
})();
