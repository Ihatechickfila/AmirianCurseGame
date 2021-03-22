//=============================================================================
// JayaKun_Game_Setup.js
//=============================================================================
/*:
 * @plugindesc JayaKun Mods
 * @author JayaKun
 * 
 * @param ArouseUpText
 * @desc Which text to show when the character arouses up
 * @default feels excitingly aroused!!
 *
 * @param ArouseRessistText
 * @desc Which text to show when the character ressist arousal
 * @default ressist arousal!!
 * 
 * @param ChastenUpText
 * @desc Which text to show when the character rejects arousal
 * @default rejects arousal!!
 *
 * @param ChastenRessistText
 * @desc Which text to show when the character is unable to ressit arousal
 * @default feels ashamed!!
 * 
 * @param EquipEventID
 * @desc Run this event every time any gear is equipped
 * @default 0
 * 
 * @param UnEquipEventID
 * @desc Run this event every time any gear is un-equipped
 * @default 0
 * 
 * @param EquipExportID
 * @desc Global Variable used to export the Item which is being attacked, or removed from the gear
 * @default 0
 *
 * @help
 * jayak_actor_lust( actor_id , [ percent:boolean ] ) 
 */

/**
 * @description JayaK Modules
 * @type JayaK
 */
var JayaK = JayaK || {};
/**
 * @type Number Max limit of lust score bar
 */
JayaK.LUST_RANGE = 100;
/**
* @description Access to plugin|module's parameters
* @param {String} input 
* @param {String|Number|Boolean} value
* @returns {String}
*/
JayaK.Parameters = function (input, value) {
    var parameters = $plugins.filter(function (p) {
        return p.description.contains('JayaKun Mods');
    })[0].parameters;
    return typeof parameters === 'object' && parameters.hasOwnProperty(input) ?
        parameters[input] :
        typeof value !== 'undefined' ? value : '';
};
/**
 * Setup the mod variables here
 * @var {JayaK.Mods}
 */
JayaK.Mods = {
    'cache': {
        'equipEventId':0,
        'unequipEventId':0,
        'equipExportVarID':0
    },
    /**
     * @returns {Number}
     */
    'getExportVarID': function(){
        if( this.cache.equipExportVarID === 0 ){
            this.cache.equipExportVarID = parseInt( JayaK.Parameters('EquipExportID',0) );
        }
        return this.cache.equipExportVarID;
    },
    /**
     * @returns {Number}
     */
    'getEquipEventId': function(){
        if( this.cache.equipEventId === 0 ){
            this.cache.equipEventId = parseInt( JayaK.Parameters('EquipEventID',0) );
        }
        return !Number.isNaN( this.cache.equipEventId ) ? this.cache.equipEventId : 0;
    },
    /**
     * @returns {Number}
     */
    'getUnEquipEventId': function(){
        if( this.cache.unequipEventId === 0 ){
            this.cache.unequipEventId = parseInt( JayaK.Parameters('UnEquipEventID',0) );
        }
        return !Number.isNaN( this.cache.unequipEventId ) ? this.cache.unequipEventId : 0;
    },
    /**
     * @param {Number} value 
     */
    'exportEquipValue': function( value ){

        if( value > 0 ){
        
            var var_id = this.getExportVarID();

            if( var_id  ){
                $gameVariables.setValue( var_id , value );
            }
        }
    },
    /**
     * @param {Number} value 
     */
    'runEquipEvent': function( item_id , actor_id ){
    
        this.exportEquipValue( item_id );
        
        var event_id = this.getEquipEventId();

        if( event_id ){
            
            $gameTemp.reserveCommonEvent( parseInt( event_id ) );
        }
    }
};
/**
 * @returns {Number}
 */
Game_Party.count = function(){
    return $gameParty.members().length;
};
/**
 * @returns {String}
 */
Game_Party.ActorName = function( id ){
    if( id < $gameParty.members().length ){
        return $gameParty.members()[ id ].name().toString().toLowerCase();
    }
    return '';
};
/**
 * @param {Number} id
 * @param {Number} intoVar
 * @returns {Number}
 */
Game_Party.ActorID = function( id , intoVar ){
    if( id > 0 ){
        id--;
    }
    if( id < $gameParty.members().length ){
        var actorID = $gameParty.members()[ id ].actorId();
        if( typeof intoVar === 'number' ){
            $gameVariables.setValue( intoVar , actorID );
        }
        return actorID;
    }
    return 0;
};

//$gameTemp.reserveCommonEvent(effect.dataId)
Window_Base.prototype.standardFontSize = function () { return 22; };
//Time to override the base vanilla method to transform escape codes
Window_Base.prototype.convertEscapeCharactersVanilla = Window_Base.prototype.convertEscapeCharacters;
Window_Base.prototype.convertEscapeCharacters = function (text) {
    //parse first the vanilla strings
    var parsed = Window_Base.prototype.convertEscapeCharactersVanilla.call(this, text);

    //include item names here
    parsed = parsed.replace(/\x1bIN\[(\d+)\]/gi, function () {
        //get item by id
        var id = parseInt(arguments[1]);
        if (Number.isSafeInteger(id) && id >= 0 && id < $dataItems.length) {
            //item.name
            return $dataItems[id].name;
        }
    }.bind(this));

    //actor nick names
    parsed = parsed.replace(/\x1bAN\[(\d+)\]/gi, function () {
        //get actor by id
        return this.actorNickName( parseInt(arguments[1]) );
    }.bind(this));

    //include party member name
    parsed = parsed.replace(/\x1bPN\[(\d+)\]/gi, function () {
        //get actor by id
        var id = parseInt(arguments[1]);
        if( id > 0 ){ id--; }
        if( id < $gameParty.members().length ){
            return $gameParty.members()[ id ].name();
        }
        else{
            return '{INVALID_ACTOR_ID_' + id + '}';
        }
    }.bind( this ));


    return parsed;
};
Window_Base.prototype.actorNickName = function(n) {
    var actor = n >= 1 ? $gameActors.actor(n) : null;
    return actor ? actor.nickname() : '';
};

Window_Base.prototype.drawGaugeOverride = Window_Base.prototype.drawGauge;
/**
 * @description Override current gauge's top positon offset
 */
Window_Base.prototype.drawGauge = function (x, y, width, rate, color1, color2, offset) {
    y = y + (typeof offset === 'number' ? offset : 4);
    this.drawGaugeOverride(x, y, width, rate, color1, color2);
}
/**
 * Extra actor attributes
 * Lust, Chastity and Arousal
 */
Window_Status.prototype.drawLustAttributes = function (x, y, width) {

    var lineHeight = this.lineHeight();

    var lust = this._actor.getLust();
    var arousing = this._actor.getArousing();
    var chastity = this._actor.getChastity();

    var width = width || 270;
    var width_split = parseInt(width / 2.5);
    var lustColor1 = lust < 0 ? this.textColor(4) : this.textColor(2);
    var lustColor2 = lust < 0 ? this.textColor(6) : this.textColor(5);

    this.changeTextColor(this.systemColor());
    this.drawText( lust > 0 ? "Lust" : "Virtuosity", x, y + lineHeight * 0, 270);
    this.drawText("Arousal", x, y + lineHeight * 1, 135);
    this.drawText("Chastity", x + 162, y + lineHeight * 1, 135);
    this.resetTextColor();

    this.drawText( Math.abs(lust.toString()) + "%", x, y + lineHeight * 0, 270, 'right');
    this.drawGauge(x, y, width, Math.abs(this._actor.getLust( true )), lustColor1, lustColor2);
    this.drawText(arousing.toString() + "%", x, y + lineHeight * 1, 120, 'right');
    this.drawGauge(x, y + lineHeight, width_split, this._actor.getArousing(true), this.textColor(2), this.textColor(27));
    this.drawText(chastity.toString() + "%", x + 135, y + lineHeight * 1, 135, 'right');
    this.drawGauge(x + 162, y + lineHeight, width_split, this._actor.getChastity(true), this.textColor(13), this.textColor(4));
};
/**
 * Override and move actor level's offset
 * @param Game_Actor actor
 * @param Number x
 * @param Number y
 */
Window_Base.prototype.drawActorLevel = function (actor, x, y) {
    this.changeTextColor(this.systemColor());
    this.drawText(TextManager.levelA, x, y, 48);
    this.resetTextColor();
    this.drawText(actor.level, x + 145, y, 36, 'right');
};
/**
 * @param Number x
 * @param Number y
 */
Window_Status.prototype.drawExpInfo = function (x, y) {
    var lineHeight = this.lineHeight();
    var expTotal = TextManager.expTotal.format(TextManager.exp);
    var expNext = TextManager.expNext.format(TextManager.level);
    var value1 = this._actor.currentExp();
    var value2 = this._actor.nextRequiredExp();
    if (this._actor.isMaxLevel()) {
        value1 = '-------';
        value2 = '-------';
    }
    else {
        //gauges
        var levelExp = (this._actor.nextLevelExp() - this._actor.currentLevelExp());
        var currentExp = Math.abs(value2 - levelExp) / levelExp;
        this.drawGauge(x, y + lineHeight, 270, currentExp, this.textColor(14), this.textColor(6));
    }
    this.changeTextColor(this.systemColor());
    this.drawText(expTotal, x, y + lineHeight * 0, 270);
    this.drawText(expNext, x, y + lineHeight * 1, 270);
    this.resetTextColor();
    this.drawText(value1, x, y + lineHeight * 0, 270, 'right');
    this.drawText(value2, x, y + lineHeight * 1, 270, 'right');

    this.drawLustAttributes(x, y + lineHeight * 2);
};


/******
 * Actor setup with LustBar, allowing Lust score for each actor
 *****/

Game_Actor.prototype.checkLustPoints = function(){

    if( typeof this._lust !== 'number' ){
        this._lust = 0;
    }
    if( typeof this._arousing !== 'number' ){
        this._arousing = 0;
    }
    if( typeof this._chastity !== 'number' ){
        this._chastity = 0;
    }

};

/**
 * @param Boolean percent
 * @returns Number
 */
Game_Actor.prototype.getLust = function ( percent ) {

    this.checkLustPoints();

    if( typeof percent === 'boolean' && percent ){

        var fix = this._lust / JayaK.LUST_RANGE;

        return Math.floor( fix * 100 ) / 100;
    }

    return this._lust;
}
/**
 * @param Number var_id
 * @returns Number
 */
Game_Actor.prototype.exportLust = function( var_id ) {
    
    $gameVariables.setValue( var_id , this.getLust( ) );

}
/**
 * @returns Boolean
 */
Game_Actor.prototype.nightmareTime = function(  ) {

    return Math.random() * JayaK.LUST_RANGE > 75;

    //if( typeof this.nightmareCounter === 'undefined' ){
    //    this.nightmareCounter = 0;
    //}
    //from 0 to 200%
    var resilience = JayaK.LUST_RANGE - this.getLust( );
    // random from 0 to 100%
    var attempt = parseInt( Math.random(  ) * JayaK.LUST_RANGE ) + this.getArousing();

    return resilience > 0 ? ( attempt / resilience ) > 1 : true;
}
/**
 * @static
 * @param Number|String gameVar
 * @param Number|String character_id
 * @returns Number
 */
Game_Actor.SetLustVar = function( gameVar , character_id ){

    if( gameVar && character_id ){

        var _target = $gameVariables.value( character_id );

        var _lust = $gameActors.actor( _target ).getLust();
    
        $gameVariables.setValue( gameVar , _lust );
    
        return _lust;
    }
    return 0;
}
/**
 * @param Boolean percent
 * @returns Number
 */
Game_Actor.prototype.getArousing = function ( percent ) {

    this.checkLustPoints();

    if( typeof percent === 'boolean' && percent ){

        var fix = this._arousing / JayaK.LUST_RANGE;

        return Math.floor( fix * 100 ) / 100;
    }

    return this._arousing;
}
/**
 * @param Boolean percent
 * @returns Number
 */
Game_Actor.prototype.getChastity = function ( percent ) {

    this.checkLustPoints();

    if( typeof percent === 'boolean' && percent ){

        var fix = this._chastity / JayaK.LUST_RANGE;

        return Math.floor( fix * 100 ) / 100;
    }

    return this._chastity;
}
/**
 * @returns Number
 */
Game_Actor.prototype.updateLust = function ( ) {

    //define the action
    if( typeof arouse !== 'boolean' ){
        arouse = false;
    }

    //update lust points with the given formula
    var points = parseInt( ( this.getArousing() - this.getChastity( ) ) * 0.1);

    var before = this.getLust();

    switch (true) {
        case points === 0:
            break;
        case Math.abs(this.getLust() + points) < JayaK.LUST_RANGE:
            //default update
            this._lust += points;
            break;
        case points > 0 && this.getLust() < JayaK.LUST_RANGE:
            //max to 100%
            this._lust = JayaK.LUST_RANGE;
            break;
        case points < 0 && this.getLust() > -JayaK.LUST_RANGE:
            //min to -100%
            this._lust = -JayaK.LUST_RANGE;
            break;
    }

    return this._lust - before;
}
/**
 * @param Number gameVar
 * @returns Number
 */
Game_Actor.prototype.arouse = function ( gameVar ) {

    this.checkLustPoints();

    //import arouse value
    var arouse = gameVar > 0 ? parseInt($gameVariables.value(gameVar)) : 1;
    //fix drop to 2 decimals
    //var drop = Math.floor( (1 - ( arouse / JayaK.LUST_RANGE )) * 100 ) / 100;

    if (this._arousing + arouse < JayaK.LUST_RANGE) {
        this._arousing = parseInt(this._arousing + arouse);
    }
    else {
        this._arousing = JayaK.LUST_RANGE;
    }

    this.resetChastity( arouse );
    //if( this._chastity > 0 ){
        //do not substract under 1
        //this._chastity = parseInt( this._chastity * drop );
    //}

    if( this.updateLust() > 0 ){
        //arouse succeeded
        this.notifyUpdate( JayaK.Parameters('ArouseUpText','feels excitingly aroused!!'), true);
        return true;
    }
    else{
        //arouse failed
        this.notifyUpdate( JayaK.Parameters('ArouseRessistText','ressist arousal!!'), true);
    }
    return false;
}
/**
 * @param Number gameVar
 * @returns Boolean
 */
Game_Actor.prototype.chastify = function (gameVar) {

    this.checkLustPoints();

    //import the chastify value
    var chastify = gameVar > 0 ? parseInt($gameVariables.value(gameVar)) : 1;
    //fix drop to 2 decimals
    //var drop = Math.floor( (1 - ( chastify / JayaK.LUST_RANGE )) * 100 ) / 100;

    //apply over the chastity counter
    if (this._chastity + chastify < JayaK.LUST_RANGE) {
        //this._chastity += chastify;
        this._chastity = parseInt(this._chastity + chastify);
    }
    else {
        this._chastity = JayaK.LUST_RANGE;
    }

    this.resetArousal( chastify );
    //if( this._arousing > 0 ){
        //do not substract under 1
        //this._arousing = parseInt( this._arousing * drop );
    //}

    if( this.updateLust() > 0 ){
        //chasten failed
        this.notifyUpdate( JayaK.Parameters('ChastenRessistText','feels ashamed!!'), true);
    }
    else{
        //chasten succeeded
        this.notifyUpdate( JayaK.Parameters('ChastenUpText','rejects arousal!!'), true);
        return true;
    }
    return false;
}
/**
 * @param Number amount
 * @returns {Game_Actor}
 */
Game_Actor.prototype.resetChastity = function( amount ){

    if( this.getChastity() > 0 ){

        switch( true ){
            case typeof amount !== 'number':
                amount = 5;
                break;
            case amount < 5:
                amount = 5;
                break;
            case amount > JayaK.LUST_RANGE:
                amount = JayaK.LUST_RANGE;
                break;
        }

        var drop = Math.floor( (1 - ( amount / JayaK.LUST_RANGE )) * 100 ) / 100;

        this._chastity = parseInt( this._chastity * drop );
    }

    return this;
};
/**
 * @param Number amount
 * @returns {Game_Actor}
 */
Game_Actor.prototype.resetArousal = function( amount ){

    if( this.getArousing() > 0 ){

        switch( true ){
            case typeof amount !== 'number':
                amount = 5;
                break;
            case amount < 5:
                amount = 5;
                break;
            case amount > JayaK.LUST_RANGE:
                amount = JayaK.LUST_RANGE;
                break;
        }

        var drop = Math.floor( (1 - ( amount / JayaK.LUST_RANGE )) * 100 ) / 100;

        this._arousing = parseInt( this._arousing * drop );
    }

    return this;
};
/**
 * @param Number lust
 * @param Number chastity
 * @param Number arousing
 */
Game_Actor.prototype.resetLustPoints = function (lust, chastity, arousing) {

    this._lust = lust || 0;

    this._chastity = chastity || 0;

    this._arousing = arousing || 0;

}
/**
 * @description Show a small notification area
 * @param String message
 * @param Boolean prefixActorName
 * @returns Game_Actor
 */
Game_Actor.prototype.notifyUpdate = function (message, prefixActorName) {

    //add prefix actor name if required
    if (typeof prefixActorName === 'boolean' && prefixActorName) {
        message = this._name + ' ' + message;
    }

    if( JayaK.Notifier && JayaK.Notifier.add ){
        JayaK.Notifier.add(message);
    }
    else{
        jayak_test_notifier( message );
    }

    return this;
}


function jayak_test_notifier(text) {

    var win = new Window_Base(
        10, 10,
        window.screen.width / 2,
        80);

    SceneManager._scene.addChild(win);

    win.drawText(text, 0, 0, window.screen.width, "left");

    window.setTimeout(function () {
        //shutdown
        win.close();
    }, 1800);
}

function jayak_test_dump(text) {

    var win = new Window_Base(
        10, 10,
        window.screen.width / 2,
        300);

    SceneManager._scene.addChild(win);

    win.drawText(text, 0, 0, window.screen.width, "left");

    window.setTimeout(function () {
        //shutdown
        win.close();
    }, 1800);
}

Game_Actor.prototype.getProtection = function () { return this.protection(); }
Game_Actor.prototype.protection = function () {

    switch( true ){
        case this.equips()[ Game_Actor.EquipTypes.Body - 1 ] === null:
            return Game_Actor.Protection.Naked;
        case this.equips()[ Game_Actor.EquipTypes.Footwear - 1 ] === null:
            return Game_Actor.Protection.Half;
        default:
            return Game_Actor.Protection.Full;
    }
}
Game_Actor.prototype.changeEquipVanilla = Game_Actor.prototype.changeEquip;
Game_Actor.prototype.changeEquip = function (slotId, item) {

    this.changeEquipVanilla(slotId, item);
    
    if( item !== null ){
        JayaK.Mods.runEquipEvent( item.id , this.id );
    }
}
Game_Actor.prototype.getEquipedItem = function( slotId ){

    if( slotId < this.equips().length && slotId ){
        
        var item = this.equips()[ slotId ];

        return item !== null ? item : null;
    }

    return null;
};
/**
 * @param Number slotId
 * @param Boolean remove
 */
Game_Actor.prototype.dropEquip = function ( slotId , remove ) {

    if( typeof slotId === 'number' ){
        //this.equipSlots()
        if( slotId > 0 ){
            //capture current item in slot
            var item = this.getEquipedItem( slotId - 1 );

            if( typeof remove !== 'boolean' ){
                remove = false;
            }

            if( item !== null ){
                if( remove ){
                    //remove item instead of switching it back to the inventory
                }
                //remove item
                this.changeEquipVanilla( slotId - 1, null );
                //set the removed item
                JayaK.Mods.exportEquipValue( item.id );
                if( JayaK.Notifier && JayaK.Notifier.add ){
                    //report item loss
                    JayaK.Notifier.add( this._name + ' has lost her ' + item.name );
                }
            }
        }
    }
    else{

        this.clearEquipments();
    }
}
Game_Actor.Protection = {
    'Naked': 0,
    'Half': 1,
    'Full': 2
};
Game_Actor.EquipTypes = {
    'Body': 4,
    'Footwear': 6
};

/**
 * @param Number actor_id Actor ID. 1 by default
 * @param Boolean percent Return percentage
 * @returns Number Lust score
 */
function jayak_actor_lust( actor_id , percent ){
    return $gameActors.actor( typeof actor_id === 'number' ? actor_id : 1 ).getLust( typeof percent === 'boolean' ? percent : false );
}
/**
 * @param Number actor_id Actor ID. 1 by default
 * @param Boolean percent Return percentage
 * @returns Number Arousal score
 */
function jayak_actor_arousing( actor_id , percent ){
    return $gameActors.actor( typeof actor_id === 'number' ? actor_id : 1 ).getArousing( typeof percent === 'boolean' ? percent : false );
}

/**
 * @param Number actor_id Actor ID. 1 by default
 * @param Boolean percent Return percentage
 * @returns Number Chastity score
 */
function jayak_actor_chastity( actor_id , percent ){
    return $gameActors.actor( typeof actor_id === 'number' ? actor_id : 1 ).getChastity( typeof percent === 'boolean' ? percent : false );
}

/**
 * @param Number actor_id Actor ID. 1 by default
 * @param Boolean percent Return percentage
 * @returns Number Chastity score
 */
function jayak_actor_tease_up( actor_id , import_var ){
    return $gameActors.actor( typeof actor_id === 'number' ? actor_id : 1 ).arouse( typeof import_var === 'number' ? import_var : 0 );
}
/**
 * @param Number actor_id Actor ID. 1 by default
 * @param Number import_var Source import variable
 * @returns Number Chastity score
 */
function jayak_actor_tease_down( actor_id , import_var ){
    return $gameActors.actor( typeof actor_id === 'number' ? actor_id : 1 ).chastify( typeof import_var === 'number' ? import_var : 0 );
}
/**
 * @param Number actor_id Actor ID. 1 by default
 * @returns Number Protection value
 */
function jayak_actor_protection( actor_id ){
    return $gameActors.actor( typeof actor_id === 'number' ? actor_id : 1  ).protection();
}
/**
 * @param Number actor_id Actor ID. 1 by default
 * @param Number slot_id Slot ID
 * @param boolean remove Remove item if required
 * @returns Number Protection value
 */
function jayak_actor_drop_equip( actor_id , slot_id , remove ){
    if( typeof slot_id === 'number' ){
        $gameActors.actor( typeof actor_id === 'number' ? actor_id : 1 ).dropEquip( slot_id , typeof remove === 'boolean' ? remove : false );
    }
}
/**
 * @returns Number
 */
function jayak_count_party_members(){
    return $gameParty.members().length;
}


