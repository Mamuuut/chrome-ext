var elScript = document.getElementById('devtools_inject');
if (elScript !== null) {
    elScript.parentNode.removeChild(elScript);
}
elScript = document.createElement('script');

elScript.id   = 'devtools_inject';
elScript.type = 'text/javascript';
elScript.src  = chrome.extension.getURL('devtools/inject.js');
elFirstScript = document.getElementsByTagName('script')[0];
elFirstScript.parentNode.insertBefore(elScript, elFirstScript);