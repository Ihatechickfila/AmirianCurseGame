//=============================================================================
// JayaKun_HUD.js
//=============================================================================
/*:
 * @plugindesc JayaKun_HUD
 * @author JayaKun
 *
 * @help
 * Use: jayak_notify( "message" )
 */

//Window_EquipCommand.prototype.initializeOriginal = Window_EquipCommand.prototype.initialize;

//Window_EquipCommand.prototype.initialize = function(x, y, width) {
//    this._windowWidth = width;
//    Window_HorzCommand.prototype.initialize.call(this, x, y);
//};

//Window_Base._iconWidth  = 32;
//Window_Base._iconHeight = 32;

/*Window_Base.prototype.processDrawIcon = function(iconIndex, textState) {
    this.drawIcon(iconIndex, textState.x - 6, textState.y -6);
    textState.x += Window_Base._iconWidth + 12;
};*/

/*Window_ItemList.prototype.drawItemNumber = function(item, x, y, width) {
    if (this.needsNumber()) {
        this.drawText('x', x, y, width - this.textWidth('00'), 'right');
        this.drawText($gameParty.numItems(item), x, y, width, 'right');
    }
};*/

/*Window_EquipCommand.prototype.initialize = function() {

    this._windowWidth = Graphics.boxWidth;
    this._windowHeight = this.fittingHeight( 2 );
    
    Window_HorzCommand.prototype.initialize.call(this, 0, 0 );
    //Window_Base.prototype.initialize.call(this, 0, 0, width, height);
};*/

Window_EquipStatus.prototype.initialize = function(x, y) {
    //var width = this.windowWidth();
    var width = Graphics.boxWidth / 2;
    var height = this.windowHeight();
    //var height = this.windowHeight() + 156;
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this._actor = null;
    this._tempActor = null;
    this.refresh();
};


Scene_Equip.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createHelpWindow();
    this.createCommandWindow();
    this.createStatusWindow();
    this.createSlotWindow();
    this.createItemWindow();
    this.refreshActor();
};
/**
 * @override
 */
Scene_Equip.prototype.createHelpWindow = function() {
    this._helpWindow = new Window_Help();
    //this._helpWindow.y = Graphics.boxHeight - this._helpWindow.height;
    this.addWindow(this._helpWindow);
};
Scene_Equip.prototype.createCommandWindow = function() {
    var wx = 0;
    var wy = this._helpWindow.height;
    var ww = Graphics.boxWidth;
    this._commandWindow = new Window_EquipCommand( wx , wy , ww );
    this._commandWindow.setHelpWindow(this._helpWindow);
    this._commandWindow.setHandler('equip',    this.commandEquip.bind(this));
    this._commandWindow.setHandler('optimize', this.commandOptimize.bind(this));
    this._commandWindow.setHandler('clear',    this.commandClear.bind(this));
    this._commandWindow.setHandler('cancel',   this.popScene.bind(this));
    this._commandWindow.setHandler('pagedown', this.nextActor.bind(this));
    this._commandWindow.setHandler('pageup',   this.previousActor.bind(this));
    this.addWindow(this._commandWindow);
};

Scene_Equip.prototype.createStatusWindow = function() {
    var wy = this._commandWindow.height + this._commandWindow.y;
    this._statusWindow = new Window_EquipStatus(0, wy );
    this.addWindow(this._statusWindow);
};

Scene_Equip.prototype.createSlotWindow = function() {
    var wx = this._statusWindow.width;
    var wy = this._statusWindow.y;
    var ww = Graphics.boxWidth - this._statusWindow.width;
    var wh = this._statusWindow.height;
    this._slotWindow = new Window_EquipSlot(wx, wy, ww, wh);
    this._slotWindow.setHelpWindow(this._helpWindow);
    this._slotWindow.setStatusWindow(this._statusWindow);
    this._slotWindow.setHandler('ok',       this.onSlotOk.bind(this));
    this._slotWindow.setHandler('cancel',   this.onSlotCancel.bind(this));
    this.addWindow(this._slotWindow);
};

Scene_Equip.prototype.createItemWindow = function() {
    //var wx = this._statusWindow.width;
    //var wy = this._slotWindow.y + this._slotWindow.height;
    //var ww = Graphics.boxWidth - this._statusWindow.width;
    //var wh = this._statusWindow.height - this._slotWindow.height;
    var wx = 0;
    var wy = this._statusWindow.y + this._statusWindow.height;
    var ww = Graphics.boxWidth;
    var wh = Graphics.boxHeight - wy;
    this._itemWindow = new Window_EquipItem(wx, wy, ww, wh);
    this._itemWindow.setHelpWindow(this._helpWindow);
    this._itemWindow.setStatusWindow(this._statusWindow);
    this._itemWindow.setHandler('ok',     this.onItemOk.bind(this));
    this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
    this._slotWindow.setItemWindow(this._itemWindow);
    this.addWindow(this._itemWindow);
};

