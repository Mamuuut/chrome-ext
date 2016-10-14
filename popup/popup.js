function getCurrentTabUrl(callback)
{
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs)
    {

        var tab = tabs[0];

        var oPopup = {

            /**
             * @function vInitComplete
             *
             * @description Extension has been initialized
             */

            'vInitComplete' : function()
            {
                oPort.postMessage({
                    'class'  : 'CDezemPopup',
                    'method' : 'vInjectScript',
                    'param'  : [
                        tab.id,
                        'popup/content.js'
                    ]
                });
            }
        };

        oPort.onMessage.addListener(function(oMsg)
        {
            var sMethod = oMsg.method;
            var amParam = oMsg.param;

            if (oPopup[sMethod]) {

                try {
                    oPopup[sMethod].apply(oPopup, amParam);
                }
                catch (oError) {
                    chrome.devtools.inspectedWindow.eval("console.log(" + JSON.stringify(oError.stack) + ")");
                }
            }
        });

        oPort.postMessage({
            'class'  : 'CDezemPopup',
            'method' : 'vInitTab',
            'param'  : [tab.id]
        });

        callback(tab.url);
    });
}

document.addEventListener('DOMContentLoaded', function()
{
    getCurrentTabUrl(function(url)
    {
        console.log(url);
    });
});

var oPort = chrome.runtime.connect({
    'name' : 'popup'
});