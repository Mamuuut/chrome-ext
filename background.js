
chrome.runtime.onInstalled.addListener(function() {
    // Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        // With a new rule ...
        chrome.declarativeContent.onPageChanged.addRules([{
            // That fires when a page's URL contains a 'home2' ...
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {
                        urlContains: 'dezem'
                    },
                }),
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {
                        urlContains: 'localhost'
                    },
                })
            ],
            // And shows the extension's page action.
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

var connections = {};

// popup and devtools messages
chrome.runtime.onConnect.addListener(
    function(oPort)
    {
        console.log('onConnect', oPort);

        if (oPort.name === 'popup') {
            oPort.onMessage.addListener(function(sMsg) {
                console.log('message recieved', sMsg);
                oPort.postMessage('Hi Popup.js');
            });

            chrome.tabs.executeScript(
                tab.id,
                {
                    'file' : 'popup/content.js'
                },
                function(aoResult)
                {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                    }
                    else {
                        console.log('content script exectued.');
                    }
                }
            );
        }

        if (oPort.name === 'dev_panel') {

            var extensionListener = function(oMsg)
            {
                if (oMsg.init) {
                    connections[oMsg.tabId] = oPort;
                    oPort.postMessage({
                        'class'  : 'CDezemDevTools',
                        'method' : 'vInitComplete',
                        'param'  : null
                    });
                    return;
                }

                if (oMsg.scriptToInject) {
                    chrome.tabs.executeScript(oMsg.tabId, { 'file': oMsg.scriptToInject }, function()
                    {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError.message);
                        }
                        else {
                            console.log('content script exectued.');
                        }
                    });
                }

                if (oMsg.log) {
                    console.log(oMsg.log);
                }
            }

            oPort.onMessage.addListener(extensionListener);

            oPort.onDisconnect.addListener(function(oPort)
            {
                console.log('onDisconnect.');

                oPort.onMessage.removeListener(extensionListener);

                var tabs = Object.keys(connections);
                for (var i=0, len=tabs.length; i < len; i++) {
                  if (connections[tabs[i]] == oPort) {
                    delete connections[tabs[i]]
                    break;
                  }
                }
            });
        }
    }
);
// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    console.log('onMessage', request, sender, sendResponse);

    // Messages from content scripts should have sender.tab set
    if (sender.tab) {
        var tabId = sender.tab.id;
        if (tabId in connections) {
            connections[tabId].postMessage(request);
        } else {
            console.log("Tab not found in connection list.");
        }
    } else {
        console.log("sender.tab not defined.");
    }
    return true;
});