/**
 * Created with JetBrains WebStorm.
 * User: henryleu
 * Date: 13-6-23
 * Time: 上午8:11
 * To change this template use File | Settings | File Templates.
 */

(function(){
    //Wrap console object to adapt all browsers for logging
    var f = function () {};
    if (!window.console) { window.console = {log:f, info:f, warn:f, debug:f, error:f}; }

    //Check module namespace usage
    var moduleName = 'crysto';
    var namespaceOwner = 'Tomato Labs';
    if(!window.tl){ window.tl ={}; }
    if(window.tl[moduleName]){
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
    var _removeItem = function(arr, item){
        arr.splice(arr.indexOf(item), 1);
    };

    /* * * * * * * * * * * *
     * crysto module
     * * * * * * * * * * * */
    var crysto = window.tl[moduleName] = function(o){
        if(o){
            this.config(o);
            this.reset();
        }
    };
    crysto.status = {
        inited: 'i',
        running: 'r',
        stopped: 's'
    };
    crysto.prototype = {
        o: {
            interval: 200, //default interval is 200
            startCallback: null,
            stopCallback: null
        },
        status: crysto.status.inited,
        timerHandle: null, //the handle id the window.setInterval(..) returns
        startTime: 0,
        endTime: 0,
        passedTime: 0, //milliseconds the time has passed from start.
        nowDate: null, //current time's Date object which is set on each interval callback
        now: 0, //current time's milliseconds which is set on each interval callback
        intervalRounds: 0, //how many times interval has run.
        passedOffset: 0 //it means that passedTime - intervalRounds * interval;
    };
    crysto.prototype.config = function(o){
        if(o && o instanceof Object ){
            this.o = {};
            _apply(this.o, crysto.prototype.o);
            _apply(this.o, o);
        }
        else{
            throw Error('needs options object for configuring crysto');
        }

        this.icbList = [];
        this.icbMap = {};
        this.icbQueue = [];

        var emptyFn = function(){};
        this.o.startCallback = this.o.startCallback || emptyFn;
        this.o.stopCallback = this.o.stopCallback || emptyFn;
    };

    /**
     *  Init state after configuring, it is not supposed to call it on running.
     *  it could be called after configuring and before starting, or be called
     *  after stopping an reconfiguring
     */
    crysto.prototype.reset = function(){
        if(this.status===crysto.status.running){
            console.warn('the crysto[' + this.timerHandle + '] is running now, cannot be reset');
            return null;
        }
        console.info('the crysto[' + this.timerHandle + '] is reset');

        /*
         *  if the crysto is just stopped, return its internal state.
         */
        var oldState = null;
        if(this.status == crysto.status.stopped){
            oldState = {
                interval: this.o.interval,
                startTime: this.startTime,
                endTime: this.endTime,
                passedTime: this.passedTime,
                intervalRounds: this.intervalRounds,
                passedOffset: this.passedOffset
            };
        }

        /*
         *  Init state to prepare for new starting
         */
        this.status = crysto.status.inited;
        this.timerHandle = -1;
        this.startTime = -1;
        this.endTime = -1;
        this.passedTime = 0;
        this.intervalRounds = 0;
        this.passedOffset = 0;

        return oldState;
    };
    crysto.prototype.existIntervalCallback = function(key){
        var icboExisted = this.icbMap[key]; //Interval Callback Object (icbo);
        return icboExisted ? true : false;
    };
    crysto.prototype.setIntervalCallback = function(key, cb, ctx){
        var icboExisted = this.icbMap[key]; //Interval Callback Object (icbo);
        var icbo = {
            key: key,
            cb: cb,
            ctx: ctx,
            enabled: true
        };
        if(icboExisted){
            _apply(icboExisted, icbo);
        }
        else{
            this.icbList.push(icbo);
            this.icbMap[key] = icbo;
            this.applyIntervalCallbacks();
            console.info('the crysto[' + this.timerHandle + ']\'s interval callback[' + key + '] is added.');
        }
    };
    /**
     * @parivate
     */
    crysto.prototype.applyIntervalCallbacks = function(){
        var newQueue = [];
        var i= 0, len = this.icbList.length;
        for(; i<len; i++){
            var obj = this.icbList[i];
            if(obj.enabled){
                newQueue.push(obj);
            }
        }
        this.icbQueue = newQueue;
    };

    crysto.prototype.unsetIntervalCallback = function(key){
        var icboExisted = this.icbMap[key]; //Interval Callback Object (icbo);
        if(icboExisted){
            _removeItem(this.icbList, icboExisted);
            delete this.icbMap[key];
            this.applyIntervalCallbacks();
            console.info('the crysto[' + this.timerHandle + ']\'s interval callback[' + key + '] is deleted.');
        }
    };
    crysto.prototype.isEnabledIntervalCallback = function(key){
        var icboExisted = this.icbMap[key]; //Interval Callback Object (icbo);
        if(icboExisted){
            return icboExisted.enabled;
        }
        else{
            return false;
        }
    };
    crysto.prototype.enableIntervalCallback = function(key){
        var icboExisted = this.icbMap[key]; //Interval Callback Object (icbo);
        if(icboExisted){
            if(!icboExisted.enabled){
                icboExisted.enabled = true;
                this.applyIntervalCallbacks();
                console.info('the crysto[' + this.timerHandle + ']\'s interval callback[' + key + '] is enabled.');
            }
        }
    };
    crysto.prototype.disableIntervalCallback = function(key){
        var icboExisted = this.icbMap[key]; //Interval Callback Object (icbo);
        if(icboExisted){
            if(icboExisted.enabled){
                icboExisted.enabled = false;
                this.applyIntervalCallbacks();
                console.info('the crysto[' + this.timerHandle + ']\'s interval callback[' + key + '] is disabled.');
            }
        }
    };
    crysto.prototype.clearIntervalCallbacks = function(){
        this.icbQueue = [];
        this.icbList = [];
        this.icbMap = {};
        console.info('the crysto[' + this.timerHandle + ']\'s all interval callbacks are deleted.');
    };
    crysto.prototype.showIntervalCallbacks = function(){
        var i= 0, len = this.icbList.length;
        for(; i<len; i++){
            var obj = this.icbList[i];
            console.log(obj);
        }
    };
    crysto.prototype.start = function(){
        if(this.status===crysto.status.running){
            console.warn('the crysto[' + this.timerHandle + '] is running, cannot be started again until stopped.');
            return;
        }

        this.status = crysto.status.running;
        this.nowDate = new Date();
        this.now = this.nowDate.getTime();
        this.startTime = this.now;

        var me = this;
        this.timerHandle = window.setInterval(function(){
                if(me.status!==crysto.status.running){
                    console.warn('the crysto[' + me.timerHandle + '] is already stopped, no more intervals');
                    return;
                }
                else{
                    me.onInterval();
                }
            },
            this.o.interval
        );
        console.info('the crysto[' + this.timerHandle + '] is started');
        this.o.startCallback.call(this);
    };

    crysto.prototype.stop = function(){
        if(this.status!==crysto.status.running){
            console.warn('the crysto[' + this.timerHandle + '] is not running, no need to stop it');
            return;
        }

        this.status = crysto.status.stopped;
        this.nowDate = new Date();
        this.now = this.nowDate.getTime();
        this.endTime = this.now;
        this.passedTime = this.now - this.startTime;
        window.clearInterval(this.timerHandle);
        console.info('the crysto[' + this.timerHandle + '] is stopped');
        this.o.stopCallback.call(this);
    };
    crysto.prototype.onInterval = function(){
        this.nowDate = new Date();
        this.now = this.nowDate.getTime();
        this.passedTime = this.now - this.startTime;
        this.intervalRounds++;
        this.passedOffset = this.passedTime - this.intervalRounds * this.o.interval;
        var icbQueue = this.icbQueue;
        if(icbQueue.length==0){
            return;
        }
        var i=0, len = icbQueue.length;
        for(; i<len; i++){
            var icb = icbQueue[i];
            if(icb.ctx){
                icb.cb.call(icb.ctx);
            }
            else{
                icb.cb();
            }
        }
    };

})();
