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
                gapi.client.load('sheets', 'v4', listMajors);
            });
        });

        function listMajors()
        {
            gapi.client.sheets.spreadsheets.values.update({
                'spreadsheetId'    : DOC_ID,
                'range'            : 'Sheet1!A1:E' + aasValues.length,
                'valueInputOption' : 'RAW',
                'values'           : aasValues
            }).then(function(response) {
                console.log('update', response);
            }, function(response) {
                console.log(response.result.error.message);
            });
        }
    });
}