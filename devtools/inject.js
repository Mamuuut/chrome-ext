console.log('INJECTED');

var CLIENT_ID = '318499840811-vlrbc90ecdol26086v5h99vq7i48n3tb.apps.googleusercontent.com';
var SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
];
var DOC_ID = '1fm9d7riCPXGQ2GnbcFvxNtzs-TC0pm9kfkJYFv4MF-Q';

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

function setSelectedElement(el) {
    console.log('setSelectedElement', el.innerHTML);
    window.postMessage({
        'source'   : 'dezem-devtools-extension',
        'selected' : el.innerHTML
    }, '*');
}

var sGetRepPath = function(sPath)
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
            return 'widget-' + sPath.split('/').shift();
        case 'dezem' :
        case 'resource' :
            return 'shared-' + sPath;
    }
}

var vFetchSpreadSheet = function(sPath)
{
    console.log(sPath);

    var sQuery = typeof sPath === 'string' ?
        'properties has {key="dezem-path" and value="' + sGetRepPath(sPath) + '"}' :
        'properties has {key="dezem-type" and value="home2-translation"}';

    require(['https://apis.google.com/js/api.js'], function()
    {
        var getSheet = function()
        {
            gapi.client.drive.files.list({
                'fields'   : 'files(properties,name,id)',
                'pageSize' : 1000,
                'q'        : sQuery
            })
                .then(
                    function(oResponse)
                    {
                        console.log('files.list', oResponse);

                        if (oResponse.result.files.length > 0) {

                            gapi.client.load('sheets', 'v4', function()
                            {
                                gapi.client.sheets.spreadsheets.values.get({
                                    'spreadsheetId' : oResponse.result.files[0].id,
                                    'range'         : 'Sheet1!A1:E1000'
                                })
                                    .then(
                                        function(oResponse)
                                        {
                                            console.log('sheets.get', oResponse);

                                            var assValues = oResponse.result.values;
                                            var oLangDef = {};

                                            for (var iCol = 1, iNbCol = assValues[0].length; iCol < iNbCol; iCol++) {
                                                var sLocale = assValues[0][iCol];

                                                oLangDef[sLocale] = {};

                                                for (var iRow = 1, iNbRow = assValues.length; iRow < iNbRow; iRow++) {
                                                    var sKey   = assValues[iRow][0];
                                                    var sValue = assValues[iRow][iCol];

                                                    _.set(oLangDef[sLocale], sKey, sValue);
                                                }
                                            }

                                            require(['dezem/language/CLang'], function(CLang)
                                            {
                                                var oLang = new CLang();
                                                oLang.vCopyLangObserveValues(oLangDef[oLang.sGetLocale()]);
                                            });
                                        },
                                        function(oResponse) {
                                            console.log(oResponse.result.error.message);
                                        }
                                    )
                            });
                        }
                    },
                    function(oResponse) {
                        console.log(oResponse.result.error.message);
                    }
                );
        };

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
                gapi.client.load('drive', 'v3', getSheet);
            });
        });
    });
};

var vOpenSpreadSheet = function(sPath)
{
    var sQuery = 'properties has {key="dezem-path" and value="' + sGetRepPath(sPath) + '"}';

    require(['https://apis.google.com/js/api.js'], function()
    {
        var getSheet = function()
        {
            gapi.client.drive.files.list({
                'fields'   : 'files/webViewLink',
                'pageSize' : 1000,
                'q'        : sQuery
            })
                .then(
                    function(oResponse)
                    {
                        console.log('files.list', oResponse);

                        if (oResponse.result.files.length > 0) {
                            window.open(oResponse.result.files[0].webViewLink, '_blank');
                        }
                    },
                    function(oResponse) {
                        console.log(oResponse.result.error.message);
                    }
                );
        };

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
                gapi.client.load('drive', 'v3', getSheet);
            });
        });
    });
};

var vUploadSpreadSheet = function(aasValues)
{
    require(['https://apis.google.com/js/api.js'], function()
    {
        var updateSheet = function()
        {
            gapi.client.sheets.spreadsheets.values.update({
                'spreadsheetId'    : DOC_ID,
                'range'            : 'Sheet1!A1:E1000',
                'valueInputOption' : 'RAW',
                'values'           : aasValues
            }).then(function(oResponse) {
                console.log('update', oResponse);
            }, function(oResponse) {
                console.log(oResponse.result.error.message);
            });
        }

        var getSheet = function()
        {
            gapi.client.sheets.spreadsheets.values.get({
                'spreadsheetId' : DOC_ID,
                'range'         : 'Sheet1!A1:E1000'
            }).then(function(oResponse) {
                console.log('get', oResponse);

                var aasExistingValue = oResponse.result.values;
                if (aasExistingValue.length > aasValues.length) {
                    var iNbColumn = aasValues[0].length;
                    var iNbMissingRow = aasExistingValue.length - aasValues.length;
                    for (var i = 0; i < iNbMissingRow; i++) {
                        aasValues.push(_.fill(new Array(iNbColumn), ''));
                    }
                }

                updateSheet(aasValues);
            }, function(oResponse) {
                console.log(oResponse.result.error.message);
            });
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
                gapi.client.load('sheets', 'v4', getSheet);
            });
        });
    });
}