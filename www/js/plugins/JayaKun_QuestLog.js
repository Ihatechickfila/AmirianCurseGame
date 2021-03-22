//=============================================================================
// JayaKun_QuestLog.js
//=============================================================================
/*:
 * @plugindesc JayaKun_QuestManager
 * @author JaKun
 * 
 * @param AddMenu
 * @desc Show in the menu "Yes" or "No".
 * @default Yes
 *
 * @param IconStatusActive
 * @desc Icon to show in running stages
 * @default 255
 * 
 * @param IconStatusCompleted
 * @desc Icon to show in completed stages
 * @default 255
 *
 * @param IconStatusFailed
 * @desc Icon to show in failed elements
 * @default 255
 *
 * @param IconStatusCancelled
 * @desc Icon to show in cancelled elements
 * @default 255
 *
 * @param QuestRewardPrefix
 * @desc Text prefix to show in the quest reward layout
 * @default Earn
 * 
 * @help
 */
/**
 * @type {JayaK}
 */
var JayaK = JayaK || {};

//Game_Party.prototype.initInventoryOverride = Game_Party.prototype.initAllItems;
/**
 * @description Override Game_Party to register questData
 */
/*Game_Party.prototype.initAllItems = function(){

    Game_Party.prototype.initInventoryOverride();

    this._questData = {};

};*/
/**
 * @param {String} quest_id
 * @param {String} stage_id
 * @param {Number} amount
 * @returns {Number}
 */
Game_Party.prototype.updateQuestData = function( quest_id , stage_id , amount ) {

    if( typeof amount !== 'number' ){
        amount = 1;
    }

    if( !this.hasQuestData( quest_id, stage_id ) ){
        this.setQuestData( quest_id , stage_id , amount );
        return amount;
    }
    else{
        var current = this.getQuestData( quest_id , stage_id );

        var target = current + amount;

        if( current !== false ){
            this.setQuestData( quest_id , stage_id , target );
        }

        return target;
    }

    return 0;
}
/**
 * @param {String} quest_id
 * @param {String} stage_id
 * @param {Number} value
 * @returns Game_party
 */
Game_Party.prototype.setQuestData = function( quest_id , stage_id , amount ){

    if( this.hasQuestData( quest_id , true ) ){
        
        if( typeof amount !== 'number' ){
            //reset
            amount = 0;
        }

        this._questData[ quest_id ][ stage_id ] = amount;
    }

    return this;
};
/**
 * @param {String} quest_id
 * @param {String} stage_id
 * @returns {Boolean|Number}
 */
Game_Party.prototype.getQuestData = function( quest_id , stage_id ){

    if( this.hasQuestData( quest_id , stage_id ) ){

        var quest = this._questData[ quest_id ];

        return quest[ stage_id ];
    }

    return 0;
}
/**
 * @param {String} quest_id
 * @param {String} stage_id
 * @returns {Number}
 */
Game_Party.prototype.getQuestStatus = function( quest_id ){

    return this.hasQuestData( quest_id , true ) ?
            this._questData[ quest_id ].STATUS :
            Quest.Status.Hidden;
}
/**
 * @param {String} quest_id
 * @param {Boolean} status
 * @returns {Number}
 */
Game_Party.prototype.setQuestStatus = function( quest_id ,status ){

    if( this.hasQuestData( quest_id , true ) ){

        this._questData[ quest_id ].STATUS = status;

        return status;
    }
    return Quest.Status.Invalid;
}
/**
 * @param {String} quest_id
 * @param {String|Boolean} stage_id
 * @returns {Boolean}
 */
Game_Party.prototype.hasQuestData = function( quest_id , stage_id ){
    
    if( !this.hasOwnProperty( '_questData' ) ){
        
        this._questData = {};

    }

    if( typeof quest_id === 'string' ){
        if( this._questData.hasOwnProperty( quest_id ) ){

            switch( true ){
                case typeof stage_id === 'string' && stage_id.length && stage_id !== 'STATUS':
                    //check stage too
                    return this._questData[ quest_id ].hasOwnProperty( stage_id );
                case typeof stage_id === 'boolean':
                    //no stage requested, return quest exists
                    return stage_id;
            }
        }
        else if( typeof stage_id === 'boolean' && stage_id ){
            this._questData[ quest_id ] = {'STATUS':Quest.Status.Hidden};
            return true;
        }
    }
    else{
        //check if the full questdata engine is initialized
        return Object.keys(this._questData).length > 0;
    }

    return false;
}
/**
 * @returns {String}
 */
Game_Party.prototype.serializeQuestData = function(){

    return JSON.stringify( this._questData );
};
/**
 * @returns {Number}
 */
Game_Party.prototype.checkQuestData = function( quest_id, stage_id, objective ) {
        
    var current = this.getQuestData( quest_id, stage_id );
    
    if( current !== false ){
        return current < objective ?
            Quest.Status.Active :
            Quest.Status.Completed;
    }
    return Quest.Status.Invalid;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @description Root Quest Manager Module
 * @type QuestManager Quest Manager
 */
function QuestManager() {
    var _QM = {
        /**
         * @type {QuestManager}
         */
        'instance': this,
        /**
         * @type {Boolean}
         */
        'initialized': false,
        /**
         * @type {Number}
         */
        'timer': 1500,
        /**
         * @type {Number}
         */
        'timeHandler': 0,
        'icons':{
            'active':0,
            'completed':0,
            'failed':0,
            'cancelled':0,
        },
        /**
         * @type {Quest[]}
         */
        'quests':[]
    };
    /**
     * @param {String} icon_name
     * @param {Number} icon_id
     * @returns Number
     */
    this.iconCache = function( icon_name , icon_id ){
        if( !_QM.icons.hasOwnProperty( icon_name ) ){
            _QM.icons[icon_name] = QuestManager.Parameters( icon_name, icon_id );
        }

        return _QM.icons[ icon_name ];
    };
    /**
     * @param {String} quest_id
     * @param {String} title
     * @param {String} detail
     * @param {String} stages
     * @param {String} category
     * @param {String} next
     * @param {String} behavior
     * @param {String} reward
     * @param {Number} icon
     * @returns {Quest}
     */
    this.add = function (quest_id, title, detail, stages, category, next, behavior, reward , icon ) {
        //must be quest, not INVALID and have a unique Quest ID
        var Q = new Quest(quest_id, title, detail, category, next, behavior , reward , icon );
        if (Q.id() !== Quest.INVALID) {
            if (Array.isArray(stages)) {
                for (var i = 0; i < stages.length; i++) {
                    if (stages[i].hasOwnProperty('id')) {
                        Q.addStage(
                            stages[i].id,
                            stages[i].title || '--',
                            stages[i].objective || 1 ,
                            stages[i].required || false,
                            stages[i].detail || '' );
                    }
                }
            }
            else if (typeof stages === 'object') {
                for (var stage_id in stages) {
                    Q.addStage(stage_id,
                        stages[stage_id].title || '--',
                        stages[stage_id].objective || 1,
                        stages[stage_id].required || false,
                        stages[stage_id].detail || '' );
                }
            }
            //if( reward ){ Q.setReward(reward); }
            //if( icon ){ Q.setIcon( icon ); }
            _QM.quests.push(Q);
        }
        return Q;
    };
    /**
     * @param {String} quest_id
     * @returns Quest
     */
    this.get = function( quest_id ){

        if (quest_id.length) {
            for (var q = 0; q < _QM.quests.length; q++) {
                if ( _QM.quests[ q ].id() === quest_id) {
                    return _QM.quests[ q ];
                }
            }
        }
        return Quest.Invalid;
    };
    /**
     * @param {String} category
     * @param {Number} status
     * @returns Quest[]
     */
    this.list = function( category ,status ){

        if (category === undefined) {
            category = '';
        }
    
        if (status === undefined) {
            status = Quest.Status.Invalid;
        }
    
        var output = [];
    
        _QM.quests.forEach(function (item) {
            if (typeof item === 'object' && item instanceof Quest) {
                if (category.length === 0 || item.category() === category) {
                    if (status === Quest.Status.Invalid || item.status() === status) {
                    //if ( item.status() >= status) {
                        output.push({
                            'id': item.id(),
                            'title': item.title(),
                            'status': item.status()
                        });
                    }
                }
            }
        });
    
        return output;
    }
    /**
     * @returns {Boolean}
     */
    this.isHidden = function( quest_id ){
        
        var q = this.get( quest_id );
        
        return q.isValid() && q.status() === Quest.Status.Hidden;
    };
    /**
     * @returns {Boolean}
     */
    this.isRunning = function( quest_id ){
        
        var q = this.get( quest_id );
        
        return q.isValid() && q.status() === Quest.Status.Active;
    };
    /**
     * @returns {Boolean}
     */
    this.isCompleted = function( quest_id ,stage_id ){
        
        var q = this.get( quest_id );

        if( q.id() !== Quest.INVALID ){
            //console.log('ID ' + q.id());
            //console.log('status ' + Quest.Status.display(q.stageStatus())) ;
            if( typeof stage_id === 'string' && stage_id.length ){
                return q.stageStatus( stage_id ) === Quest.Status.Completed;
            }
        
            return q.isValid() && q.status() === Quest.Status.Completed;
        }

        return Quest.Status.Invalid;
    };
    /**
     * @returns {Boolean}
     */
    this.isFailed = function( quest_id ){
        
        var q = this.get( quest_id );
        
        return q.isValid() && q.status() === Quest.Status.Failed;
    };
    /**
     * @returns {Boolean}
     */
    this.isCancelled = function( quest_id ){
        
        var q = this.get( quest_id );
        
        return q.isValid() && q.status() === Quest.Status.Cancelled;
    };
    /**
     * @param {String} quest_id
     * @param {Boolean} reset
     * @returns {QuestManager}
     */
    this.start = function( quest_id , reset ){
        if( typeof reset !== 'boolean' ){
            reset = false;
        }
        if (quest_id !== undefined) {
            var quest = this.get( quest_id );
            if (quest.isValid() && ( reset || quest.status() < Quest.Status.Active ) ) {
                //Quest started!
                //quest.reset();
                quest.setStatus( Quest.Status.Active );
                this.message( quest.title() + ' started' );
            }
        }
        else{
            this.message('NO QUEST ID PROVIDED!!!');
        }
        return this;
    };
    /**
     * @param {String} quest_id
     * @param {String} stage_id
     * @returns {QuestManager}
     */
    this.complete = function (quest_id, stage_id) {

        if (quest_id !== undefined) {
            var quest = this.get(quest_id);
            if (quest.isValid() ) {
                if( typeof stage_id === 'string' && stage_id ){
                    quest.complete( stage_id );
                    this.message( quest.title() + ' - ' + quest.stageTitle( stage_id ) + ' completed');
                }
                else{
                    //completed
                    quest.complete( );
                    this.message(quest.title() + ' completed');
                }
            }
        }
        else{
            this.message('NO QUEST ID PROVIDED!!!');
        }

        return this;
    };
    /**
     * @param {String} quest_id
     * @param {String} stage_id
     * @returns {QuestManager}
     */
    this.fail = function (quest_id) {

        if (quest_id !== undefined) {
            var quest = this.get(quest_id);
            if (quest.isValid() && quest.status() === Quest.Status.Active ) {
                quest.fail();
                this.message( quest.title() + ' failed');
            }
        }
        else{
            this.message('NO QUEST ID PROVIDED!!!');
        }

        return this;
    };
    /**
     * @param {String} quest_id
     * @returns {QuestManager}
     */
    this.cancel = function( quest_id ){
        var quest = this.get( quest_id );
        if( quest.isValid() && quest.status() === Quest.Status.Active ){
            quest.setStatus( Quest.Status.Cancelled );
            this.message( quest.title() + ' cancelled');
        }
        return this;
    };
    /**
     * @param {String} quest_id
     * @param {String} stage_id
     * @param {Number} value
     * @returns {QuestManager}
     */
    this.update = function (quest_id, stage_id, value) {

        if (quest_id !== undefined) {

            var quest = this.get(quest_id);

            if (quest.isValid()) {

                switch (quest.status()) {
                    case Quest.Status.Hidden:
                        //open the quest in the diary
                        quest.setStatus(Quest.Status.Active).update(stage_id,value);
                        this.message( quest.title() + ' started' );
                        break;
                    case Quest.Status.Active:
                        switch( true ){
                            case quest.update(stage_id, value) === Quest.Status.Completed:
                                this.message( quest.title() + ' completed' );
                                break;
                            case quest.stageObjective( stage_id ) > 1:
                                this.message( quest.title() + ' '
                                    + quest.stageTitle( stage_id ) + ' ('
                                    + quest.stageProgress( stage_id ) + ' / '
                                    + quest.stageObjective( stage_id ) + ' )' );
                                break;
                            default:
                                this.message( quest.title() + ' ' + quest.stageTitle( stage_id ) + ' updated' );
                                break;
                        }
                        break;
                }
            }
            else {
                this.message('INVALID QUEST ' + quest_id + ' !!!');
            }
        }
        else {
            this.message('NO QUEST ID PROVIDED!!!');
        }
        return this;
    };
    /**
     * @returns {QuestManager}
     */
    this.openUpdate = function( quest_id , stage_id , value ){
        
        //set here the pointers
        SceneManager.push(QuestLogScene);
      
        return this;
    };
    /**
     * @returns {QuestManager}
     */
    this.openWindow = function () {

        SceneManager.push(QuestLogScene);

        return this;
    };
    /**
     * @returns {QuestManager}
     */
    this.closeWindow = function () {

        if (_QM.scene !== null && _QM.scene instanceof QuestLogScene) {

            _QM.scene.terminate();

        }

        return this;
    };

    /**
     * @returns {QuestManager}
     */
    this.dump = function (txt) {

        var msgBox = new Window_Base(
            0, 0,
            window.screen.width / 2,
            600);

        msgBox.drawText(txt, 0, 0, window.screen.width, "left");

        SceneManager._scene.addChild(msgBox);

        window.setTimeout(function () {

            msgBox.close();

        }, _QM.timer * 2);

        return this;
    }
    /**
     * @returns {QuestManager}
     */
    this.message = function (text) {

        if( JayaK.Notifier && JayaK.Notifier.add ){
            
            JayaK.Notifier.add( text );
            
        }
        else{
            var message = new Window_Base(
                10, 10,
                window.screen.width / 2,
                80);
    
            message.drawText(text, 0, 0, window.screen.width, "left");
            
            message.setBackgroundType( 1 );

            SceneManager._scene.addChild(message);
    
            window.setTimeout(function () {
    
                message.close();
    
            }, 1200 );
        }

        return this;
    };
    /**
     * @returns QuestManager
     */
    this.summary = function(){
        
        var quests = _QM.quests.length;
        var stages = 0;
        _QM.quests.forEach( function( quest ){
            stages += quest.stageList().length;
        });
        
        return this.message( 'Quest Manager loaded with ' + quests + ' quests and ' + stages + ' stages' );
    },
    /**
     * @returns {QuestManager}
     */
    this.importQuestData = function () {

        var _self = this;

        if ( _QM.quests.length === 0) {
            var path = 'data/' + QuestManager.Parameters('QuestFile', 'quests') + '.json';
            var request = new XMLHttpRequest();
            request.open("GET", path);
            request.overrideMimeType('application/json');
            request.onload = function () {
                if (request.status < 400) {
                    var questData = JSON.parse(request.responseText);
                    if (typeof questData === 'object') {
                        Object.keys(questData).forEach(function (item) {
                            switch (item) {
                                case 'Categories':
                                    //Import categories
                                    var categories = questData[item];
                                    Object.keys(categories).forEach(function (cat_id) {
                                        Quest.Categories.add(cat_id, categories[cat_id]);
                                    });
                                    break;
                                default:
                                    //import Quests
                                    var title = questData[item].hasOwnProperty('title') ? questData[item].title : 'Quest';
                                    var detail = questData[item].hasOwnProperty('detail') ? questData[item].detail : '--';
                                    var stages = questData[item].hasOwnProperty('stages') ? questData[item].stages : [/**/];
                                    var next = questData[item].hasOwnProperty('next') ? questData[item].next : '';
                                    var category = questData[item].hasOwnProperty('category') ? questData[item].category : '';
                                    var behavior = questData[item].hasOwnProperty('behavior') ? questData[item].behavior : Quest.Behavior.Default;
                                    var reward = questData[item].hasOwnProperty('reward') ? questData[item].reward : '';
                                    var icon = questData[item].hasOwnProperty('icon') ? questData[item].icon : 0;
                                    //register quest
                                    _self.add(item, title, detail, stages, category, next, behavior, reward , icon );
                                    break;
                            }
                        });
                    }
                }
                else {
                    QuestManager.message(request.status);
                }
            };
            request.send();
        }

        return this;
    };
    /**
     * @returns {QuestManager}
     */
    this.initialize = function () {

        if (!_QM.initialized) {

            if (  QuestManager.Parameters('AddMenu', 'No').toLowerCase() === 'yes') {
                var _self = this;
                var addMenuOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
                Window_MenuCommand.prototype.addOriginalCommands = function () {
                    addMenuOriginalCommands.call(this);
                    var enabled = true;
                    this.addCommand(QuestManager.Parameters('MenuTitle', 'Journal'), 'quest', enabled);
                };
                var createCommandWindow = Scene_Menu.prototype.createCommandWindow;
                Scene_Menu.prototype.createCommandWindow = function () {
                    createCommandWindow.call(this);
                    this._commandWindow.setHandler('quest', this.commandQuestLog.bind(this));
                };
                Scene_Menu.prototype.commandQuestLog = function () {
                    //QuestManager.message( 'Quest Log Menu Working' );
                    _self.openWindow();
                };
            }

            _QM.initialized = true;
        }

        return this;
    };

    return this.initialize().importQuestData();
}
/**
 * @description Access to plugin|module's parameters
 * @param {String} input 
 * @param {String|Number|Boolean} value
 * @returns {String}
 */
QuestManager.Parameters = function( input, value ) {

    var parameters = $plugins.filter(function (p) {

        return p.description.contains('JayaKun_QuestManager');

    })[0].parameters;

    return typeof parameters === 'object' && parameters.hasOwnProperty(input) ?
        parameters[input] :
        typeof value !== 'undefined' ? value : '';
};
/**
 * @param {String} quest_id
 * @returns {Number}
 */
QuestManager.getQuestStatus = function( quest_id ){

    return $gameParty.getQuestStatus(quest_id );
};
/**
 * @param {String} quest_id
 * @returns {Number}
 */
QuestManager.setQuestStatus = function( quest_id , status ){

    return $gameParty.setQuestStatus(quest_id , status );
};
/**
 * @returns {Game_Party}
 */
QuestManager.getQuestData = function( quest_id , stage_id ){
    
    return $gameParty.getQuestData( quest_id , stage_id );
};
/**
 * @returns {Game_Party}
 */
QuestManager.setQuestData = function( quest_id , stage_id , value ){
    
    return $gameParty.setQuestData( quest_id , stage_id , value );
};
/**
 * @returns {Game_Party}
 */
QuestManager.updateQuestData = function( quest_id , stage_id , amount , limit ){
    
    return $gameParty.updateQuestData( quest_id , stage_id , amount , limit );
};
/**
 * @returns {Game_Party}
 */
QuestManager.hasQuestData = function( quest_id , stage_id ){
    
    return $gameParty.hasQuestData( quest_id , stage_id );
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @description Alias to JayaK.Quests methods
 * @type {Quests}
 */
var Quests = {
    /**
     * @param {String} ID
     * @param {String} title
     * @param {String} detail
     * @param {Array|Object} stages
     * @param {String} category
     * @param {String} next
     * @param {Number} behavior
     * @returns {Quest}
     */
    'add': function (ID, title, detail, stages, category, next, behavior, reward) {

        return JayaK.Quests.add( ID , title, detail , category , next , behavior , reward );
    },
    /**
     * @returns {Quest|Boolean}
     */
    'get': function (quest_id) {
        return JayaK.Quests.get( quest_id );
    },
    /**
     * @description List all quests by ID > title
     * @param {String} category
     * @param {Number} status
     * @returns {Array}
     */
    'list': function (category, status) {

        return JayaK.Quests.list (category,status);
    },
    /**
     * @returns {Boolean}
     */
    'hidden': function( quest_id ){

        return JayaK.Quests.isHidden( quest_id );
    },
    /**
     * @param {String} quest_id
     * @param {String|Boolean} stage
     */
    'status': function( quest_id ){
        var name = quest_id.split( '.' );
        var quest = this.get( name[0] );
        if( quest.isValid() ){
            var current = quest.currentStage();
            if( name.length > 1 ){
                return ( name[ 1 ] === current );
            }
            return current;
        }
        return false;
    },
    /**
     * @returns {Boolean}
     */
    'running': function( quest_id ){

        return JayaK.Quests.isRunning( quest_id );
    },
    /**
     * @returns {Boolean}
     */
    'completed': function( quest_id , stage_id ){

        return JayaK.Quests.isCompleted( quest_id ,stage_id );
    },
    /**
     * @returns {Boolean}
     */
    'failed': function( quest_id ){

        return JayaK.Quests.isFailed( quest_id );
    },
    /**
     * @returns {Boolean}
     */
    'cancelled': function( quest_id ){

        return JayaK.Quests.isCancelled( quest_id );
    },
    /**
     * @param {String} quest_id
     * @param {Boolean} reset
     * @returns {QuestManager}
     */
    'start': function (quest_id , reset ) {
        if( typeof reset !== 'boolean' ){
            reset = false;
        }
        return JayaK.Quests.start( quest_id );
    },
    /**
     * @param {String} quest_id
     * @param {String} stage_id
     * @returns {QuestManager}
     */
    'complete': function (quest_id, stage_id) {
        return JayaK.Quests.complete( quest_id , stage_id );
    },
    /**
     * @param {String} quest_id
     * @param {String} stage_id
     * @returns {QuestManager}
     */
    'fail': function (quest_id) {
        return JayaK.Quests.fail( quest_id );
    },
    /**
     * @param {String} quest_id
     * @returns {QuestManager}
     */
    'cancel': function( quest_id ){
        return JayaK.Quests.cancel( quest_id );
    },
    /**
     * @param {String} quest_id
     * @param {String} stage_id
     * @param {Number} value
     * @returns {QuestManager}
     */
    'update': function (quest_id, stage_id, value) {
        return JayaK.Quests.update( quest_id , stage_id , value );
    },
    /**
     * @returns {QuestManager}
     */
    'openUpdate': function ( quest_id , stage_id , value ) {
        return JayaK.Quests.openUpdate( quest_id ,stage_id , value );
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @param {String} ID
 * @param {String} title
 * @param {String} detail
 * @param {String} category
 * @param {String} next
 * @param {Number} behavior
 * @param {String} reward
 * @param {Number} icon
 * @Quest
 */
function Quest(ID, title, detail, category, next, behavior, reward , icon ) {
    var _Q = {
        'ID': ID || Quest.INVALID,
        'title': title || '',
        'detail': detail || '',
        //'status': Quest.Status.Hidden,
        'category': category || '',
        'next': next || '',
        'reward': reward || '',
        'icon': icon || 0,
        'behavior': behavior || Quest.Behavior.Default,
        'stages': { /*populate quest stages here*/}
    };
    /**
     * @param {String} ID
     * @param {String} title
     * @param {Number} target
     * @param {Boolean} required
     * @param {String} detail
     * @returns Quest
     */
    this.addStage = function (stage_id, title, objective, required , detail ) {
        if ( !this.hasStage( stage_id ) ) {
            _Q.stages[stage_id] = {
                'title': title || 'Objective ' + _Q.stages.length + 1,
                'objective': objective || 1,
                'required': required || true,
                'detail': typeof detail === 'string' ? detail : ''
            };
        }

        return this;
    };
    /**
     * @returns {Boolean}
     */
    this.isValid = function () { return _Q.ID !== Quest.INVALID; };
    /**
     * @returns {String}
     */
    this.id = function () { return _Q.ID; };
    /**
     * @description get the quest's title or stage title, given its stage_id
     * @param {String} stage_id (optional)
     * @returns {String}
     */
    this.title = function ( stage_id ) {

        if( typeof stage_id === 'string' && stage_id.length ){

            return this.hasStage(stage_id) ? _Q.stages[stage_id].title : Quest.INVALID;
        }

        return _Q.title;
    };
    /**
     * @returns {String}
     */
    this.detail = function () {
        
        var current = this.currentStage();
        if( current.length ){
            if( _Q.stages[current].detail.length ){
                return _Q.stages[current].detail;
            }
        }

        return _Q.detail;
    };
    /**
     * @returns String|Boolean
     */
    this.currentStage = function(){
        if(_Q.behavior === Quest.Behavior.Linear ){
            for( var stage_id in _Q.stages ){
                //get the current stage if not completed
                if( this.stageProgress( stage_id ) < this.stageObjective( stage_id ) ){
                    return stage_id;
                }
            }
        }
        return '';
    };
    /**
     * @returns {String}
     */
    this.behavior = function () { return _Q.behavior; };
    /**
     * @returns {String}
     */
    this.category = function () { return _Q.category; };
    /**
     * @returns {String}
     */
    this.reward = function ( ) { return _Q.reward; };
    /**
     * @returns {Number}
     */
    this.icon = function ( ) { return _Q.icon; };
    /**
     * @returns {Array}
     */
    this.displayDetail = function () {
        var output = [];
        //_Q.detail.split("\n").forEach(function (paragraph) {
        this.detail().split("\n").forEach(function (paragraph) {
            paragraph.split(' ').forEach(function (word) {
                if (output.length) {
                    if (output[output.length - 1].length + word.length + 1 < 50) {
                        output[output.length - 1] += output[output.length - 1].length ? ' ' + word : word;
                    }
                    else {
                        output.push(word);
                    }
                }
                else {
                    output.push(word);
                }
            });
            //libe break
            output.push('');
        });

        return output;
    };
    /**
     * @returns {String}
     */
    this.displayCategory = function () { return Quest.Categories.get(_Q.category); };
    /**
     * @returns {String}
     */
    this.displayReward = function(){
        return _Q.reward.length > 0 ?
        QuestManager.Parameters('QuestRewardPrefix','Earn') + ' ' + _Q.reward :
        '--'
    };
    /**
     * @returns {String}
     */
    this.displayStatus = function(){
        return Quest.Status.display( this.status( ) );
   };
    /**
     * @returns {String}
     */
    this.nextQuest = function () { return _Q.next; };
    /**
     * @returns {Quest}
     */
    this.setBehavior = function (behavior) {
        if (typeof behavior === 'number') {
            _Q.behavior = behavior;
        }
        return this;
    };
    /**
     * @returns {Quest}
     */
    this.setReward = function (reward) {
        if (typeof reward === 'string') {
            _Q.reward = reward;
        }
        return this;
    };
    /**
     * @returns {Quest}
     */
    this.setIcon = function( icon ){
        if( typeof icon === 'number' && icon ){
            _Q.icon = icon ;
        }
        return this;
    };
    /**
     * @returns {Boolean}
     */
    this.hasIcon = function ( ) { return _Q.icon > 0; };
    /**
     * @returns Boolean
     */
    this.hasStage = function( stage_id ){ return typeof stage_id === 'string' && stage_id.length && _Q.stages.hasOwnProperty( stage_id ); };
    /**
     * @param {String} stageID
     * @returns {Object}
     */
    this.stage = function (stage_id) {
        return this.hasStage(stage_id) ? _Q.stages[stage_id] : { 'title': Quest.INVALID, 'objective': 0 };
    };
    /**
     * @param {String} stage_id
     * @returns {String}
     */
    this.stageTitle = function (stage_id) {
        return this.title( stage_id );
    };
    /**
     * @param {String} stage_id
     * @returns {Number}
     */
    this.stageProgress = function (stage_id) {
        return QuestManager.getQuestData( _Q.ID , stage_id );
    };
    /**
     * @param {String} stage_id
     * @returns {Number}
     */
    this.stageObjective = function (stage_id) {
        return this.hasStage(stage_id) ?
            _Q.stages[stage_id].objective :
            Quest.Status.Invalid;
    };
    /**
     * @param {String} stageID
     * @returns {Number}
     */
    this.stageStatus = function (stage_id) {

        return this.status( stage_id );

    };
    /**
     * @returns {Number}
     */
    this.stageCount = function(){ return this.stageList().length; };
    /**
     * @returns Array
     */
    this.stageList = function () { return Object.keys(_Q.stages); };
    /**
     * @returns Array
     */
    this.stages = function () { return _Q.stages; };
    /**
     * @returns Quest
     */
    this.update = function (stage_id, progress) {

        var status = this.status();

        if( typeof progress !== 'number' || progress < 1 ){
            progress  = 1;
        }

        switch( true ){
            case status > Quest.Status.Active:
                break;
            case status === Quest.Status.Hidden:
                //reset status implicity
                return this.setStatus( Quest.Status.Active );
            case this.hasStage( stage_id ) && this.stageStatus( stage_id ) === Quest.Status.Active:
                var objective = this.stageObjective( stage_id );
                var current = this.stageProgress( stage_id );
                //cap the limits here
                progress = current + progress < objective ? progress : objective - current;

                var update = QuestManager.updateQuestData( _Q.ID , stage_id , progress );

                return this.check();
        }

        return status;
    };
    /**
     * @returns {Number}
     */
    this.check = function(){
        var status = this.status();
        if( status === Quest.Status.Active ){
            var progress = 0;
            var objective = 0;
            var Q = this;
            this.stageList().forEach( function( stage_id ){
                progress  += Q.stageProgress( stage_id );
                objective += Q.stageObjective( stage_id );
            });
            if( progress >= objective ){
                this.setStatus( Quest.Status.Completed );
                this.next();
            }
        }
        return status;
    };
    /**
     * @returns {Boolean}
     */
    this.next = function(){
        if( _Q.next.length ){
            var next =  JayaK.Quests.get( _Q.next );
            if( next.id() !== Quest.INVALID ){
                if( next.status() < Quest.Status.Active) {
                    next.setStatus(Quest.Status.Active);
                    return true;
                }
            }
        }
        return false;
    };
    /**
     * @param {String} stage_id optional
     * @returns {Number}
     */
    this.progress = function( stage_id ){
        
        if( this.hasStage( stage_id ) ){
            return QuestManager.getQuestData( _Q.ID , stage_id );
        }

        var current = 0;
        var objective = 0;
        var _this = this;

        this.stageList().forEach( function( stage ){
            current += _this.stageProgress( stage );
            objective += _this.stageObjective( stage );
        });

        return objective > 0 ? parseInt(100 * current / parseFloat( objective )) : 0;
    };
    /**
     * @param {String} stage_id (optional)
     * @returns Number
     */
    this.status = function ( stage_id ) {

        if( this.hasStage( stage_id ) ){
            var objective = this.stageObjective(stage_id);
            var status = this.stageProgress( stage_id );
            return objective > Quest.Status.Invalid && status === objective ?
                Quest.Status.Completed :
                Quest.Status.Active;
        }

         return QuestManager.getQuestStatus( _Q.ID );
    };
    /**
     * @returns Number
     */
    this.setStatus = function (status){
        return QuestManager.setQuestStatus( _Q.ID , status );
    };
    /**
     * @param {String} stage_id
     * @returns {Quest}
     */
    this.complete = function (stage_id) {

        if (this.status() < Quest.Status.Completed) {
            if (typeof stage_id === 'string' && stage_id.length) {
                var target = this.stageObjective(stage_id);
                QuestManager.setQuestData( _Q.ID , stage_id , target );
                return this.check();
            }
            else {
                //ful quest compplte
                this.setStatus(Quest.Status.Completed);
                this.next();
            }
        }

        return this.status();
    };
    /**
     * @returns {Quest}
     */
    this.fail = function (stage_id) {
        if (this.status() < Quest.Status.Completed) {
            this.setStatus(Quest.Status.Completed);
        }
        return this;
    };
    /**
     * @returns {Number}
     */
    this.isHidden = function () { return this.status() === Quest.Status.Hidden; };
    /**
     * @returns {Number}
     */
    this.isActive = function () { return this.status() === Quest.Status.Active; };
    /**
     * @returns {Number}
     */
    this.isCompleted = function () { return this.status() === Quest.Status.Completed; };
    /**
     * @returns {Number}
     */
    this.isFailed = function () { return this.status() === Quest.Status.Failed; };
    /**
     * @returns {Number}
     */
    this.dump = function () { return JSON.stringify(_Q); }

    return this;
};
/**
 * @type Quest.Status
 */
Quest.Status = {
    'Invalid': 0,
    'Hidden': 1,
    'Active': 2,
    'Completed': 3,
    'Failed': 4,
    'Cancelled': 5
};
Quest.Status.display = function( status ){
    switch( status  ){
        case this.Hidden: return 'Hidden';
        case this.Active: return 'Active';
        case this.Completed: return 'Completed';
        case this.Failed: return 'Failed';
        case this.Cancelled: return 'Cancelled';
        default: return 'Invalid';
    }
};
Quest.Behavior = { 'Default': 0,'Linear': 1 };
Quest.INVALID = 'INVALID';
Quest.Invalid = new Quest('INVALID');
/**
 * @returns {Quest.Categories}
 */
Quest.Categories = {};
/**
 * @returns {String[]}
 */
Quest.Categories.list = function () {
    var _this = this;
    var out = [];
    Object.keys(this).forEach(function (category_id) {
        if (_this.hasOwnProperty(category_id) && typeof _this[category_id] === 'string') {
            out.push(category_id);
        }
    });
    return out;
};
Quest.Categories.count = function () { this.list.length; };
/**
 * @returns {String}
 */
Quest.Categories.get = function (category_id) {
    return this.hasOwnProperty(category_id) ?
        this[category_id] :
        category_id;
};
/**
 * @param {String} category_id
 * @param {String} label
 * @returns {Quest.Categories}
 */
Quest.Categories.add = function (category_id, label) {
    if (typeof category_id === 'string' && category_id.length) {
        this[category_id] = label || category_id;
    }
    return this;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
////    QuestLogScene : Scene_ItemBase
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @QuestLogScene
 */
QuestLogScene = function () {

    this.initialize.apply(this, arguments);

}
QuestLogScene.prototype = Object.create(Scene_ItemBase.prototype);
QuestLogScene.prototype.constructor = QuestLogScene;
QuestLogScene.prototype.initialize = function () {
    Scene_ItemBase.prototype.initialize.call(this);
};
QuestLogScene.LayoutSize = 4;
QuestLogScene.prototype.create = function () {
    Scene_ItemBase.prototype.create.call(this);
    this.setupCategoryWindow();
    this.setupStatusWindow();
    this.setupQuestWindow();
    this.setupDetailWindow();
    this.onSelectCategory();
};
QuestLogScene.prototype.setupStatusWindow = function(){
    this._statusWindow = new QuestStatusWindow( this._categoryWindow.height );
    this.addWindow(this._statusWindow);
};
QuestLogScene.prototype.setupCategoryWindow = function () {
    this._categoryWindow = new QuestCatWindow( );
    this._categoryWindow.setHandler('left', this.onSelectCategory.bind(this));
    this._categoryWindow.setHandler('right', this.onSelectCategory.bind(this));
    this._categoryWindow.setHandler('cancel', this.onQuitQuestLog.bind(this));
	this._categoryWindow.setHandler('ok',   this.onSelectStatus.bind(this));
    this.addWindow(this._categoryWindow);
};
QuestLogScene.prototype.setupQuestWindow = function () {

    var y = this._categoryWindow.y + this._categoryWindow.height;

    this._questsWindow = new QuestLogWindow( y );
    this._questsWindow.setHandler('up', this.onSelectQuest.bind(this));
    this._questsWindow.setHandler('down', this.onSelectQuest.bind(this));
    this._categoryWindow.setItemWindow(this._questsWindow);
    this.addWindow(this._questsWindow);
};
QuestLogScene.prototype.setupDetailWindow = function () {
    this._detailWindow = new QuestDetailWindow( this._questsWindow.y );
    this._questsWindow.setHelpWindow(this._detailWindow);
    this.addWindow(this._detailWindow);
};
QuestLogScene.prototype.onSelectCategory = function () {
    this._questsWindow.activate();
    this._questsWindow.select(0);
    this._detailWindow.setItem(this._questsWindow.getItemId());
    this._detailWindow.refresh();
    this._statusWindow.refresh( this._questsWindow.getStatus( ) );
};
QuestLogScene.prototype.onSelectQuest = function () {
    this._questsWindow.refresh();
    this._detailWindow.refresh();
    this._statusWindow.refresh( this._questsWindow.getStatus( ) );
    this._questsWindow.activate();
    this._detailWindow.activate();
};
QuestLogScene.prototype.onQuitQuestLog = function () {
    this._questsWindow.deselect();
    //this._categoryWindow.activate();
    this.popScene();
};
QuestLogScene.prototype.onSelectStatus = function () {

    if( this._questsWindow ){
        this._questsWindow.nextStatus( );
        this._questsWindow.deselect();

        if( this._categoryWindow ){
            this._categoryWindow.activate();
        }
        //this.onSelectCategory();
        this._statusWindow.refresh( this._questsWindow.getStatus( ) );
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
////    QuestStatusWindow : Window_Base
///////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * @QuestStatusWindow
 */
function QuestStatusWindow() { this.initialize.apply(this, arguments); };
QuestStatusWindow.prototype = Object.create(Window_Base.prototype);
QuestStatusWindow.prototype.constructor = QuestStatusWindow;
QuestStatusWindow.prototype.initialize = function ( height ) {

    Window_Base.prototype.initialize.call(this , 0 , 0 , this.windowWidth( ) , height );

};
QuestStatusWindow.prototype.windowWidth = function () {
    return parseInt(Graphics.boxWidth / QuestLogScene.LayoutSize);
};
QuestStatusWindow.prototype.getIcon = function( status ){
    switch( status ){
        case Quest.Status.Active: return JayaK.Quests.iconCache( 'IconStatusActive', 0);
        case Quest.Status.Completed: return JayaK.Quests.iconCache( 'IconStatusCompleted', 0);
        case Quest.Status.Failed: return JayaK.Quests.iconCache( 'IconStatusFailed', 0);
        case Quest.Status.Cancelled: return JayaK.Quests.iconCache( 'IconStatusCancelled', 0);
        default: return 0;
    }
};
QuestStatusWindow.prototype.getColor = function( status ){
    switch( status ){
        case Quest.Status.Completed: return this.textColor(8);
        case Quest.Status.Failed: return this.textColor(2);
        case Quest.Status.Cancelled: return this.textColor(7);
        default: return this.normalColor();
    }
};
QuestStatusWindow.prototype.refresh = function( status ){
    this.contents.clear();
    //this.changeTextColor(this.getColor(status));
    this.drawIcon( 225 , 0, 0 );
    //this.drawText( Quest.Status.display( status ) , 10 , 0 , this.contentsWidth() , 'center' );
    this.drawText( Quest.Status.display( status ) , 40 , -5 , this.contentsWidth() );
};
///////////////////////////////////////////////////////////////////////////////////////////////////
////    QuestCatWindow : Window_HorzCommand
///////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * @QuestCatWindow
 */
function QuestCatWindow() { this.initialize.apply(this, arguments); };
QuestCatWindow.prototype = Object.create(Window_HorzCommand.prototype);
QuestCatWindow.prototype.constructor = QuestCatWindow;
QuestCatWindow.prototype.initialize = function () {
    Window_HorzCommand.prototype.initialize.call(this, this.windowX(), 0);
};
QuestCatWindow.prototype.windowX = function(){
    return parseInt(Graphics.boxWidth / QuestLogScene.LayoutSize );
};
QuestCatWindow.prototype.windowWidth = function () {
    return this.windowX() * (QuestLogScene.LayoutSize-1);
};
QuestCatWindow.prototype.maxCols = function () {
    var cols = Quest.Categories.count();
    return cols < 4 ? cols : 4;
};
QuestCatWindow.prototype.update = function () {

    Window_HorzCommand.prototype.update.call(this);

    if (this._questsWindow) {
        this._questsWindow.setCategory( this.currentSymbol( ) );
    }
};
QuestCatWindow.prototype.makeCommandList = function () {
    var _renderer = this;
    Quest.Categories.list().forEach(function (cat_id) {
        _renderer.addCommand(Quest.Categories.get(cat_id), cat_id);
    });
};
QuestCatWindow.prototype.setItemWindow = function (itemWindow) {
    this._questsWindow = itemWindow;
    this.update();
};

///////////////////////////////////////////////////////////////////////////////////////////////////
////    QuestLogWindow : Window_Selectable
///////////////////////////////////////////////////////////////////////////////////////////////////

function QuestLogWindow() {
    this.initialize.apply(this, arguments);
}
QuestLogWindow.prototype = Object.create(Window_Selectable.prototype);
QuestLogWindow.prototype.constructor = QuestLogWindow;
QuestLogWindow.prototype.initialize = function ( y ) {
    Window_Selectable.prototype.initialize.call(this, 0, y , this.windowWidth() , this.windowHeight( y ) );
    this.questCat = '';
    this.questStatus = Quest.Status.Active;
    this.questLog = [];
};
QuestLogWindow.prototype.windowWidth = function(){
    return Graphics.boxWidth / QuestLogScene.LayoutSize;
};
QuestLogWindow.prototype.windowHeight = function( y ){
    return Graphics.boxHeight - y;
};
/**
 * @returns {Number}
 */
QuestLogWindow.prototype.getStatus = function(){
    return this.questStatus;
};
/**
 * @returns {Number}
 */
QuestLogWindow.prototype.nextStatus = function(){

    this.questStatus = this.questStatus < Quest.Status.Failed ?
            this.questStatus + 1 :
            Quest.Status.Active;

    this.resetQuestList();

    //return this.questStatus;
};
QuestLogWindow.prototype.setStatus = function( status ){

    if( this.questStatus !== status ){
        
        this.questStatus = status;

        this.resetQuestList();
    }
};
QuestLogWindow.prototype.setCategory = function ( category ) {

    if (this.questCat !== category ) {

        this.questCat = category;

        this.resetQuestList();
    }
};
QuestLogWindow.prototype.resetList = function(){

    this.resetQuestList( );
    this.createContents( );
    this.contents.fontSize = 24;

    this.refresh();
    this.resetScroll();

    //reset the view on change
    this.select(this.questLog.length > 0 ? 0 : -1);
    if (this._detailWindow) {
        this._detailWindow.setItem(this._questsWindow.getItemId());
    }
};
/**
 * @returns {Array}
 */
QuestLogWindow.prototype.listItems = function () { Object.keys(this.questLog); };
QuestLogWindow.prototype.maxCols = function () { return 1; };
QuestLogWindow.prototype.maxItems = function () { return this.questLog ? this.questLog.length : 0; };
QuestLogWindow.prototype.spacing = function () { return 32; };
/**
 * @returns {String}
 */
QuestLogWindow.prototype.getItemId = function (idx) {
    var item = this.getItem(idx);
    return item !== Quest.INVALID ? item.id : Quest.INVALID;
};
/**
 * @returns {String}
 */
QuestLogWindow.prototype.getItemTitle = function (idx) {
    var item = this.getItem(idx);
    return item !== Quest.INVALID ? item.title : '';
};
QuestLogWindow.prototype.getItemStatus = function (idx) {
    var item = this.getItem(idx);
    return item !== Quest.INVALID ? item.status : '';
};
QuestLogWindow.prototype.getItem = function (idx) {

    if (typeof idx !== 'number') {
        idx = this.index();
    }

    return idx >= 0 && idx < this.questLog.length ?
        this.questLog[idx] :
        Quest.INVALID;
};
/**
 * 
 */
QuestLogWindow.prototype.resetQuestList = function () {

    this.questLog = Quests.list( this.questCat, this.questStatus );
    
    this.createContents( );
    this.contents.fontSize = 24;

    this.refresh();
    this.resetScroll();

    //reset the view on change
    this.select(this.questLog.length > 0 ? 0 : -1);
    //this.activate();

    if (this._detailWindow) {
        this._detailWindow.setItem(this._questsWindow.getItemId());
    }
};
/**
 * @description Render Item in the list by its list order
 */
QuestLogWindow.prototype.drawItem = function (idx) {
    var title = this.getItemTitle(idx);
    var status = this.getItemStatus(idx);
    if (title.length) {
        var rect = this.itemRect(idx);
        var title_break = title.split(' - ');
        rect.width -= this.textPadding();

        switch( status ){
            case Quest.Status.Active:
                //this.drawIcon(QuestManager.Parameters( 'IconStatusActive', 225), rect.x, rect.y);
                //this.drawIcon( JayaK.Quests.iconCache( 'IconStatusActive', 0), rect.x - 10, rect.y);
                this.changeTextColor(this.normalColor());
                break;
            case Quest.Status.Completed:
                //this.drawIcon(QuestManager.Parameters( 'IconStatusCompleted', 225), rect.x, rect.y);
                //this.drawIcon( JayaK.Quests.iconCache( 'IconStatusCompleted', 0), rect.x - 10, rect.y);
                this.changeTextColor(this.textColor(8));
                break;
            case Quest.Status.Failed:
                //this.drawIcon( QuestManager.Parameters( 'IconStatusFailed', 225), rect.x, rect.y);
                //this.drawIcon( JayaK.Quests.iconCache( 'IconStatusFailed', 0), rect.x - 10, rect.y);
                this.changeTextColor(this.textColor(2));
                break;
            case Quest.Status.Cancelled:
                //this.drawIcon( QuestManager.Parameters( 'IconStatusCancelled', 225), rect.x, rect.y);
                //this.drawIcon( JayaK.Quests.iconCache( 'IconStatusCancelled', 0), rect.x - 10, rect.y);
                this.changeTextColor(this.textColor(7));
                break;
        }
        //this.drawText(title, rect.x + 20, rect.y, rect.width);
        //this.drawText( title_break[ 0 ] , rect.x + 20, rect.y, rect.width);
        this.drawText( title_break[ 0 ] , rect.x , rect.y, rect.width);
    }
};
QuestLogWindow.prototype.updateHelp = function () { this.setHelpWindowItem(this.getItemId()); };
QuestLogWindow.prototype.refresh = function () { this.drawAllItems(); };

///////////////////////////////////////////////////////////////////////////////////////////////////
////    QuestDetailWindow : Window_Base
///////////////////////////////////////////////////////////////////////////////////////////////////
QuestDetailWindow = function () { this.initialize.apply(this, arguments); }
QuestDetailWindow.prototype = Object.create(Window_Base.prototype);
QuestDetailWindow.prototype.constructor = QuestDetailWindow;
QuestDetailWindow.prototype.initialize = function ( y ) {
    Window_Base.prototype.initialize.call(this, this.windowX(), y, this.windowWidth( ), this.windowHeight( y ) );
    this.quest_id = '';
    this.questData = Quest.Invalid;
    this.refresh();
};
QuestDetailWindow.prototype.windowX = function(){
    return Graphics.boxWidth / QuestLogScene.LayoutSize;
};
QuestDetailWindow.prototype.windowWidth = function(){
    return this.windowX() * (QuestLogScene.LayoutSize-1);
};
QuestDetailWindow.prototype.windowHeight = function( y ){
    return Graphics.boxHeight - y;
};
QuestDetailWindow.prototype.clear = function () {
    //this.setItem();
};
QuestDetailWindow.prototype.setItem = function (quest_id) {

    this.questData = Quests.get(quest_id);

    this.refresh();
};
QuestDetailWindow.prototype.refresh = function () {

    this.contents.clear();

    if (this.questData && this.questData.id() !== Quest.INVALID) {
        this.renderQuestDetail(this.questData);
    }
    else {
        this.renderEmptyQuest();
    }
};
QuestDetailWindow.prototype.drawHorzLine = function (y) {
    this.contents.paintOpacity = 48;
    this.contents.fillRect(0,
        y + this.lineHeight() / 2 - 1,
        this.contentsWidth(), 2,
        this.normalColor());
    this.contents.paintOpacity = 255;
};
QuestDetailWindow.prototype.standardFontSize = function () { return 24; };
QuestDetailWindow.prototype.lineHeight = function () { return 30; };
/**
 * @param {Quest}
 */
QuestDetailWindow.prototype.renderQuestDetail = function (quest) {

    this.changeTextColor(this.normalColor());
    // quest heading

    var line_height = this.lineHeight();
    var base_line = Math.max((28 - this.standardFontSize()) / 2, 0);
    //TITLE
    this.drawText(quest.title(), 40, base_line, this.contentsWidth());
    if( quest.hasIcon() ){
        this.drawIcon( quest.icon() , 0 , base_line);
    }
    else{
        this.drawIcon( 225 , 0, base_line );
        //TITLE
        //this.drawText(quest.title(), 0, base_line, this.contentsWidth());
    }

    this.changeTextColor(this.textColor(23));
    //CATEGORY
    this.drawText(quest.displayCategory(), 40, base_line, this.contentsWidth() - 40 , 'right');
    this.changeTextColor(this.textColor(24));
    var line = Math.max(32, this.lineHeight());
    this.drawHorzLine(line);
    var y = line + line_height;
    var width = this.contentsWidth();
    
    switch( quest.status() ){
        case Quest.Status.Active:
            this.changeTextColor(this.textColor(6));
            break;
        case Quest.Status.Completed:
            this.changeTextColor(this.textColor(24));
            break;
        case Quest.Status.Failed:
            this.changeTextColor(this.textColor(2));
            break;
        case Quest.Status.Cancelled:
            this.changeTextColor(this.textColor(7));
            break;
    }
    // STATUS
    this.drawText(quest.displayStatus(), 0, y, width );
    this.changeTextColor(this.normalColor());
    // REWARD
    this.drawText(quest.displayReward(), 0, y, width, 'right');
    this.drawGauge( 0, y + 8, width, quest.progress() / 100, this.textColor(4), this.textColor(6));
    y += 10;
    //split text in lines
    var desc = quest.displayDetail();
    for (var l = 0; l < desc.length; l++) {
        y += line_height;
        this.drawTextEx(desc[l], 0, y , width );
    }

    //y += line_height * 2;
    y += line_height;
    this.drawHorzLine(line);

    //RENDER STAGES
    for ( var stage in quest.stages() ) {

        var title = quest.stageTitle( stage );
        var progress = quest.stageProgress( stage );
        var objective = quest.stageObjective( stage );
        //var status = quest.stageStatus( stage );

        if( progress < objective ){
            //this.drawIcon( QuestManager.Parameters( 'IconStatusActive', 225) , 0, y);
            this.drawIcon( JayaK.Quests.iconCache( 'IconStatusActive', 0) , -10 , y);

            this.changeTextColor(this.normalColor());
        }
        else{
            //this.drawIcon( QuestManager.Parameters( 'IconStatusCompleted', 225) , 0, y);
            this.drawIcon( JayaK.Quests.iconCache( 'IconStatusCompleted', 0) , -10, y);

            this.changeTextColor(this.textColor(8));
        }

        if (objective > 1) {
            this.drawText( title + ' ( ' + progress + ' / ' + objective + ' )', 20, base_line + y );
        }
        else {
            this.drawText(title, 20, base_line + y );
        }

        this.changeTextColor(this.normalColor());

        if ( quest.behavior() === Quest.Behavior.Linear && progress < objective ) {
            //If behavior is linear, show the stages in progress one by one.
            break;
        }

        y += line_height + 8;
    }
};
/**
 * @description Empty quest window
 */
QuestDetailWindow.prototype.renderEmptyQuest = function () {

    var y = this.contentsHeight() / 3 - this.standardFontSize() / 2 - this.standardPadding();

    this.drawText("-- Empty log --", 10, y, this.contentsWidth(), 'center');
    
    this.changeTextColor(this.textColor(8));
    this.drawText("Select a quest category with Left and Right", 0, y + 40, this.contentsWidth(), 'center');
    this.drawText("Select a quest with Up and Down", 0, y + 80, this.contentsWidth(), 'center');
    this.drawText("Switch the quest status filter with Action", 0, y + 120, this.contentsWidth(), 'center');
    this.changeTextColor(this.normalColor(8));
};








/**
 *
 */
JayaK.Quests = new QuestManager();










