console.log('POPUP');

function getCurrentTabUrl(callback)
{
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs)
    {
        var tab = tabs[0];
        console.log(tab);

        callback(tab.url);
    });
}

function getUser(url, callback, errorCallback)
{
    var asMatch = url.match(/(^https?:\/\/[^/]+)\/.*/)

    if (asMatch.length) {
        var searchUrl = asMatch[1] + '/services/tree/json.php';

        console.log(searchUrl);

        var x = new XMLHttpRequest();
        x.open('POST', searchUrl);
        x.responseType = 'json';
        x.onload = function(oEvent)
        {
            callback(oEvent.currentTarget.response);
        };
        x.onerror = function()
        {
            errorCallback('Network error.');
        };
        x.send(JSON.stringify({
            'class'     : 'User',
            'method'    : 'oGetUser',
            'parameter' : [null, 63],
        }));
    }
}

function renderStatus(statusText)
{
    document.getElementById('result').innerHTML = '<pre>' + statusText + '</pre>';
}

document.addEventListener('DOMContentLoaded', function()
{
    getCurrentTabUrl(function(url)
    {
        getUser(url,
            function(oUser)
            {
                renderStatus(JSON.stringify(oUser, null, '    '));
            },
            function(errorMessage)
            {
                renderStatus('Cannot display image. ' + errorMessage);
            }
        );
    });
});

var oPort = chrome.runtime.connect({
    'name' : 'popup'
});
oPort.postMessage('Hi BackGround');
oPort.onMessage.addListener(function(sMsg) {
    console.log('message recieved', sMsg);
});