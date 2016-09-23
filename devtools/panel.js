
var vSetStatus = function(sStatus)
{
    $('#footer').toggle(sStatus !== '');
    $('#footer .message').html(sStatus);
}

vSetStatus('Connecting to deZem application…');

var asFLAG_LOCALE = {
    'de_DE' : 'de',
    'en_GB' : 'gb',
    'es_ES' : 'es',
    'ru_RU' : 'ru'
};
var aoModuleGroup = {};
var aselLine = {};

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
                    if ((typeof sValue === 'string' && sValue.toLowerCase().search(sText.toLowerCase()) !== -1) ||
                        sKey.toLowerCase().search(sText.toLowerCase()) !== -1) {
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
    chrome.devtools.inspectedWindow.eval('window.CInjectController.vSetSelectedElement($0)');
});

var vRenderLine = function(elModule, sLocale, sKey, sValue)
{
    var elLine = aselLine[sKey];

    if (!elLine) {
        elLine = $('<dl class="line" />');
        elLine.append('<dt>' + sKey + '</dt>');
        elModule.append(elLine);
        aselLine[sKey] = elLine;
    }

    var sFlag = asFLAG_LOCALE[sLocale];
    elLine.append('<dd><span class="flag-icon flag-icon-' + sFlag + '" /><input data-locale="' + sLocale + '" type="text" value="' + sValue + '"/></dd>');
}

oPort.onMessage.addListener(function(oMsg) {

    // Init
    if (oMsg.initComplete !== undefined) {
        vSetStatus('Loading language modules…');

        oPort.postMessage({
            'tabId'          : chrome.devtools.inspectedWindow.tabId,
            'scriptToInject' : 'devtools/content.js'
        });
    }

    // Status
    if (oMsg.sStatus !== undefined) {
        vSetStatus(oMsg.sStatus);
    }

    // Element selected
    if (oMsg.selected !== undefined) {

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

    // oLangDef update
    if (oMsg.oLangDefv) {

        var elModule = aoModuleGroup[oMsg.sPath][0].elModule;

        elModule.find('dl').remove();
        _.forIn(oMsg.oLangDef.en_GB, function(sValue, sKey)
        {
            delete aselLine[sKey];
        });

        _.forIn(oMsg.oLangDef, function(oLocaleDef, sLocale)
        {
            _.forIn(oLocaleDef, function(sValue, sKey)
            {
                vRenderLine(elModule, sLocale, sKey, sValue);
            });
        });
    }

    // Language Module list
    if (oMsg.aoModule !== undefined) {
        vSetStatus('');
        $('#content').empty();

        oMsg.aoModule = _.sortBy(oMsg.aoModule, 'sModule');

        aoModuleGroup = _.groupBy(oMsg.aoModule, function(oModule)
        {
            var sLocale = oModule.sModule.match(/.*\/language(\/\w+)\/.*/)[1];
            oModule.sLocale = sLocale.replace(/\//, '');
            return oModule.sModule.replace(sLocale, '');
        });

        _.forIn(aoModuleGroup, function(aoModule, sGroup)
        {
            var elGroup = $('<div class="module off" />');

            elGroup.append('<div class="module-title">' + sGroup + '</div>');

            var elModule = $('<div class="module-content"></div>')
                .data('aoModule', aoModule)
                .data('sGroup', sGroup)
                .hide();

            $('<div/>').appendTo(elModule)
                .append('<button class="upload">Upload to Spreadsheet</button>')
                .append('<button class="open">Open Spreadsheet</button>')
                .append('<button class="download">Download Spreadsheet</button>');

            elGroup.append(elModule);

            _.forEach(aoModule, function(oModule)
            {
                _.forIn(oModule.oModule, function(sValue, sKey)
                {
                    vRenderLine(elModule, oModule.sLocale, sKey, sValue);
                });

                oModule.elModule = elModule;
            });
            $('#content').append(elGroup);
        });

        $('#content').find('.module-title').click(function(oEvent)
        {
            $(oEvent.target).closest('.module').find('.module-content').toggle();
        });

        $('#content').find('.download').click(function(oEvent)
        {
            var sGroup = $(oEvent.target).closest('.module-content').data('sGroup');
            chrome.devtools.inspectedWindow.eval('window.CInjectController.vFetchSpreadSheet("' + sGroup + '")');
        });

        $('#content').find('.open').click(function(oEvent)
        {
            var sGroup = $(oEvent.target).closest('.module-content').data('sGroup');
            chrome.devtools.inspectedWindow.eval('window.CInjectController.vOpenSpreadSheet("' + sGroup + '")');
        });

        $('#content').find('.upload').click(function(oEvent)
        {
            var aoModule = $(oEvent.target).closest('.module-content').data('aoModule');
            var sGroup   = $(oEvent.target).closest('.module-content').data('sGroup');
            var asKeys   = _.union.apply(_, _.map(_.map(aoModule, 'oModule'), _.keys));

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
                    var sValue = aselLine[sKey].find('input[data-locale=' + oModule.sLocale + ']').val();
                    assValues[iIndex + 1].push(sValue);
                })
            });

            chrome.devtools.inspectedWindow.eval('window.CInjectController.vUploadSpreadSheet("' + sGroup + '", ' + JSON.stringify(assValues) + ')');
        });
    }
});