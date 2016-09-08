$('#content').html('Connecting to deZem application…');

$('.clear-filter').click(function(oEvent)
{
    $('#content').find('.module, .line').show();
    $('#content').find('.module-content').hide();
});

$('.search').click(function(oEvent)
{
    var sText = $('.search-input').val();
    if (sText) {

        $('#content').find('.module, .module-content, .line').hide();
        _.forIn(aoModuleGroup, function(aoModule, sGroup)
        {
            _.forEach(aoModule, function(oModule)
            {
                _.forIn(oModule.oModule, function(sValue, sKey)
                {
                    if (sValue.toLowerCase().search(sText.toLowerCase()) !== -1) {
                        aselLine[sKey].show()
                            .closest('.module-content').show()
                            .closest('.module').show();
                    }
                });
            });
        });
    }
    else {
        $('#content').find('.module, .line').show();
        $('#content').find('.module-content').hide();
    }
});

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
    chrome.devtools.inspectedWindow.eval('setSelectedElement($0)');
});

var asFLAG_LOCALE = {
    'de_DE' : 'de',
    'en_GB' : 'gb',
    'es_ES' : 'es',
    'ru_RU' : 'ru'
};
var aoModuleGroup = {};
var aselLine = {};

oPort.onMessage.addListener(function(oMsg) {

    // Init
    if (oMsg.initComplete) {
        $('#content').html('loading module… ');

        oPort.postMessage({
            'tabId'          : chrome.devtools.inspectedWindow.tabId,
            'scriptToInject' : 'devtools/content.js'
        });
    }

    // Language Module list
    if (oMsg.selected) {
        oPort.postMessage({
            'log' : [oMsg.selected]
        });

        $('#content').find('.module, .module-content, .line').hide();
        _.forIn(aoModuleGroup, function(aoModule, sGroup)
        {
            _.forEach(aoModule, function(oModule)
            {
                _.forIn(oModule.oModule, function(sValue, sKey)
                {
                    if (sValue == oMsg.selected) {
                        aselLine[sKey].show()
                            .closest('.module-content').show()
                            .closest('.module').show();
                    }
                });
            });
        });
    }

    // Language Module list
    if (oMsg.aoModule) {
        $('#content').empty();

        oMsg.aoModule = _.sortBy(oMsg.aoModule, 'sModule');

        aoModuleGroup = _.groupBy(oMsg.aoModule, function(oModule)
        {
            var sLocale = oModule.sModule.match(/.*\/language(\/\w+)\/.*/)[1];
            oModule.sLocale = asFLAG_LOCALE[sLocale.replace(/\//, '')];
            return oModule.sModule.replace(sLocale, '');
        });

        oPort.postMessage({
            'log' : aoModuleGroup
        });

        _.forIn(aoModuleGroup, function(aoModule, sGroup)
        {
            var elGroup = $('<div class="module off" />');

            elGroup.append('<div class="module-title">' + sGroup + '</div>');
            var elModule = $('<div class="module-content"></div>')
                .data('aoModule', aoModule)
                .hide();
            elModule.append('<div class="module-upload"><button class="upload">Upload to Spreadsheet</button></div>');
            elGroup.append(elModule);

            _.forEach(aoModule, function(oModule)
            {

                _.forIn(oModule.oModule, function(sValue, sKey)
                {
                    var elLine = aselLine[sKey];

                    if (!elLine) {
                        elLine = $('<dl class="line" />');
                        elLine.append('<dt>' + sKey + '</dt>');
                        elModule.append(elLine);
                        aselLine[sKey] = elLine;
                    }

                    elLine.append('<dd><span class="flag-icon flag-icon-' + oModule.sLocale + '" /><input type="text" value="' + sValue + '"/></dd>');
                });

                oModule.elModule = elModule;
            });
            $('#content').append(elGroup);
        });

        $('#content').find('.module-title').click(function(oEvent)
        {

            oPort.postMessage({
                'log' : 'CLICK'
            });
            $(oEvent.target).closest('.module').find('.module-content').toggle();
        });

        $('#content').find('.upload').click(function(oEvent)
        {
            var aoModule = $(oEvent.target).closest('.module-content').data('aoModule');
            var asKeys = _.union.apply(_, _.map(_.map(aoModule, 'oModule'), _.keys));

            oPort.postMessage({
                'log' : asKeys
            });

            var assValues = _.map(asKeys, function(sKey)
            {
                return [sKey];
            });
            assValues.unshift(['Keys']);
            _.forEach(aoModule, function(oModule)
            {
                assValues[0].push(oModule.sLocale);
                _.forEach(asKeys, function(sKey, iIndex)
                {
                    var sValue = typeof oModule.oModule[sKey] === 'string' ? oModule.oModule[sKey] : '';
                    assValues[iIndex + 1].push(sValue);
                })
            });

            chrome.devtools.inspectedWindow.eval('vUploadSpreadSheet(' + JSON.stringify(assValues) + ')');
        });

        oPort.postMessage({
            'log' : 'received asoModule'
        });
    }

    // Fixtures
    if (oMsg.asFixture) {
        $('#content').empty();
        oMsg.asFixture.forEach(function(sFixture)
        {
            var oFixture = JSON.parse(sFixture);
            // $('#content').append('<div>' + oFixture.oRequest.method + '</div>');
            // window.document.getElementById('content').innerHTML = '<pre>' + oMsg.asFixture + '</pre>';
        })
        oPort.postMessage({
            'log' : 'received asFixture'
        });
    }
});