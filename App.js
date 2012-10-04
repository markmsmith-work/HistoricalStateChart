Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: {
        type: 'vbox',
        align: 'stretch',
        style: 'margin: 0 auto;'
    },
    items:[
        {
            xtype: 'component',
            itemId: 'titleDate',
            html: '<h1>Current Date: '+ Rally.util.DateTime.format(new Date(), "m/d/Y T(P)") +'</h1>',
            style: 'text-align:center; font-size: 24px; margin: 10px 10px; color:#333333'
        },
        {
            xtype: 'container',
            layout: 'auto',
            border: false,
            height: 60,
            defaults: {
                style: 'margin: auto;'
            },
            items: [
                {
                    xtype: 'container',
                    layout: 'auto',
                    border: false,
                    height: 60,
                    width: 1000,
                    defaults: {
                        style: 'float:left; margin: 5px 5px;'
                    },
                    defaultType: 'rallydatefield',
                    items: [
                        {
                            itemId: 'startDateField',
                            width: 110,
                            value: Rally.util.DateTime.add(new Date(), "day", -10)
                        },
                        {
                            xtype: 'container',
                            itemId: 'sliderHolder',
                            layout: 'fit',
                            width: 680

                        },
                        {
                            itemId: 'endDateField',
                            width: 110,
                            value: new Date()
                        },
                        {
                            xtype: 'rallybutton',
                            itemId: 'playButton',
                            width: 60,
                            text: 'Play'
                        }
                    ]
                }
            ]
        },
        {
            xtype: 'container',
            itemId: 'chartHolder'
        }
    ],

    launch: function() {

        var startDate = this.getStartDate();
        var endDate = this.down('#endDateField').getValue();
        var changeFlag = false;
        this.currentDate = endDate;

        var startDateField = this.down('#startDateField');
        startDateField.on('change', this.onStartDateChange, this);
        //startDateField.on('select', this.onStartDateChange, this);

        var endDateField = this.down('#endDateField');
        endDateField.on('change', this.onEndDateChange, this);
        //endDateField.on('select', this.onEndDateChange, this);

        this.down('#playButton').on('click', this.playClicked, this);

        this.noDays = Rally.util.DateTime.getDifference(endDate, startDate, 'day');
        var app = this;

        this.down('#sliderHolder').add({
            xtype: 'slider',
            itemId: 'dateSlider',
            hideLabel: true,
            width: 700,
            increment: 1,
            minValue: 0,
            maxValue: this.noDays,
            value: this.noDays,
            tipText: function(thumb){
                var tickerDate = Rally.util.DateTime.add(app.getStartDate(), "day", thumb.value);
                return Ext.String.format('<b>{0}</b>',  Rally.util.DateTime.format(tickerDate, "m/d/Y"));
            },
            listeners: {
                'changecomplete': this.onDateChanged,
                scope: this
            }
        });

        this.scheduleStates = ["Backlog", "Defined", "In-Progress", "Completed", "Accepted"];

        var rallyChartConfig = {
            xtype : 'rallychart',
            itemId: 'timeMarkChart',
            height: 600,
            series : [],
            chartConfig : {
              chart : {
                marginRight : 130,
                marginBottom : 250,
                zoomType : 'xy',
                type: 'column',
                animation : {
                  duration : 1500,
                  easing : 'swing'
                }
              },
              title : {
                text : 'Schedule State Counts',
                align: 'center'
              },
              xAxis : [
                {
                    title : {
                      text : 'ScheduleState',
                      margin : 40
                    },

                    labels : {
                      align: 'right',
                      rotation : 300
                    },

                    categories: this.scheduleStates
                }
              ],
              yAxis : {
                title: {
                    text: 'Total Artifacts by ScheduleState'
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold'
                    }
                },
                plotLines : [{
                  value : 0,
                  width : 1,
                  color : '#808080'
                }]
              },
              plotOptions : {
                column: {
                  stacking: 'normal',
                  animation : {
                    duration : 1500,
                    easing : 'swing'
                  }
                }
              },
              tooltip : {
                formatter : function() {
                  return this.series.name + ': ' + this.y;
                }
              },
              legend : {
                layout : 'vertical',
                align : 'right',
                verticalAlign : 'top',
                x : -10,
                y : 100,
                borderWidth : 0
              }
            }
          };

        this.chart = this.down('#chartHolder').add(rallyChartConfig);

        this.onDateChanged();
    },

    playClicked: function(){
        this.down('#playButton').setDisabled(true);
        if(this.down('#dateSlider').getValue() > 0) {
            // reset the slider to 0
            this.down('#dateSlider').setValue(0);
            this.onDateChanged();
            Ext.Function.defer(function() {this.nextTick();}, 6000, this);
        } else {
            this.nextTick();
        }
    },

    nextTick: function(){
        var current = this.down('#dateSlider').getValue();
        var nextVal = current +1;

        if(nextVal <= this.noDays){
            this.down('#dateSlider').setValue(nextVal);
            this.onDateChanged();
            Ext.Function.defer(function() {this.nextTick();}, 6000, this);
        } else {
            this.down('#playButton').setDisabled(false);
        }
    },

    onStartDateChange: function(){
        if(!this.changeFlag) {
            this.changeFlag = true;
            var newStart = this.getStartDate();
            var newEnd = Rally.util.DateTime.add(newStart, "day", 10);
            this.down('#endDateField').setValue(newEnd);
            this.down('#dateSlider').setValue(0);
            this.onDateChanged();
        }
    },

    onEndDateChange: function(){
        if(!this.changeFlag) {
            this.changeFlag = true;
            var newEnd = this.getEndDate();
            var newStart = Rally.util.DateTime.add(newEnd, "day", -10);
            this.down('#startDateField').setValue(newStart);

            this.down('#dateSlider').setValue(this.noDays);
            this.onDateChanged();
        }
    },

    getStartDate: function(){
        return this.down('#startDateField').getValue();
    },

    getEndDate: function(){
        return this.down('#endDateField').getValue();
    },

    setCurrentDate: function(newDate){
        this.currentDate = newDate;
        this.setTitleDate(newDate);
        this.updateChartSeriesForDate(newDate);
        this.changeFlag = false;
    },

    updateChartSeriesForDate: function(newDate){
        var wrappedStoreConfig = {
            context: {
                workspace: this.context.getWorkspace(),
                project: this.context.getProject()
            },
            rawFind: {
                '__At': newDate,
                '_TypeHierarchy': {'$in': ["HierarchicalRequirement", "Defect"]},
                '$or': [
                    { 'ScheduleState': {'$gte': this.scheduleStates[0]}},
                    { 'ScheduleState': {'$lte': this.scheduleStates[this.scheduleStates.length -1]}}
                ]
            },
            sorters: [
                {
                    property: '_ValidFrom',
                    direction: 'DESC'
                }
            ],
            fetch : ["_ValidFrom, ObjectID", "ScheduleState", "_TypeHierarchy"],
            hydrate: ["ScheduleState", "_TypeHierarchy"]
        };

        var transformStore = Ext.create('Rally.data.custom.TransformStore', {
            wrappedStoreType: 'Rally.data.lookback.SnapshotStore',
            wrappedStoreConfig: wrappedStoreConfig,

            transform: {
              method: "groupBy",
              config: {
                  groupBy: 'ScheduleState',
                  aggregations: [
                      {
                          field: 'ObjectID',
                          f: Rally.data.util.Transform.functions.COUNT
                      },
                      {
                          field: '_TypeHierarchy',
                          f: Rally.data.util.Transform.functions.PUSH
                      }
                  ]
              }
            },

            autoLoad: true,

            listeners: {
                scope: this,
                load: this.onTransformStoreLoad
            }
        });
      },

    onTransformStoreLoad: function(store, records){
        var listOfSeries = this.convertGroupingsToSeries(records[0]);
        this.chart.addSeries(listOfSeries);
    },

    convertGroupingsToSeries: function(groups){

        var storySeries = {
            name : "User Story",
            visible : true,
            data: [],
            color: '#89A54E'
        };
        var defectSeries = {
            name : "Defect",
            visible : true,
            data: [],
            color: '#AA4643'
        };

        for(var j=0, ll=this.scheduleStates.length; j < ll; ++j){
            var scheduleState = this.scheduleStates[j];
            var value = groups[scheduleState];

            var storyCount = 0;
            var defectCount = 0;

            if(value){
                for(var i=0, l=value._TypeHierarchy_$push.length; i < l; ++i){
                    var types = value._TypeHierarchy_$push[i];
                    var type = types[types.length-1] || "";
                    if(type === "HierarchicalRequirement"){
                        storyCount++;
                    }
                    else if(type === "Defect"){
                        defectCount++;
                    }
                }
            }

            storySeries.data.push(storyCount);
            defectSeries.data.push(defectCount);
        }

        return [storySeries, defectSeries];
      },

    setTitleDate: function(date){
        var title = '<h1>Current Date: '+ Rally.util.DateTime.format(date, "m/d/Y T(P)") +'</h1>';
        this.down('#titleDate').update(title);
    },

    getDateSliderValue: function(){
        var tickCount = this.down('#dateSlider').getValue();
        var date = Rally.util.DateTime.add(this.getStartDate(), "day", tickCount);
        return date;
    },

    onDateChanged: function(slider, newTickCount){
        var newDate = this.getDateSliderValue();
        this.setCurrentDate(newDate);
    }
});
