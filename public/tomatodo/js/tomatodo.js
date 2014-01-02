
(function($){
    var td = window.td = function(){};
    var StaticDef = {
        lsSettingsKey: 'tomatodo-settings',
        lsTaskListKey: 'tomatodo-tasklist',
        lsClockKey: 'tomatodo-clock',
        workTimeSelector: '#workTime',
        breakTimeSelector: '#breakTime'
    };
    td.StaticDef = StaticDef;

    var Settings = Backbone.Model.extend({
        localStorage: new Backbone.LocalStorage(StaticDef.lsSettingsKey),
        defaults: {
            //uid: '', //user id
            workTime: 25,
            breakTime: 5
        },
        //idAttribute: "_id",
        initialize: function() {
//            var uid = $.cookie('userToken'); //TODO: rename te cookie name to uid
//            this.set({"uid": uid});
        }
    });
    td.Settings = Settings;

    var TaskType = {
        WORK: 'w',
        BREAK: 'b'
    };
    td.TaskType = TaskType;

    var TaskStatus = {
        INITIAL: 'i',
        RUNNING: 'r',
        FINISHED: 'f',
        ABORTED: 'a'
    };
    td.TaskStatus = TaskStatus;

    var ClockAction = {
        WORK: 'w',
        BREAK: 'b',
        FINISH: 'f',
        ABORT: 'a'
    };
    td.ClockAction = ClockAction;

    var Task = Backbone.Model.extend({
        defaults: {
            id: null,
            type: TaskType.WORK,
            status: TaskStatus.INITIAL,
            startTime: null,
            endTime: null,
            content: null,
            contentId: null
        },
        initialize: function() {
            var now = new Date().getTime();
            this.set({
                id: now,
                status: TaskStatus.RUNNING,
                startTime: now
            });
        },
        getState: function(){return this.get('type')+this.get('status');}
    });
    td.Task = Task;

    var TaskList = Backbone.Collection.extend({
        model: Task,
        localStorage: new Backbone.LocalStorage(StaticDef.lsTaskListKey),
        initialize: function() {
        }
    });
    td.TaskList = TaskList;

    var Clock = Backbone.Model.extend({
        localStorage: new Backbone.LocalStorage(StaticDef.lsClockKey),
        defaults: {
            currentTask: null,
            lastTaskState: ''
        },
        initialize: function() {
        }
    });
    td.Clock = Clock;

    var SettingsView = Backbone.View.extend({
        events: {
            "change #workTime":          "workTimeChanged",
            "change #breakTime":          "breakTimeChanged"
        },
        initialize: function() {
            $(StaticDef.workTimeSelector).inputNumber().scopeNumber(15, 45); //TODO: remove hardcode
            $(StaticDef.breakTimeSelector).inputNumber().scopeNumber(3, 10); //TODO: remove hardcode
        },
        render: function() {
            $(StaticDef.workTimeSelector).val(this.model.get('workTime'));
            $(StaticDef.breakTimeSelector).val(this.model.get('breakTime'));
            console.log( this.model.attributes.workTime + ' ' + this.model.attributes.breakTime ); //TODO: remove debug code
        },
        workTimeChanged: function() {
            this.model.set('workTime',$('#workTime').val());
        },
        breakTimeChanged: function() {
            this.model.set('breakTime',$('#breakTime').val());
        }
    });
    td.SettingsView = SettingsView;

    var ClockView = Backbone.View.extend({
        events: {
            "change #workTime":          "workTimeChanged",
            "change #breakTime":          "breakTimeChanged"
        },
        initialize: function() {
            $(StaticDef.workTimeSelector).inputNumber().scopeNumber(15, 45); //TODO: remove hardcode
            $(StaticDef.breakTimeSelector).inputNumber().scopeNumber(3, 10); //TODO: remove hardcode
        },
        render: function() {
            $(StaticDef.workTimeSelector).val(this.model.get('workTime'));
            $(StaticDef.breakTimeSelector).val(this.model.get('breakTime'));
            console.log( this.model.attributes.workTime + ' ' + this.model.attributes.breakTime ); //TODO: remove debug code
        },
        workTimeChanged: function() {
            this.model.set('workTime',$('#workTime').val());
        },
        breakTimeChanged: function() {
            this.model.set('breakTime',$('#breakTime').val());
        }
    });
    td.ClockView = ClockView;
})(jQuery);