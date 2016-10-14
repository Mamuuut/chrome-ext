require([
    'dezem/language/CLang',
    'can/construct'
], function(CLang)
{

    window.CInjectPopup = can.Construct.extend(
        {

            /**
             * @function vPostStatus
             *
             * @param {String}
             */

            'vPostStatus' : function(sStatus)
            {
                console.log(sStatus);
                window.postMessage({
                    'class'  : 'CDezemPopup',
                    'method' : 'vSetStatus',
                    'param'  : [sStatus]
                }, '*');
            }
        },
        {

        }
    );
});