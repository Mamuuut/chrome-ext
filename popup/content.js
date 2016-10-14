console.log('Injecting devtools script…');

var vInjectScript = function()
{
    var elLoading = document.getElementById('loader_container');
    var elScript  = document.getElementById('popup_inject');

    if (elScript !== null) {
        return;
    }

    if (elLoading !== null && elLoading.style.display !== 'none') {
        setTimeout(vInjectScript, 100)
    }
    else {
        console.log('Injected devtools script.');

        elScript = document.createElement('script');

        elScript.id   = 'popup_inject';
        elScript.type = 'text/javascript';
        elScript.src  = chrome.extension.getURL('popup/inject.js');
        elFirstScript = document.getElementsByTagName('script')[0];
        elFirstScript.parentNode.insertBefore(elScript, elFirstScript);
    }
}

vInjectScript();