var vInjectScript = function()
{
    var elLoading = document.getElementById('loader_container');
    var elScript  = document.getElementById('devtools_inject');

    if (elScript !== null) {
        return;
    }

    if (elLoading !== null && elLoading.style.display !== 'none') {
        setTimeout(vInjectScript, 100)
    }
    else {
        elScript = document.createElement('script');

        elScript.id   = 'devtools_inject';
        elScript.type = 'text/javascript';
        elScript.src  = chrome.extension.getURL('devtools/inject.js');
        elFirstScript = document.getElementsByTagName('script')[0];
        elFirstScript.parentNode.insertBefore(elScript, elFirstScript);
    }
}

vInjectScript();