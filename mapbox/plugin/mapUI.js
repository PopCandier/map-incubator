layui.define(['jquery', 'element', 'util', 'form', 'map', 'tree', 'dropdown', 'laytpl','slider','colorpicker'], function(exports) {
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
		ADD_LAYER = "addLayer",
		ADD_ITEM = "addItem",
		$ = layui.jquery,
		element = layui.element,
		util = layui.util,
		form = layui.form,
		L = layui.map,
		tree = layui.tree,
		dropdown = layui.dropdown,
		laytpl = layui.laytpl,
		slider = layui.slider,
		colorpicker = layui.colorpicker;

	// 状态使用变量
	var addLayerBtn = null,
		addLayerForm = null,
		addItemForm = null,
		polylineForm = null,
		polylineList = null,
		circleList = null,
		polygonList = null,
		circleForm = null,
		LEFT_TREE_MENU_OBJ = null,
		isEdit = false, //是否是编辑
		isView = false, //是否是预览
		currentPaint = null, //当前是否是多边形的画图模式
		currentShapeForm = {}, //记录当前表单的事件是什么
		markIcon = L.Icon.extend({
			options: {
				iconUrl: './img/util/mark.png',
				iconSize: [20, 20]
			}
		}),
		dropMapping = { //下拉框键值映射
			"0": "多边形",
			"1": "圆形",
		},
		shapeUtils = { // 对应图形的一些方法
			"0":{
				modeValue:function(layerId, bodyId){
					form.val('polyLineMenuAddForm', {
						bodyId: bodyId,
						layerId: layerId
					});
					currentShapeForm = form.val('polyLineMenuAddForm');
				},
				plainFuncWindow: function(flag){
					if (typeof(flag) == undefined) {
						return;
					}
					if (flag) {
						plainFuncIndex["0"] = layer.open({
							type: 1,
							title: '多边形工具',
							area: ['15%', '75%'],
							offset: 'r',
							shade: 0,
							closeBtn: 0, //不显示关闭按钮
							id: 'polylineFormId',
							btnAlign: 'c',
							moveType: 1,
							resize: false,
							content: $(polylineForm)
						});
					} else {
						layer.close(plainFuncIndex["0"]);
					}
				},
				plainFunc:function(e){
					var latlng = e.latlng,
						layerId = currentShapeForm.layerId,
						bodyId = currentShapeForm.bodyId,
						map = tabMap['1'],
						lat = latlng.lat.toFixed(3),
						lng = latlng.lng.toFixed(3),
						id = uuid(),
						mark = L.marker([lat, lng], {
							icon: new markIcon()
						}).addTo(map).bindPopup("是这个点");
					// 是否有对这个表单下面的内容是否有赋值
					var tempStruct = buildPolylinesObj();
					if (!leftItemHtmlOperator.isEmptyData(layerId, bodyId)) {
						tempStruct=leftItemHtmlOperator.data(layerId, bodyId);
					}
					tempStruct.latlngs.data[id] = [lat, lng];
					tempStruct.latlngs.len += 1;
					leftItemHtmlOperator.initData(layerId, bodyId, tempStruct);
					// latlngs.data[id] = [lat, lng];
					// latlngs.len += 1;
					laytpl(POLYLINE_MENU_ITEM).render({
						id: id
					}, function(html) {
						polylineList.append(html);
						leftItemHtmlOperator.insertPolyline(layerId, bodyId, id, {
							obj: mark,
							data: [lat, lng],
							visiable:true
						});
					});
				},
				hideLayer:function(menuBody){
					//关于多边形，由于要存储 点 和 所购成多边形的图形
					//取出点
					var polygons = menuBody.data.polygon;
					var marks = menuBody.data.marks;
					if(polygons)
					{
						for(var polygon in polygons)
						{
							polygons[polygon].obj.remove();
							polygons[polygon].obj = null;
							polygons[polygon].visiable = false;
						}
						menuBody.data.polygon = polygons;
					}
					if(marks)
					{
						for(var mark in marks)
						{
							marks[mark].obj.remove();
							marks[mark].obj = null;
							marks[mark].visiable = false;
						}
						menuBody.data.marks = marks;
					}
					return menuBody;
				},
				showLayer:function(menuBody,map){
					var polygons = menuBody.data.polygon;
					var marks = menuBody.data.marks;
					if(polygons)
					{
						for(var polygon in polygons)
						{
							var pol = polygons[polygon];
							var p = L.polygon(pol.data, {
								color: pol.color
							}).addTo(map).bindPopup("是这个多边形");
							polygons[polygon].obj=p;
							polygons[polygon].visiable = true;
						}
						menuBody.data.polygon = polygons;
					}
					if(marks)
					{
						for(var mark in marks)
						{
							var ma = marks[mark];
							var m = L.marker(ma.data, {
								icon: new markIcon()
							}).addTo(map).bindPopup("是这个点");
							marks[mark].obj = m;
							marks[mark].visiable = true;
						}
						menuBody.data.marks = marks;
					}
					return menuBody;
				},
				switchMenu:function(layerId,bodyId,flag)
				{
					var polygonPanelData = leftItemHtmlOperator.data(layerId,bodyId),
						polylinePanelData = leftItemHtmlOperator.data(layerId,bodyId);
						
					if(polygonPanelData)
					{
						
						var polygonPanels=polygonPanelData.polygonPanel;

						if(flag)
						{
							for(var polygonP in polygonPanels)
							{
								polygonPanels[polygonP].show();
							}
						}
						else{
							for(var polygonP in polygonPanels)
							{
								polygonPanels[polygonP].hide();
							}
						}
					}
					if(polylinePanelData)
					{
						var polylinePanels=polylinePanelData.marksPanel;
						if(flag)
						{
							for(var polygonL in polylinePanels)
							{
								polylinePanels[polygonL].show();
							}
						}
						else{
							for(var polygonL in polylinePanels)
							{
								polylinePanels[polygonL].hide();
							}
						}
					}
				}
			},
			"1":{
				modeValue:function(layerId, bodyId){
					form.val('circleMenuAddForm', {
						bodyId: bodyId,
						layerId: layerId
					});
					currentShapeForm = form.val('circleMenuAddForm');
				},
				plainFuncWindow: function(flag){
					if (typeof(flag) == undefined) {
						return;
					}
					if (flag) {
						plainFuncIndex["1"] = layer.open({
							type: 1,
							title: '圆形工具',
							area: ['15%', '50%'],
							offset: 'r',
							shade: 0,
							closeBtn: 0, //不显示关闭按钮
							id: 'circleFormId',
							btnAlign: 'c',
							moveType: 1,
							resize: false,
							content: $(circleForm)
						});
					} else {
						layer.close(plainFuncIndex["1"]);
					}
				},
				plainFunc:function(e){
				// 对于画圆圈，会沿用以前的页面展示的配置
					var latlng = e.latlng,
						layerId = currentShapeForm.layerId,
						bodyId = currentShapeForm.bodyId,
						map = tabMap['1'],
						lat = latlng.lat.toFixed(3),
						lng = latlng.lng.toFixed(3),
						id = uuid(),
						color = currentShapeForm.ccolor,
						crv = currentShapeForm.crv,
						radius = parseInt(crv)*10000,
						circle=L.circle([lat, lng], {radius: radius,color:color})
						.addTo(map).bindPopup("是这个圈");;
					// CIRCLE_MENU_ITEM
					if (leftItemHtmlOperator.isEmptyData(layerId, bodyId)) {
						// 需要初始化
						leftItemHtmlOperator.initData(layerId, bodyId, buildCircleObj());
					}
					laytpl(CIRCLE_MENU_ITEM).render({id: id}, function(html) {
						circleList.append(html);
						leftItemHtmlOperator.insertCircle(layerId, bodyId, id, {
							obj: circle,
							data: [lat, lng],
							radius:radius,
							color:color,
							visiable:true,
							type:'1'
						});
					});
					
				},
				hideLayer:function(menuBody){
					//是圆形
					var circles=menuBody.data.circle;
					if(circles)
					{
						for(var circle in circles)
						{
							circles[circle].obj.remove();
							circles[circle].obj = null;
							circles[circle].visiable = false;
						}
						menuBody.data.circle = circles;
					}
					return menuBody;
				},
				showLayer:function(menuBody,map){
					//是圆形
					var circles=menuBody.data.circle;
					if(circles)
					{
						for(var circle in circles)
						{
							var cir = circles[circle];
							var c=L.circle(cir.data, {radius: cir.radius,color:cir.color})
							.addTo(map).bindPopup("是这个圈");
							circles[circle].obj = c;
							circles[circle].visiable = true;
						}
						menuBody.data.circle = circles;
					}
					return menuBody;
				},
				switchMenu:function(layerId,bodyId,flag){
					var circlePanleData = leftItemHtmlOperator.data(layerId,bodyId);
					if(circlePanleData)
					{
						var circlePanles = circlePanleData.circlePanel;
						if(flag)
						{
							
							for(var circleP in circlePanles)
							{
								circlePanles[circleP].show();
							}
						}
						else{
							for(var circleP in circlePanles)
							{
								circlePanles[circleP].hide();
							}
						}
					}
					
				}
			}
		},
		//弹窗的索引
		plainFuncIndex = {};
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
						 //是多边形，还是圆形或者其他图形
						 type:"0"
						 obj://对应的数据对象
					 }
				 }
			 }
			  
			}
		 */
		leftItemHtml = {},
		leftItemHtmlOperator = { //操作面板内容的对象
			checkDataExist: function(layerId, bodyId) {
				return leftItemHtml[layerId].kids[bodyId].data != null;
			},
			isEmptyData: function(layerId, bodyId) {
				return leftItemHtml[layerId].kids[bodyId].data == null;
			},
			initData: function(layerId, bodyId, objStruct) {
				leftItemHtml[layerId].kids[bodyId].data = objStruct;
			},
			selectShapeItem:function(layerId,bodyId){
				var obj = leftItemHtmlOperator.shapeMenuBody(layerId,bodyId),
				checkObj = obj.children(".layui-form-checkbox");
				checkObj.click();
			},
			checkBoxFlag:function(bodyId)
			{
				return form.val(bodyId).checkState;
			},
			switchCheckBoxState:function(bodyId,switchFlag)
			{
				form.val(bodyId,{checkState:switchFlag});
			},
			switchCheckBox:function(bodyId,switchFlag)
			{
				form.val(bodyId,{shape:switchFlag,checkState:switchFlag});
			},
			unselectShapeItem:function(layerId,bodyId){
				var obj = leftItemHtmlOperator.shapeMenuBody(layerId,bodyId),
					checkObj = obj.find(".layui-form-checkbox");
				obj.find("input[name='"+bodyId+"']").prop("checked", false);
				checkObj.removeClass('layui-form-checked');
			},
			shapeMenuBody:function(layerId,bodyId){
				return leftItemHtml[layerId].kids[bodyId].obj;
			},
			data: function(layerId, bodyId) {
				return leftItemHtml[layerId].kids[bodyId].data;
			},
			getPolygon:function(layerId, bodyId, id){
				return leftItemHtml[layerId].kids[bodyId].data.polygon[id];
			},
			getPolygons:function(layerId,bodyId){
				return leftItemHtml[layerId].kids[bodyId].data.polygon;
			},
			getPolyglines:function(layerId,bodyId){
				return leftItemHtml[layerId].kids[bodyId].data.marks;
			},
			getPolygonPanels:function(layerId,bodyId){
				return leftItemHtml[layerId].kids[bodyId].data.polygonPanel;
			},
			getPolylinePanels:function(layerId,bodyId)
			{
				return leftItemHtml[layerId].kids[bodyId].data.marksPanel;
			},
			getPolyline:function(layerId, bodyId, id){
				return leftItemHtml[layerId].kids[bodyId].data.marks[id];
			},
			insertPolygon: function(layerId, bodyId, id, params) {
				leftItemHtml[layerId].kids[bodyId].data.polygon[id] = params;
				leftItemHtml[layerId].kids[bodyId].data.polygonPanel[id] = $("#" + id);
			},
			insertPolyline: function(layerId, bodyId, id, params) {
				leftItemHtml[layerId].kids[bodyId].data.marks[id] = params;
				leftItemHtml[layerId].kids[bodyId].data.marksPanel[id] = $("#" + id);
			},
			insertCircle:function(layerId,bodyId,id,params){
				leftItemHtml[layerId].kids[bodyId].data.circle[id] = params;
				leftItemHtml[layerId].kids[bodyId].data.circlePanel[id] = $("#" + id);
			},
			getCircles:function(layerId,bodyId)
			{
				return leftItemHtml[layerId].kids[bodyId].data.circle;
			},
			getCircle:function(layerId,bodyId,circleId){
				return leftItemHtml[layerId].kids[bodyId].data.circle[circleId];
			},
			getCirclePanel:function(layerId,bodyId,circleId){
				return leftItemHtml[layerId].kids[bodyId].data.circlePanel[circleId];
			},
			getCirclePanels:function(layerId,bodyId){
				return leftItemHtml[layerId].kids[bodyId].data.circlePanel;
			},
			deleteCircle:function(layerId,bodyId,circleId){
				delete leftItemHtml[layerId].kids[bodyId].data.circle[circleId];
			},
			deleteCirclePanel:function(layerId,bodyId,circleId){
				delete leftItemHtml[layerId].kids[bodyId].data.circlePanel[circleId];
			},
			delPolygon: function(layerId, bodyId, polygonId) {
				delete leftItemHtml[layerId].kids[bodyId].data.polygon[polygonId];
			},
			delPolygonPanel: function(layerId, bodyId, polygonPanelId) {
				delete leftItemHtml[layerId].kids[bodyId].data.polygonPanel[polygonPanelId];
			},
			delPolyline: function(layerId, bodyId, markId) {
				delete leftItemHtml[layerId].kids[bodyId].data.marks[markId];
			},
			delPolylinePanel: function(layerId, bodyId, markPanelId) {
				delete leftItemHtml[layerId].kids[bodyId].data.marksPanel[markPanelId];
			},
			switchVisiableLeftMenuShape:function(e){
				var dataset = e[0].dataset,
					map = tabMap["1"],
					clickId = dataset.id,
					clickLayerId = dataset.layerid,
					rt = dataset.type,
					menuBody=leftItemHtml[clickLayerId].kids[clickId],
					tipParam = {tips: 1,time:1000};
				if(menuBody.data)
				{
					//隐藏
					if(dataset.visiable=="true")
					{
						leftItemHtml[clickLayerId].kids[clickId] = shapeUtils[rt].hideLayer(menuBody);
						layer.tips('该图层已被隐藏', e, tipParam);
						e[0].dataset["visiable"] = "false";
						e.css({"color":"#1E9FFF"});
					}
					else{
						leftItemHtml[clickLayerId].kids[clickId] = shapeUtils[rt].showLayer(menuBody,map);
						//显示
						layer.tips('该图层解除隐藏', e, tipParam);
						e[0].dataset["visiable"] = "true";
						e.css({"color":"black"});
					}
				}else{
					//隐藏
					if(dataset.visiable=="true")
					{
						layer.tips('该图层已被隐藏', e, tipParam);
						e[0].dataset["visiable"] = "false";
						e.css({"color":"#1E9FFF"});
					}
					else{
						layer.tips('该图层解除隐藏', e, tipParam);
						e[0].dataset["visiable"] = "true";
						e.css({"color":"black"});
					}
				}
				
			}
		},
		/**
		 * 由于可以同时编辑多个地图，所以这边存储每个tab的实现
		 */
		tabMap = {},
		/*
		 多边形的组件，包含两个对象，一个是点的列表，一个是已经连成多边形的图形
		  id:obj
		*/
		//圆形对象
		buildCircleObj = function(){
			var obj = {
				circle:{},//对应圆形的遮罩
				circlePanel:{}//对应的圆形的面板
			}
			return obj;
		},
		buildPolylinesObj = function(){
			var obj = {
				marks: {}, //对应的多边形点的遮罩
				marksPanel: {}, //对应的多边形点的面板
				polygon: {}, //对应的多边形的遮罩,obj表示地图中的图形实体，data表示包含的数据，是一个数据
				polygonPanel: {} ,//对应多边形的面板
				latlngs:{ //暂存的列表数据
					data:{},
					len:0
				}
			};
			return obj;
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
			'<div class="layui-card-body" >',
			'<div class="layui-form" lay-filter="LeftLayerItemMenu" action="" id="{{ d.bodyId }}">',
			'</div>',
			'</div>',
			'</div>',
			'</div>',
		].join(''),
		LEFT_LAYER_SHAPE_ITEM = [ //图形的单位
			'<form class="layui-form" lay-filter="{{ d.id }}" style="height: 27px;" >',
			'<div id="{{ d.id }}" class="left-layer-shape-item" data-id="{{ d.id }}">',
			'<input name="checkState" type="hidden" value="false"/>',
			'<input type="checkbox" lay-filter="activeCheck" lay-skin="primary" data-id="{{ d.id }}" data-type="{{ d.rt }}" data-layerId="{{ d.layerId }}"  name="shape" title="{{ d.name }}">',
			'<div class="left-layer-shape-item-menu">',
			'<i class="layui-icon layui-icon-menu-fill" data-id="{{ d.id }}" data-type="{{ d.rt }}" data-layerId="{{ d.layerId }}" data-visiable="true" lay-active="switchVisiableLeftMenuShape" ></i>',
			'<i class="layui-icon layui-icon-delete" data-id="{{ d.id }}" data-type="{{ d.rt }}"  data-layerId="{{ d.layerId }}" lay-active="delLeftLayerShapeItem" ></i>',
			'</div>',
			'</div>',
			'<div class="left-layer-shape-item-text layui-bg-blue">{{ d.type }}</div>',
			'</form>'
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
			'<form id="left-menu-add-form" class="layui-form layui-form-pane" action="" lay-filter="leftMenuAddForm" style="display:none;width:90%;margin:20px auto;" >',
			'<div class="layui-form-item">',
			'<input type="hidden" name="layerId" >',
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
			'<form id="polyline-menu-add-form" class="layui-form layui-form-pane" lay-filter="polyLineMenuAddForm" action="" style="display:none;width:90%;margin:15px auto;" >',
			'<input type="hidden" name="bodyId">',
			'<input type="hidden" name="layerId">',
			'<input type="hidden" value="0" name="type">',
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
			'<div class="layui-form-item">',
			'<div class="layui-btn-group">',
			'<button type="button" lay-active="clearPolygon" class="layui-btn layui-btn-sm layui-btn-danger">清空列表</button>',
			'</div>',
			'</div>',
			'</form>'
		].join(''),
		POLYLINE_MENU_ITEM = [
			'<div class="polyline-menu-item" id="{{ d.id }}" data-id="{{ d.id }}" lay-active="polylineHit" >',
			'点',
			'<div style="float: right;cursor:pointer;"><i class="layui-icon layui-icon-delete" data-id="{{ d.id }}" lay-active="delPolyline" style="font-size: 15px;cursor: pointer;"></i></div>',
			'</div>'
		].join(''),
		POLYGON_MENU_ITEM = [
			'<div class="polyline-menu-item" id="{{ d.id }}" data-id="{{ d.id }}" lay-active="polygonHit" >',
			'多边形',
			'<div style="float: right;cursor:pointer;"><i class="layui-icon layui-icon-delete" data-id="{{ d.id }}" lay-active="delPolygon" style="font-size: 15px;cursor: pointer;"></i></div>',
			'</div>'
		].join(''),
		CIRCLE_MENU = [
			'<form id="circle-menu-add-form" class="layui-form layui-form-pane" lay-filter="circleMenuAddForm" action="" style="display:none;width:90%;margin:15px auto;" >',
			'<input type="hidden" name="bodyId">',
			'<input type="hidden" name="layerId">',
			'<input type="hidden" value="1" name="type">',
			'<div class="layui-form-item">',
			'<label class="layui-form-label">圆圈颜色</label>',
			'<div class="layui-input-block">',
			'<div id="circleColor" ></div>',
			'<input type="hidden" name="ccolor" value="#1E9FFF">',
			'</div>',
			'</div>',
			'<div class="layui-form-item">',
			'<label class="layui-form-label" style="width:100%;">圆圈半径</label>',
			'</div>',
			'<div class="layui-form-item">',
			'<div id="circleRadiusSlider" style="width:90%;"></div>',
			'<input type="hidden"  name="crv" value="10">',
			'</div>',
			'<div class="layui-form-item">',
			'<label class="layui-form-label" style="width:100%;">圆列表</label>',
			'<div class="layui-form-item">',
			'<div id="circle-menu-list" class="circle-menu"></div>',
			'</div>',
			'</div>',
			'<div class="layui-form-item">',
			'<div class="layui-btn-group">',
			'<button type="button" lay-active="delAllCircle" class="layui-btn layui-btn-sm layui-btn-danger">清空列表</button>',
			'</div>',
			'</div>',
			'</form>'
		].join(''),
		CIRCLE_MENU_ITEM = [
			'<div class="circle-menu-item" id="{{ d.id }}" data-id="{{ d.id }}" lay-active="circleHit" >',
			'圆',
			'<div style="float: right;cursor:pointer;">',
			'<i class="layui-icon layui-icon-delete" data-id="{{ d.id }}" lay-active="delCircle" style="font-size: 15px;cursor: pointer;"></i></div>',
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
		return LAYER + uuid();
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
		htmlRender();
	}

	function htmlRender(){
		element.render();
		form.render();
		slider.render({
		    elem: '#circleRadiusSlider'
			,min:10
			,max:90
		    ,step: 10 //步长
		    ,showstep: true //开启间隔点
			,change: function(value){
			      // $('#test-slider-tips1').html('当前数值：'+ value);
				  form.val('circleMenuAddForm',{crv:value});
				  currentShapeForm = form.val('circleMenuAddForm');
				  layer.tips('圆圈半径调整为：'+ value, this.elem, {tips: 1,time:500});
			    }
		  });
		 colorpicker.render({
		    elem: '#circleColor' //绑定元素
			,color:'#1E9FFF'
		    ,change: function(color){ //颜色改变的回调
				form.val('circleMenuAddForm',{ccolor:color});
				currentShapeForm = form.val('circleMenuAddForm');
				layer.tips('选择了：'+ color, this.elem, {tips: 1,time:500});
		    }
		  });
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
	/**
	 * 开启某个模式
	 * @param {Object} rn
	 * @param {Object} id
	 */
	function openItemMode(rn, layerId, bodyId) {
		setItemModeValue(rn, layerId, bodyId);
		currentPaint = shapeUtils[rn].plainFunc;
	}
	/**
	 * 设置默认值
	 * @param {Object} rt
	 * @param {Object} id
	 */
	function setItemModeValue(rt, layerId, bodyId) {
		shapeUtils[rt].modeValue(layerId, bodyId);
	}

	/**
	 * 获得当前点的列表
	 */
	function currentPolyline() {
		var arr = [],
			layerId = currentShapeForm.layerId,
			bodyId = currentShapeForm.bodyId,
			// datas = latlngs.data,
			datas = leftItemHtmlOperator.data(layerId,bodyId).latlngs.data;
		for (var o in datas) {
			 var position = datas[o];
			if (position) {
				arr.push(position);
			}
		}
		return arr;
	}

	/**
	 * 清空所有多边形点的列表
	 */
	function clearAllPolyline() {
		var layerId = currentShapeForm.layerId,
			bodyId = currentShapeForm.bodyId,
			datas = leftItemHtmlOperator.data(layerId,bodyId).latlngs.data;
		for (var o in datas) {
			delPolylineMethod(o, layerId, bodyId);
		}
		var exsitData=leftItemHtmlOperator.data(layerId,bodyId);
		exsitData.latlngs.data={};
		exsitData.latlngs.len = 0;
	}

	/**
	 * 清空所有多边形
	 */
	function clearAllPolygon() {
		var layerId = currentShapeForm.layerId,
			bodyId = currentShapeForm.bodyId,
			menuBody = leftItemHtmlOperator.shapeMenuBody(layerId,bodyId),
			visiable = menuBody.find('.layui-icon-menu-fill')[0].dataset.visiable,
			polygons = leftItemHtmlOperator.getPolygons(layerId, bodyId);
			//找到内容的状态
		if("false"==visiable)
		{
			layer.msg("该图层已被隐藏，无法执行删除操作。");
			return ;
		}else{
			for (var o in polygons) {
				delPolygonMethod(o, layerId, bodyId);
			}
		}
		
	}
	/**
	 * 清空所有的圆形
	 */
	function clearAllCircle(){
		var layerId = currentShapeForm.layerId,
			bodyId = currentShapeForm.bodyId,
			menuBody = leftItemHtmlOperator.shapeMenuBody(layerId,bodyId),
			visiable = menuBody.find('.layui-icon-menu-fill')[0].dataset.visiable,
			circles = leftItemHtmlOperator.getCircles(layerId,bodyId);
			
		//找到内容的状态
		if("false"==visiable)
		{
			layer.msg("该图层已被隐藏，无法执行删除操作。");
			return ;
		}
		else
		{
			for(var c in circles)
			{
				delCircleMethod(c,layerId,bodyId);
			}
		}
		
	}
	
	/**
	 * 删除一个圆
	 * @param {Object} id
	 * @param {Object} layerId
	 * @param {Object} bodyId
	 */
	function delCircleMethod(id,layerId,bodyId)
	{
		var circle = leftItemHtmlOperator.getCircle(layerId, bodyId,id);
		var circlePanel = leftItemHtmlOperator.getCirclePanel(layerId, bodyId,id);
		// 如果这个图形不可见，就意味着被隐藏了，那么就暂时不支持删除
		if(!circle.visiable){
			layer.msg("你无法删除一个已被隐藏的图形");
			return;
		}
		if (circle.obj) {
			circle.obj.remove();
			leftItemHtmlOperator.deleteCircle(layerId, bodyId, id);
		}
		if (circlePanel) {
			circlePanel.remove();
			leftItemHtmlOperator.deleteCirclePanel(layerId, bodyId, id);
		}
	}
	
	/**
	 * 删除一个多边形
	 * @param {Object} id
	 */
	function delPolygonMethod(id, layerId, bodyId) {
		var ploygon = leftItemHtmlOperator.data(layerId, bodyId).polygon[id];
		var ploygonPanel = leftItemHtmlOperator.data(layerId, bodyId).polygonPanel[id];
		
		if(!ploygon.visiable){
			layer.msg("你无法删除一个已被隐藏的多边形");
			return;
		}
		
		if (ploygon.obj) {
			ploygon.obj.remove();
			leftItemHtmlOperator.delPolygon(layerId, bodyId, id);
		}
		if (ploygonPanel) {
			ploygonPanel.remove();
			leftItemHtmlOperator.delPolygonPanel(layerId, bodyId, id);
		}
	}

	/**
	 * 删除一个点
	 * @param {Object} id
	 */
	function delPolylineMethod(id, layerId, bodyId) {
		var targetData = leftItemHtmlOperator.data(layerId,bodyId),
			mark = targetData.marks[id],
			markPanel = targetData.marksPanel[id],
			datas = targetData.latlngs.data,
			latlng = datas[id];
		if(!mark.visiable){
			layer.msg("你无法删除一个已被隐藏的点");
			return;
		}	
		if (mark.obj) {
			mark.obj.remove();
			leftItemHtmlOperator.delPolyline(layerId, bodyId, id);
		}
		if (markPanel) {
			markPanel.remove();
			leftItemHtmlOperator.delPolylinePanel(layerId, bodyId, id);
		}
		if (latlng) {
			targetData = leftItemHtmlOperator.data(layerId,bodyId);
			delete targetData.latlngs.data[id];
			targetData.latlngs.len -= 1;
			return latlng;
		}
	}

	/**
	 * 注册编辑界面事件
	 */
	function registerEditEvent() {
		form.on('submit(addLayer)', function(data){
			var field = data.field;
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
					bodyObj: $("#" + d.bodyId),
					kids: {}
				}
			});
			layer.close(plainFuncIndex[ADD_LAYER]);
			addLayerForm.reset();
			return false;
		});
		form.on('submit(addItem)', function(data) {
			var field = data.field,
				layerHtml = leftItemHtml[field.layerId],
				layerBody = layerHtml.bodyObj,
				kids = layerHtml.kids,
				bodyId = uuid(),
				layerId = field.layerId,
				rt = field.rt;
			//取出对应的body容器
			// leftItemHtml[field.layerId].bodyObj;
			laytpl(LEFT_LAYER_SHAPE_ITEM).render({
				id: bodyId,
				layerId:layerId,
				name: field.rn,
				rt:rt,
				type: dropMapping[rt]
			}, function(html) {
				layerBody.append(html);
				//面板和数据挂钩起来
				leftItemHtml[layerId].kids[bodyId] = {
					obj: $("#" + bodyId), //面板
					type: rt, //类型
					data: null //数据
				};
			});

			layer.close(plainFuncIndex[ADD_ITEM]);
			form.render();
			addItemForm.reset();
			return false;
		});
		// 面板的多选框,选中将会激活预览
		form.on('checkbox(activeCheck)', function(data) {
			//点击编辑的某个资源图层的时候，或者切换他们之间的的时候
			//会决定他们这个图层是否显示，
			// 如果之前编辑的工具栏中有还未编辑完成的内容,将会保存 并且弹窗关闭
			// 打开属于这个资源图层的弹窗
			// 点击的目标的id
			// 获得之前开的是什么资源的窗口
			var dataset =$(data.elem)[0].dataset,
				//在这之前编辑的资源目录
				type=currentShapeForm.type,
				layerId=currentShapeForm.layerId,
				bodyId=currentShapeForm.bodyId,
				// 点击了新产生的的layerid，clickId这里就是bodyId了
				clickBodyId = dataset.id,
				clickLayerId = dataset.layerid,
				clickType = dataset.type;
			// 同时，这里还涉及数据初始化的问题，包括隐藏显示的图层，和不显示的图层，和切换的对应图层的数据初始化到制定目标列表
			openItemMode(clickType, clickLayerId, clickBodyId);
			if(typeof(layerId)=='undefined'){
				// 第一次进入的时候，currentShapeForm是没有值得
				shapeUtils[clickType].plainFuncWindow(true);
				leftItemHtmlOperator.switchCheckBoxState(clickBodyId,true);
			}else{
				//否则就是有值，我们需要关闭上一个弹出的页面
				//判断一下，点击的是否是自己
				if(!(layerId==clickLayerId&&bodyId==clickBodyId))
				{
					//如果之前的某个页面已经存在了生成的菜单，需要把之前已经生成的菜单删除掉，
					//然后按照新点击的内容生成菜单，需要根据类型来生成相对应的菜单
					//例如，如果是圆形切换到多边形是不需要进行菜单隐藏，但是是同类型，也就是多边形与多边形就需要
					//如果是同一类型，就直接切换显示就行，没必要关闭之前已经打开的菜单
					shapeUtils[type].switchMenu(layerId,bodyId,false);//关闭上一个菜单
					shapeUtils[clickType].switchMenu(clickLayerId,clickBodyId,true);//打开现在的菜单
					if(type!=clickType)
					{
						shapeUtils[type].plainFuncWindow(false);
						shapeUtils[clickType].plainFuncWindow(true);
					}else{
						if(leftItemHtmlOperator.checkBoxFlag(bodyId)=='false'&&
							leftItemHtmlOperator.checkBoxFlag(clickBodyId)=='false')
						{
							shapeUtils[clickType].plainFuncWindow(true);
						}
					}
					//取消选中
					leftItemHtmlOperator.switchCheckBox(bodyId,false);
					leftItemHtmlOperator.switchCheckBoxState(clickBodyId,true);
				}
				else
				{
					shapeUtils[clickType].plainFuncWindow(data.elem.checked);
					//如果点的是自己，那么有可能是想关闭自己
					leftItemHtmlOperator.switchCheckBoxState(clickBodyId,data.elem.checked);
				}
				
			}
			//edi得到美化后的DOM对象
		});

		util.event('lay-active', {
			hit:function(e){
				layer.msg("1");
			},
			delAllCircle:function(e){
				//是否需要删除
				if(circleList.children().length>0)
				{
					layer.confirm('此动作会清空当前列表里所有的圆形，你确定要删除吗?', function(index) {
						clearAllCircle();
						layer.close(index);
					});
				}
				else
				{
					layer.msg("列表中暂未发现圆形，无法删除");
				}
				return false;
			},
			connectPolygon: function(e) {
				var latlngs = currentPolyline();
				if (latlngs.length > 2) {
					layer.confirm('此动作会清空当前列表里所有的点，并将他们组成新的图形，你确定要这样做吗?', function(index) {
						var layerId = currentShapeForm.layerId,
							bodyId = currentShapeForm.bodyId;
						//将所有的数据，挂在到对应的多边形中
						clearAllPolyline();
						var polygon = L.polygon(latlngs, {
							color: '#1E9FFF',
						}).addTo(tabMap['1']).bindPopup("<p><a lay-active='hit'>点击我</a></p>");
						var id = uuid();
						laytpl(POLYGON_MENU_ITEM).render({
							id: id,
						}, function(html) {
							polygonList.append(html);
							// 颜色预留
							leftItemHtmlOperator.insertPolygon(layerId, bodyId, id, {
								obj: polygon,
								data: latlngs,
								visiable:true,
								color:'#1E9FFF',
								type:'0'
							});
						});
						layer.close(index);
					});
				} else {
					layer.msg('需要三个点才可以绘制成一个图形');
					return false;
				}
				return false;
			},
			polygonHit: function(e) {
				var id = e[0].dataset.id,
					layerId = currentShapeForm.layerId,
					bodyId = currentShapeForm.bodyId,
					polygon = leftItemHtmlOperator.getPolygon(layerId, bodyId,id);
					if(polygon.visiable)
					{
						polygon.obj.togglePopup();
					}else{
						layer.msg("该多边形已被隐藏");
					}
				return false;
			},
			delPolygon: function(e) {
				layer.confirm('你确定要删除该多边形吗?', function(index) {
					var id = e[0].dataset.id,
						layerId = currentShapeForm.layerId,
						bodyId = currentShapeForm.bodyId;
					delPolygonMethod(id, layerId, bodyId);
					layer.close(index);
				});
				return false;
			},
			clearPolygon: function(e) {
				layer.confirm('此动作会清空当前列表里所有的多边形，你确定要删除吗?', function(index) {
					clearAllPolygon();
					layer.close(index);
				});
				return false;
			},
			clearPolyline: function(e) {
				layer.confirm('此动作会清空当前列表里所有的点，你确定要删除吗?', function(index) {
					clearAllPolyline();
					layer.close(index);
				});
				return false;
			},
			delPolyline: function(e) {
				layer.confirm('你确定要删除该点吗?', function(index) {
					var id = e[0].dataset.id,
						layerId = currentShapeForm.layerId,
						bodyId = currentShapeForm.bodyId;
					delPolylineMethod(id, layerId, bodyId);
					layer.close(index);
				});
				return false;
			},
			polylineHit: function(e) {
				var id = e[0].dataset.id,
					layerId = currentShapeForm.layerId,
					bodyId = currentShapeForm.bodyId,
					polyline = leftItemHtmlOperator.getPolyline(layerId, bodyId,id);
					if(polyline.visiable)
					{
						polyline.obj.togglePopup();
					}else{
						layer.msg("该点已被隐藏");
					}
				return false;
			},
			circleHit: function(e){
				var id = e[0].dataset.id,
					layerId = currentShapeForm.layerId,
					bodyId = currentShapeForm.bodyId,
					circle = leftItemHtmlOperator.getCircle(layerId, bodyId,id);
				if(circle.visiable)
				{
					circle.obj.togglePopup()
				}
				else{
					layer.msg("该圆已被隐藏");
				}
				return false;
			},
			delCircle:function(e)
			{
				layer.confirm('你确定要删除该圈吗?', function(index) {
					var id = e[0].dataset.id,
						layerId = currentShapeForm.layerId,
						bodyId = currentShapeForm.bodyId;
					delCircleMethod(id, layerId, bodyId);
					layer.close(index);
				});
				return false;
			},
			switchVisiableLeftMenuShape: function(e) {
				leftItemHtmlOperator.switchVisiableLeftMenuShape(e);
			},
			delLeftLayerShapeItem: function(e) {
				layer.msg('1');
			},
			addLayer: function(e) {
				plainFuncIndex[ADD_LAYER]=layer.open({
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
				// 赋值给表单
				form.val('leftMenuAddForm', {
					layerId: id
				});
				plainFuncIndex[ADD_ITEM]=layer.open({
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
					//相关联的数据也要删除 todo
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
				// var latlngs = []
				// var polyline = L.polyline(latlngs, {
				// 	color: 'red'
				// }).addTo(map);
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
		container.append(CIRCLE_MENU);
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
		//作用于圆形的表单表单
		circleForm = document.getElementById("circle-menu-add-form");
		//记录已经绘制出的圆形
		circleList = $("#circle-menu-list")
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
