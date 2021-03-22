//=============================================================================
// JayaKun_Notifier.js
//=============================================================================
/*:
 * @plugindesc JayaKun_Notifier
 * @author JayaKun
 * 
 * @param DisplayTime
 * @desc Elapsed time to show the popup message.
 * @default 1800
 *
 * @param TransitionTime
 * @desc Elapsed time to wait for the next popup message.
 * @default 600
 *
 * @help
 * Use: jayak_notify( "message" )
 */

/**
 * @description JayaK Modules
 * @type JayaK
 */
var JayaK = JayaK || {};
/**
 * @type JayaK_Notifier
 */
JayaK.Notifier = new JayaK_Notifier();
/**
 * @description Independent notification system to show up some messages in the scene
 */
function JayaK_Notifier() {

    var _notifier = {
        /**
         * @type Array
         */
        'messages': [],
        'parameters':{
            //set here all parameters
        },
        'size': {
            'width': 800,
            'height':80
        },
        'position': {
            'x': 10,
            'y': 10
        },
    };
    /**
     * @returns Window_Base
     */
    function create_message( message ) {

        var msgBox = new Window_Base(
                _notifier.position.x, _notifier.position.y,
                //window.screen.width / 2,
                _notifier.size.width - (_notifier.position.x * 2 ),
                _notifier.size.height);

        SceneManager._scene.addChild( msgBox );

        msgBox.setBackgroundType( 1 );
        msgBox.drawText( msgBox.convertEscapeCharacters( message ) , 0, 0, window.screen.width, "left");

        return msgBox;
    };
    /**
     * @param {String} param
     * @param {String} value
     * @returns {String}
     */
    this.importParameter = function( param , value  ){
        if( !_notifier.parameters.hasOwnProperty( param )){
            _notifier.parameters[ param ] =  JayaK_Notifier.Parameters( param, value);
        }
        return _notifier.parameters.hasOwnProperty(param) ? _notifier.parameters[param] : value;
    },
    /**
     * @returns JayaK_Notifier
     */
    this.dispatch = function () {

        if ( _notifier.messages.length > 0 ) {

            var _self = this;
            //retrieve the view to draw a text on it
            var _messageBox = create_message( _notifier.messages[ 0 ] );
            
            window.setTimeout( function(){
                //shutdown the view
                _messageBox.close();
                //remove message
                _notifier.messages.splice(0, 1);
                //wait trainsition
                window.setTimeout( function(){
                    if( _notifier.messages.length > 0 ){
                        _self.dispatch();
                    }
                } , _self.importParameter('TransitionTime',2500) );

            } , _self.importParameter('TransitionTime',800) );
        }
        return this;
    };
    /**
     * @param String message
     * @returns JayaK_Notifier
     */
    this.add = function (message) {

        _notifier.messages.push(message);

        return _notifier.messages.length > 1 ? this : this.dispatch();
    };

    return this;
}

/**
 * @description Access to plugin|module's parameters
 * @param {String} input 
 * @param {String|Number|Boolean} value
 * @returns {String}
 */
JayaK_Notifier.Parameters = function( input , value ){

    var parameters = $plugins.filter(function (p) {

        return p.description.contains('JayaKun_Notifier');

    })[0].parameters;

    return typeof parameters === 'object' && parameters.hasOwnProperty(input) ?
        parameters[input] :
        typeof value !== 'undefined' ? value : '';
};

/**
 * @param {String} message 
 * @returns {JayaK_Notifier}
 */
function jayak_notify( message ){
    return JayaK.Notifier.add( message );
}



