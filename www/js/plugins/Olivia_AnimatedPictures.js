//=============================================================================
// Olivia Engine - Animated Pictures - for RPG Maker MV version 1.6.1
// Olivia_AnimatedPictures.js
//=============================================================================
 /*:
 * @plugindesc <AnimatedPictures> for RPG Maker MV version 1.6.1.
 * @author Fallen Angel Olivia
 *
 * @help
 * This is a RPG Maker MV plugin that gives functionality to Show Picture events
 * to display animated pictures. Animated pictures are shown in a sprite sheet
 * format. There are looping controls and speed controls that can be used with
 * these animated pictures.
 *
 *
 *
 * -----------------
 * Plugin Parameters
 * -----------------
 *
 * Loop by Default: Animated pictures will loop back to beginning by default
 * once it reaches the last frame.
 *
 * Wait Frames Default: Default number of frames to wait before moving to next
 * picture cell. The lower the number, the faster it goes (1 is the fastest).
 * The higher the number, the slower it goes.
 *
 *
 *
 * ------------
 * Instructions
 * ------------
 * 
 * Save your animated picture into your game project's img/pictures folder.
 * The filename must be named with the following format:
 *
 * filename[HxV]
 *
 * Replace H in the filename with the number of horizontal cells it has.
 * Replace V in the filename with the number of vertical cells it has.
 * The number of total cells it has available is equal the multiplicative
 * product of the horizontal and vertical cells.
 *
 * For example:
 *
 * "Parrot[3x2]" will have 3 horizontal cells and 2 vertical cells. This means
 * there are a total of 6 cells that will be used for this animated picture.
 *
 * Animations will be played from left to right, then up to down so please
 * arrange them as such. For example, 4x5 will play like this:
 *
 *  1  2  3  4
 *  5  6  7  8
 *  9 10 11 12
 * 13 14 15 16
 * 17 18 19 20
 *
 * Keep this in mind as you format your animated pictures.
 *
 *
 *
 * ---------------
 * Plugin Commands
 * ---------------
 *
 * If you want to change the settings of specific pictures like loop or speed,
 * please use these plugin commands to change them:
 *
 * AnimatedPicture id NoLoop
 * - Replace id with the ID of the selected picture. The selected picture will
 * not loop after this plugin command takes effect.
 *
 * AnimatedPicture id Loop
 * - Replace id with the ID of the selected picture. The selected picture will
 * loop after this plugin command takes effect.
 *
 * AnimatedPicture id Speed x
 * - Replace id with the ID of the selected picture. Replace x with the number
 * of frames to wait in between animated cells. The higher the number, the
 * faster the picture will animate. The lower the number, the slower the picture
 * will animate. The lowest the speed can go is 1.
 *
 * AnimatedPicture id Reset
 * - Replace id with the ID of the selected picture. This will reset the loop
 * and speed settings for that picture to whatever the value is in the plugin
 * parameters set for default.
 *
 *
 *
 * --------------
 * Good Practices
 * --------------
 *
 * 1. Use animated pictures sparingly if possible. RPG Maker MV's cache has a
 * limited size to it, which means the more animated pictures you use, the
 * faster it will fill up. And the faster it fills up, the more it needs to be
 * emptied to allow other assets in your game to load at all.
 *
 * 2. If you do use animated pictures, trim down as much empty space as possible
 * and keep picture cells to a minimum size to reduce bloating the cache.
 *
 * 3. If it is practical, make your sprite sheet cells work towards a power of
 * 2 (ie: sizes of 32x32, 64x64, 128x128, 256x256, etc). Bitmaps render best
 * when it works in this cell range. This is not necessary, but it is a thing
 * to keep in mind.
 *
 * 4. Limit the amount of colors used in the animated picture to reduce the
 * filesize of the image and reduce the strain on the cache. Use more flat
 * colors instead of gradients. These work better for the engine.
 *
 * 5. When you are done using the animated picture, use the Erase Picture
 * command to clear the picture from use. This will stop the animation frame
 * calculating and reduce strain on your game.
 *
 *
 *
 * -------------------
 * W A R N I N G ! ! !
 * -------------------
 *
 * This plugin is made for RPG Maker MV versions 1.6.1 and below. If you update
 * RPG Maker MV past that and this plugin breaks, I am NOT responsible for it.
 *
 * ------------
 * Terms of Use
 * ------------
 * 
 * 1. These plugins may be used in free or commercial games.
 * 2. 'Fallen Angel Olivia' must be given credit in your games.
 * 3. You are allowed to edit the code.
 * 4. Do NOT change the filename, parameters, and information of the plugin.
 * 5. You are NOT allowed to redistribute these Plugins.
 * 6. You may NOT take code for your own released Plugins without credit.
 *
 * -------
 * Credits
 * -------
 *
 * If you are using this plugin, credit the following people:
 * 
 * - Fallen Angel Olivia
 *
 * @param 
 * @param 
 * @param ATTENTION!!!
 * @default READ THE HELP FILE
 * @param 
 * @param 
 *
 * @param Loop by Default
 * @type boolean
 * @on YES
 * @off NO
 * @desc Animated pictures will loop back to beginning by default once it reaches the last frame.
 * @default true
 *
 * @param Wait Frames Default
 * @type number
 * @min 1
 * @desc Default number of frames to wait before moving to next picture cell
 * @default 4
 *
 */
//=============================================================================

var Imported = Imported || {};
Imported.Olivia_AnimatedPictures = true;

var Olivia = Olivia || {};

var parameters = $plugins.filter(function(p) { return p.description.contains('<AnimatedPictures>') })[0].parameters;

Olivia.AnimatedPictures = {
    defaultLoop:       eval(parameters['Loop by Default']),
    defaultWaitFrames: Math.max(1, Number(parameters['Wait Frames Default']))
}

//-----------------------------------------------------------------------------
// Game_Screen
//
// The game object class for screen effect data, such as changes in color tone
// and flashes.

Olivia.AnimatedPictures.___Game_Screen_initialize___ = Game_Screen.prototype.initialize;
Game_Screen.prototype.initialize = function() {
    Olivia.AnimatedPictures.___Game_Screen_initialize___.call(this);
    this.initializeAnimatedPictureSettings();
};

Game_Screen.prototype.initializeAnimatedPictureSettings = function() {
    this._animatedPictureLoop = [];
    this._animatedPictureWait = [];
};

Game_Screen.prototype.isAnimatedPictureLooping = function(pictureId) {
    if (this._animatedPictureLoop === undefined) {
        this.initializeAnimatedPictureSettings();
    }
    var realPictureId = this.realPictureId(pictureId);
    if (this._animatedPictureLoop[realPictureId] === undefined) {
        this._animatedPictureLoop[realPictureId] = Olivia.AnimatedPictures.defaultLoop;
    }
    return this._animatedPictureLoop[realPictureId];
};

Game_Screen.prototype.setAnimatedPictureLooping = function(pictureId, value) {
    if (this._animatedPictureLoop === undefined) {
        this.initializeAnimatedPictureSettings();
    }
    var realPictureId = this.realPictureId(pictureId);
    this._animatedPictureLoop[realPictureId] = value;
};

Game_Screen.prototype.getAnimatedPictureWaitFrames = function(pictureId) {
    if (this._animatedPictureWait === undefined) {
        this.initializeAnimatedPictureSettings();
    }
    var realPictureId = this.realPictureId(pictureId);
    if (this._animatedPictureWait[realPictureId] === undefined) {
        this._animatedPictureWait[realPictureId] = Olivia.AnimatedPictures.defaultWaitFrames;
    }
    return this._animatedPictureWait[realPictureId];
};

Game_Screen.prototype.setAnimatedPictureWaitFrames = function(pictureId, value) {
    if (this._animatedPictureWait === undefined) {
        this.initializeAnimatedPictureSettings();
    }
    var realPictureId = this.realPictureId(pictureId);
    this._animatedPictureWait[realPictureId] = value;
};

//-----------------------------------------------------------------------------
// Game_Interpreter
//
// The interpreter for running event commands.

Olivia.AnimatedPictures.___Game_Interpreter_pluginCommand___ = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    Olivia.AnimatedPictures.___Game_Interpreter_pluginCommand___.call(this, command, args);
    if (command.match(/AnimatedPicture/i)) {
        var pictureId = args.shift();
        if (pictureId > 0 && pictureId <= $gameScreen.maxPictures()) {
            var setting = args.shift();
            if (setting.match(/NoLoop/i)) {
                $gameScreen.setAnimatedPictureLooping(pictureId, false);
            } else if (setting.match(/Loop/i)) {
                $gameScreen.setAnimatedPictureLooping(pictureId, true);
            } else if (setting.match(/Speed/i)) {
                var value = Math.max(1, parseInt(args.shift()));
                $gameScreen.setAnimatedPictureWaitFrames(pictureId, value);
            } else if (setting.match(/Reset/i)) {
                $gameScreen.setAnimatedPictureLooping(pictureId, undefined);
                $gameScreen.setAnimatedPictureWaitFrames(pictureId, undefined);
            }
        } else {
            alert(pictureId + ' is not a valid Picture ID number.')
        }
    }
};

//-----------------------------------------------------------------------------
// Sprite_Picture
//
// The sprite for displaying a picture.

Olivia.AnimatedPictures.___Sprite_Picture_initialize___ =Sprite_Picture.prototype.initialize;
Sprite_Picture.prototype.initialize = function(pictureId) {
    this.initializeAnimatedPicture();
    Olivia.AnimatedPictures.___Sprite_Picture_initialize___.call(this, pictureId);
};

Sprite_Picture.prototype.initializeAnimatedPicture = function() {
    this._isAnimatedPicture = false;
    this._animationHorzCells = 1;
    this._animationVertCells = 1;
    this._animationMaxCells = 1;
    this._animationCount = 0;
    this._animationIndex = 0;

};

Olivia.AnimatedPictures.___Sprite_Picture_loadBitmap___ = Sprite_Picture.prototype.loadBitmap;
Sprite_Picture.prototype.loadBitmap = function() {
    this.setupAnimatedPictureData();
    Olivia.AnimatedPictures.___Sprite_Picture_loadBitmap___.call(this);
    if (this._isAnimatedPicture) {
        this.bitmap.addLoadListener(this.updateAnimatedPictureFrame.bind(this));
    } else {
        this.bitmap.addLoadListener(this.resetFrame.bind(this));
    }
};

Sprite_Picture.prototype.resetFrame = function() {
    this.setFrame(0, 0, this.bitmap.width, this.bitmap.height);
};

Sprite_Picture.prototype.setupAnimatedPictureData = function() {
    if (this._pictureName.match(/\[(\d+)x(\d+)\]/i)) {
        this._isAnimatedPicture = true;
        this._animationHorzCells = Math.max(1, parseInt(RegExp.$1));
        this._animationVertCells = Math.max(1, parseInt(RegExp.$2));
        this._animationMaxCells = this._animationHorzCells * this._animationVertCells;
    } else {
        this._isAnimatedPicture = false;
        this._animationHorzCells = 1;
        this._animationVertCells = 1;
        this._animationMaxCells = 1;
    }
    this._animationCount = 0;
    this._animationIndex = 0;
};

Olivia.AnimatedPictures.___Sprite_Picture_update___ = Sprite_Picture.prototype.update;
Sprite_Picture.prototype.update = function() {
    Olivia.AnimatedPictures.___Sprite_Picture_update___.call(this);
    if (this.visible && this._isAnimatedPicture) {
        this.updateAnimatedPictureCount();
    }
};


Sprite_Picture.prototype.updateAnimatedPictureCount = function() {
    this._animationCount += 1;
    if (this._animationCount >= this.animationWaitFrames()) {
        this._animationCount = 0;
        this._animationIndex += 1;
        if (this._animationIndex >= this._animationMaxCells) {
            if (this.isAnimationLooping()) {
                this._animationIndex = 0;
            } else {
                this._animationIndex = this._animationMaxCells - 1;
            }
        }
        this.updateAnimatedPictureFrame();
    }
};

Sprite_Picture.prototype.updateAnimatedPictureFrame = function() {
    var pw = this.bitmap.width / this._animationHorzCells;
    var ph = this.bitmap.height / this._animationVertCells;
    var sx = this._animationIndex % this._animationHorzCells * pw;
    var sy = Math.floor(this._animationIndex / this._animationHorzCells) * ph;
    this.setFrame(sx, sy, pw, ph);
};

Sprite_Picture.prototype.isAnimationLooping = function() {
    return $gameScreen.isAnimatedPictureLooping(this._pictureId);
};

Sprite_Picture.prototype.animationWaitFrames = function() {
    return $gameScreen.getAnimatedPictureWaitFrames(this._pictureId);
};



























