// Communication uniq id for chrome.runtime messages
var sInjectId = 'popup-inject-' + new Date().getTime();

require([
    'widgets/chart/controller/CChart',
    'can/component',
    'can/view/stache'
], function(CChart)
{
    var aoFeature = [
        {
            'sName' : 'Over the rainbow',

            'vActivate' : function()
            {
                var asColor = ['#f00', '#f80', '#ff0', '#8f0', '#0f0', '#0f8', '#0ff', '#08f', '#00f', '#80f', '#f0f', '#f08'];
                var oSetSeries = CChart.prototype.oSetSeries;
                this.oRestore = oSetSeries;

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
            },

            'vDeactivate' : function()
            {
                CChart.prototype.oSetSeries = this.oRestore;
            }
        },

        {
            'sName' : 'DB Scan',

            'vActivate' : function()
            {
                var asColor = ['#f00', '#f80', '#ff0', '#8f0', '#0f0', '#0f8', '#0ff', '#08f', '#00f', '#80f', '#f0f', '#f08'];
                var oSetSeries = CChart.prototype.oSetSeries;
                this.oRestore = oSetSeries;

                CChart.prototype.oSetSeries = function(aoData)
                {
                    if (this.aoGraph[0]) {
                        var aoScanData = [];
                        var sValueField = this.aoGraph[0].valueField;
                        var sColorField = this.aoGraph[0].lineColorField;
                        var sClassField = this.aoGraph[0].classNameField;
                        _.forEach(aoData, function(oData)
                        {
                            if (oData[sValueField]) {
                                oData.x = oData.fValue;
                                oData.y = oData[sValueField];
                                aoScanData.push(oData);
                            }
                        }.bind(this));

                        var oDbScanner  = jDBSCAN().eps(1).minPts(1).distance('EUCLIDEAN').data(aoScanData);
                        var aiCluster   = oDbScanner();

                        _.forEach(aiCluster, function(iCluster, iData)
                        {
                            aoScanData[iData][sColorField] = asColor[iCluster % asColor.length];
                            aoScanData[iData][sClassField] = 'bold-bullet';
                        });
                    }
                    return oSetSeries.call(this, aoData);
                };
            },

            'vDeactivate' : function()
            {
                CChart.prototype.oSetSeries = this.oRestore;
            }
        }
    ];

    var sTemplate = can.stache('<button id="sandbox" class="btn md dropdown-toggle" data-toggle="dropdown">' +
            '<span class="glyphicon glyphicon-sunglasses"></span>'+
        '</button>' +
        '<ul class="dropdown-menu header-module-dropdown">' +
            '{{#each aoFeature}}<li {{data "oFeature" .}} ><a>{{sName}}</a></li>{{/each}}' +
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

            'li click' : function(elTarget, oEvent)
            {
                var oFeature = elTarget.data('oFeature');

                elTarget.toggleClass('active');
                if (elTarget.hasClass('active')) {
                    oFeature.vActivate();
                }
                else {
                    oFeature.vDeactivate();
                }

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