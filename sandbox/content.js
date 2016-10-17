var vInjectScript = function()
{
    var elLoading = document.getElementById('loader_container');
    var elScript  = document.getElementById('sandbox_inject');

    if (elScript !== null) {
        return;
    }

    if (elLoading !== null && elLoading.style.display !== 'none') {
        setTimeout(vInjectScript, 100)
    }
    else {
        elFirstScript = document.getElementsByTagName('script')[0];

        elScriptDb = document.createElement('script');
        elScriptDb.type = 'text/javascript';
        elScriptDb.src  = chrome.extension.getURL('sandbox/jDBSCAN.js');
        elFirstScript.parentNode.insertBefore(elScriptDb, elFirstScript);

        elScript = document.createElement('script');
        elScript.id   = 'sandbox_inject';
        elScript.type = 'text/javascript';
        elScript.src  = chrome.extension.getURL('sandbox/inject.js');
        elFirstScript.parentNode.insertBefore(elScript, elFirstScript);
    }
}

vInjectScript();