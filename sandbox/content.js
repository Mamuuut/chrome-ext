var vAppendScript = function(sScript, sId)
{
        var elScript      = document.createElement('script');
        var elFirstScript = document.getElementsByTagName('script')[0];

        elScript.id   = sId;
        elScript.type = 'text/javascript';
        elScript.src  = chrome.extension.getURL(sScript);

        if (elFirstScript) {
            elFirstScript.parentNode.insertBefore(elScript, elFirstScript);
        }
}

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
        vAppendScript('sandbox/inject.js', 'sandbox_inject');
        vAppendScript('sandbox/jDBSCAN.js');
        vAppendScript('sandbox/dbscan.js');
    }
}

vInjectScript();