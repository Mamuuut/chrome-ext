console.log("TEST", dezem.model.CUserRpc.oGetCurrentUser());

var extensionID = 'mclhkfjceicnebhelmabijdakhgkcdhn';

chrome.runtime.sendMessage(extensionID, {dezem: true}, function(response) {
    console.log(response);
});