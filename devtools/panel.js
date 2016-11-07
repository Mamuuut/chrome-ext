var asFLAG_LOCALE = {
    'de_DE' : 'de',
    'en_GB' : 'gb',
    'es_ES' : 'es',
    'fr_FR' : 'fr',
    'ru_RU' : 'ru'
};

// Create a connection to the background page
var oPort = chrome.runtime.connect({
    'name' : 'dev_panel'
});

oPort.postMessage({
    'class'  : 'CDezemDevTools',
    'method' : 'vInitTab',
    'param'  : [chrome.devtools.inspectedWindow.tabId]
});

// chrome.devtools.panels.elements.onSelectionChanged.addListener(function()
// {
//     chrome.devtools.inspectedWindow.eval('window.CInjectController.vSetSelectedElement($0)');
// });

var oPanel = {

    /**
     * @property {Array_aso}
     * @description List of Module Group by group name
     */

    'asoModuleGroup' : {},

    /**
     * @property {Array_aso}
     * @description List of Module changes by group name
     */

    'asoChanges' : {},

    /**
     * @property {Array_asel}
     * @description List of Language line per language key
     */

    'aselLine' : {},

    /**
     * @property {Boolean}
     * @description Is Pick mode actiove
     */

    'bPickMode' : false,

    /**
     * @function vEvalScript
     *
     * @description Evaluate inject function call
     *
     * @param {String} sMethod
     *
     * @param {Array_as} asParam
     */

    'vEvalScript' : function(sMethod, asParam)
    {
        var sParam = '';

        if (typeof asParam === 'string') {
            sParam = asParam;
        }
        else if (asParam && asParam.length) {
            sParam = asParam.join(',');
        }

        var sEval = 'window.CInjectController.' + sMethod + '(' + sParam + ')';
        chrome.devtools.inspectedWindow.eval(sEval);
    },

    /**
     * @function vScrollToModule
     *
     * @description Scroll to the first visible module
     */

    'vScrollToModule' : function(elModule)
    {
        var iScrollTop = elModule.offset().top + $('#content').scrollTop() - $('#content').offset().top;
        $('#content').scrollTop(iScrollTop);
    },

    /**
     * @function vRenderLine
     *
     * @description Render a language line
     *
     * @param {jQueryElement} elModule
     *
     * @param {String} sGroup
     *
     * @param {String} sLocale
     *
     * @param {String} sKey
     *
     * @param {String} sValue
     */

    'vRenderLine' : function(elModule, sGroup, sLocale, sKey, sValue)
    {
        var elLine = _.get(this.aselLine, [sGroup, sKey]);

        if (!elLine) {

            elLine = $('<dl class="line" />');
            elLine.append('<dt>' + sKey + '</dt>');
            elModule.append(elLine);

            _.set(this.aselLine, [sGroup, sKey], elLine);
        }

        var sFlag = asFLAG_LOCALE[sLocale];
        var elDD = $('<dd><span class="flag-icon flag-icon-' + sFlag + '" /><input data-locale="' + sLocale + '" type="text"/></dd>');

        elDD.find('input').on('blur', function(oEvent)
        {
            var sNewValue = $(oEvent.target).val();
            var bChanged = sNewValue !== sValue;

            if (bChanged) {
                _.set(this.asoChanges, [sGroup, sKey], sNewValue);
            }
            else {
                _.unset(this.asoChanges, [sGroup, sKey]);
            }

            elModule.closest('.module').toggleClass('highlighted', _.size(this.asoChanges[sGroup]) > 0);
        }.bind(this));

        elLine.append(elDD);
        elLine.find('input').last().val(sValue);
    },

    /**
     * @function vSearchText
     *
     * @description Search all keys and values for a matching text
     *
     * @param {String} sText
     *
     * @param {Boolean} bForce
     *
     * @param {Boolean} bNoInputUpdate
     */

    'vSetSearchText' : function(sText, bForce, bNoInputUpdate)
    {
        if (!bForce && sText === $('.search-input').val()) {
            return;
        }

        if (sText && sText.length > 2) {

            if (!bNoInputUpdate) {
                $('.search-input').val(sText);
            }

            $('#content').find('.module, .module-content, .line').hide();
            _.forIn(this.asoModuleGroup, function(aoModule, sGroup)
            {
                _.forEach(aoModule, function(oModule)
                {
                    _.forIn(oModule.oKeyValues, function(sValue, sKey)
                    {
                        if ((typeof sValue === 'string' && sValue.toLowerCase().search(sText.toLowerCase()) !== -1) ||
                            sKey.toLowerCase().search(sText.toLowerCase()) !== -1) {

                            _.get(this.aselLine, [sGroup, sKey])
                                .show()
                                .closest('.module-content').show()
                                .closest('.module').show();
                        }
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }
        else {
            $('#content').find('.module, .line').show();
            $('#content').find('.module-content').hide();
        }

        $('#content').scrollTop(0);
    },

    /**
     * @function vTogglePickMode
     *
     * @description Activate/Deactivate Element picking mode
     */

    'vTogglePickMode' : function()
    {
        this.bPickMode = !this.bPickMode;
        $('.pick').toggleClass('active', this.bPickMode);
        this.vEvalScript('vSetPickMode', JSON.stringify(this.bPickMode));
    },

    /**
     * @function vInitComplete
     *
     * @description Extension has been initialized
     */

    'vInitComplete' : function()
    {
        oPort.postMessage({
            'class'  : 'CDezemDevTools',
            'method' : 'vInjectScript',
            'param'  : [
                chrome.devtools.inspectedWindow.tabId,
                'devtools/content.js'
            ]
        });
    },

    /**
     * @function vRefreshPage
     *
     * @description Page has been reloaded
     */

    'vRefreshPage' : function()
    {
        this.vInitComplete();
    },


    /**
     * @function vSetStatus
     *
     * @description Set the current status in the footer
     *
     * @param {String} sStatus
     */

    'vSetStatus' : function(sStatus)
    {
        $('#footer').toggle(sStatus !== '');
        $('#footer .message').html(sStatus);
    },

    /**
     * @function vUpdateModule
     *
     * @description Update a module key/values for all locales
     *
     * @param {String} sGroup
     *
     * @param {Array_aso} asoLocaleKeyValues
     */

    'vUpdateModule' : function(sGroup, asoLocaleKeyValues)
    {
        var elModule = this.asoModuleGroup[sGroup][0].elModule;

        elModule.find('input').off('blur');
        elModule.find('dl').remove();

        _.forIn(asoLocaleKeyValues.en_GB, function(sValue, sKey)
        {
            _.unset(this.aselLine, [sGroup, sKey]);
        }.bind(this));

        _.forIn(asoLocaleKeyValues, function(oLocaleDef, sLocale)
        {
            _.forIn(oLocaleDef, function(sValue, sKey)
            {
                this.vRenderLine(elModule, sGroup, sLocale, sKey, sValue);
            }.bind(this));
        }.bind(this));

        var sText = $('.search-input').val();
        if (sText) {
            oPanel.vSetSearchText(sText, true);
        }
    },

    /**
     * @function vConfirmUploadDiff
     *
     * @description Show Local/Remote diff before uploading
     *
     * @param {String} sGroup
     *
     * @param {Object} oMergedValue
     */

    'vConfirmUploadDiff' : function(sGroup, oMergedValue)
    {
        $('#diff').empty();

        _.forEach(oMergedValue.aoDiff, function(oDiff)
        {
            var elDiff = $('<div class="diff-line" />');

            var sFlag = asFLAG_LOCALE[oDiff.sLocale];

            var elTitle = $('<div class="diff-title" />');

            elTitle.append('<span class="flag-icon flag-icon-' + sFlag + '" />');
            elTitle.append('<span>' + oDiff.sKey + '</span>');

            elDiff.append(elTitle);

            var oModule        = _.find(this.asoModuleGroup[sGroup], {'sLocale' : oDiff.sLocale})
            var sLocalOldValue = oModule && oModule.oKeyValues[oDiff.sKey];

            elDiff.append('<div class="diff-version diff-local"><span>Edited (new version to be uploaded to google drive)</span>' + (oDiff.sLocalValue || '[NO VALUE]') + '</div>');
            elDiff.append('<div class="diff-version diff-remote"><span>Google (previous version in google drive)</span>' + (oDiff.sRemoteValue || '[NO VALUE]') + '</div>');
            elDiff.append('<div class="diff-version diff-webpage"><span>Webpage (previous version in the web application)</span>' + (sLocalOldValue || '[NO VALUE]') + '</div>');

            $('#diff').append(elDiff);
        }.bind(this));

        var elHeader = $('<div class="diff-header" />');
        elHeader.append('<span>' + oMergedValue.aoDiff.length + ' change(s).</span>');
        elHeader.append('<button class="diff-confirm">Confirm</button>');
        elHeader.append('<button class="diff-cancel">Cancel</button>');

        elHeader.find('.diff-cancel').click(function(oEvent)
        {
            $('#diff').hide();
            $('#content').show();
        });

        elHeader.find('.diff-confirm').click(function(oEvent)
        {
            $('#diff').hide();
            $('#content').show();
            var sEval = 'window.CInjectController.vUploadSpreadSheet("' + sGroup + '", ' + JSON.stringify(oMergedValue.aasMergedValues) + ')';
            chrome.devtools.inspectedWindow.eval(sEval);
        });

        $('#diff').append(elHeader);

        $('#diff').show();
        $('#content').hide();
    },


    /**
     * @function vUploadSuccess
     *
     * @description File upload was successfull
     *
     * @param {String} sGroup
     */

    'vUploadSuccess' : function(sGroup)
    {
        var elGroup = this.asoModuleGroup[sGroup][0].elModule.closest('.module');
        elGroup.removeClass('highlighted');
    },


    /**
     * @function vUploadSuccess
     *
     * @description File upload was successfull
     *
     * @param {String} sGroup
     */

    'vDownloadSuccess' : function(sGroup)
    {
        var elGroup = this.asoModuleGroup[sGroup][0].elModule.closest('.module');
        elGroup.removeClass('highlighted');
    },


    /**
     * @function vRenderModuleGroups
     *
     * @description Render all module groups
     *
     * @param {Array_ao} asoModuleGroup
     */

    'vRenderModuleGroups' : function(asoModuleGroup)
    {
        this.vSetStatus('');

        $('#content').empty();
        $('.pick').toggleClass('active', false);

        this.asoModuleGroup = asoModuleGroup;
        this.asoChanges     = {};
        this.aselLine       = {};
        this.bPickMode      = false;

        _.forIn(asoModuleGroup, function(aoModule, sGroup)
        {
            var elGroup = $('<div class="module off" />');

            var sTitle = _.map(sGroup.replace(/text!(.*)language\/(.*)\.json/, '$1$2').split('/'), function(sFolder)
            {
                return '<span class="folder">' + sFolder + '</span>';
            }).join('/');
            elGroup.append('<div class="module-title"><span class="path">' + sTitle + '</span></div>');

            var elModule = $('<div class="module-content"></div>')
                .data('aoModule', aoModule)
                .data('sGroup', sGroup)
                .hide();

            elGroup.find('.module-title')
                .append('<span class="button-cell"><button class="upload">Upload</button></span>')
                .append('<span class="button-cell"><button class="open">Open</button></span>')
                .append('<span class="button-cell"><button class="download">Download</button></span>');

            elGroup.append(elModule);

            _.forEach(aoModule, function(oModule)
            {
                _.forIn(oModule.oKeyValues, function(sValue, sKey)
                {
                    this.vRenderLine(elModule, sGroup, oModule.sLocale, sKey, sValue);
                }.bind(this));

                oModule.elModule = elModule;
            }.bind(this));

            $('#content').append(elGroup);

        }.bind(this));

        $('#content').find('.module-title').click(function(oEvent)
        {
            $(oEvent.target).closest('.module').find('.module-content').toggle();
            this.vScrollToModule($(oEvent.target).closest('.module'));
        }.bind(this));

        $('#content').find('.download').click(function(oEvent)
        {
            var elModuleContent = $(oEvent.target).closest('.module').find('.module-content');
            var sGroup = elModuleContent.data('sGroup');
            this.vEvalScript('vFetchSpreadSheet', JSON.stringify(sGroup));
            return false;
        }.bind(this));

        $('#content').find('.open').click(function(oEvent)
        {
            var elModuleContent = $(oEvent.target).closest('.module').find('.module-content');
            var sGroup = elModuleContent.data('sGroup');
            this.vEvalScript('vOpenSpreadSheet', JSON.stringify(sGroup));
            return false;
        }.bind(this));

        $('#content').find('.upload').click(function(oEvent)
        {
            var elModuleContent = $(oEvent.target).closest('.module').find('.module-content');
            var aoModule  = elModuleContent.data('aoModule');
            var sGroup    = elModuleContent.data('sGroup');
            var asKeys    = _.keys(this.asoChanges[sGroup]);
            var assValues = _.map(asKeys, function(sKey)
            {
                return [sKey];
            });

            assValues.unshift(['Keys']);

            elModuleContent.find('dl').first().find('input[data-locale]').each(function()
            {
                assValues[0].push($(this).data('locale'));
            });

            _.forEach(asKeys, function(sKey, iIndex)
            {
                var elInput = _.get(this.aselLine, [sGroup, sKey]).find('input[data-locale]');

                elInput.each(function()
                {
                    var sValue = $(this).val();
                    assValues[iIndex + 1].push(JSON.stringify(sValue));
                });

            }.bind(this));

            this.vEvalScript('vCheckLocalRemoteDiff', [JSON.stringify(sGroup), JSON.stringify(assValues)]);
            return false;
        }.bind(this));
    }
};

oPort.onMessage.addListener(function(oMsg)
{
    var sMethod = oMsg.method;
    var amParam = oMsg.param;

    if (oPanel[sMethod]) {

        try {
            oPanel[sMethod].apply(oPanel, amParam);
        }
        catch (oError) {
            chrome.devtools.inspectedWindow.eval("console.log(" + JSON.stringify(oError.stack) + ")");
        }
    }
});

$('.clear-filter').click(function(oEvent)
{
    $('#content').find('.module, .line').show();
    $('#content').find('.module-content').hide();
});

$('.download-all').click(function(oEvent)
{
    $('#content').find('.download').click();
});

$('.pick').click(function(oEvent)
{
    oPanel.vTogglePickMode();
});

$('.search-input').keyup(function(oEvent)
{
    if (oPanel.bPickMode) {
        oPanel.vTogglePickMode();
    }
    var sText = $('.search-input').val();
    oPanel.vSetSearchText(sText, true, true);
});

oPanel.vSetStatus('Connecting to deZem application…');