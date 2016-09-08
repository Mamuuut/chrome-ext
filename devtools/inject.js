console.log('INJECTED');

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

var vUploadSpreadSheet = function(aasValues)
{
    require(['https://apis.google.com/js/api.js'], function()
    {
        var CLIENT_ID = '318499840811-vlrbc90ecdol26086v5h99vq7i48n3tb.apps.googleusercontent.com';
        var SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
        var DOC_ID = '1fm9d7riCPXGQ2GnbcFvxNtzs-TC0pm9kfkJYFv4MF-Q';

        var updateSheet = function()
        {
            gapi.client.sheets.spreadsheets.values.update({
                'spreadsheetId'    : DOC_ID,
                'range'            : 'Sheet1!A1:E1000',
                'valueInputOption' : 'RAW',
                'values'           : aasValues
            }).then(function(response) {
                console.log('update', response);
            }, function(response) {
                console.log(response.result.error.message);
            });
        }

        var getSheet = function()
        {
            gapi.client.sheets.spreadsheets.values.get({
                'spreadsheetId' : DOC_ID,
                'range'         : 'Sheet1!A1:E1000'
            }).then(function(response) {
                console.log('get', response);

                var aasExistingValue = response.result.values;
                if (aasExistingValue.length > aasValues.length) {
                    var iNbColumn = aasValues[0].length;
                    var iNbMissingRow = aasExistingValue.length - aasValues.length;
                    for (var i = 0; i < iNbMissingRow; i++) {
                        aasValues.push(_.fill(new Array(iNbColumn), ''));
                    }
                }

                updateSheet(aasValues);
            }, function(response) {
                console.log(response.result.error.message);
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