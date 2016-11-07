// TODO:
// - Deactivate picking and typing in search input

if (window.require && window.dezem) {
    require([
        'dezem/language/CLang',
        'https://apis.google.com/js/api.js'
    ], function(CLang)
    {
        var CLIENT_ID = '318499840811-vlrbc90ecdol26086v5h99vq7i48n3tb.apps.googleusercontent.com';
        var SCOPES = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
        ];

        var sRange = 'Sheet1!A1:Z1000';

        var aoFileCache = {};

        window.CInjectController = can.Construct.extend(
            {

                /**
                 * @function vPostStatus
                 *
                 * @param {String}
                 */

                'vPostStatus' : function(sStatus)
                {
                    console.log(sStatus);
                    window.postMessage({
                        'class'  : 'CDezemDevTools',
                        'method' : 'vSetStatus',
                        'param'  : [sStatus]
                    }, '*');
                },

                /**
                 * @function vOnMouseMove
                 *
                 * @description Mouse move event listener
                 *
                 * @param {jQueryEvent} oEvent
                 */

                'vOnMouseMove' : function(oEvent)
                {
                    if (oEvent.target.getAttribute('id') !== 'pick-hover' && $(oEvent.target).children(':not(img)').length === 0) {

                        var sText = oEvent.target.value || oEvent.target.innerText;

                        if (sText) {

                            var oRect = oEvent.target.getBoundingClientRect()
                            this.elPickHover.css({
                                'top'    : oRect.top + 'px',
                                'left'   : oRect.left + 'px',
                                'width'  : oRect.width + 'px',
                                'height' : oRect.height + 'px'
                            });

                            window.postMessage({
                                'class'  : 'CDezemDevTools',
                                'method' : 'vSetSearchText',
                                'param'  : [sText.trim()]
                            }, '*');
                        }
                    }
                },

                /**
                 * @function vSetPickMode
                 *
                 * @description Activate/Deactivate Element picking mode
                 *
                 * @param {Boolean} bActive
                 */

                'vSetPickMode' : function(bActive)
                {
                    console.log('vSetPickMode', bActive);
                    if (bActive) {
                        this.oMouseMoveListener = this.vOnMouseMove.bind(this);
                        this.oMouseDownListener = function(oEvent)
                        {
                            window.postMessage({
                                'class'  : 'CDezemDevTools',
                                'method' : 'vTogglePickMode',
                                'param'  : null
                            }, '*');

                            return false;
                        }

                        this.elPickHover = $('<div id="pick-hover"/>').css({
                            'background'     : 'rgba(255, 127, 0, .5)',
                            'position'       : 'absolute',
                            'zIndex'         : 10000
                        });
                        $('body').append(this.elPickHover);

                        $(document).on('mousemove', this.oMouseMoveListener);
                        $(document).on('mousedown', this.oMouseDownListener);
                    }
                    else {
                        this.elPickHover.remove();
                        delete this.elPickHover;

                        $(document).off('mousemove', this.oMouseMoveListener);
                        $(document).off('mousedown', this.oMouseDownListener);
                    }
                },

                /**
                 * @function oLoadApi
                 *
                 * @return {Promise}
                 */

                'oLoadApi' : function()
                {

                    this.vPostStatus('Loading Google Api…');
                    return new Promise(function(resolve, reject)
                    {
                        // No need to load ot twice
                        if (gapi.client && gapi.client.sheets && gapi.client.drive) {
                            resolve();
                            return;
                        }

                        gapi.load('client', function()
                        {
                            gapi.auth.authorize(
                            {
                                'client_id' : CLIENT_ID,
                                'scope'     : SCOPES,
                                'immediate' : false
                            },
                            function()
                            {
                                Promise.all([
                                    gapi.client.load('sheets', 'v4'),
                                    gapi.client.load('drive', 'v3')
                                ])
                                    .then(resolve);
                            });
                        });
                    });
                },

                /**
                 * @function vLoadModule
                 */

                'vLoadModule' : function()
                {
                    this.vPostStatus('Loading language modules…');

                    var asModule = _.keys(requirejs.s.contexts._.defined);
                    var asLanguageModule = _.filter(asModule, function(sModule)
                    {
                        return sModule.match(/.*\/language\/.*\.json/g) !== null;
                    }).sort();

                    var asGroup  = [];
                    var asLocale = [];

                    // Return the list of language modules with converted plural rules
                    var aoModule = _.map(asLanguageModule, function(sModule)
                    {
                        var oModule = JSON.parse(require(sModule));
                        var oKeyValues = {};
                        _.forEach(oModule, function(mValue, sKey)
                        {
                            if (typeof mValue === 'string') {
                                oKeyValues[sKey] = mValue;
                            }
                            if (typeof mValue === 'object') {
                                _.forEach(mValue, function(sValue, iIndex)
                                {
                                    oKeyValues[sKey + '[' + iIndex + ']'] = sValue;
                                });
                            }
                        });

                        var sLocale = sModule.match(/.*\/language\/(\w+)\/.*/)[1];
                        var sGroup  = sModule.replace('\/' + sLocale, '');

                        asGroup.push(sGroup);
                        asLocale.push(sLocale);

                        return {
                            'sGroup'     : sGroup,
                            'sLocale'    : sLocale,
                            'oKeyValues' : oKeyValues
                        };
                    });

                    asGroup = _.uniq(asGroup);
                    asLocale = _.uniq(asLocale);

                    aoModuleGroup = {};

                    // Create empty values for missing locale entries
                    _.forEach(asGroup, function(sGroup)
                    {
                        aoModuleGroup[sGroup] = [];

                        var asKey = [];

                        _.forEach(asLocale, function(sLocale)
                        {
                            var oModule = _.find(aoModule, {'sGroup' : sGroup, 'sLocale' : sLocale});
                            asKey = _.union(asKey, _.keys(oModule.oKeyValues));
                        });

                        asKey.sort();

                        _.forEach(asLocale, function(sLocale)
                        {
                            var oModule = _.merge({
                                'sGroup'     : sGroup,
                                'sLocale'    : sLocale,
                                'oKeyValues' : {}
                            }, _.find(aoModule, {'sGroup' : sGroup, 'sLocale' : sLocale}));

                            // Set undefined keys to ''
                            _.forEach(asKey, function(sKey)
                            {
                                oModule.oKeyValues[sKey] = oModule.oKeyValues[sKey] || '';
                            });

                            aoModuleGroup[sGroup].push(oModule);
                        });
                    });

                    window.postMessage({
                        'class'  : 'CDezemDevTools',
                        'method' : 'vRenderModuleGroups',
                        'param'  : [aoModuleGroup]
                    }, '*');
                },

                /**
                 * @function vSetSelectedElement
                 *
                 * @param {HTMLElement}
                 */

                'vSetSelectedElement' : function(el)
                {
                    console.log('setSelectedElement', el.innerHTML.trim());
                    window.postMessage({
                        'class'  : 'CDezemDevTools',
                        'method' : 'vSetSearchText',
                        'param'  : [el.innerHTML.trim()]
                    }, '*');
                },

                /**
                 * @function sGetRepPath
                 *
                 * @param {String} sGroup
                 *
                 * @return {String}
                 */

                'sGetRepPath' : function(sGroup)
                {
                    var sPath = sGroup.replace('text!', '').replace('.json', '').replace('/language', '');
                    var sFirst = sPath.split('/')[0];

                    switch(sFirst) {
                        case 'ad' :
                        case 'vis' :
                        case 'dashboard' :
                        case 'report2' :
                            return 'app-' + sPath;
                        case 'widgets' :
                            var asPath = sPath.split('/');
                            asPath.shift();
                            return 'widget-' + asPath.join('/');
                        case 'dezem' :
                        case 'resource' :
                            return 'shared-' + sPath;
                    }
                },

                /**
                 * @function oGetFile
                 *
                 * @param {String} sQuery
                 *
                 * @param {String} sGroup
                 *
                 * @return {Promise}
                 */

                'oGetFile' : function(sQuery, sGroup)
                {
                    this.vPostStatus('Getting file …');

                    // Get file from cache if possible…
                    if (typeof sGroup === 'string' && aoFileCache[this.sGetRepPath(sGroup)]) {
                        return new Promise(function(resolve, reject)
                        {
                            resolve({
                                'result' : {
                                    'files' : [aoFileCache[this.sGetRepPath(sGroup)]]
                                }
                            });
                        }.bind(this));
                    }

                    return gapi.client.drive.files.list({
                        'fields'   : 'files(properties,name,id,webViewLink)',
                        'pageSize' : 1000,
                        'q'        : sQuery
                    });
                },

                /**
                 * @function oGetAllFile
                 *
                 * @return {Promise}
                 */

                'oGetAllFile' : function()
                {
                    var sQueryAll = 'properties has {key="dezem-type" and value="home2-translation"}';

                    this.oLoadApi()
                        .then(this.oGetFile.bind(this, sQueryAll, undefined))
                        .then(function(oResponse)
                        {
                            oResponse.result.files.forEach(function(oFile)
                            {
                                aoFileCache[oFile.properties['dezem-path']] = oFile;
                            });
                            this.vPostStatus('');
                        }.bind(this));
                },

                /**
                 * @function oGetSheet
                 *
                 * @param {Object} oResponse
                 *
                 * @return {Promise}
                 */

                'oGetSheet' : function(oResponse)
                {
                    if (oResponse.result.files.length > 0) {
                        this.vPostStatus('Getting spreadsheet…');
                        return gapi.client.sheets.spreadsheets.values.get({
                            'spreadsheetId' : oResponse.result.files[0].id,
                            'range'         : sRange
                        });
                    }
                    else {
                        return new Promise(function(resolve, reject)
                        {
                            reject('File not found.');
                        });
                    }
                },

                /**
                 * @function vSetLangValuesFromSpreadsheet
                 *
                 * @param {String} sGroup
                 *
                 * @param {Array_aas} aasValues
                 */

                'vSetLangValuesFromSpreadsheet' : function(sGroup, aasValues)
                {
                    var oLangDef           = {};
                    var asoLocaleKeyValues = {};

                    for (var iCol = 1, iNbCol = aasValues[0].length; iCol < iNbCol; iCol++) {
                        var sLocale = aasValues[0][iCol];

                        oLangDef[sLocale]           = {};
                        asoLocaleKeyValues[sLocale] = {};

                        for (var iRow = 1, iNbRow = aasValues.length; iRow < iNbRow; iRow++) {
                            var sKey   = aasValues[iRow][0];
                            var sValue = aasValues[iRow][iCol] || '';

                            asoLocaleKeyValues[sLocale][sKey] = sValue;

                            var asPluralRuleMatch = sKey.match(/^(.*)\[(\w+)\]$/);
                            if (asPluralRuleMatch) {
                                sKey = asPluralRuleMatch[1];
                                var sPluralIndex = asPluralRuleMatch[2];

                                oLangDef[sLocale][sKey] = oLangDef[sLocale][sKey] || {};
                                oLangDef[sLocale][sKey][sPluralIndex] = sValue;
                            }
                            else {
                                oLangDef[sLocale][sKey] = sValue;
                            }
                        }
                    }

                    CLang.bMergeProperties = true;
                    var oLang = new CLang();

                    // Update language entries
                    oLang.vCopyLangObserveValues(oLangDef[oLang.sGetLocale()]);
                    oLang.vUpdateLocale();

                    window.postMessage({
                        'class'  : 'CDezemDevTools',
                        'method' : 'vUpdateModule',
                        'param'  : [sGroup, asoLocaleKeyValues]
                    }, '*');
                },

                /**
                 * @function vFetchSpreadSheet
                 *
                 * @param {String} sGroup
                 */

                'vFetchSpreadSheet' : function(sGroup)
                {
                    console.log(sGroup);

                    var sQuery = 'properties has {key="dezem-path" and value="' + this.sGetRepPath(sGroup) + '"}';

                    this.oLoadApi()
                        .then(this.oGetFile.bind(this, sQuery, sGroup))
                        .then(this.oGetSheet.bind(this))
                        .then(function(oResponse)
                        {
                            this.vSetLangValuesFromSpreadsheet(sGroup, oResponse.result.values);
                        }.bind(this))
                        .then(function()
                        {
                            window.postMessage({
                                'class'  : 'CDezemDevTools',
                                'method' : 'vDownloadSuccess',
                                'param'  : [sGroup]
                            }, '*');

                            return new Promise(function(resolve, reject)
                            {
                                resolve();
                            }.bind(this));
                        })
                        .then(this.vPostStatus.bind(this, ''))
                        .catch(function(sError)
                        {
                            console.log(sError);
                        });
                },

                /**
                 * @function vOpenSpreadSheet
                 *
                 * @param {String} sGroup
                 */

                'vOpenSpreadSheet' : function(sGroup)
                {
                    var sQuery = 'properties has {key="dezem-path" and value="' + this.sGetRepPath(sGroup) + '"}';

                    this.oLoadApi()
                        .then(this.oGetFile.bind(this, sQuery, sGroup))
                        .then(function(oResponse)
                        {
                            console.log('files.list', oResponse);

                            if (oResponse.result.files.length > 0) {
                                window.open(oResponse.result.files[0].webViewLink, '_blank');
                            }
                        })
                        .then(this.vPostStatus.bind(this, ''))
                        .catch(function(sError)
                        {
                            console.log(sError);
                        });
                },

                /**
                 * @function oGetMergedValues
                 *
                 * @param {array_aas} aasLocalValues
                 *
                 * @param {array_aas} aasRemoteValues
                 */

                'oGetMergedValues' : function(aasLocalValues, aasRemoteValues)
                {
                    var aoDiff = [];
                    var aasMergedValues = [];

                    var asLocalKey = _.map(aasLocalValues, 0);
                    asLocalKey.shift();

                    var asRemoteKey = _.map(aasRemoteValues, 0);
                    asRemoteKey.shift();

                    var asAllKey = _.union(asRemoteKey, asLocalKey).sort();
                    var asLocale = _.union(aasLocalValues[0].slice(1), aasRemoteValues[0].slice(1)).sort();

                    aasMergedValues.push([''].concat(asLocale));

                    _.forEach(asAllKey, function(sKey)
                    {
                        var asLocalValues  = _.find(aasLocalValues, {0 : sKey});
                        var asRemoteValues = _.find(aasRemoteValues, {0 : sKey});

                        var asRow = [sKey];

                        _.forEach(asLocale, function(sLocale)
                        {
                            var sRemoteValue = '';
                            if (asRemoteValues) {
                                var iRemoteIndex = _.indexOf(aasRemoteValues[0], sLocale);
                                sRemoteValue = asRemoteValues[iRemoteIndex] || '';
                            }

                            var sLocalValue = '';
                            if (asLocalValues) {
                                var iLocalIndex = _.indexOf(aasLocalValues[0], sLocale);
                                sLocalValue = asLocalValues[iLocalIndex] || '';
                            }
                            else {
                                sLocalValue = sRemoteValue;
                            }

                            if (sRemoteValue !== sLocalValue) {
                                aoDiff.push({
                                    'sKey'         : sKey,
                                    'sLocale'      : sLocale,
                                    'sLocalValue'  : sLocalValue,
                                    'sRemoteValue' : sRemoteValue
                                })
                            }

                            asRow.push(sLocalValue);
                        });

                        aasMergedValues.push(asRow);
                    });

                    return {
                        'aoDiff'          : aoDiff,
                        'aasMergedValues' : aasMergedValues
                    }
                },

                /**
                 * @function vCheckLocalRemoteDiff
                 *
                 * @param {array_aas} aasValues
                 */

                'vCheckLocalRemoteDiff' : function(sGroup, aasValues)
                {
                    _.forEach(aasValues, function(asValues, iRow)
                    {
                        if (iRow > 0) {
                            _.forEach(asValues, function(sValue, iCol)
                            {
                                if (iCol > 0) {
                                    asValues[iCol] = JSON.parse(sValue);
                                }
                            });
                        }
                    });

                    var sQuery = 'properties has {key="dezem-path" and value="' + this.sGetRepPath(sGroup) + '"}';
                    var fileId;

                    this.oLoadApi()
                        .then(this.oGetFile.bind(this, sQuery, sGroup))
                        .then(function(oResponse)
                        {
                            if (oResponse.result.files.length > 0) {
                                fileId = oResponse.result.files[0].id;
                            }
                            return this.oGetSheet(oResponse);
                        }.bind(this))
                        .then(function(oResponse)
                        {
                            var oMergedValue = this.oGetMergedValues(aasValues, oResponse.result.values);

                            window.postMessage({
                                'class'  : 'CDezemDevTools',
                                'method' : 'vConfirmUploadDiff',
                                'param'  : [sGroup, oMergedValue]
                            }, '*');

                            return new Promise(function(resolve, reject)
                            {
                                resolve();
                            }.bind(this));
                        }.bind(this))
                        .then(this.vPostStatus.bind(this, ''))
                        .catch(function(sError)
                        {
                            console.log(sError);
                        });
                },

                /**
                 * @function vUploadSpreadSheet
                 *
                 * @param {array_aas} aasValues
                 */

                'vUploadSpreadSheet' : function(sGroup, aasValues)
                {
                    this.vPostStatus('Uploading to spreadsheet…');

                    this.vSetLangValuesFromSpreadsheet(sGroup, aasValues);

                    var sQuery = 'properties has {key="dezem-path" and value="' + this.sGetRepPath(sGroup) + '"}';

                    this.oLoadApi()
                        .then(this.oGetFile.bind(this, sQuery, sGroup))
                        .then(function(oResponse)
                        {
                            this.vPostStatus('Uploading spreadsheet…');
                            return gapi.client.sheets.spreadsheets.values.update({
                                'spreadsheetId'    : oResponse.result.files[0].id,
                                'range'            : sRange,
                                'valueInputOption' : 'RAW',
                                'values'           : aasValues
                            });
                        }.bind(this))
                        .then(function()
                        {
                            window.postMessage({
                                'class'  : 'CDezemDevTools',
                                'method' : 'vUploadSuccess',
                                'param'  : [sGroup]
                            }, '*');

                            return new Promise(function(resolve, reject)
                            {
                                resolve();
                            }.bind(this));
                        })
                        .then(this.vPostStatus.bind(this, ''))
                        .catch(function(sError)
                        {
                            console.log(sError);
                        });
                }
            },
            {

            }
        );

        window.CInjectController.vLoadModule();
        window.CInjectController.oGetAllFile();
    });
}