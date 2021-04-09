layui.define(['jquery', 'element', 'util', 'form', 'map', 'tree', 'dropdown', 'laytpl'], function(exports) {
	"use strict";
	var MODULE_NAME = 'mapUI',
		MODEL_EDIT = 'edit',
		MODEL_VIEW = 'view',
		DEFAULT_CONTAINER_ID = 'map',
		LAYER = 'layer-',
		MAP_CONTAINER_CLASS_NAME = 'map-edit-container',
		MAP_BOTTOM_TOP_MENU = 'bottom-top-menu',
		MAP_BOTTOM_LEFT_MENU = 'bottom-left-menu',
		MAP_BOTTOM_RIGH_MENU = 'bottom-right-menu',
		DISABLE_BTN = 'layui-btn-disabled',
		LEFT_TREE_MENU = '#map-left-menu-resource-tree',
		$ = layui.jquery,
		element = layui.element,
		util = layui.util,
		form = layui.form,
		L = layui.map,
		tree = layui.tree,
		dropdown = layui.dropdown,
		laytpl = layui.laytpl;

	// 状态使用变量
	var addLayerBtn = null,
		addLayerForm = null,
		addItemForm = null,
		polylineForm = null,
		polylineList = null,
		polygonList = null,
		LEFT_TREE_MENU_OBJ = null,
		isEdit = false, //是否是编辑
		isView = false, //是否是预览
		currentPaint = null, //当前是否是多边形的画图模式
		markIcon = L.Icon.extend({
			options: {
				iconUrl: './img/util/mark.png',
				iconSize: [20, 20]
			}
		}),
		latlngs = {
			data:{},
			len:0
		}, //临时存储勾选内容的坐标 id = [lat,lng]
		plainFunc = {
			"0": function(e) { //多边形
				var latlng = e.latlng,
				map = tabMap['1'],
				lat = latlng.lat.toFixed(3),
				lng = latlng.lng.toFixed(3),
				id = uuid(),
				mark=L.marker([lat, lng], {
					icon: new markIcon()
				}).addTo(map).bindPopup("是这个点");
				latlngs.data[id]=[lat,lng];
				latlngs.len+=1;
				laytpl(POLYLINE_MENU_ITEM).render({
					id:id,
					lat:lat,
					lng:lng
				}, function(html) {
					polylineList.append(html);
					polylinesObj.marks[id]=mark;
					polylinesObj.marksPanel[id]=$("#"+id);
				});
				//删除一次，再重新刷新
				// if (latlngs.length == 0) {
				// 	// firstPoint = L.circle([latlng.lat.toFixed(3), latlng.lng.toFixed(3)], {
				// 	// 	color: '#009688',
				// 	// 	fillColor: '#5FB878',
				// 	// 	fillOpacity: 0.5,
				// 	// 	radius: 30000
				// 	// }).addTo(map);
					
					
				// } else {
				// 	if (firstPoint) {
				// 		firstPoint.removeFrom(map);
				// 	}
				// 	polyline.removeFrom(map);
				// 	latlngs.push([latlng.lat.toFixed(3), latlng.lng.toFixed(3)]);
				// 	polyline = L.polyline(latlngs, {
				// 		color: '#009688'
				// 	}).addTo(map);
				// }
			}
		}



	/**
	 *  存储资源的数据
	 * 一个对象可能包括
	 * 	//资源名称
	 * rn={
		  id:''
		  type:'1' 类型
		  area:[] 区域的点
	   }
	 * 
	 */
	var resourceBase = {},
		/**
		 * 保存菜单上元素的方法,方便快速查找到。
		 * 
		 * 每次创建都会生成一个唯一的id，
		 * 所以就是具体就是id和所关联内容的映射生成
		 * {
			 //父亲的id
			 parentId:{
				 obj:对应的html元素
				 kid:{
					 //挂在到某个页面上的余下子菜单
					 id:{
						 obj://对应的对象
					 }
				 }
			 }
			  
			}
		 */
		leftItemHtml = {},
		/**
		 * 由于可以同时编辑多个地图，所以这边存储每个tab的实现
		 */
		tabMap = {},
		/*
		 多边形的组件，包含两个对象，一个是点的列表，一个是已经连成多边形的图形
		  id:obj
		*/
		polylinesObj = {
			marks:{},//对应的多边形点的遮罩
			marksPanel:{},//对应的多边形点的面板
			polygon:{},//对应的多边形的遮罩
			polygonPanel:{}//对应多边形的面板
		};

	/* 编辑页面的页面布局*/
	var BODY = [
			'<div class="layui-row">',
			'<div class="layui-col-xs12" id="bottom-top-menu" >',
			'</div>',
			'</div>',
			'<div class="layui-row" style="height:93.8%;">',
			'<div class="layui-col-xs2 bottom-left-menu" id="bottom-left-menu" >',
			'</div>',
			'<div class="layui-col-xs10 bottom-right-menu" id="bottom-right-menu" >',
			'</div>',
			'</div>'
		].join(''),
		TOP_MENU = [
			'<ul class="layui-nav .map-top-menu" lay-filter="">',
			'<li class="layui-nav-item" ><a href="">首页</a></li>',
			'<li class="layui-nav-item map-float-right" ><a href="">历史记录</a></li>',
			'<li class="layui-nav-item map-float-right" >',
			' <a href="javascript:;">载入模板</a>',
			'<dl class="layui-nav-child">',
			' <dd><a  href="javascript:;" lay-active="loadMap" >一个模板地图</a></dd>',
			'</dl>',
			'</li>',
			'</ul>'
		].join(''),
		LEFT_MENU = [
			'<div class="map-left-menu layui-bg-gray">',
			'<div class="map-left-menu-btn-group">',
			'<button id="addLayer" type="button"  lay-active="addLayer" class="layui-btn layui-btn-xs"><i class="layui-icon layui-icon-add-1" style="margin-right: 1px;"></i></button>',
			'</div>',
			'<div class="map-left-menu-resource-panel">',
			'<div id="map-left-menu-resource-tree" class="map-left-menu-resource-tree" ></div>',
			'</div>',
			'</div>'
		].join(''),
		LEFT_LAYER_ITEM = [
			'<div class="layui-col-md11 left-layer-item" id="{{ d.id }}">',
			'<div class="layui-card">',
			'<div class="layui-card-header">{{ d.title }}',
			'<div class="left-layer-item-menu">',
			'<i class="layui-icon layui-icon-addition" data-id="{{ d.id }}" lay-active="addItem" style="font-size: 15px;cursor: pointer;"></i> ',
			'<i class="layui-icon layui-icon-delete" data-id="{{ d.id }}" lay-active="delItem" style="font-size: 15px;cursor: pointer;"></i> ',
			'</div>',
			'</div>',
			'<div class="layui-card-body" id="{{ d.bodyId }}">',

			'</div>',
			'</div>',
			'</div>',
		].join(''),
		LEFT_MENU_ADD_LAYER_FORM = [
			'<form id="left-menu-layer-add-form" class="layui-form layui-form-pane" action="" style="display:none;width:90%;margin:20px auto;" >',
			'<div class="layui-form-item">',
			'<label class="layui-form-label">图层名称</label>',
			'<div class="layui-input-block">',
			'<input type="text" name="rn" autocomplete="off" lay-verify="required" placeholder="图层名称" class="layui-input">',
			'</div>',
			'</div>',
			'<div class="layui-form-item" style="text-align: center;">',
			'<button class="layui-btn" lay-submit="" lay-filter="addLayer" >添加</button>',
			'<a href="javascript:;" class="layui-btn layui-btn-primary" lay-active="closeAll">关闭</a>',
			'</div>',
			'</form>'
		].join(''),
		LEFT_MENU_ADD_FORM = [
			'<form id="left-menu-add-form" class="layui-form layui-form-pane" action="" style="display:none;width:90%;margin:20px auto;" >',
			'<div class="layui-form-item">',
			'<label class="layui-form-label">资源名称</label>',
			'<div class="layui-input-block">',
			'<input type="text" name="rn" autocomplete="off" lay-verify="required" placeholder="资源名称" class="layui-input">',
			'</div>',
			'</div>',
			'<div class="layui-form-item">',
			'<label class="layui-form-label">资源类型</label>',
			'<div class="layui-input-block">',
			'<select name="rt" lay-filter="rt" lay-verify="required">',
			'<option value="" selected="">请选择资源类型</option>',
			'<option value="0">多边形(Polygon)</option>',
			'<option value="1">圆(Circle)</option>',
			'<option value="2">矩形(Rectangle)</option>',
			'</select>',
			'</div>',
			'</div>',
			'<div class="layui-form-item" style="text-align: center;">',
			'<button class="layui-btn" lay-submit="" lay-filter="addItem" >添加</button>',
			'<a href="javascript:;" class="layui-btn layui-btn-primary" lay-active="closeAll">关闭</a>',
			'</div>',
			'</form>'
		].join(''),
		RIGHT_MENU = [
			'<div class="map-right-menu" >',
			'<div class="layui-tab" style="margin:0px;height: 100%;" lay-filter="map-tab">',
			'<ul class="layui-tab-title">',
			'</ul>',
			'<div class="layui-tab-content" style="height: 93.2%;" >',
			'</div>',
			'</div>',
			'</div>'
		].join(''),
		POLYLINE_MENU = [
			'<form id="polyline-menu-add-form" class="layui-form layui-form-pane" action="" style="display:none;width:90%;margin:15px auto;" >',
			'<div class="layui-form-item">',
			'<label class="layui-form-label" style="width:100%;">点列表</label>',
			'</div>',
			'<div class="layui-form-item">',
			'<div id="polyline-menu-list" class="polyline-menu"></div>',
			'</div>',
			'<div class="layui-form-item">',
			'<div class="layui-btn-group">',
			'<button type="button" lay-active="connectPolygon" class="layui-btn layui-btn-sm">连成多边形</button>',
			'<button type="button" lay-active="clearPolyline" class="layui-btn layui-btn-sm layui-btn-danger">清空列表</button>',
			'</div>',
			'</div>',
			'<div class="layui-form-item">',
			'<label class="layui-form-label" style="width:100%;">多边形列表</label>',
			'</div>',
			'<div class="layui-form-item">',
			'<div id="polygon-menu-list" class="polyline-menu"></div>',
			'</div>',
			'<div class="layui-form-item" style="text-align: center;">',
			'<button class="layui-btn" lay-submit="" lay-filter="addItem" >添加</button>',
			'<a href="javascript:;" class="layui-btn layui-btn-primary" lay-active="closeAll">关闭</a>',
			'</div>',
			'</form>'
		].join(''),
		POLYLINE_MENU_ITEM = [
			'<div class="polyline-menu-item" id="{{ d.id }}" data-id="{{ d.id }}" lay-active="polylineHit" >',
				'lat&nbsp;=&nbsp;{{ d.lat }}&nbsp;,&nbsp;lng&nbsp;=&nbsp;{{ d.lng }}&nbsp;',
				'<div style="float: right;cursor:pointer;"><i class="layui-icon layui-icon-delete" data-id="{{ d.id }}" lay-active="delPolyline" style="font-size: 15px;cursor: pointer;"></i></div>',
			'</div>'
		].join(''),
		POLYGON_MENU_ITEM = [
			'<div class="polyline-menu-item" id="{{ d.id }}" data-id="{{ d.id }}" lay-active="polylineHit" >',
				'多边形',
				'<div style="float: right;cursor:pointer;"><i class="layui-icon layui-icon-delete" data-id="{{ d.id }}" lay-active="delPolyline" style="font-size: 15px;cursor: pointer;"></i></div>',
			'</div>'
		].join('');
	var mapUI = function() {
		this.v = '0.0.1';
	};

	function uuid() {
		var temp_url = URL.createObjectURL(new Blob());
		var uuid = temp_url.toString();
		URL.revokeObjectURL(temp_url);
		return uuid.substr(uuid.lastIndexOf("/") + 1);
	}

	function isLayerId(id) {
		id += "";
		return id.indexOf(LAYER) != -1;
	}

	function uuidParent() {
		var temp_url = URL.createObjectURL(new Blob());
		var uuid = temp_url.toString();
		URL.revokeObjectURL(temp_url);
		return LAYER + uuid.substr(uuid.lastIndexOf("/") + 1);
	}

	/**检查参数
	 * @param {Object} map
	 * @param {Object} config
	 */
	function checkParam(config) {}

	function isNotEmpty(obj) {
		return obj != null;
	}

	function generateUI(config) {
		var container = config.container,
			containerQuery = $(container);
		// L.control.zoom({
		// 	position: 'bottomright'
		// }).addTo(map);
		if (MODEL_VIEW === config.mode) {
			// 预览模式
			isView = true;
		} else if (MODEL_EDIT === config.mode) {
			isEdit = true;
			containerQuery.addClass(MAP_CONTAINER_CLASS_NAME);
			appendEditUI(containerQuery);
			registerEditEvent();
			// 编辑模式
			// 先做一版本，只能添加的图层的操作吧
		}
		element.render();
		form.render();
	}

	/**
	 * 编辑地图的方法
	 * @param {Object} e 
	 */
	function editMap(e) {
		if (isEdit) {
			if (currentPaint) {
				currentPaint(e);
			}
		}
	}

	function openItemMode(rn) {
		currentPaint = plainFunc[rn];
	}

	/**
	 * 获得当前点的列表
	 */
	function currentPolyline(){
		var arr = [];
		var datas = latlngs.data;
		for(var o in datas)
		{
			var position= delPolylineMethod(o);
			if(position)
			{
				arr.push(position);
			}
		}
		return arr;
	}

	/**
	 * 清空所有多边形点的列表
	 */
	function clearAllPolyline(){
		var datas = latlngs.data;
		for(var o in datas)
		{
			delPolylineMethod(o);
		}
	}

	/**
	 * 删除一个点
	 * @param {Object} id
	 */
	function delPolylineMethod(id){
		var mark=polylinesObj.marks[id];
		var markPanel = polylinesObj.marksPanel[id];
		var latlng = latlngs.data[id];
		if(mark){
			mark.remove();
			delete polylinesObj.marks[id];
		}
		if(markPanel){
			markPanel.remove();
			delete polylinesObj.marksPanel[id];
		}
		// 此为临时内容，直接置空就行。
		if(latlng)
		{
			var position = latlngs.data[id];
			delete latlngs.data[id];
			return position;
		}
	}

	/**
	 * 注册编辑界面事件
	 */
	function registerEditEvent() {
		//处理属性 为 lay-active 的所有元素事件
		//监听提交
		form.on('submit(addLayer)', function(data) {

			var field = data.field;
			// {"rn":"123","rt":"0"}
			if (isNotEmpty(resourceBase[field.rn])) {
				layer.msg('已存在相同的资源名');
				return false;
			}
			var obj = {
				id: uuidParent(),
				type: field.rt,
				area: []
			};
			resourceBase[field.rn] = obj;
			//在左边放上树形菜单
			//模拟数据1
			//通过添加方法新增的只能是图层,图层下面可以新建资源
			var d = {
				title: field.rn,
				id: obj.id,
				bodyId: obj.id.replace(LAYER, ''),
				children: []
			};
			// leftTreeMenu.layer.push(d);

			laytpl(LEFT_LAYER_ITEM).render(d, function(html) {
				LEFT_TREE_MENU_OBJ.append(html);
				//将对象放在本地
				leftItemHtml[d.id] = {
					obj: $("#" + d.id),
					kids: {}
				}
			});

			layer.closeAll();
			addLayerForm.reset();
			return false;
		});
		form.on('submit(addItem)', function(data) {
			var field = data.field;
			// 以多边形为例子，随便点击地图上的几个位置，将会生成点，然后再决定是否将他们连接起来。
			// 判断选择了什么。
			/**
			 * '<option value="0">多边形(Polygon)</option>',
			'<option value="1">圆(Circle)</option>',
			'<option value="2">矩形(Rectangle)</option>',
			 */
			openItemMode(field.rt);

			// if("0"==)
			// {
			// 	layer.msg('选择的是多边形');
			// 	//多边形，我们选择一个弹框
			// }
			layer.closeAll();
			layer.open({
				type: 1,
				title: '多边形工具',
				area: ['15%', '60%'],
				offset: 'r',
				shade: 0,
				closeBtn: 0, //不显示关闭按钮
				id: 'polylineFormId',
				btnAlign: 'c',
				moveType: 1,
				resize: false,
				content: $(polylineForm)
			});
			return false;
		});

		util.event('lay-active', {
			connectPolygon:function(e){
				if(latlngs.len>2)
				{
					layer.confirm('此动作会清空当前列表里所有的点，并将他们组成新的图形，你确定要这样做吗?', function(index) {
						var latlngs = currentPolyline();
						clearAllPolyline();
						var polygon = L.polygon(latlngs, {color: '#1E9FFF'}).addTo(tabMap['1']);
						var id = uuid();
						laytpl(POLYGON_MENU_ITEM).render({
							id:id,
						}, function(html) {
							polygonList.append(html);
							polylinesObj.polygon[id]=polygon;
							polylinesObj.polygonPanel[id]=$("#"+id);
						});
						layer.close(index);
					});
				}else{
					layer.msg('需要三个点才可以绘制成一个图形');
					return false;
				}
				return false;
			},
			clearPolyline:function(e){
				layer.confirm('此动作会清空当前列表里所有的点，你确定要删除吗?', function(index) {
					clearAllPolyline();
					layer.close(index);
				});
				return false;
			},
			delPolyline:function(e){
				layer.confirm('你确定要删除该点吗?', function(index) {
					var id = e[0].dataset.id;
					delPolylineMethod(id);
					layer.close(index);
				});
				return false;
			},
			polylineHit:function(e){
				var id = e[0].dataset.id;
				polylinesObj.marks[id].togglePopup();
				return false;
			},
			addLayer: function(e) {
				layer.open({
					type: 1,
					title: '添加一个新图层',
					area: ['15%', '20%'],
					shade: 0.2,
					id: 'LAY_layuipro',
					btnAlign: 'c',
					moveType: 1,
					content: $(addLayerForm)
				});
			},
			addItem: function(e) {
				var id = e[0].dataset.id;
				layer.open({
					type: 1,
					title: '添加一个资源',
					area: ['20%', '40%'],
					shade: 0.2,
					id: 'LAY_layuipro2',
					btnAlign: 'c',
					moveType: 1,
					content: $(addItemForm)
				});
			},
			delItem: function(e) {
				// console.log(e);
				layer.confirm('你确定要删除该图层吗?', function(index) {
					//do something
					var id = e[0].dataset.id;
					var obj = leftItemHtml[id].obj;
					obj.remove();
					delete leftItemHtml[id];
					layer.close(index);
				});
				return false;
			},
			loadMap: function(e) {
				//这里正常需要拉取接口，读取已经上传的地图列表
				element.tabAdd('map-tab', {
					title: '地图',
					content: '<div id="map" style="cursor:default;"></div>',
					id: '1' //实际使用一般是规定好的id，这里以时间戳模拟下
				});
				element.tabChange('map-tab', '1');
				var map = tabMap['1'] = L.map('map', {
					minZoom: 2,
					maxZoom: 3,
					attributionControl: false,
					zoomControl: false
				}).setView([12.5, 3.17], 2);
				//改变手势
				var url = 'http://127.0.0.1:8848/mapbox/img/{z}/{x}-{y}.jpg';
				// 关闭循环漫游
				L.tileLayer(url, {
					tileSize: 512,
					noWrap: true
				}).addTo(map);
				// var marker = L.marker([51.5, -0.09]).addTo(map);
				// var cities = L.layerGroup([littleton, denver, aurora, golden]);
				// var circle = L.circle([51.508, -0.11], {
				//     color: '#1E9FFF',
				//     fillColor: '#01AAED',
				//     fillOpacity: 0.5,
				//     radius: 200000
				// }).addTo(map);
				var latlngs = []
				var polyline = L.polyline(latlngs, {
					color: 'red'
				}).addTo(map);
				var firstPoint = null;
				//封装的方法，将点和全组合在一起，初始点不具有先，当存储点的线超过2的时候，开始有线连接
				map.on('click', editMap);

				// 放开禁用
				addLayerBtn.removeClass(DISABLE_BTN);

				return false;
			},
			closeAll: function(e) {
				layer.closeAll();
				return false;
			}
		});
	}


	function appendEditUI(container) {
		container.append(BODY);
		// 上面的菜单
		var topMenu = $("#" + MAP_BOTTOM_TOP_MENU),
			//获得左边的菜单
			leftMenu = $("#" + MAP_BOTTOM_LEFT_MENU),
			//获得右边的菜单
			rightMenu = $("#" + MAP_BOTTOM_RIGH_MENU);
		container.append(LEFT_MENU_ADD_LAYER_FORM);
		container.append(LEFT_MENU_ADD_FORM);
		container.append(POLYLINE_MENU);
		topMenu.append(TOP_MENU);
		leftMenu.append(LEFT_MENU);
		rightMenu.append(RIGHT_MENU);
		// 添加按钮
		addLayerForm = document.getElementById('left-menu-layer-add-form');
		addLayerBtn = $("#addLayer");
		addLayerBtn.addClass(DISABLE_BTN);
		LEFT_TREE_MENU_OBJ = $(LEFT_TREE_MENU);
		//添加单元的表单
		addItemForm = document.getElementById('left-menu-add-form');
		//多边形菜单的表单内容
		polylineForm = document.getElementById('polyline-menu-add-form');
		//多边形的点数列表
		polylineList = $("#polyline-menu-list");
		//已完成的多边形列表
		polygonList = $("#polygon-menu-list");

	}

	mapUI.prototype.render = function(config) {
		checkParam(config);
		generateUI(config);

	}
	document.oncontextmenu = function() {
		return false
	}
	var UI = new mapUI();
	exports(MODULE_NAME, UI);
});
