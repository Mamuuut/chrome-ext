console.log('INJECTED');

var asModule = _.keys(requirejs.s.contexts._.defined);
var asLanguageModule = _.filter(asModule, function(sModule)
{
    return sModule.match(/.*\/language\/.*\.json/g) !== null;
});

var aoModule = _.map(asLanguageModule, function(sModule)
{
    return {
        'sModule' : sModule,
        'oModule' : JSON.parse(require(sModule))
    }
});

window.postMessage({
    'source'   : 'dezem-devtools-extension',
    'aoModule' : aoModule
}, '*');

function setSelectedElement(el) {
    console.log('setSelectedElement', el.innerHTML);
    window.postMessage({
        'source'   : 'dezem-devtools-extension',
        'selected' : el.innerHTML
    }, '*');
}
