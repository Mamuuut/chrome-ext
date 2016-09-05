$('#main').html('Connecting to deZem application…');

// Create a connection to the background page
var oPort = chrome.runtime.connect({
    'name' : 'dev_panel'
});

oPort.postMessage({
    'init'  : true,
    'tabId' : chrome.devtools.inspectedWindow.tabId
});

chrome.devtools.panels.elements.onSelectionChanged.addListener(function()
{
    chrome.devtools.inspectedWindow.eval("setSelectedElement($0)");
});

var aoModuleGroup = {};

oPort.onMessage.addListener(function(oMsg) {

    // Init
    if (oMsg.initComplete) {
        $('#main').html('onMessage init ' + chrome.devtools.inspectedWindow.tabId);

        oPort.postMessage({
            'tabId'          : chrome.devtools.inspectedWindow.tabId,
            'scriptToInject' : 'devtools/content.js'
        });
    }

    // Language Module list
    if (oMsg.selected) {
        oPort.postMessage({
            'log' : ['selected']
        });

        $('#main').find('.module, .module-content, .line').hide();
        $('.line').filter(function()
            {
                return $(this).data('value') == oMsg.selected;
            }).show()
            .closest('.module-content').show()
            .closest('.module').show();
    }

    // Language Module list
    if (oMsg.aoModule) {
        $('#main').empty();

        oMsg.aoModule = _.sortBy(oMsg.aoModule, 'sModule');

        aoModuleGroup = _.groupBy(oMsg.aoModule, function(oModule)
        {
            var sLocale = oModule.sModule.match(/.*\/language(\/\w+)\/.*/)[1];
            return oModule.sModule.replace(sLocale, '');
        });

        oPort.postMessage({
            'log' : aoModuleGroup
        });

        _.forIn(aoModuleGroup, function(aoModule, sGroup)
        {
            var elGroup = $('<div class="module off" />');
            elGroup.append('<div class="module-title">' + sGroup + '</div>');
            _.forEach(aoModule, function(oModule)
            {
                var elModule = $('<div class="module-content"></div>');
                
                _.forIn(oModule.oModule, function(sValue, sKey)
                {
                    var elLine = $('<dl class="line" data-value="' + sValue + '" />');
                    
                    elLine.append('<dt>' + sKey + '</dt>');
                    elLine.append('<dd>' + sValue + '</dd>');

                    elModule.append(elLine);
                });

                elGroup.append(elModule);
                oModule.elModule = elModule;
            });
            $('#main').append(elGroup);
        });

        $('#main').find('.module').click(function(oEvent)
        {
            oPort.postMessage({
                'log' : 'click'
            });

            $(oEvent.target).closest('.module').toggleClass('off');
        });

        oPort.postMessage({
            'log' : 'received asoModule'
        });
    }

    // Fixtures
    if (oMsg.asFixture) {
        $('#main').empty();
        oMsg.asFixture.forEach(function(sFixture)
        {
            var oFixture = JSON.parse(sFixture);
            // $('#main').append('<div>' + oFixture.oRequest.method + '</div>');
            // window.document.getElementById('main').innerHTML = '<pre>' + oMsg.asFixture + '</pre>';
        })
        oPort.postMessage({
            'log' : 'received asFixture'
        });
    }
});