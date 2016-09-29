console.log('INJECTED');

require([
    'dezem/language/CLang',
    'can/view/live',
    'https://apis.google.com/js/api.js'
], function(CLang)
{
    var CLIENT_ID = '318499840811-vlrbc90ecdol26086v5h99vq7i48n3tb.apps.googleusercontent.com';
    var SCOPES = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ];

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
                    'source'  : 'dezem-devtools-extension',
                    'sStatus' : sStatus
                }, '*');
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
                var asModule = _.keys(requirejs.s.contexts._.defined);
                var asLanguageModule = _.filter(asModule, function(sModule)
                {
                    return sModule.match(/.*\/language\/.*\.json/g) !== null;
                });

                var aoModule = _.map(asLanguageModule, function(sModule)
                {
                    return {
                        'sModule' : sModule,
                        'oModule' : JSON.parse(require(sModule))
                    }
                });

                window.postMessage({
                    'source'   : 'dezem-devtools-extension',
                    'aoModule' : aoModule
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
                    'source'   : 'dezem-devtools-extension',
                    'selected' : el.innerHTML.trim()
                }, '*');
            },

            /**
             * @function sGetRepPath
             *
             * @param {String} sPath
             *
             * @return {String}
             */

            'sGetRepPath' : function(sPath)
            {
                sPath = sPath.replace('text!', '').replace('.json', '').replace('/language', '');
                var sFirst = sPath.split('/')[0];

                switch(sFirst) {
                    case 'ad' :
                    case 'vis' :
                    case 'dashboard' :
                    case 'report2' :
                        return 'app-' + sPath;
                    case 'widgets' :
                        var asPath = sPath.split('/');
                        asPath.shift()
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
             * @param {String} sPath
             *
             * @return {Promise}
             */

            'oGetFile' : function(sQuery, sPath)
            {
                this.vPostStatus('Getting file …');

                // Get file from cache if possible…
                if (typeof sPath === 'string' && aoFileCache[this.sGetRepPath(sPath)]) {
                    return new Promise(function(resolve, reject)
                    {
                        resolve({
                            'result' : {
                                'files' : [aoFileCache[this.sGetRepPath(sPath)]]
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
                        'range'         : 'Sheet1!A1:E1000'
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
             * @param {Array_aas} aasValues
             */

            'vSetLangValuesFromSpreadsheet' : function(sPath, aasValues)
            {
                console.log('sheets.get', aasValues);
                var oLangDef = {};

                for (var iCol = 1, iNbCol = aasValues[0].length; iCol < iNbCol; iCol++) {
                    var sLocale = aasValues[0][iCol];

                    oLangDef[sLocale] = {};

                    for (var iRow = 1, iNbRow = aasValues.length; iRow < iNbRow; iRow++) {
                        var sKey   = aasValues[iRow][0];
                        var sValue = aasValues[iRow][iCol];

                        _.set(oLangDef[sLocale], sKey, sValue);
                    }
                }

                var oLang = new CLang();

                // Hook live text method to blink updated elements
                var text = can.view.live.text;
                can.view.live.text = function (el, compute, parentNode, nodeList) {
                    text.call(can.view.live, el, compute, parentNode, nodeList);
                    compute.computeInstance.bind('change', function(ev, newVal, oldVal) {
                        $(parentNode).fadeOut(function()
                        {
                            $(parentNode).fadeIn();
                        });
                    });
                };

                // Update language entries
                oLang.vCopyLangObserveValues(oLangDef[oLang.sGetLocale()]);

                // Restore live text method
                can.view.live.text = text

                window.postMessage({
                    'source'   : 'dezem-devtools-extension',
                    'oLangDef' : oLangDef,
                    'sPath'    : sPath
                }, '*');
            },

            /**
             * @function vFetchSpreadSheet
             *
             * @param {String} sPath
             */

            'vFetchSpreadSheet' : function(sPath)
            {
                console.log(sPath);

                var sQuery = 'properties has {key="dezem-path" and value="' + this.sGetRepPath(sPath) + '"}';

                this.oLoadApi()
                    .then(this.oGetFile.bind(this, sQuery, sPath))
                    .then(this.oGetSheet.bind(this))
                    .then(function(oResponse)
                    {
                        this.vSetLangValuesFromSpreadsheet(sPath, oResponse.result.values);
                    }.bind(this))
                    .then(this.vPostStatus.bind(this, ''))
                    .catch(function(sError)
                    {
                        console.log(sError);
                    });
            },

            /**
             * @function vOpenSpreadSheet
             *
             * @param {String} sPath
             */

            'vOpenSpreadSheet' : function(sPath)
            {
                var sQuery = 'properties has {key="dezem-path" and value="' + this.sGetRepPath(sPath) + '"}';

                this.oLoadApi()
                    .then(this.oGetFile.bind(this, sQuery, sPath))
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
             * @function oGetValuesDiff
             *
             * @param {array_aas} aasLocalValues
             *
             * @param {array_aas} aasRemoteValues
             */

            'oGetValuesDiff' : function(aasLocalValues, aasRemoteValues)
            {
                var asLocalKey = _.map(aasLocalValues, 0);
                asLocalKey.shift();

                var asRemoteKey = _.map(aasRemoteValues, 0);
                asRemoteKey.shift();

                var asAllKey = _.union(asRemoteKey, asLocalKey).sort();
                var asLocale = _.union(aasLocalValues[0].slice(1), aasRemoteValues[0].slice(1)).sort();

                _.forEach(asAllKey, function(sKey)
                {
                    var asLocalValues  = _.find(aasLocalValues, {0 : sKey});
                    var asRemoteValues = _.find(aasRemoteValues, {0 : sKey});

                    _.forEach(asLocale, function(sLocale)
                    {
                        console.log(sKey, sLocale);

                        var iLocalIndex = _.indexOf(aasLocalValues[0], sLocale);
                        var sLocalValue = asLocalValues[iLocalIndex];

                        var iRemoteIndex = _.indexOf(aasRemoteValues[0], sLocale);
                        var sRemoteValue = asRemoteValues[iRemoteIndex];

                        console.log(sKey, sLocale, iLocalIndex, sLocalValue, iRemoteIndex, sRemoteValue);
                    });
                });
            },

            /**
             * @function vUploadSpreadSheet
             *
             * @param {array_aas} aasValues
             */

            'vUploadSpreadSheet' : function(sPath, aasValues)
            {
                console.log(sPath);

                var sQuery = 'properties has {key="dezem-path" and value="' + this.sGetRepPath(sPath) + '"}';
                var fileId;

                this.oLoadApi()
                    .then(this.oGetFile.bind(this, sQuery, sPath))
                    .then(function(oResponse)
                    {
                        if (oResponse.result.files.length > 0) {
                            fileId = oResponse.result.files[0].id;
                        }
                        return this.oGetSheet(oResponse);
                    }.bind(this))
                    .then(function(oResponse)
                    {

                        var aasExistingValue = oResponse.result.values;
                        if (aasExistingValue.length > aasValues.length) {
                            var iNbColumn = aasValues[0].length;
                            var iNbMissingRow = aasExistingValue.length - aasValues.length;
                            for (var i = 0; i < iNbMissingRow; i++) {
                                aasValues.push(_.fill(new Array(iNbColumn), ''));
                            }
                        }

                        this.vSetLangValuesFromSpreadsheet(sPath, aasValues);

                        this.oGetValuesDiff(aasValues, oResponse.result.values);
                        return;

                        this.vPostStatus('Uploading spreadsheet…');
                        return gapi.client.sheets.spreadsheets.values.update({
                            'spreadsheetId'    : fileId,
                            'range'            : 'Sheet1!A1:E1000',
                            'valueInputOption' : 'RAW',
                            'values'           : aasValues
                        })
                    }.bind(this))
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