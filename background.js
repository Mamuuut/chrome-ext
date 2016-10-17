

var aoConnection = {};

var oPanel = {

    /**
     * @function vInitTabConnection
     *
     * @description Initialize the tab connection to the dev tool panel
     *
     * @param {Object} oPort
     *
     * @param {Integer} iTab
     */

    'vInitTab' : function(oPort, iTabId) {

        // Keep the relation between port and tab id
        aoConnection[iTabId] = oPort;

        oPort.postMessage({
            'class'  : 'CDezemDevTools',
            'method' : 'vInitComplete',
            'param'  : null
        });

        return;
    },


    /**
     * @function vInjectScript
     *
     * @description Inject a script in the current tab
     *
     * @param {Object} oPort
     *
     * @param {Integer} iTab
     *
     * @param {String} sScript
     */

    'vInjectScript' : function(oPort, iTabId, sScript)
    {
        chrome.tabs.executeScript(iTabId, {'file' : sScript}, function()
        {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            }
            else {
                console.log('content script exectued.');
            }
        });
    }
}

var onConnect = function(oDestObject)
{
    return function(oPort)
    {
        var extensionListener = function(oMsg)
        {
            console.log(oMsg);

            var sMethod = oMsg.method;
            var amParam = oMsg.param;

            amParam.unshift(oPort);

            if (oDestObject[sMethod]) {
                oDestObject[sMethod].apply(oPanel, amParam);
            }
        };

        oPort.onMessage.addListener(extensionListener);

        oPort.onDisconnect.addListener(function(oPort)
        {
            console.log('onDisconnect.');

            oPort.onMessage.removeListener(extensionListener);

            var aiTabs = Object.keys(aoConnection);

            for (var i = 0, len = aiTabs.length; i < len; i++) {

                var iTabId = aiTabs[i]

                if (aoConnection[iTabId] == oPort) {
                    delete aoConnection[iTabId]
                    break;
                }
            }
        });
    };
}

var aoOnPortConnect = {

    /**
     * @function dev_panel
     *
     * @description dev_panel connected
     *
     * @param {Object} oPort
     */

    'dev_panel' : onConnect(oPanel)

}


// Extension installed

chrome.runtime.onInstalled.addListener(function()
{
    // Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function()
    {
        // With a new rule ...
        chrome.declarativeContent.onPageChanged.addRules([{
            // That fires when a page's URL contains a 'home2' ...
            'conditions' : [
                new chrome.declarativeContent.PageStateMatcher({
                    'pageUrl' : {
                        'urlContains' : 'dezem'
                    },
                }),
                new chrome.declarativeContent.PageStateMatcher({
                    'pageUrl' : {
                        'urlContains' : 'localhost'
                    },
                })
            ],
            // And shows the extension's page action.
            'actions' : [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});


// Connect messages

chrome.runtime.onConnect.addListener(function(oPort)
{
    console.log('onConnect', oPort);

    if (aoOnPortConnect[oPort.name]) {
        aoOnPortConnect[oPort.name](oPort);
    }
});


// Tab changed

chrome.tabs.onUpdated.addListener(function(iTabId, oChangeInfo, oTab){

    if (oChangeInfo.status === 'complete' && aoConnection[iTabId]) {

        console.log(iTabId, oChangeInfo, oTab);

        aoConnection[iTabId].postMessage({
            'class'  : 'CDezemDevTools',
            'method' : 'vRefreshPage',
            'param'  : null
        });
    }
});


// Receive message from content script and relay to the devTools page for the
// current tab

chrome.runtime.onMessage.addListener(function(oRequest, oSender, sendResponse)
{
    // Messages from content scripts should have sender.tab set
    if (oSender.tab) {
        var iTabId = oSender.tab.id;

        if (iTabId in aoConnection) {
            
            console.log('runtime onMessage', iTabId, oRequest);

            aoConnection[iTabId].postMessage(oRequest);
        }
        else {
            console.log("Tab not found in connection list.");
        }
    }
    else {
        console.log("sender.tab not defined.");
    }

    return true;
});