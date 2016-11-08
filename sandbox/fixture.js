var sJsonRpcModule = _.keys(requirejs.s.contexts._.defined).find(function(sModule)
{
    return sModule.search('CJsonRpc') != -1
});

require([sJsonRpcModule,
        'dezem/external/mousetrap/mousetrap',
        'can/component',
        'can/view/stache'
    ], function(
        CJsonRpc,
        Mousetrap
    )
    {
        var aoFixture = new can.List();

        var sTemplate = can.stache(
            '<ul class="fixture-list dropdown-menu">' +
                '<li class="filter">' +
                    '<input type="test" placeholder="Filter">' +
                    '<span class="clear-filter glyphicon glyphicon-remove" aria-hidden="true"></span>' +
                '</li>' +
                '{{#each aoFixture}}' +
                    '{{#bFiltered .}}' +
                        '<li class="fixture" {{data "oFixture" .}} >' +
                            '<a><span class="bold">{{sUri}}</span><span>{{sClass}}</span><span class="bold">{{sMethod}}</span><span>{{sParam}}</span></a>' +
                            '<div class="fixture-content">' +
                                '<div class="fixture-request">' +
                                    '<pre>{{sRequest}}</pre>' +
                                '</div>' +
                                '<div class="fixture-response">' +
                                    '<pre>{{sResponse}}</pre>' +
                                '</div>' +
                            '</div>' +
                        '</li>' +
                    '{{/bFiltered}}' +
                '{{/each}}' +
            '</ul>'
        );

        var CFixtureComp = can.Component.extend({
            'tag'       : 'fixture-list',
            'template'  : sTemplate,
            'viewModel' : {
                'aoFixture' : aoFixture,
                'sFilter'   : ''
            },

            'helpers' : {
                'bFiltered' : function(oFixture, oOptions)
                {
                    var sFilter = this.attr('sFilter');

                    var sUri = oFixture.attr('sUri');
                    var sRequest = oFixture.attr('sRequest');
                    var sResponse = oFixture.attr('sResponse');

                    if (sFilter.length < 3 ||
                        sUri.search(sFilter) !== -1 ||
                        sRequest.search(sFilter) !== -1 ||
                        sResponse.search(sFilter) !== -1) {
                        return oOptions.fn(this);
                    }
                    else {
                        return oOptions.inverse(this);
                    }
                }
            },

            'events' : {

                'click' : function(elTarget, oEvent)
                {
                    this.element.remove();
                },

                'ul click' : function(elTarget, oEvent)
                {
                    return false;
                },

                'ul > li > a click' : function(elTarget, oEvent)
                {
                    elTarget.next().toggle();
                },

                '.filter input keyup' : function(elTarget, oEvent)
                {
                    this.viewModel.attr('sFilter', elTarget.val());
                },

                '.clear-filter click' : function(elTarget, oEvent)
                {
                    this.viewModel.attr('sFilter', '');
                }
            }
        });


        var oSendAjaxRequest = CJsonRpc.prototype.oSendAjaxRequest;
        CJsonRpc.prototype.oSendAjaxRequest = function(sUri, sRequestData, aoHandler)
        {
            var jqXhr = oSendAjaxRequest.apply(this, arguments);
            jqXhr.done(function(oData, sTextStatus, jqXHR)
            {
                var oRequest = JSON.parse(sRequestData);
                aoFixture.push({
                    'bSuccess'  : true,
                    'sUri'      : sUri,
                    'sClass'    : oRequest.class,
                    'sMethod'   : oRequest.method,
                    'sParam'    : JSON.stringify(oRequest.parameter),
                    'sRequest'  : JSON.stringify(oRequest, null, '    '),
                    'sResponse' : JSON.stringify(oData, null, '    '),oData
                });
            });
        };

        Mousetrap.bind('# f i x', function()
        {
            $('fixture-list').remove();
            $('body').append(can.stache('<fixture-list />')())
        });

        var vEscape = Mousetrap.trigger()._callbacks.esc && Mousetrap.trigger()._callbacks.esc[0].callback || _.noop;
        Mousetrap.bind('escape', function()
        {
            vEscape();
            $('fixture-list').remove();
        });
    }
);