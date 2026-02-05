
var canvas, stage;
var builder;
var touchdev = false;

// イベント関数
var timer_func = new Function();	timer_func = null;
var click_func = new Function();	click_func = null;
var move_func = new Function();		move_func = null;
var release_func = new Function();	release_func = null;
var waitcount=0;
var stat=0;

// ゲームオブジェクト
var game = new Game();

// 表示位置
var org = {view_w:840,view_h:840,cel_w:27,cel_h:18,ypos_mes:688,ypos_arm:770};	// オリジナルサイズ
var nume = 1;
var deno = 1;
var view_w,view_h;
var cel_w,cel_h;	// カードの大きさと
var ypos_mes;		// メッセージ、戦闘ダイスの位置
var ypos_arm;		// 各軍のステータス表示位置
var dot;			// 1ドットの大きさ

// セル描画位置
var cpos_x = new Array();
var cpos_y = new Array();

// スプライト
var spr = new Array();

// スプライト番号
var sn_area = 0;
var sn_from = 0;	// 攻撃元エリアのスプライト番号
var sn_to = 0;	// 攻撃先エリアのスプライト番号
var sn_dice = 0;
var sn_info = 0;
var sn_ban = 0;
var sn_player = 0;
var sn_battle = 0;
var sn_supply = 0;
var sn_gameover = 0;
var sn_win = 0;
var sn_title = 0;
var sn_pmax = 0;
var sn_load = 0;
var sn_mes = 0;
var sn_btn = 0;
var sn_max = 0;	// 最大数

var prio = new Array();		// エリアダイスの表示順
var an2sn = new Array();	// エリア番号からダイススプライト番号を返す

// ボタン
var bmax = 0;
var activebutton = -1;
var btn_func = new Array();

// バトルクラス
var Battle = function(){
	this.dn = 0;	// ダイス番号(止めるべき位置)
	this.arm = 0;	// ダイス色
	this.dmax = 0;	// ダイス数
	this.deme = [0,0,0,0,0,0,0,0];
	this.sum = 0;
	this.fin = [0,0,0,0,0,0,0,0];	// 終了フラグ
	this.usedice = [0,1,2,3,4,5,6,7];	// 使うダイス
}
var battle = new Array();
var bturn = 0;	// バトル用ターン

// 履歴の再生用
var replay_c=0;

// サウンド関係
var soundon = GameConfig.soundEnabled;
var manifest = [
	{"src":"./sound/button.wav",	"id":"snd_button"},
	{"src":"./sound/clear.wav",		"id":"snd_clear"},
	{"src":"./sound/click.wav",		"id":"snd_click"},
	{"src":"./sound/dice.wav",		"id":"snd_dice"},
	{"src":"./sound/fail.wav",		"id":"snd_fail"},
	{"src":"./sound/myturn.wav",	"id":"snd_myturn"},
	{"src":"./sound/over.wav",		"id":"snd_over"},
	{"src":"./sound/success.wav",	"id":"snd_success"}
];

// 縮尺に合わせてリサイズ
function resize(n){
	return n*nume/deno;
}

// 起動
window.addEventListener("load", init);
function init() {
	var i,j,c,n;

	canvas = document.getElementById("myCanvas");
	stage = new createjs.Stage(canvas);
	
	if(createjs.Touch.isSupported() == true) {
	   createjs.Touch.enable(stage);
	   touchdev = true;
	}
//	   touchdev = true;
	if( touchdev ){
		soundon = false;
	} else {
		soundon = GameConfig.soundEnabled;
	}
	// 表示位置
	var iw = window.innerWidth;
	var ih = window.innerHeight;
	if( iw/org.view_w<ih/org.view_h ){
		nume = iw;
		deno = org.view_w;
	}else{
		nume = ih;
		deno = org.view_h;
	}
	view_w = Math.floor(org.view_w*nume/deno);
	view_h = Math.floor(org.view_h*nume/deno);
	stage.canvas.width = view_w;
	stage.canvas.height = view_h;
	cel_w = org.cel_w*nume/deno;
	cel_h = org.cel_h*nume/deno;
	ypos_mes = org.ypos_mes*nume/deno;
	ypos_arm = org.ypos_arm*nume/deno;
	dot = 1*nume/deno;
	for( i=0; i<2; i++ ) battle[i] = new Battle();

	// スプライト番号
	var sn = 0;

	// セルの位置
	c=0;
	for( i=0; i<game.YMAX; i++ ){
		for( j=0; j<game.XMAX; j++ ){
			cpos_x[c] = j*cel_w;
			if( i%2 ) cpos_x[c] += cel_w/2;
			cpos_y[c] = i*cel_h;
		c++;
		}
	}
	
	// エリア描画 +2 (攻撃元と攻撃先)
	sn_area = sn;
	for( i=0; i<game.AREA_MAX+2; i++ ){
		spr[sn] = new createjs.Shape();
		spr[sn].x = view_w/2-game.XMAX*cel_w/2-cel_w/4;
		spr[sn].y = 50*nume/deno;
		stage.addChild(spr[sn]);
		sn++;
	}
	sn_from = sn_area + game.AREA_MAX;	// 攻撃元エリアのスプライト番号
	sn_to = sn_area + game.AREA_MAX+1;	// 攻撃先エリアのスプライト番号
	
	// エリアダイス
	sn_dice = sn;
	builder = new createjs.SpriteSheetBuilder();
	var mc = new lib.areadice();
	var rect = new createjs.Rectangle(0,0,80,100);
	builder.addMovieClip(mc, rect, nume/deno);
	var spritesheet = builder.build();
	for( i=0; i<game.AREA_MAX; i++ ){
		spr[sn] = new createjs.Sprite(spritesheet);
		stage.addChild(spr[sn]);
		sn++;
	}
	// エリアダイス表示順
	for( i=0; i<game.AREA_MAX; i++ ){
		prio[i] = new Object();
		prio[i].an = i;
		prio[i].cpos = 0;	// 後で使う
	}
	
	// マップ以外のスプライト番号(一括で消すため)
	sn_info = sn;
	
	// プレイヤー状態
	sn_ban = sn;
	spr[sn] = new lib.mc();
	stage.addChild(spr[sn]);
	spr[sn].scaleX = nume/deno;
	spr[sn].scaleY = nume/deno;
	sn++;
	sn_player = sn;
	for( i=0; i<8; i++ ){
		var pd = new lib.mc();
		pd.scaleX = pd.scaleY = 0.12;
		pd.x = -22;
		pd.y = 0;
		spr[sn] = new createjs.Container();
		spr[sn].addChildAt(pd,0);
		var txt = new createjs.Text("", "32px Anton", "Black")
		txt.textBaseline = "middle";
		txt.x = 5;
		spr[sn].addChildAt(txt,1);
		var txt2 = new createjs.Text("", "16px Anton", "Black")
		txt2.textBaseline = "middle";
		txt2.x = 5;
		txt2.y = 28;
		spr[sn].addChildAt(txt2,2);
		stage.addChild(spr[sn]);
		spr[sn].scaleX = nume/deno;
		spr[sn].scaleY = nume/deno;
		sn++;
	}
	
	// バトルダイス
	sn_battle = sn;
	spr[sn] = new createjs.Container();
	spr[sn].y = ypos_mes;
	spr[sn].x = view_w/2;
	spr[sn].scaleX = spr[sn].scaleY = nume/deno;
	var bgshape = new createjs.Shape();
	bgshape.graphics.beginFill("rgba(255,255,255,0.8)").drawRect(-org.view_w/2,-50,org.view_w,360);
	spr[sn].addChild(bgshape);
	for( i=0; i<2; i++ ){
		for( j=0; j<8; j++ ){
			var bs = new lib.mc();
			bs.scaleX = bs.scaleY = 0.15;
			bs.name = "s"+i+j;
			spr[sn].addChild(bs);
		}
		for( j=0; j<8; j++ ){
			var bd = new lib.mc();
			bd.scaleX = bd.scaleY = 0.15;
			bd.name = "d"+i+j;
			spr[sn].addChild(bd);
		}
		var txt = new createjs.Text("37", "80px Anton", "Black")
		txt.textBaseline = "middle";
		txt.textAlign = "center";
		txt.name = "n"+i;
		spr[sn].addChild(txt);
	}
	stage.addChild(spr[sn]);
	sn++;
	
	// 供給ダイス
	sn_supply = sn;
	spr[sn] = new createjs.Container();
	spr[sn].y = ypos_mes;
	spr[sn].x = view_w/2;
	spr[sn].scaleX = spr[sn].scaleY = nume/deno;
	for( i=0; i<game.STOCK_MAX; i++ ){
		var sd = new lib.mc();
		var w = 40;
		sd.x = -(6.5*w)+Math.floor(i/4)*w -(i%4)*w*0.5;
		sd.y = -w*0.7+Math.floor(i%4)*w/2;
		sd.gotoAndStop("d00");
		sd.scaleX = sd.scaleY = 0.1;
		spr[sn].addChildAt(sd,i);
	}
	stage.addChild(spr[sn]);
	sn++;

	// GAMEOVER
	sn_gameover = sn;
	spr[sn] = new createjs.Container();
	spr[sn].x = view_w/2;
	spr[sn].y = view_h/2;
	spr[sn].scaleX = spr[sn].scaleY = nume/deno;
	var goshape = new createjs.Shape();
	goshape.graphics.beginFill("#000000").drawRect(-org.view_w/2+10,-180,org.view_w-20,360);
	goshape.name = "bg";
	spr[sn].addChild(goshape);
	var gotext = new createjs.Text("G A M E O V E R", "80px Anton", "White")
	gotext.textBaseline = "middle";
	gotext.textAlign = "center";
	gotext.name = "mes";
	spr[sn].addChild(gotext);
	stage.addChild(spr[sn]);
	sn++;
	
	// YOU WIN
	sn_win = sn;
	spr[sn] = new lib.mc();
	spr[sn].scaleX = spr[sn].scaleY = nume/deno;
	stage.addChild(spr[sn]);
	sn++;
	
	// タイトル画面
	sn_title = sn;
	spr[sn] = new lib.mc();
	spr[sn].scaleX = spr[sn].scaleY = nume/deno;
	stage.addChild(spr[sn]);
	sn++;
	
	// プレイヤー数設定
	sn_pmax = sn;
	spr[sn] = new createjs.Container();
	for( i=0; i<7; i++ ){
		var ptxt = new createjs.Text((i+2)+" players",Math.floor(32*nume/deno)+"px Anton", "#aaaaaa");
		ptxt.name = "p"+i;
		ptxt.x = view_w/2 -280*nume/deno + Math.floor(i%4)*(180*nume/deno);
		ptxt.y = view_h*0.8 + Math.floor(i/4)*(60*nume/deno);
		ptxt.textAlign = "center";
		ptxt.textBaseline = "middle";
		spr[sn].addChild(ptxt);
	}
	stage.addChild(spr[sn]);
	sn++;
	
	// Loading用(web フォントを読んでおくため)
	sn_load = sn;
	spr[sn] = new createjs.Text("Now loading...", Math.floor(24*nume/deno)+"px Anton", "#000000");
	stage.addChild(spr[sn]);
	sn++;

	// 汎用メッセージ
	sn_mes = sn;
	spr[sn] = new createjs.Text("Now loading...", Math.floor(30*nume/deno)+"px Roboto", "#000000");
	spr[sn].textAlign = "center";
	spr[sn].textBaseline = "middle";
	stage.addChild(spr[sn]);
	sn++;
	
	// ボタン
	var btxt = ["START","TOP PAGE","YES","NO","END TURN","TITLE","HISTORY","SETTINGS"];
	bmax = btxt.length;
	sn_btn = sn;
	for( i=0; i<bmax; i++ ){
		var bt = new lib.mc();
		spr[sn] = new createjs.Container();
		bt.gotoAndStop("btn");
		spr[sn].addChildAt(bt,0);
		var txt = new createjs.Text(btxt[i], "32px Anton", "Black")
		txt.textAlign = "center";
		txt.textBaseline = "middle";
		spr[sn].addChildAt(txt,1);
		stage.addChild(spr[sn]);
		spr[sn].scaleX = nume/deno;
		spr[sn].scaleY = nume/deno;
		spr[sn].visible = true;
		sn++;
		// ボタン関数
		btn_func[i] = new Function();
		btn_func[i] = null;
	}

	// スプライト枚数
	sn_max = sn;
	for( i=0; i<sn_max; i++ ) spr[i].visible = false;
	
	stage.addEventListener("stagemousedown", mouseDownListner );
	stage.addEventListener("stagemousemove", mouseMoveListner );
	stage.addEventListener("stagemouseup", mouseUpListner );
	createjs.Ticker.addEventListener("tick", onTick);
	createjs.Ticker.setFPS(60);

	// Always skip sound loading at startup
	// Note: Sound requires running from a web server (http://), not file://
	// See README_SOUND.md for instructions
	waitcount = 60;
	timer_func = fake_loading;

	// Suppress CreateJS Sound auto-init errors when running from file://
	// The library tests audio capabilities on load, which fails with file:// protocol
	// This is expected and doesn't affect gameplay
}

function handleFileLoad(event){
	var item = event.item;
	if( item.type == createjs.LoadQueue.SOUND ){
		startSound(item.id);
	}	
}
function handleComplete(event){
	waitcount = 30;
	timer_func = fake_loading;
}
var instance = new Array();
function startSound(soundid){
	instance[soundid] = createjs.Sound.createInstance(soundid); // SoundJSのインスタンスを再生(idを指定)
}
function playSound(soundid){
	if( !soundon ) return;
	// Check if sound instance exists (sounds may not be loaded if disabled at startup)
	if( !instance[soundid] ) return;
	instance[soundid].setVolume(GameConfig.soundVolume);
	instance[soundid].play();
}

////////////////////////////////////////////////////
// イベントリスナー群
////////////////////////////////////////////////////

function mouseDownListner(e) {
	if( click_func != null ){ click_func(e); }
	canvas.style.cursor="default";  // マウスカーソルの変更
}
function mouseMoveListner(e) {
	if( move_func != null ){ move_func(e); }
	canvas.style.cursor="default";  // マウスカーソルの変更
}
function mouseUpListner(e) {
	if( release_func != null ){ release_func(e); }
	canvas.style.cursor="default";  // マウスカーソルの変更
	if( activebutton>=0 ){
		if( btn_func[activebutton] != null ){
			playSound("snd_button");
			btn_func[activebutton]();
		}
	}
}

function onTick() {
	if( timer_func != null ){ timer_func(); }
	check_button();
}

// ボタン
function check_button(){
	var i,sn;
	var n=-1;
	for( i=0; i<bmax; i++ ){
		sn = sn_btn+i;
		if( !spr[sn].visible ) continue;
		var pt = spr[sn].globalToLocal(stage.mouseX, stage.mouseY);
		if( spr[sn].hitTest(pt.x,pt.y) ) n=i;
	}
	if( activebutton == n ) return;
	activebutton = n;
	for( var i=0; i<bmax; i++ ){
		if( i==activebutton ){
			spr[sn_btn+i].getChildAt(0).gotoAndStop("press");
		}else{
			spr[sn_btn+i].getChildAt(0).gotoAndStop("btn");
		}
	}
	stage.update();
}

////////////////////////////////////////////////////
// Loading
////////////////////////////////////////////////////

function fake_loading(){
	spr[sn_load].visible = true;
	spr[sn_load].text = " ";
	spr[sn_mes].visible = true;
	spr[sn_mes].text = "Now loading... ";
	spr[sn_mes].x = view_w/2;
	spr[sn_mes].y = view_h/2;
	stage.update();
	waitcount--;
	if( waitcount<=0 ){
		timer_func = null;
		start_title();
	}
}

////////////////////////////////////////////////////
// タイトル画面
////////////////////////////////////////////////////

function start_title(){
	var i;

	for( i=0; i<sn_max; i++ ) spr[i].visible = false;

	// Clean up settings UI if it exists
	var settingsUI = stage.getChildByName("settings_ui");
	if( settingsUI ){
		stage.removeChild(settingsUI);
	}
	
	spr[sn_title].visible = true;
	spr[sn_title].x = 0;
	spr[sn_title].y = 0;
	spr[sn_title].gotoAndStop("title");

	spr[sn_mes].visible = true;
	spr[sn_mes].text = "Copyright (C) 2001 GAMEDESIGN";
	spr[sn_mes].color = "#aaaaaa";
	spr[sn_mes].textAlign = "right";
	spr[sn_mes].x = view_w*0.9;
	spr[sn_mes].y = view_h*0.24;
	
	spr[sn_pmax].visible = true;
	for( i=0; i<7; i++ ){
		spr[sn_pmax].getChildByName("p"+i).color = (i==game.pmax-2)?"#aa0000":"#cccccc";
	}
	
	// ボタン
	spr[sn_btn+0].x = resize(640);
	spr[sn_btn+0].y = resize(390);
	spr[sn_btn+0].visible = true;
	btn_func[0] = make_map;
	spr[sn_btn+7].x = resize(640);
	spr[sn_btn+7].y = resize(490);
	spr[sn_btn+7].visible = true;
	btn_func[7] = start_settings;
	spr[sn_btn+1].x = resize(640);
	spr[sn_btn+1].y = resize(590);
	spr[sn_btn+1].visible = true;
	btn_func[1] = toppage;

	stage.update();

	timer_func = null;
	click_func = click_pmax;
	move_func = null;
	releaese_func = null;	
}

function click_pmax(){
	var i,pmax=-1;
	for( i=0; i<7; i++ ){
		var o = spr[sn_pmax].getChildByName("p"+i);
		var pt = o.globalToLocal(stage.mouseX, stage.mouseY);
		if( Math.abs(pt.x)<(70*nume/deno) && Math.abs(pt.y)<(20*nume/deno) ){
			pmax = i+2;
		}
	}
	if( pmax<0 ) return;
	game.pmax = pmax;
	for( i=0; i<7; i++ ){
		spr[sn_pmax].getChildByName("p"+i).color = (i==game.pmax-2)?"#aa0000":"#cccccc";
	}
	stage.update();
}

////////////////////////////////////////////////////
// マップ作成画面
////////////////////////////////////////////////////

function make_map(){
	var i,j,x,y,n;
	
	for( i=0; i<sn_max; i++ ) spr[i].visible = false;

	game.make_map();
	
	// ダイスの表示順
	for( i=0; i<game.AREA_MAX; i++ ){
		n = prio[i].an;
		prio[i].cpos = game.adat[n].cpos;
	}
	for( i=0; i<game.AREA_MAX-1; i++ ){
		for( j=i; j<game.AREA_MAX; j++ ){
			if( prio[i].cpos>prio[j].cpos ){
				var tmp=prio[i].an; prio[i].an=prio[j].an; prio[j].an=tmp;
				tmp=prio[i].cpos; prio[i].cpos=prio[j].cpos; prio[j].cpos=tmp;
			}
		}
	}
	for( i=0; i<game.AREA_MAX; i++ ){
		n = prio[i].an;
		an2sn[n] = sn_dice+i;
	}

	// エリア塗り
	for( i=0; i<game.AREA_MAX; i++ ){
		draw_areashape(sn_area+i,i,0);
	}
	
	// エリアダイス
	for( i=0; i<game.AREA_MAX; i++ ){
		draw_areadice(sn_dice+i,prio[i].an);
	}

	spr[sn_mes].visible = true;
	spr[sn_mes].text = "Play this board?";
	spr[sn_mes].color = "#000000";
	spr[sn_mes].textAlign = "left";
	spr[sn_mes].x = view_w*0.1;
	spr[sn_mes].y = ypos_mes;

	// ボタン
	spr[sn_btn+2].x = resize(500);
	spr[sn_btn+2].y = ypos_mes;
	spr[sn_btn+2].visible = true;
	btn_func[2] = start_game;
	spr[sn_btn+3].x = resize(650);
	spr[sn_btn+3].y = ypos_mes;
	spr[sn_btn+3].visible = true;
	btn_func[3] = make_map;
	
	stage.update();	
	
	timer_func = null;
	click_func = null;
	move_func = null;
	releaese_func = null;	
}


function draw_areashape( sn, area, paint_mode ){
	var i,j;

	if( game.adat[area].size==0 ){
		spr[sn].visible = false;
		return;
	}
	spr[sn].visible = true;
	spr[sn].graphics.clear();
	var cnt = 0;
	var c = game.adat[area].line_cel[cnt];
	var d = game.adat[area].line_dir[cnt];
	var ax = [cel_w/2,cel_w,cel_w,cel_w/2,0,0,cel_w/2];
	var ax_left = [cel_w/2,cel_w,cel_w,cel_w/2,-cel_w/2,-cel_w/2,cel_w/2];
	var s = 3*nume/deno;
	var ay = [-s,s,cel_h-s,cel_h+s,cel_h-s,s,-s];
	var ay_top = [-cel_h/2,-cel_h/2,cel_h-s,cel_h+s,cel_h-s,-cel_h/2,-cel_h/2];
	var line_color = "#222244";
	var armcolor = ["#b37ffe","#b3ff01","#009302","#ff7ffe","#ff7f01","#b3fffe","#ffff01","#ff5858"];
	var color = armcolor[game.adat[area].arm];

	// Paint modes: 0=normal, 1=attack(red), 2=redeploy source(green), 3=redeploy dest(blue)
	if( paint_mode == 1 ) {
		line_color = "#ff0000";
		color = "#000000";
	} else if( paint_mode == 2 ) {
		line_color = "#00ff00";
		color = "#004400";
	} else if( paint_mode == 3 ) {
		line_color = "#0088ff";
		color = "#002244";
	}

	spr[sn].graphics.beginStroke(line_color);
	spr[sn].graphics.setStrokeStyle(4*nume/deno,"round","round").beginFill(color);
	var px=ax[d];
	var py=ay[d];
	spr[sn].graphics.moveTo( cpos_x[c]+px, cpos_y[c]+py );
	for( var i=0; i<100; i++ ){
		// まず線を引く
		var px=ax[d+1];
		var py=ay[d+1];
		spr[sn].graphics.lineTo(cpos_x[c]+px,cpos_y[c]+py);
		cnt++;
		c = game.adat[area].line_cel[cnt];
		d = game.adat[area].line_dir[cnt];
		if( c==game.adat[area].line_cel[0] && d==game.adat[area].line_dir[0] ) break;
	}
}

// エリアダイス
function draw_areadice(sn,area){
	if( game.adat[area].size==0 ){
		spr[sn].visible = false;
		return;
	}
	spr[sn].visible = true;
	var n = game.adat[area].cpos;
	spr[sn].x = Math.floor(cpos_x[n] + 6*nume/deno);
	spr[sn].y = Math.floor(cpos_y[n] - 10*nume/deno);
	spr[sn].gotoAndStop(game.adat[area].arm*10+game.adat[area].dice-1);
}

////////////////////////////////////////////////////
// プレイ開始
////////////////////////////////////////////////////

function start_game(){
	game.start_game();
	start_player();
}

// プレイヤー状態
function draw_player_data(){
	var i;
	var pnum = 0;
	for( i=0; i<8; i++ ){
		spr[sn_player+i].visible = false;
		var p = game.jun[i];
		if( game.player[p].area_tc > 0 ){
			spr[sn_player+i].visible = true;
			pnum++;
		}
	}
	var c=0;
	for( i=0; i<8; i++ ){
		var p = game.jun[i];
		if( game.player[p].area_tc == 0 )continue;
		var sn = sn_player+i;
		w = 100*nume/deno;
		var ox = view_w/2-(pnum-1)*w/2+c*w;
		spr[sn].x = ox;//-22*nume/deno;
		spr[sn].y = ypos_arm;
		spr[sn].getChildAt(0).gotoAndStop("d"+p+"0");
	        //  Use lighter color for numbers.
	        spr[sn].getChildAt(1).color = "#606060";
		spr[sn].getChildAt(1).text = ""+game.player[p].area_tc;
		spr[sn].getChildAt(2).text = "";
		if( game.player[p].stock>0 ) spr[sn].getChildAt(2).text = ""+game.player[p].stock;
	        //  Use lighter color for numbers.
	        if( game.player[p].stock>0 ) spr[sn].getChildAt(2).color = "#606060";
		if( i==game.ban ){
			spr[sn_ban].x = ox;
			spr[sn_ban].y = ypos_arm;
			spr[sn_ban].gotoAndStop("ban");
			spr[sn_ban].visible = true;
		}
		c++;
	}
}

////////////////////////////////////////////////////
// 順番が来た
////////////////////////////////////////////////////

function start_player(){
	
	for( var i=sn_info; i<sn_max; i++ ){
		spr[i].visible = false;
	}
	draw_player_data();
	
	if( game.jun[game.ban] == game.user ){
		start_man();
	}else{
//		start_man();
		start_com();
	}
}

////////////////////////////////////////////////////
// プレイヤーの行動開始
////////////////////////////////////////////////////

function start_man(){
	var pn = game.jun[game.ban];
	var allianceInfo = game.get_alliance_info(pn);

	spr[sn_mes].visible = true;
	if( allianceInfo ) {
		var allyNum = allianceInfo.target;
		spr[sn_mes].text = "Allied with P" + (allyNum + 1) + " (" + allianceInfo.turns_remaining + " rounds)";
		spr[sn_mes].color = "#00aa00";
	} else {
		spr[sn_mes].text = "1. Click your area. 2. Click neighbor to attack.";
		spr[sn_mes].color = "#000000";
	}
	spr[sn_mes].textAlign = "left";
	spr[sn_mes].x = view_w*0.05;
	spr[sn_mes].y = ypos_mes;
	
	// ボタン
	activebutton = -1;	// ボタンをクリックしてないのにendturnになるバグ対応
	spr[sn_btn+4].x = view_w-100*nume/deno;
	spr[sn_btn+4].y = ypos_mes;
	spr[sn_btn+4].visible = true;
	spr[sn_btn+4].getChildAt(1).text = "END TURN";
	btn_func[4] = end_turn;

	// Diplomacy button (if alliances enabled, player has no active alliance, and hasn't used diplomacy this round)
	var pn = game.jun[game.ban];
	var hasAlliance = game.get_alliance_info(pn) !== null;
	var usedDiplomacyThisRound = game.diplomacy_used_round[pn] === game.current_round;

	if( GameConfig.allowAlliances && !hasAlliance && !usedDiplomacyThisRound ) {
		spr[sn_btn+3].x = view_w-100*nume/deno;
		spr[sn_btn+3].y = ypos_mes - resize(60);
		spr[sn_btn+3].visible = true;
		spr[sn_btn+3].getChildAt(1).text = "DIPLOMACY";
		btn_func[3] = start_diplomacy;
	} else {
		spr[sn_btn+3].visible = false;
		btn_func[3] = null;
	}
	
	spr[sn_from].visible = false;
	spr[sn_to].visible = false;
	stage.update();
	
	timer_func = null;
	click_func = first_click;
	move_func = null;
	releaese_func = null;	
}

// クリックしたエリアの取得
function clicked_area(){
	var i,sn;
	var ret = -1;
	for( i=0; i<game.AREA_MAX; i++ ){
		if( game.adat[i].size==0 ) continue;
		sn = sn_area+i;
		var pt = spr[sn].globalToLocal(stage.mouseX, stage.mouseY);
		if( spr[sn].hitTest(pt.x,pt.y) ) ret=i;
	}
	for( i=0; i<game.AREA_MAX; i++ ){
		var a = prio[i].an;
		if( game.adat[a].size==0 ) continue;
		sn = sn_dice+i;
		var pt = spr[sn].globalToLocal(stage.mouseX, stage.mouseY);
		if( spr[sn].hitTest(pt.x,pt.y) ) ret=a;
	}
	return ret;
}

// 一回目
function first_click(){
	var p = game.jun[game.ban];
	var an = clicked_area();
	if( an<0 ) return;
	if( game.adat[an].arm != p ) return;
	if( game.adat[an].dice<=1 ) return;

	spr[sn_mes].visible = false;
		
	game.area_from = an;
	draw_areashape(sn_from,an,1);

	playSound("snd_click");

	stage.update();
	click_func = second_click;
}

// 二回目
function second_click(){
	var p = game.jun[game.ban];
	var an = clicked_area();
	if( an<0 ) return;
	
	// 同じエリアで選択解除	
	if( an==game.area_from ){
		start_man();
		return;
	}
	if( game.adat[an].arm == p ) return;
	if( game.adat[an].join[game.area_from]==0 ) return;
	
	game.area_to = an;
	draw_areashape(sn_to,an,1);
	stage.update();
	playSound("snd_click");
	start_battle();
}

// 行動終了
function end_turn(){

	spr[sn_btn+4].visible = false;
	spr[sn_btn+3].visible = false;
	spr[sn_from].visible = false;
	spr[sn_to].visible = false;
	spr[sn_mes].visible = false;

	// Clean up any diplomacy overlays
	stage.removeChild(stage.getChildByName("diplomacy_ui"));
	stage.removeChild(stage.getChildByName("alliance_result"));

	timer_func = null;
	click_func = null;
	move_func = null;
	releaese_func = null;

	// Check if redeployment phase should be triggered
	var pn = game.jun[game.ban];
	if (GameConfig.allowRedeployment && pn === game.user) {
		start_redeploy();
	} else {
		start_supply();
	}
}

////////////////////////////////////////////////////
// Dice Redeployment Phase
////////////////////////////////////////////////////

var redeploy_source = -1;
var redeploy_dest = -1;

function start_redeploy(){
	var pn = game.jun[game.ban];

	// Hide any previous highlights
	spr[sn_from].visible = false;
	spr[sn_to].visible = false;

	// Show instructions
	spr[sn_mes].visible = true;
	spr[sn_mes].text = "REDEPLOYMENT PHASE: Click source, then destination";
	spr[sn_mes].color = "#00aa00";
	spr[sn_mes].font = Math.floor(24*nume/deno)+"px Roboto";
	spr[sn_mes].textAlign = "center";
	spr[sn_mes].x = view_w/2;
	spr[sn_mes].y = ypos_mes;

	// Show "Done Redeploying" button
	spr[sn_btn+4].x = view_w/2;
	spr[sn_btn+4].y = resize(750);
	spr[sn_btn+4].visible = true;
	spr[sn_btn+4].getChildAt(1).text = "DONE";
	btn_func[4] = finish_redeploy;

	stage.update();

	redeploy_source = -1;
	redeploy_dest = -1;

	timer_func = null;
	click_func = redeploy_first_click;
	move_func = null;
	releaese_func = null;
}

function redeploy_first_click(){
	var i,c;
	var an = -1;
	var pn = game.jun[game.ban];

	// Find clicked area
	for( i=0; i<game.AREA_MAX; i++ ){
		if( game.adat[i].size == 0 ) continue;
		if( game.adat[i].arm != pn ) continue;
		if( game.adat[i].dice <= 1 ) continue;  // Need at least 2 dice

		c = game.adat[i].cpos;
		var pt = spr[sn_area+i].globalToLocal(stage.mouseX,stage.mouseY);
		if( spr[sn_area+i].hitTest(pt.x,pt.y) ){
			an = i;
			break;
		}
	}

	if( an < 0 ) return;

	// Check if this area has valid targets
	var targets = game.get_redeploy_targets(an);
	if( targets.length === 0 ) {
		spr[sn_mes].text = "No valid destinations from this territory!";
		spr[sn_mes].color = "#aa0000";
		stage.update();
		return;
	}

	redeploy_source = an;

	// Highlight source in green
	draw_areashape(sn_from, an, 2);  // 2 for green highlight
	spr[sn_from].visible = true;

	spr[sn_mes].text = "Select destination (adjacent owned territory)";
	spr[sn_mes].color = "#00aa00";

	stage.update();
	playSound("snd_click");

	click_func = redeploy_second_click;
}

function redeploy_second_click(){
	var i,c;
	var an = -1;
	var pn = game.jun[game.ban];

	// Find clicked area
	for( i=0; i<game.AREA_MAX; i++ ){
		if( game.adat[i].size == 0 ) continue;
		if( game.adat[i].arm != pn ) continue;

		c = game.adat[i].cpos;
		var pt = spr[sn_area+i].globalToLocal(stage.mouseX,stage.mouseY);
		if( spr[sn_area+i].hitTest(pt.x,pt.y) ){
			an = i;
			break;
		}
	}

	if( an < 0 ) return;

	// Check if clicking same area (deselect)
	if( an === redeploy_source ) {
		spr[sn_from].visible = false;
		spr[sn_mes].text = "REDEPLOYMENT PHASE: Click source, then destination";
		stage.update();
		redeploy_source = -1;
		click_func = redeploy_first_click;
		return;
	}

	// Validate redeployment
	if( !game.can_redeploy(redeploy_source, an) ) {
		spr[sn_mes].text = "Invalid destination! Must be adjacent and owned by you";
		spr[sn_mes].color = "#aa0000";
		stage.update();
		return;
	}

	redeploy_dest = an;

	// Highlight destination in blue
	draw_areashape(sn_to, an, 3);  // 3 for blue highlight
	spr[sn_to].visible = true;

	stage.update();
	playSound("snd_click");

	// Show dice count picker
	show_dice_picker();
}

// Track selected dice count for picker
var selected_dice_count = 1;

function show_dice_picker(){
	var maxDice = game.adat[redeploy_source].dice - 1;  // Leave at least 1

	// Default selection to 1
	selected_dice_count = 1;

	// Create picker UI
	stage.removeChild(stage.getChildByName("dice_picker"));

	var picker = new createjs.Container();
	picker.name = "dice_picker";

	// Background
	var bg = new createjs.Shape();
	bg.graphics.beginFill("rgba(0,0,0,0.8)").drawRect(-resize(220), -resize(100), resize(440), resize(200));
	picker.addChild(bg);

	// Title
	var title = new createjs.Text("Move how many dice?", Math.floor(28*nume/deno)+"px Roboto", "#ffffff");
	title.textAlign = "center";
	title.textBaseline = "middle";
	title.y = -resize(60);
	picker.addChild(title);

	// Subtitle instruction
	var subtitle = new createjs.Text("Click number to select, then click DONE to confirm", Math.floor(18*nume/deno)+"px Roboto", "#aaaaaa");
	subtitle.textAlign = "center";
	subtitle.textBaseline = "middle";
	subtitle.y = -resize(30);
	picker.addChild(subtitle);

	// Dice count buttons (limit to 3 max, matching backend limit)
	var maxButtons = Math.min(maxDice, 3);
	for( var i = 1; i <= maxButtons; i++ ) {
		var btn = new createjs.Container();
		btn.name = "dice_btn_" + i;
		btn.cursor = "pointer";

		var btnBg = new createjs.Shape();
		btnBg.name = "bg";
		var btnTxt = new createjs.Text(i.toString(), Math.floor(32*nume/deno)+"px Anton", "#ffffff");
		btnTxt.name = "txt";
		btnTxt.textAlign = "center";
		btnTxt.textBaseline = "middle";

		// Apply selection styling (1 is selected by default)
		if( i === 1 ) {
			btnBg.graphics.beginFill("#ffffff").drawRect(-resize(35), -resize(25), resize(70), resize(50));
			btnBg.graphics.beginStroke("#00aa00").setStrokeStyle(3).drawRect(-resize(35), -resize(25), resize(70), resize(50));
			btnTxt.color = "#00aa00";
		} else {
			btnBg.graphics.beginFill("#00aa00").drawRect(-resize(35), -resize(25), resize(70), resize(50));
			btnBg.graphics.beginStroke("#ffffff").setStrokeStyle(2).drawRect(-resize(35), -resize(25), resize(70), resize(50));
			btnTxt.color = "#ffffff";
		}

		btn.addChild(btnBg);
		btn.addChild(btnTxt);

		var xOffset = (i - (maxButtons+1)/2) * resize(80);
		btn.x = xOffset;
		btn.y = resize(20);

		picker.addChild(btn);
	}

	picker.x = view_w/2;
	picker.y = view_h/2;

	stage.addChild(picker);
	stage.update();

	click_func = click_dice_picker;
}

function click_dice_picker(){
	var maxDice = game.adat[redeploy_source].dice - 1;
	var maxButtons = Math.min(maxDice, 3);
	var picker = stage.getChildByName("dice_picker");
	if( !picker ) return;

	// Check number button clicks (for selection only)
	for( var i = 1; i <= maxButtons; i++ ) {
		var btn = picker.getChildByName("dice_btn_" + i);
		if( btn ) {
			var pt = btn.globalToLocal(stage.mouseX, stage.mouseY);
			if( Math.abs(pt.x) < resize(35) && Math.abs(pt.y) < resize(25) ) {
				// Update selection
				if( selected_dice_count !== i ) {
					// Deselect old button
					update_dice_button_style(picker, selected_dice_count, false);

					// Select new button
					selected_dice_count = i;
					update_dice_button_style(picker, selected_dice_count, true);

					stage.update();
					playSound("snd_click");
				}
				return;
			}
		}
	}
}

function update_dice_button_style(picker, buttonNum, selected){
	var btn = picker.getChildByName("dice_btn_" + buttonNum);
	if( !btn ) return;

	var bg = btn.getChildByName("bg");
	var txt = btn.getChildByName("txt");
	if( !bg || !txt ) return;

	// Clear and redraw background with new style
	bg.graphics.clear();
	if( selected ) {
		// Selected: white background, green text, green border
		bg.graphics.beginFill("#ffffff").drawRect(-resize(35), -resize(25), resize(70), resize(50));
		bg.graphics.beginStroke("#00aa00").setStrokeStyle(3).drawRect(-resize(35), -resize(25), resize(70), resize(50));
		txt.color = "#00aa00";
	} else {
		// Unselected: green background, white text, white border
		bg.graphics.beginFill("#00aa00").drawRect(-resize(35), -resize(25), resize(70), resize(50));
		bg.graphics.beginStroke("#ffffff").setStrokeStyle(2).drawRect(-resize(35), -resize(25), resize(70), resize(50));
		txt.color = "#ffffff";
	}
}

function execute_redeploy_move(count){
	// Execute the redeployment
	game.execute_redeploy(redeploy_source, redeploy_dest, count);

	// Update visuals
	draw_areadice(an2sn[redeploy_source], redeploy_source);
	draw_areadice(an2sn[redeploy_dest], redeploy_dest);
	draw_player_data();

	// Remove picker
	stage.removeChild(stage.getChildByName("dice_picker"));

	// Clear highlights
	spr[sn_from].visible = false;
	spr[sn_to].visible = false;

	// Update message
	spr[sn_mes].text = "Moved " + count + " dice. Continue or click DONE";
	spr[sn_mes].color = "#00aa00";

	stage.update();
	playSound("snd_success");

	// Reset for next move
	redeploy_source = -1;
	redeploy_dest = -1;
	click_func = redeploy_first_click;
}

function finish_redeploy(){
	// If dice picker is visible, execute the move with selected amount
	var picker = stage.getChildByName("dice_picker");
	if( picker && redeploy_source >= 0 && redeploy_dest >= 0 ) {
		// Execute the redeployment
		game.execute_redeploy(redeploy_source, redeploy_dest, selected_dice_count);

		// Update visuals
		draw_areadice(an2sn[redeploy_source], redeploy_source);
		draw_areadice(an2sn[redeploy_dest], redeploy_dest);
		draw_player_data();

		playSound("snd_success");
	}

	// Clean up
	spr[sn_from].visible = false;
	spr[sn_to].visible = false;
	spr[sn_mes].visible = false;
	spr[sn_btn+4].visible = false;
	stage.removeChild(stage.getChildByName("dice_picker"));

	stage.update();

	// Proceed to supply phase
	start_supply();
}

////////////////////////////////////////////////////
// COM思考
////////////////////////////////////////////////////

function start_com(){
	
	var ret = game.com_thinking();
	if( ret==0 ){
		start_supply();
		return;
	}
	stage.update();
	
	waitcount = 5;
	timer_func = com_from;
	click_func = null;
	move_func = null;
	releaese_func = null;
}

function com_from(){
	waitcount--;
	if( waitcount>0 ) return;
	
	draw_areashape(sn_from,game.area_from,1);
	stage.update();
	
	waitcount = 5;
	timer_func = com_to;
}

function com_to(){
	waitcount--;
	if( waitcount>0 ) return;

	draw_areashape(sn_to,game.area_to,1);
	stage.update();

	start_battle();
}


////////////////////////////////////////////////////
// 戦闘
////////////////////////////////////////////////////

function start_battle(){
	var i,j;

	spr[sn_btn+4].visible = false;	// END TURNボタン消す
	
        /*  20220911  by parke
        //  don't hide bottom banner during combat.
	spr[sn_ban].visible = false;
	for( i=0; i<8; i++ ){
		spr[sn_player+i].visible = false;
	}
	*/

	//  戦闘シーンの変数
	//  battle scene variables
	var an = [game.area_from,game.area_to];
	for( i=0; i<2; i++ ){
		battle[i].arm = game.adat[an[i]].arm;
		battle[i].dmax = game.adat[an[i]].dice;
		for( j=0; j<8; j++ ){
			var r = Math.floor(Math.random()*8);
			var tmp = battle[i].usedice[j];
			battle[i].usedice[j] = battle[i].usedice[r];
			battle[i].usedice[r] = tmp;
		}
		battle[i].sum=0;
		for( j=0; j<8; j++ ){
			battle[i].deme[j] = Math.floor(Math.random()*6);
			if( battle[i].usedice[j]<battle[i].dmax ){
				battle[i].sum += 1+battle[i].deme[j];
			}
			battle[i].fin[j] = false;
		}
	}

        //  20220911  don't show the battle(?) sprite
	//  spr[sn_battle].visible = true;
	
	for( i=0; i<2; i++ ){
		var w = 4;
		var h = 2;
		var r = 8;
		var ox = (i==0)?w*100:-w*90;
		var oy = (i==0)?-h*50:h*60;
		for( j=0; j<8; j++ ){
			var o = spr[sn_battle].getChildByName("d"+i+j);
			o.vx = ox + (j%3)*10*w - Math.floor(j/3)*10*w + Math.random()*r;
			o.vy = oy + (j%3)*10*h + Math.floor(j/3)*10*h + Math.random()*r;
			o.x = o.vx;
			o.y = o.vy;
			o.z = Math.random()*10;
			o.up = Math.random()*22;
			o.bc = 0;
			o.visible = false;
			var s = spr[sn_battle].getChildByName("s"+i+j);
			s.x = o.vx;
			s.y = o.vy;
			s.gotoAndStop("shadow");
			s.visible = false;
		}
	}
	spr[sn_battle].getChildByName("n0").x = 110;
	spr[sn_battle].getChildByName("n0").y = -10;
	spr[sn_battle].getChildByName("n0").visible = false;
	spr[sn_battle].getChildByName("n1").x = -290;
	spr[sn_battle].getChildByName("n1").y = -10;
	spr[sn_battle].getChildByName("n1").visible = false;
	
	bturn = 0;

	stage.update();
	timer_func = battle_dice;
	click_func = null;
	move_func = null;
	releaese_func = null;
}

function battle_dice(){

	// Skip animation if disabled in config
	if (!GameConfig.animations) {
		timer_func = after_battle;
		return;
	}

	var i,j;
	var w = (bturn==0)?-10:10;
	var h = (bturn==0)?6:-6;
	var f=false;
	var soundflg = false;
	for( i=0; i<8; i++ ){
		if( battle[bturn].fin[i]>0 ) continue;
		var o = spr[sn_battle].getChildByName("d"+bturn+i);
		o.visible = true;
		o.vx += w;
		o.vy += h;
		o.z += o.up;
		o.up -= 3;
		if( o.z<0 ){
			o.z = 0;
			o.up = 5-o.bc*3;
			o.bc++;
			if( o.bc>=2 ){
				battle[bturn].fin[i] = 1;
				if( bturn==0 ){
					if( i>=3 ){
						if( battle[bturn].fin[i-3]==0 ) battle[bturn].fin[i] = 0;
					}
					if( i>=2 ){
						if( battle[bturn].fin[i-2]==0 ) battle[bturn].fin[i] = 0;
					}
				}else{
					if( i<5 ){
						if( battle[bturn].fin[i+3]==0 ) battle[bturn].fin[i] = 0;
					}
					if( i<6 ){
						if( battle[bturn].fin[i+2]==0 ) battle[bturn].fin[i] = 0;
					}
				}
			}
			if( o.bc==1 ){
				if( battle[bturn].usedice[i]<battle[bturn].dmax ) soundflg = true;
			}
		}
		o.x = o.vx;
		o.y = o.vy-o.z;
		o.gotoAndStop("d"+battle[bturn].arm+Math.floor(Math.random()*6));
		if( battle[bturn].fin[i]>0 ){
			o.gotoAndStop("d"+battle[bturn].arm+battle[bturn].deme[i]);
			if( battle[bturn].usedice[i]<battle[bturn].dmax ) soundflg = true;
		}
		var s = spr[sn_battle].getChildByName("s"+bturn+i);
		s.visible = true;
		s.x = o.vx;
		s.y = o.vy;
		if( battle[bturn].usedice[i]>=battle[bturn].dmax ){
			o.visible = false;
			s.visible = false;
		}
		f=true;
	}
	if( !f ){
		spr[sn_battle].getChildByName("n"+bturn).visible = true;
		spr[sn_battle].getChildByName("n"+bturn).text = ""+battle[bturn].sum;
		bturn++;
		if( bturn>=2 ){
			waitcount=15;
			timer_func = after_battle;
		}
	}
	if( soundflg && GameConfig.animations ){
		playSound("snd_dice");
	}
	stage.update();
}

function after_battle(){
	waitcount--;
	if( waitcount>0 ) return;
	spr[sn_battle].visible = false;
	spr[sn_from].visible = false;
	spr[sn_to].visible = false;
	spr[sn_ban].visible = true;
	for( i=0; i<8; i++ ){
		spr[sn_player+i].visible = true;
	}
	
	var arm0 = game.adat[game.area_from].arm;
	var arm1 = game.adat[game.area_to].arm;
	var defender_dice_before = game.adat[game.area_to].dice;
	var defeat = ( battle[0].sum>battle[1].sum ) ? 1 : 0;
	if( defeat>0 ){
		game.adat[game.area_to].dice = game.adat[game.area_from].dice-1;
		game.adat[game.area_from].dice = 1;
		game.adat[game.area_to].arm = arm0;
		game.set_area_tc(arm0);
		game.set_area_tc(arm1);
		if (GameConfig.animations) {
			playSound("snd_success");
		}

		// Record attack with full dice loss (territory conquered)
		if (GameConfig.allowAlliances) {
			game.record_attack(arm0, arm1, defender_dice_before);
		}
	}else{
		game.adat[game.area_from].dice = 1;
		if (GameConfig.animations) {
			playSound("snd_fail");
		}

		// Record failed attack (no dice lost by defender)
		if (GameConfig.allowAlliances) {
			game.record_attack(arm0, arm1, 0);
		}
	}
	
	draw_areashape(sn_area+game.area_to,game.area_to,0);
	draw_areadice(an2sn[game.area_from],game.area_from);
	draw_areadice(an2sn[game.area_to],game.area_to);
	
	// 履歴
	game.set_his(game.area_from,game.area_to,defeat);

	if( game.player[game.user].area_tc==0 ){
		draw_player_data();
		start_gameover();
	}else{
		var c=0;
		for( var i=0; i<game.pmax; i++ ){
			if( game.player[i].area_tc>0 ) c++;
		}
		if( c==1 ){
			draw_player_data();
			start_win();
		}else{
			start_player();
		}
	}
}

////////////////////////////////////////////////////
//  ダイス補充の開始
//  start dice replenishment
////////////////////////////////////////////////////

function start_supply(){
	spr[sn_from].visible = false;
	spr[sn_to].visible = false;
	spr[sn_btn+4].visible = false;

	var pn = game.jun[game.ban];
//	game.player[pn].stock = 64;
	game.set_area_tc(pn);
	game.player[pn].stock += game.player[pn].area_tc;
	if( game.player[pn].stock > game.STOCK_MAX ){
		game.player[pn].stock = game.STOCK_MAX;
	}
	
	spr[sn_supply].visible = true;
	for( var i=0; i<game.STOCK_MAX; i++ ){
		if( i<game.player[pn].stock ){
			spr[sn_supply].getChildAt(i).visible = true;
			spr[sn_supply].getChildAt(i).gotoAndStop("d"+pn+"3");
		}else{
			spr[sn_supply].getChildAt(i).visible = false;
		}
	}
	stage.update();
	
	waitcount = 10;
	timer_func = supply_waiting;
	click_func = null;
	move_func = null;
	releaese_func = null;	
}

function supply_waiting(){
	waitcount--;
	if( waitcount>0 ) return;
	timer_func = supply_dice;
}

function supply_dice(){
	var pn = game.jun[game.ban];
	var list = new Array();
	c = 0;
	for( var i=0; i<game.AREA_MAX; i++ ){
		if( game.adat[i].size == 0 ) continue;
		if( game.adat[i].arm != pn ) continue;
		if( game.adat[i].dice >= 8 ) continue;
		list[c] = i;
		c++;
	}
	if( c==0 || game.player[pn].stock<=0 ){
		next_player();
		return;
	}
	
	game.player[pn].stock--;
	var an = list[Math.floor(Math.random()*c)];
	game.adat[an].dice++;
	draw_areadice(an2sn[an],an);
	
	for( i=0; i<game.STOCK_MAX; i++ ){
		if( i<game.player[pn].stock ){
			spr[sn_supply].getChildAt(i).visible = true;
		}else{
			spr[sn_supply].getChildAt(i).visible = false;
		}
	}
	// 履歴
	game.set_his(an,0,0);

	stage.update();
	
	return;
}


////////////////////////////////////////////////////
//  次のプレイヤーへ
//  to the next player
////////////////////////////////////////////////////

function next_player(){
	var old_ban = game.ban;

	for( var i=0; i<game.pmax; i++ ){
		game.ban++;
		if( game.ban >= game.pmax ) game.ban = 0;
		var pn = game.jun[game.ban];
		if( game.player[pn].area_tc ) break;
	}

	// Increment round when we've cycled back to the first player (ban wrapped to 0)
	if (GameConfig.allowAlliances && game.ban < old_ban) {
		game.increment_round();

		// Update alliances (decrement turn counters) - only when round increments
		var expired = game.update_alliances();
		if( expired.length > 0 && game.jun[game.ban] == game.user ) {
			// Could show notification of expired alliances
			console.log("Alliances expired:", expired);
		}
	}

	if( game.jun[game.ban] == game.user ) playSound("snd_myturn");

	start_player();
}

////////////////////////////////////////////////////
// GAMEOVER
////////////////////////////////////////////////////

function start_gameover(){
	spr[sn_gameover].visible = false;
	spr[sn_gameover].x = view_w/2;
	spr[sn_gameover].y = view_h/2;
	spr[sn_gameover].getChildByName("bg").alpha = 0;
	spr[sn_gameover].getChildByName("mes").alpha = 0;
	spr[sn_gameover].getChildByName("mes").y = -120;
	stage.update();
	stat = 0;
	waitcount = 0;
	timer_func = gameover;
	click_func = null;
	move_func = null;
	releaese_func = null;	
}

function gameover(){
	
	spr[sn_gameover].visible = true;
	waitcount++;
	if( stat==0 ){
		var a = (-80+waitcount)/100;
		spr[sn_gameover].getChildByName("bg").alpha=a;
		if( a>0.8 ){
			if (GameConfig.animations) {
				playSound("snd_over");
			}
			waitcount=0;
			stat++;
		}
		stage.update();
	}else if( stat==1 ){
		var a = waitcount/100;
		var o = spr[sn_gameover].getChildByName("mes");
		o.alpha=a;
		o.y+=0.5;
		if( o.y>-70 ) o.y=-70;
		if( waitcount>=160 ){
			// ボタン
			spr[sn_btn+5].x = view_w/2 - resize(100);
			spr[sn_btn+5].y = view_h/2 + resize(70);
			spr[sn_btn+5].visible = true;
			btn_func[5] = start_title;
			spr[sn_btn+6].x = view_w/2 + resize(100);
			spr[sn_btn+6].y = view_h/2 + resize(70);
			spr[sn_btn+6].visible = true;
			btn_func[6] = start_history;
			
			waitcount=0;
			stat++;
		}
		stage.update();
	}
}

////////////////////////////////////////////////////
// YOU WIN!
////////////////////////////////////////////////////

function start_win(){
	spr[sn_win].visible = false;
	spr[sn_win].x = view_w/2;
	spr[sn_win].y = view_h/2 - resize(70);
	spr[sn_win].gotoAndStop("win");
	waitcount = 0;
	timer_func = win;
	click_func = null;
	move_func = null;
	releaese_func = null;	
}

function win(){
	waitcount++;
	var a = Math.floor(waitcount/2);
	if( a==10 || a==12 || a==14 || a==16 || a>=18 ){
		spr[sn_win].visible = true;
	}else{
		spr[sn_win].visible = false;
	}
	if( a==10 ){
		playSound("snd_clear");
	}
	
	if( a>=40 ){
		timer_func = null;
		spr[sn_btn+6].x = view_w/2;
		spr[sn_btn+6].y = view_h/2 + resize(70);
		spr[sn_btn+6].visible = true;
		btn_func[6] = start_history;
	}
	stage.update();
}

////////////////////////////////////////////////////
//  履歴
//  history
////////////////////////////////////////////////////

function start_history(){
	var i;
	
	spr[sn_win].visible = false;
	spr[sn_gameover].visible = false;
	spr[sn_ban].visible = false;
	for( i=0; i<8; i++ ) spr[sn_player+i].visible = false;
	for( i=0; i<bmax; i++ ) spr[sn_btn+i].visible = false;

	for( i=0; i<game.AREA_MAX; i++ ){
		if( game.adat[i].size==0 ) continue;
		game.adat[i].dice = game.his_dice[i];
		game.adat[i].arm = game.his_arm[i];
		draw_areashape(sn_area+i,i,0);
	}
	for( i=0; i<game.AREA_MAX; i++ ){
		draw_areadice(sn_dice+i,prio[i].an);
	}
	
	//  ボタン
	//  button
	spr[sn_btn+5].x = view_w/2 - resize(100);
	spr[sn_btn+5].y = view_h*0.88;
	spr[sn_btn+5].visible = true;
	btn_func[5] = start_title;
	spr[sn_btn+1].x = view_w/2 + resize(100);
	spr[sn_btn+1].y = view_h*0.88;
	spr[sn_btn+1].visible = true;
	btn_func[1] = toppage;
	
	stage.update();
	replay_c = 0;
	stat = 0;
	waitcount = 0;
	timer_func = play_history;
	click_func = null;
	move_func = null;
	releaese_func = null;	
}

function play_history(){

	var an;
	if( stat==0 ){
		if( replay_c >= game.his_c ){
			timer_func = null;	// 終了
		}else{
			stat = ( game.his[replay_c].to==0 ) ? 1 : 2;
		}
	}else if( stat==1 ){
		// 補給
		an = game.his[replay_c].from;
		game.adat[an].dice++;
		draw_areadice(an2sn[an],an);
		stage.update();
		replay_c++;
		if( replay_c >= game.his_c ){
			timer_func = null;	// 終了
		}else{
			stat = ( game.his[replay_c].to==0 ) ? 1 : 2;
		}
	}else if( stat==2 ){
		// 攻撃元
		an = game.his[replay_c].from;
		draw_areashape(sn_from,an,1);
		stage.update();
		waitcount=0;
		stat++;
	}else if( stat==3 ){
		// 攻撃先
		if( waitcount>2 ){
			an = game.his[replay_c].to;
			draw_areashape(sn_to,an,1);
			stage.update();
			waitcount=0;
			stat++;
		}
	}else if( stat==4 ){
		// 攻撃後
		if( waitcount>10 ){
			var an0 = game.his[replay_c].from;
			var an1 = game.his[replay_c].to;
			if( game.his[replay_c].res>0 ){
				game.adat[an1].dice = game.adat[an0].dice-1;
				game.adat[an0].dice = 1;
				game.adat[an1].arm = game.adat[an0].arm;
				if (GameConfig.animations) {
					playSound("snd_success");
				}
			}else{
				game.adat[an0].dice = 1;
				if (GameConfig.animations) {
					playSound("snd_fail");
				}
			}
			spr[sn_from].visible = false;
			spr[sn_to].visible = false;
			draw_areadice(an2sn[an0],an0);
			draw_areadice(an2sn[an1],an1);
			draw_areashape(sn_area+an1,an1,0);
			stage.update();
			stat=0;
			replay_c++;
		}
	}
	waitcount++;
}

////////////////////////////////////////////////////
//  Settings Screen
////////////////////////////////////////////////////

var settings_toggles = {};

function start_settings(){
	var i;

	for( i=0; i<sn_max; i++ ) spr[i].visible = false;

	// Title
	spr[sn_mes].visible = true;
	spr[sn_mes].text = "GAME SETTINGS";
	spr[sn_mes].color = GameConfig.darkMode ? "#ffffff" : "#000000";
	spr[sn_mes].font = Math.floor(48*nume/deno)+"px Anton";
	spr[sn_mes].textAlign = "center";
	spr[sn_mes].x = view_w/2;
	spr[sn_mes].y = resize(100);

	// Store current settings for display
	settings_toggles = {
		darkMode: GameConfig.darkMode,
		animations: GameConfig.animations,
		soundEnabled: GameConfig.soundEnabled,
		soundVolume: GameConfig.soundVolume,
		allowRedeployment: GameConfig.allowRedeployment,
		allowAlliances: GameConfig.allowAlliances
	};

	// Buttons
	spr[sn_btn+0].x = view_w/2 - resize(120);
	spr[sn_btn+0].y = resize(700);
	spr[sn_btn+0].visible = true;
	spr[sn_btn+0].getChildAt(1).text = "SAVE & START";
	btn_func[0] = save_settings;

	spr[sn_btn+5].x = view_w/2 + resize(120);
	spr[sn_btn+5].y = resize(700);
	spr[sn_btn+5].visible = true;
	spr[sn_btn+5].getChildAt(1).text = "CANCEL";
	btn_func[5] = cancel_settings;

	draw_settings_ui();

	timer_func = null;
	click_func = click_settings;
	move_func = null;
	releaese_func = null;
}

function click_settings(){
	var mx = stage.mouseX;
	var my = stage.mouseY;
	var i;

	// Check if clicking on buttons (handled by standard button system)
	// Buttons are already checked by mouseUpListner, so we don't need to handle them here

	// Define clickable areas for toggles (make them bigger and easier to click)
	var toggles = [
		{name: 'darkMode', y: 200, label: 'Dark Mode'},
		{name: 'animations', y: 260, label: 'Animations'},
		{name: 'soundEnabled', y: 320, label: 'Sound'},
		{name: 'allowRedeployment', y: 440, label: 'Redeployment'},
		{name: 'allowAlliances', y: 500, label: 'Alliances'}
	];

	for(i=0; i<toggles.length; i++){
		var ty = resize(toggles[i].y);
		// Expanded clickable area - entire row from left edge to right toggle button
		if( mx > view_w/2 - resize(350) && mx < view_w/2 + resize(250) &&
		    my > ty - resize(25) && my < ty + resize(25) ){
			settings_toggles[toggles[i].name] = !settings_toggles[toggles[i].name];

			// If toggling dark mode, update UI immediately
			if(toggles[i].name === 'darkMode') {
				// Temporarily apply theme to see changes
				var tempConfig = GameConfig.darkMode;
				GameConfig.darkMode = settings_toggles.darkMode;
				GameConfig.applyTheme();
			}

			playSound("snd_click");
			draw_settings_ui();
			break;
		}
	}

	// Volume slider (click to adjust)
	var slider_y = resize(380);
	if( mx > view_w/2 - resize(150) && mx < view_w/2 + resize(150) &&
	    my > slider_y - resize(15) && my < slider_y + resize(15) ){
		var vol = (mx - (view_w/2 - resize(150))) / resize(300);
		settings_toggles.soundVolume = Math.max(0, Math.min(1, vol));
		playSound("snd_click");
		draw_settings_ui();
	}
}

function draw_settings_ui(){
	// Clear previous drawings
	stage.removeChild(stage.getChildByName("settings_ui"));

	var container = new createjs.Container();
	container.name = "settings_ui";

	var yPos = resize(200);
	var xCenter = view_w/2;

	// Determine text color based on theme
	var textColor = GameConfig.darkMode ? "#ffffff" : "#000000";
	var headerColor = GameConfig.darkMode ? "#888888" : "#666666";

	// Visual Settings Header
	var header1 = new createjs.Text("VISUAL", Math.floor(32*nume/deno)+"px Anton", headerColor);
	header1.x = xCenter - resize(300);
	header1.y = yPos - resize(30);
	header1.textAlign = "left";
	container.addChild(header1);

	// Dark Mode
	add_toggle(container, "Dark Mode", settings_toggles.darkMode, xCenter, yPos, textColor);
	yPos += resize(60);

	// Animations
	add_toggle(container, "Animations", settings_toggles.animations, xCenter, yPos, textColor);
	yPos += resize(90);  // Increased spacing before audio section

	// Audio Settings Header
	var header2 = new createjs.Text("AUDIO", Math.floor(32*nume/deno)+"px Anton", headerColor);
	header2.x = xCenter - resize(300);
	header2.y = yPos - resize(30);  // Position header above the section
	header2.textAlign = "left";
	container.addChild(header2);

	// Sound Enabled
	add_toggle(container, "Sound", settings_toggles.soundEnabled, xCenter, yPos, textColor);
	yPos += resize(60);

	// Volume Slider
	var volLabel = new createjs.Text("Volume: " + Math.round(settings_toggles.soundVolume * 100) + "%",
		Math.floor(24*nume/deno)+"px Roboto", textColor);
	volLabel.x = xCenter - resize(300);
	volLabel.y = yPos;
	volLabel.textAlign = "left";
	container.addChild(volLabel);

	var slider_bg = new createjs.Shape();
	slider_bg.graphics.beginFill("#444444").drawRect(xCenter - resize(150), yPos - resize(10), resize(300), resize(20));
	container.addChild(slider_bg);

	var slider_fg = new createjs.Shape();
	slider_fg.graphics.beginFill("#00aa00").drawRect(xCenter - resize(150), yPos - resize(10),
		resize(300) * settings_toggles.soundVolume, resize(20));
	container.addChild(slider_fg);
	yPos += resize(90);  // Increased spacing before gameplay section

	// Gameplay Settings Header
	var header3 = new createjs.Text("GAMEPLAY", Math.floor(32*nume/deno)+"px Anton", headerColor);
	header3.x = xCenter - resize(300);
	header3.y = yPos - resize(30);  // Position header above the section
	header3.textAlign = "left";
	container.addChild(header3);

	// Redeployment
	add_toggle(container, "Dice Redeployment", settings_toggles.allowRedeployment, xCenter, yPos, textColor);
	yPos += resize(60);

	// Alliances
	add_toggle(container, "AI Alliances", settings_toggles.allowAlliances, xCenter, yPos, textColor);

	stage.addChild(container);
	stage.update();
}

function add_toggle(container, label, value, x, y, textColor){
	var txt = new createjs.Text(label, Math.floor(24*nume/deno)+"px Roboto", textColor);
	txt.x = x - resize(300);
	txt.y = y;
	txt.textAlign = "left";
	txt.textBaseline = "middle";
	container.addChild(txt);

	var box = new createjs.Shape();
	var color = value ? "#00aa00" : "#aa0000";
	box.graphics.beginFill(color).drawRect(x + resize(100), y - resize(15), resize(100), resize(30));
	box.graphics.beginStroke("#ffffff").setStrokeStyle(2).drawRect(x + resize(100), y - resize(15), resize(100), resize(30));
	container.addChild(box);

	var status = new createjs.Text(value ? "ON" : "OFF", Math.floor(20*nume/deno)+"px Anton", "#ffffff");
	status.x = x + resize(150);
	status.y = y;
	status.textAlign = "center";
	status.textBaseline = "middle";
	container.addChild(status);
}

function save_settings(){
	// Apply settings to GameConfig
	GameConfig.darkMode = settings_toggles.darkMode;
	GameConfig.animations = settings_toggles.animations;
	GameConfig.soundEnabled = settings_toggles.soundEnabled;
	GameConfig.soundVolume = settings_toggles.soundVolume;
	GameConfig.allowRedeployment = settings_toggles.allowRedeployment;
	GameConfig.allowAlliances = settings_toggles.allowAlliances;

	// Save to localStorage
	GameConfig.save();

	// Apply theme
	GameConfig.applyTheme();

	// Update sound state
	soundon = settings_toggles.soundEnabled && !touchdev;

	// If sound was just enabled and sounds aren't loaded, load them now
	// Note: Sound loading from local files requires running from a web server
	if( soundon && !instance["snd_button"] ){
		console.log("Loading sound files...");
		try {
			var queue = new createjs.LoadQueue(false);
			queue.installPlugin(createjs.Sound);
			queue.loadManifest(manifest, true);
			queue.addEventListener("fileload", handleFileLoad);
			queue.addEventListener("complete", function(){
				console.log("Sounds loaded successfully");
				playSound("snd_button");
				start_title(); // Return to title after sounds load
			});
			queue.addEventListener("error", function(evt){
				console.warn("Sound loading failed (expected when running from file://). Game will work without sound.");
				soundon = false;
				start_title(); // Return to title even if sounds fail
			});
		} catch(e) {
			console.warn("Sound system initialization failed:", e);
			soundon = false;
			start_title(); // Return to title if sound init fails
		}
	} else {
		// Sounds already loaded or sound is disabled
		if( soundon ) {
			playSound("snd_button");
		}
		start_title();
	}
}

function cancel_settings(){
	// Reload settings from GameConfig (discard changes)
	GameConfig.load();
	start_title();
}

////////////////////////////////////////////////////
// Diplomacy & Alliance System
////////////////////////////////////////////////////

function start_diplomacy(){
	// Check if player already has alliance (shouldn't happen if button logic is correct)
	var pn = game.jun[game.ban];
	if( game.get_alliance_info(pn) !== null ) {
		console.log("Player already has an alliance");
		return;
	}

	// Show diplomacy overlay
	stage.removeChild(stage.getChildByName("diplomacy_ui"));

	var container = new createjs.Container();
	container.name = "diplomacy_ui";

	// Semi-transparent background
	var bg = new createjs.Shape();
	bg.graphics.beginFill("rgba(0,0,0,0.85)").drawRect(0, 0, view_w, view_h);
	container.addChild(bg);

	// Title
	var title = new createjs.Text("DIPLOMACY", Math.floor(48*nume/deno)+"px Anton", "#ffffff");
	title.textAlign = "center";
	title.x = view_w/2;
	title.y = resize(80);
	container.addChild(title);

	// Subtitle
	var subtitle = new createjs.Text("Select a color to ally with (3 turns)", Math.floor(20*nume/deno)+"px Roboto", "#aaaaaa");
	subtitle.textAlign = "center";
	subtitle.x = view_w/2;
	subtitle.y = resize(130);
	container.addChild(subtitle);

	// Show AI players as clickable color boxes
	var armcolor = ["#b37ffe","#b3ff01","#009302","#ff7ffe","#ff7f01","#b3fffe","#ffff01","#ff5858"];
	var gridX = view_w / 2;
	var gridY = resize(220);
	var boxSize = resize(120);
	var spacing = resize(140);
	var cols = 3;
	var boxIndex = 0;

	for( var i = 0; i < game.pmax; i++ ) {
		var p = game.jun[i];
		if( p === game.user ) continue;  // Skip human player
		if( game.player[p].area_tc === 0 ) continue;  // Skip eliminated players

		// Can't ally with players who already have alliances
		var targetHasAlliance = game.get_alliance_info(p) !== null;

		var playerBox = new createjs.Container();
		playerBox.name = "select_" + p;

		// Calculate position in grid
		var col = boxIndex % cols;
		var row = Math.floor(boxIndex / cols);
		var xPos = gridX + (col - 1) * spacing;
		var yPos = gridY + row * spacing;

		// Color box background
		var boxBg = new createjs.Shape();
		if (targetHasAlliance) {
			// Gray out players with existing alliances
			boxBg.graphics.beginFill("#444444").drawRect(-boxSize/2, -boxSize/2, boxSize, boxSize);
			boxBg.graphics.beginStroke("#666666").setStrokeStyle(3).drawRect(-boxSize/2, -boxSize/2, boxSize, boxSize);
		} else {
			boxBg.graphics.beginFill(armcolor[p]).drawRect(-boxSize/2, -boxSize/2, boxSize, boxSize);
			boxBg.graphics.beginStroke("#ffffff").setStrokeStyle(4).drawRect(-boxSize/2, -boxSize/2, boxSize, boxSize);
		}
		playerBox.addChild(boxBg);

		// Player number
		var pText = new createjs.Text("Player " + (p + 1), Math.floor(22*nume/deno)+"px Anton", targetHasAlliance ? "#888888" : "#000000");
		pText.textAlign = "center";
		pText.textBaseline = "middle";
		pText.y = -resize(10);
		playerBox.addChild(pText);

		// Stats
		var stats = new createjs.Text(game.player[p].area_tc + " territories\n" + game.player[p].dice_c + " dice",
			Math.floor(16*nume/deno)+"px Roboto", targetHasAlliance ? "#888888" : "#333333");
		stats.textAlign = "center";
		stats.textBaseline = "middle";
		stats.y = resize(20);
		stats.lineHeight = resize(20);
		playerBox.addChild(stats);

		// Show "HAS ALLY" if they have an alliance
		if (targetHasAlliance) {
			var allyText = new createjs.Text("HAS ALLY", Math.floor(14*nume/deno)+"px Anton", "#ff4444");
			allyText.textAlign = "center";
			allyText.textBaseline = "middle";
			allyText.y = resize(50);
			playerBox.addChild(allyText);
		}

		playerBox.x = xPos;
		playerBox.y = yPos;
		container.addChild(playerBox);

		boxIndex++;
	}

	// Close button
	var closeBtn = new createjs.Container();
	closeBtn.name = "close_diplomacy";

	var closeBg = new createjs.Shape();
	closeBg.graphics.beginFill("#aa0000").drawRect(-resize(80), -resize(25), resize(160), resize(50));
	closeBg.graphics.beginStroke("#ffffff").setStrokeStyle(2).drawRect(-resize(80), -resize(25), resize(160), resize(50));
	closeBtn.addChild(closeBg);

	var closeTxt = new createjs.Text("CLOSE", Math.floor(24*nume/deno)+"px Anton", "#ffffff");
	closeTxt.textAlign = "center";
	closeTxt.textBaseline = "middle";
	closeBtn.addChild(closeTxt);

	closeBtn.x = view_w/2;
	closeBtn.y = view_h - resize(100);
	container.addChild(closeBtn);

	stage.addChild(container);
	stage.update();

	click_func = click_diplomacy;
}

function click_diplomacy(){
	var mx = stage.mouseX;
	var my = stage.mouseY;
	var diplomacy = stage.getChildByName("diplomacy_ui");
	if( !diplomacy ) return;

	// Remove any alliance result overlay on click
	var result = stage.getChildByName("alliance_result");
	if( result ) {
		stage.removeChild(result);
		stage.update();
	}

	// Check close button
	var closeBtn = diplomacy.getChildByName("close_diplomacy");
	if( closeBtn ) {
		var pt = closeBtn.globalToLocal(mx, my);
		if( Math.abs(pt.x) < resize(80) && Math.abs(pt.y) < resize(25) ) {
			stage.removeChild(diplomacy);
			stage.removeChild(stage.getChildByName("alliance_result"));
			stage.update();
			click_func = first_click;
			return;
		}
	}

	// Check player selection boxes
	var boxSize = resize(120);
	for( var i = 0; i < game.pmax; i++ ) {
		var p = game.jun[i];
		if( p === game.user ) continue;
		if( game.player[p].area_tc === 0 ) continue;

		var playerBox = diplomacy.getChildByName("select_" + p);
		if( !playerBox ) continue;

		// Check if click is within the box
		var pt = playerBox.globalToLocal(mx, my);
		if( Math.abs(pt.x) < boxSize/2 && Math.abs(pt.y) < boxSize/2 ) {
			// Check if target has alliance (can't ally with them)
			var targetHasAlliance = game.get_alliance_info(p) !== null;
			if (!targetHasAlliance) {
				propose_alliance_to_player(p);
			}
			return;
		}
	}
}

function propose_alliance_to_player(targetPlayer){
	var currentPlayer = game.jun[game.ban];

	// Propose alliance (3 turns, non-aggression)
	var accepted = game.propose_alliance(currentPlayer, targetPlayer, "non_aggression", 3);

	playSound(accepted ? "snd_success" : "snd_fail");

	// Mark that this player used diplomacy this round
	game.diplomacy_used_round[currentPlayer] = game.current_round;

	// Show result
	show_alliance_result(targetPlayer, accepted);

	// Auto-close diplomacy after 2 seconds
	setTimeout(function() {
		stage.removeChild(stage.getChildByName("alliance_result"));
		stage.removeChild(stage.getChildByName("diplomacy_ui"));

		// Refresh the main UI to update button visibility (diplomacy button should now be hidden)
		start_man();
	}, 2000);
}

function show_alliance_result(targetPlayer, accepted){
	var diplomacy = stage.getChildByName("diplomacy_ui");
	if( !diplomacy ) return;

	// Remove old result if exists
	stage.removeChild(stage.getChildByName("alliance_result"));

	var result = new createjs.Container();
	result.name = "alliance_result";

	var bg = new createjs.Shape();
	bg.graphics.beginFill(accepted ? "rgba(0,170,0,0.9)" : "rgba(170,0,0,0.9)")
		.drawRect(-resize(250), -resize(60), resize(500), resize(120));
	result.addChild(bg);

	var msgText = accepted ?
		"Player " + (targetPlayer + 1) + " accepted your alliance!" :
		"Player " + (targetPlayer + 1) + " rejected your alliance.";

	var msg = new createjs.Text(msgText, Math.floor(24*nume/deno)+"px Roboto", "#ffffff");
	msg.textAlign = "center";
	msg.textBaseline = "middle";
	msg.x = 0;
	msg.y = -resize(10);
	result.addChild(msg);

	if( accepted ) {
		var detail = new createjs.Text("(Non-aggression for 3 rounds)", Math.floor(18*nume/deno)+"px Roboto", "#ccffcc");
		detail.textAlign = "center";
		detail.textBaseline = "middle";
		detail.y = resize(20);
		result.addChild(detail);
	}

	result.x = view_w/2;
	result.y = view_h/2;

	stage.addChild(result);
	stage.update();
}

////////////////////////////////////////////////////
//  リンク
//  link
////////////////////////////////////////////////////

function toppage(){
	location.href="https://www.gamedesign.jp/";
}











