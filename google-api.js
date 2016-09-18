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
            'range'            : 'Sheet1!A1:E3',
            'valueInputOption' : 'RAW',
            'values'           : [
                ['Key', 'en_GB', 'de_DE', 'es_ES', 'ru_RU'],
                ['sKeyTitle', 'Title in en_GB', 'Title in de_DE', 'Title in es_ES', 'Title in ru_RU'],
                ['sKeyText', 'Text in en_GB', 'Text in de_DE', 'Text in es_ES', 'Text in ru_RU']
            ]
        }).then(function(response) {
            console.log('update', response);
        }, function(response) {
            console.log(response.result.error.message);
        });
    }
});
