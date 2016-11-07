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
                '{{#each aoFixture}}' +
                    '<li {{data "oFixture" .}} >' +
                        '<a>{{sUri}}</a>' +
                        '<div class="fixture-request">' +
                            '<pre>{{oRequest}}</pre>' +
                        '</div>' +
                        '<div class="fixture-response">' +
                            '<pre>{{oResponse}}</pre>' +
                        '</div>' +
                    '</li>' +
                '{{/each}}' +
            '</ul>'
        );

        var CFixtureComp = can.Component.extend({
            'tag'       : 'fixture-list',
            'template'  : sTemplate,
            'viewModel' : {
                'aoFixture' : aoFixture
            },
            'helpers' : {

            },

            'events' : {

                'click' : function(elTraget, oEvent) {
                    this.element.remove();
                },

                'ul click' : function(elTraget, oEvent) {
                    return false;
                }
            }
        });


        var oSendAjaxRequest = CJsonRpc.prototype.oSendAjaxRequest;
        CJsonRpc.prototype.oSendAjaxRequest = function(sUri, sRequestData, aoHandler)
        {
            var jqXhr = oSendAjaxRequest.apply(this, arguments);
            jqXhr.done(function(oData, sTextStatus, jqXHR)
            {
                aoFixture.push({
                    'bSuccess'  : true,
                    'sUri'      : sUri,
                    'oRequest'  : JSON.stringify(JSON.parse(sRequestData), null, '    '),
                    'oResponse' : JSON.stringify(oData, null, '    '),oData
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