var elScript = document.createElement('script');
elScript.type = 'text/javascript';
elScript.src = chrome.extension.getURL('popup/inject.js');
elFirstScript = document.getElementsByTagName('script')[0];
elFirstScript.parentNode.insertBefore(elScript, elFirstScript);