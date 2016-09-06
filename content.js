window.addEventListener('message', function(oEvent)
{
    console.log(oEvent);

    // Only accept messages from the same frame
    if (oEvent.source !== window) {
        return;
    }

    var message = oEvent.data;

    // Only accept messages that we know are ours
    if (typeof message !== 'object' || message === null ||
        !message.source === 'dezem-devtools-extension') {
        return;
    }

    chrome.runtime.sendMessage(message);
});