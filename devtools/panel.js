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
        $('#main').html('onMessage init ' + chrome.devtools.inspectedWindow.tabId);

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

        $('#main').find('.module, .module-content, .line').hide();
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
        $('#main').empty();

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
                .data('aoModule', aoModule);
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
            $('#main').append(elGroup);
        });

        $('#main').find('.module-title').click(function(oEvent)
        {
            $(oEvent.target).closest('.module').toggleClass('off');
        });

        $('#main').find('.upload').click(function(oEvent)
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
                    assValues[iIndex + 1].push(oModule.oModule[sKey] || '');
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