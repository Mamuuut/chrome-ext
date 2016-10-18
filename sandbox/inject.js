if (window.require && window.dezem) {

    require([
        'widgets/chart/controller/CChart',
        'can/component',
        'can/view/stache'
    ], function(CChart)
    {
        var vRefresh = function()
        {
            $('.diagram').each(function()
            {
                var oDiagram = $(this).data('diagram');
                if (!oDiagram.options.oDiagramModel.bUseDataCache) {
                    $(this).data('diagram').vRedraw();
                }
            });
        }

        var aoFeature = [
            {
                'sName' : 'Over the rainbow',

                'vRefresh' : function(oFeature)
                {
                    vRefresh();
                },

                'vActivate' : function()
                {
                    var asColor = ['#f00', '#f80', '#ff0', '#8f0', '#0f0', '#0f8', '#0ff', '#08f', '#00f', '#80f', '#f0f', '#f08'];
                    var oSetSeries = CChart.prototype.oSetSeries;
                    this.oRestore = oSetSeries;

                    CChart.prototype.oSetLoading = function(fnCallback)
                    {
                        fnCallback();
                        return new $.Deferred().resolve();
                    };
                    CChart.prototype.oSetSeries = function(aoData)
                    {
                        var iColor = 0;
                        _.forEach(aoData, function(oData)
                        {
                            var sColor = asColor[iColor];
                            _.forEach(this.aoGraph, function(oGraph)
                            {
                                oData[oGraph.lineColorField] = sColor;
                                oData[oGraph.classNameField] = 'bold-bullet';
                            });

                            iColor = (iColor + 1) % asColor.length;
                        }.bind(this));

                        return oSetSeries.call(this, aoData);
                    };

                    this.vRefresh();
                },

                'vDeactivate' : function()
                {
                    CChart.prototype.oSetSeries = this.oRestore;

                    this.vRefresh();
                }
            },

            {
                'sName' : 'DB Scan',

                'aoParam' : [
                    {
                        'sName'  : 'eps',
                        'sKey'   : 'fEps',
                        'fnType' : Number,
                        'mValue' : 0.01
                    },
                    {
                        'sName'  : 'min pts',
                        'sKey'   : 'iMinPts',
                        'fnType' : Number,
                        'mValue' : 3
                    }
                ],

                'vRefresh' : function(oFeature)
                {
                    vRefresh();
                },

                'vActivate' : function(oFeature)
                {
                    var asColor = ['#f00', '#f80', '#ff0', '#8f0', '#0f0', '#0f8', '#0ff', '#08f', '#00f', '#80f', '#f0f', '#f08'];
                    var oSetSeries = CChart.prototype.oSetSeries;
                    this.oRestore = oSetSeries;

                    CChart.prototype.oSetLoading = function(fnCallback)
                    {
                        fnCallback();
                        return new $.Deferred().resolve();
                    };
                    CChart.prototype.oSetSeries = function(aoData)
                    {
                        if (this.aoGraph[0]) {
                            var aoScanData = [];
                            var sValueField = this.aoGraph[0].valueField;

                            var yMax = _.maxBy(aoData, sValueField)[sValueField];
                            var yMin = _.minBy(aoData, sValueField)[sValueField];

                            var xMax = _.maxBy(aoData, 'date').date;
                            var xMin = _.minBy(aoData, 'date').date;

                            var sColorField = this.aoGraph[0].lineColorField;
                            var sClassField = this.aoGraph[0].classNameField;
                            _.forEach(aoData, function(oData)
                            {
                                if (oData[sValueField]) {
                                    oData.x = (oData.date - xMin) / (xMax - xMin);
                                    oData.y = (oData[sValueField] - yMin) / (yMax - yMin);
                                    oData.cluster_id = -1;
                                    aoScanData.push(oData);
                                }
                            }.bind(this));

                            // var oDbScanner  = jDBSCAN().eps(1).minPts(1).distance('EUCLIDEAN').data(aoScanData);
                            // var aiCluster   = oDbScanner();

                            // _.forEach(aiCluster, function(iCluster, iData)
                            // {
                            //     aoScanData[iData][sColorField] = asColor[iCluster % asColor.length];
                            //     aoScanData[iData][sClassField] = 'bold-bullet';
                            // });

                            dbscan.run(aoScanData, aoScanData.length, oFeature.fEps, oFeature.iMinPts, dbscan.euclidean_dist);

                            _.forEach(aoScanData, function(oData)
                            {
                                oData[sColorField] = asColor[oData.cluster_id % asColor.length];
                                oData[sClassField] = 'bold-bullet';
                            });

                        }
                        return oSetSeries.call(this, aoData);
                    };

                    this.vRefresh();
                },

                'vDeactivate' : function(oFeature)
                {
                    CChart.prototype.oSetSeries = this.oRestore;

                    this.vRefresh();
                }
            }
        ];

        _.forEach(aoFeature, function(oFeature)
        {
            _.forEach(oFeature.aoParam, function(oParam)
            {
                oFeature[oParam.sKey] = oParam.mValue;
            });
        });

        var sTemplate = can.stache('<button id="sandbox" class="btn md dropdown-toggle" data-toggle="dropdown">' +
                '<span class="glyphicon glyphicon-sunglasses"></span>'+
            '</button>' +
            '<ul class="dropdown-menu header-module-dropdown">' +
                '{{#each aoFeature}}' +
                    '<li {{data "oFeature" .}} >' +
                        '<a>{{sName}}</a>' +
                        '<div class="params">' +
                            '{{#each aoParam}}' +
                                '<div class="name">{{sName}}</div>' +
                                '<div><input {{data "oParam" .}} type="text" value="{{mValue}}" /></div>' +
                            '{{/each}}' +
                        '</div>' +
                    '</li>' +
                '{{/each}}' +
            '</ul>');

        var CSandboxComp = can.Component.extend({
            'tag'       : 'sandbox-comp',
            'template'  : sTemplate,
            'viewModel' : {
                'aoFeature' : aoFeature
            },
            'helpers' : {

            },
            'events' : {

                'vUpdateParam' : function(elTarget)
                {
                    var oFeature = elTarget.closest('li').data('oFeature');
                    var oParam   = elTarget.data('oParam');
                    oFeature[oParam.sKey] = oParam.fnType(elTarget.val());

                    oFeature.vRefresh();
                },

                'li a click' : function(elTarget, oEvent)
                {
                    var elFeature = elTarget.closest('li');
                    var bActive   = elFeature.hasClass('active');
                    var oFeature  = elFeature.data('oFeature');

                    if (this.oFeature !== undefined && oFeature !== this.oFeature) {
                        this.oFeature.vDeactivate(this.oFeature);
                        this.oFeature.elFeature.removeClass('active');
                    }

                    this.oFeature = oFeature;
                    this.oFeature.elFeature = elFeature;

                    elFeature.toggleClass('active', !bActive);
                    if (!bActive) {
                        this.oFeature.vActivate(this.oFeature);
                    }
                    else {
                        this.oFeature.vDeactivate(this.oFeature);
                    }

                    return false;
                },

                'li input blur' : function(elTarget, oEvent)
                {
                    this.vUpdateParam(elTarget);
                },

                'li input keyup' : function(elTarget, oEvent)
                {
                    if (oEvent.keyCode === 13) {
                        this.vUpdateParam(elTarget);
                    }
                },

                'li click' : function(elTarget, oEvent)
                {
                    return false;
                }
            }
        });

        var CInjectSandbox = can.Construct.extend(
            {

                /**
                 * @function vSendFeature
                 *
                 */

                'vInitSandbox' : function()
                {
                    $('personal-settings-comp').before(can.stache('<sandbox-comp />')());
                }
            },
            {

            }
        );

        CInjectSandbox.vInitSandbox();
    });
}