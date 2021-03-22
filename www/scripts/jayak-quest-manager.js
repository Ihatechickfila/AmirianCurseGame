/**
 * @returns {QuestManager}
 */
function QuestManager( ){
    /**
     * @type Array
     */
    var _questLog = [];
    /**
     * @type QuestDataBase
     */
    var _DB = null;
    
    /**
     * Test debug quest module
     * @returns {QuestManager}
     */
    this.fillDataBase = function(){
        
        if( _DB !== null ){
            
            var quests = [
                (new Quest('save-the-world','Save the word'))
                        .addStage({
                            'name':'make-cookies',
                            'title':'Make some cookies',
                            'text':'Mage some grandma cookies',
                            //'status':Quest.Status.active
                        })
                        .addStage({
                            'name':'world-is-safe',
                            'title':'World is save again!!!',
                            'text':'Congratulations!!! youve saved the world!!!',
                            'status':Quest.Status.completed
                        })
            ];
            
            for( var q = 0 ; q < quests.length ; q++ ){
                _DB.register( quests[q] );
            }
        }
        
        return this;
    };
    /**
     * Imports the quests
     * @returns {QuestManager}
     */
    this.load = function(){
        
        if( _DB === null ){
            
            _DB = new QuestDataBase();
            
            this.fillDataBase();

            //initialize quests
            _questLog = _DB.initialize();
        }
        
        return this;
    };
    /**
     * 
     * @param {type} quest_id
     * @returns {Quest}
     */
    this.get = function( quest_id ){
      
        return _DB.get( quest_id );
    };
    /**
     * Current Stage ID of the selected quest
     * @param {String|Number} quest_id
     * @returns {Number}
     */
    this.getStageID = function( quest_id ){
    
        if( _DB.exists( quest_id ) && typeof _questLog[quest_id] !== 'undefined' ){
            
            var log = _questLog[ quest_id ];
            
            return log[ log.length -1 ];
        }

        return -1;
    };
    /**
     * Get the provided quest id's Stage
     * @param {String|Number} quest_id
     * @returns {QuestStage|Boolean}
     */
    this.getStage = function( quest_id ){
        
        if( _DB.exists( quest_id )){
            
            var stage = this.getStageID( quest_id );

            var quest = _DB.get( quest_id );

            return quest.getStage( stage );
        }
        
        return false;
    };
    /**
     * Sets a quest stage
     * @param {Number|String} quest_id
     * @returns {QuestManager}
     */
    this.setStage = function( quest_id , stage_id){
        
        if( _DB.exists( quest_id ) && _DB.get(quest_id).checkStage(stage_id)){
            
            var current = this.getStageID( quest_id );
            
            if( current > stage_id ){
                _questLog[quest_id].push( stage_id );
            }
            else{
                //error
            }
        }
        else{
            //error
        }
        
        return this;
    };
    
    /**
     * Advance to a next stage
     * @param {String|Number} quest_id
     * @returns {QuestManager}
     */
    this.nextStage = function( quest_id ){
        
        var quest = this.get( quest_id );
        
        if( quest !== false && this.getStatus( quest_id ) < Quest.Status.completed ){
            
            var current = this.getStageID( quest_id );
            
            if( current > -1 && current < quest.countStages( ) - 1 ){
                
                this.setStage( quest_id , ++current );
            }
        }
        
        return this;
    };
    /**
     * Get a quest status
     * @param {String|Number} quest_id
     * @returns {Number}
     */
    this.getStatus = function( quest_id ){
        
        var stage_id = this.getStageID( quest_id );
        
        if( stage_id > -1 ){
            
            return this.get( quest_id ).getStage(stage_id).status();
        }
        
        return Quest.Status.invalid;
    };
    /**
     * Is a quest completed
     * @param {Number|String} quest_id
     * @returns {Boolean}
     */
    this.getCompleted = function( quest_id ){
        return this.getStatus( quest_id ) === Quest.Status.completed;
    };
    /**
     * Is a quest failed
     * @param {Number|String} quest_id
     * @returns {Boolean}
     */
    this.getFailed = function( quest_id ){
        return this.getStatus( quest_id ) === Quest.Status.failed;
    };
    /**
     * Is a quest cancelled
     * @param {Number|String} quest_id
     * @returns {Boolean}
     */
    this.getCancelled = function( quest_id ){
        return this.getStatus( quest_id ) === Quest.Status.cancelled;
    };
    /**
     * Is a quest active
     * @param {Number|String} quest_id
     * @returns {Boolean}
     */
    this.getActive = function( quest_id ){
        return this.getStatus( quest_id ) === Quest.Status.active;
    };
    /**
     * Is a quest hidden
     * @param {Number|String} quest_id
     * @returns {Boolean}
     */
    this.getHidden = function( quest_id ){
        return this.getStatus( quest_id ) === Quest.Status.created;
    };
    
    
    
    /**
     * List all quests in the DB
     * @returns {Quest[]}
     */
    this.list = function(){
        
        return _DB.list();
    };
    /**
     * List a given quest stages
     * @param {String|Number} quest_id
     * @returns {QuestStages[]}
     */
    this.listStages = function( quest_id ){
        
        var quest = this.get(quest_id);
        
        return quest !== null ? quest.stages() : [];
    };
    /**
     * @returns {Array}
     */
    this.export = function(){
        return _questLog;
    };
    
    return this.load();
}
/**
 * @returns {QuestDataBase}
 */
function QuestDataBase( ){
    /**
     * @type Quest[]
     */
    var _quests = [];
    /**
     * Get a quest by its id
     * @param {String|Number} id
     * @returns {Quest|Boolean}
     */
    this.get = function( id ){
        
        switch( typeof id ){
            case 'string':
                for( var q = 0 ; q < _quests.length ; q++ ){
                    if( _quests[ q ].name() === id ){
                        return _quests[ q ];
                    }
                }
                break;
            case 'number':
                if( id >= 0 && id < _quests.length ){
                    return _quests[ id ];
                }
                break;
        }
        
        return false;
    };
    /**
     * Check if a quest exists in the db
     * @param {String|Number} quest_id
     * @returns {Boolean}
     */
    this.exists = function( quest_id ){
        switch( typeof quest_id ){
            case 'string':
                for( var q = 0 ; q < _quests.length ; q++ ){
                    if( _quests[ q ].name() === quest_id ){
                        return true;
                    }
                }
                break;
            case 'number':
                if( quest_id >= 0 && quest_id < _quests.length ){
                    return true;
                }
                break;
        }
        
        return false;
    };
    /**
     * List all game quests
     * @returns {Quest[]}
     */
    this.list = function(){ return _quests; }
    /**
     * @returns {Array}
     */
    this.initialize = function(){
        
        var output = [];
        
        for( var q = 0 ; q < _quests.length ; q++ ){
            
            if( _quests[ q ].countStages() ){
                output[ _quests[ q ].name() ] = [ 0 ];
            }
        }
        
        return output;
    };
    /**
     * All registered quests
     * @param {Number} from 
     * @param {Number} to 
     * @returns {Quest[]}
     */
    this.quests = function( from , to ){
        
        if( typeof from !== 'number' ){
            from = Quest.Status.active;
        }
        
        if( typeof to !== 'number' ){
            to = Quest.Status.completed;
        }
        
        var quests = [];
        
        for( var q in _quests ){
            
            var status = q.status();
            
            if( status >= from && status <= to ){
                
                quests.push( q );
            }
        }
        
        return quests;
    };
    /**
     * List the active quests
     * @returns {Quest[]}
     */
    this.activeQuests = function(){
        
        var output = [];
        
        for( var q in _quests ){
            if( q.status() === Quest.Status.active ){
                output.push( q );
            }
        }
        
        return output;
    };
    /**
     * Check if a quest exists
     * @param {String} name
     * @returns {Number}
     */
    this.getID = function( name ){
        for( var q = 0 ; q < _quests.length ; q++ ){
            if( _quests[ q ].name() === name ){
                return q;
            }
        }
        return -1;
    };
    /**
     * Add a quest to the manager
     * @param {Quest} quest
     * @returns {QuestDataBase}
     */
    this.register = function( quest ){
        if( quest instanceof Quest && this.getID( quest.name() ) < 0 ){
        
            _quests.push( quest );
        }
        else{
            console.log( quest );
        }
        
        return this;
    };

    return this;
}
/**
 * @param {String} name 
 * @param {String} title 
 * @returns {Quest}
 */
function Quest( name , title ){
    /**
     * @type Object
     */
    var _quest = {
        'name': name ,
        'title': title
    };
    /**
     * @type QuestStage[]
     */
    var _stages = [];
    /**
     * Quest ID
     * @returns {String}
     */
    this.name = function(){ return _quest.name; };
    /**
     * Quest Title
     * @returns {String}
     */
    this.title = function(){ return _quest.title; };
    /**
     * Current Quest Stage Details
     * @returns {String}
     */
    this.description = function( stage_id ){
        
        var stage = this.getStage( stage_id );
        
        return stage !== false ? stage.details() : '';
    };
    /**
     * List all stages
     * @returns {QuestStage[]}
     */
    this.stages = function(){ return _stages; };
    /**
     * Register Quest Stage
     * @param {QuestStage} stage
     * @returns {Quest}
     */
    this.addStage = function( stage ){

        if( !(stage instanceof QuestStage) && typeof stage === 'object'){
            stage = QuestStage.fromObject( stage );
        }
        else{
            //nothings
            return this;
        }
        
        if( stage !== null && stage.status() > Quest.Status.invalid ) {

            if( this.getStage(stage.name()) === false ){
                _stages.push(stage);
            }
            else{
                console.log('stage already exists!!!');
            }
        }
        else{
            console.log('stage is null or unactivated');
        }

        return this;
    };
    /**
     * Get a quest Stage
     * @param {String|Number} stage_id
     * @returns {QuestStage|Boolean}
     */
    this.getStage = function( stage_id ){
        if( typeof stage_id === 'string' ){
            for( var i = 0 ; i < _stages.length ; i++ ){
                if( _stages[ i ] === stage_id ){
                    return _stages[ i ];
                }
            }
        }
        else if( typeof stage_id === 'number' ){
            if( stage_id >= 0 && stage_id < _stages.length ){
                return _stages[ stage_id ];
            }
        }

        return false;
    };
    /**
     * Check if a stage exists in this quest
     * @param {String|Number} stage_id
     * @returns {Boolean}
     */
    this.checkStage = function( stage_id ){
        if( typeof stage_id === 'string' ){
            for( var i = 0 ; i < _stages.length ; i++ ){
                if( _stages[ i ] === stage_id ){
                    return true;
                }
            }
        }
        else if( typeof stage_id === 'number' ){
            if( stage_id >= 0 && stage_id < _stages.length ){
                return true;
            }
        }
        return false;
    };
    /**
     * @returns {Number}
     */
    this.countStages = function(){ return _stages.length };

    return this;
}
/**
 * 
 * @returns {Quest.Status}
 */
Quest.Status = {
    'invalid': 0,
    'created': 1,
    'active': 2,
    'completed': 3,
    'cancelled': 4,
    'failed': 5
};
/**
 * @param {String} id
 * @param {String} title
 * @param {String} details
 * @param {Number} status
 * @returns {QuestStage}
 */
function QuestStage( id, title , details , status ){
    /**
     * @type Object
     */
    var _stage = {
        'name': id,
        'title': title,
        'text': details,
        'status': typeof status !== 'undefined' ? status : Quest.Status.created
    };
    /**
     * @returns {String}
     */
    this.name = function(){ return _stage.name; };
    /**
     * @returns {String}
     */
    this.title = function(){ return _stage.title; };
    /**
     * @returns {String}
     */
    this.details = function(){ return _stage.text; };
    /**
     * @returns {Number}
     */
    this.status = function(){ return _stage.status; };

    return this;
}
/**
 * Create a new quest stage from an object
 * @param {Object} stage
 * @returns {QuestStage}
 */
QuestStage.fromObject = function( stage ){

    var id = typeof stage.name === 'string' ? stage.name : '';
    var title = typeof stage.title === 'string' ? stage.title : '';
    var text = typeof stage.text === 'string' ? stage.text : '';
    var status = typeof stage.status === 'number' ? stage.status : Quest.Status.active;

    if( id.length && title.length ){
        return new QuestStage(id,title,text,status);
    }
    
    return null;
};



