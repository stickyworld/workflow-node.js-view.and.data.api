AutodeskNamespace("Viewing.Extension");

Viewing.Extension.CommentStickers = function (viewer, options) {

  /////////////////////////////////////////////////////////////////
  //  base class constructor
  //
  /////////////////////////////////////////////////////////////////

  Autodesk.Viewing.Extension.call(this, viewer, options);

  var _self = this;
  var _viewer = viewer;
  var _currentSticker = null;
  var _stickers = {};

  /////////////////////////////////////////////////////////////////
  // load callback: invoked when viewer.loadExtension is called
  //
  /////////////////////////////////////////////////////////////////

  _self.load = function () {
    viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT,
      _self.onItemSelected);
    viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT,
      _self.onCameraChanged);
    $(viewer.container).bind("click", _self.onMouseClick);

    console.log('Viewing.Extension.CommentStickers loaded');

    return true;

  };

  _self.onItemSelected = function(event) {
    // event is triggered also when component is unselected

    // in that case event.dbIdArray is an empty array
    if(event.dbIdArray.length) {

      var dbId = event.dbIdArray[0];
      var fragId = event.fragIdsArray[0];

      _currentSticker = addComment(dbId, fragId);
      _stickers[_currentSticker.divId] = _currentSticker;
    }
    else {
      // all components unselected
    }
  };

  _self.onMouseClick = function(event) {
    var screenPoint = {
      x: event.clientX,
      y: event.clientY
    };
    var n = _self.normalizeCoords(screenPoint);
  };

  _self.onCameraChanged = function (event) {
    _self.updateStickers();
  }

  _self.getMeshPosition = function (fragId) {
    var mesh = viewer.impl.getRenderProxy(viewer.model, fragId);
    var pos = new THREE.Vector3();
    pos.setFromMatrixPosition(mesh.matrixWorld);

    return pos;
  };

  _self.normalizeCoords = function(screenPoint) {
    var viewport = viewer.navigation.getScreenViewport();

    var n = {
        x: (screenPoint.x - viewport.left) / viewport.width,
        y: (screenPoint.y - viewport.top) / viewport.height
    };

    var hitPoint = viewer.utilities.getHitPoint(n.x, n.y);

    if (hitPoint && _currentSticker) {
      _currentSticker.attachmentPoint = hitPoint;
      _self.updateSticker(_currentSticker);
    }

    return n;
  }

  _self.updateSticker = function(sticker) {
    var screenPoint = _self.worldToScreen(sticker.attachmentPoint, viewer.getCamera());
    $('#' + sticker.divId).css({
      left: screenPoint.x + 'px',
      top: screenPoint.y + 'px'
    });
  };

  _self.updateStickers = function() {
    for (var key in _stickers) {
      _self.updateSticker(_stickers[key]);
    }
  };

  ///////////////////////////////////////////////////////////////////////////
  // world -> screen coords conversion
  //
  ///////////////////////////////////////////////////////////////////////////
  _self.worldToScreen = function (worldPoint, camera) {

      var p = new THREE.Vector4();

      p.x = worldPoint.x;
      p.y = worldPoint.y;
      p.z = worldPoint.z;
      p.w = 1;

      p.applyMatrix4(camera.matrixWorldInverse);
      p.applyMatrix4(camera.projectionMatrix);

      // Don't want to mirror values with negative z (behind camera)
      // if camera is inside the bounding box,
      // better to throw markers to the screen sides.
      if (p.w > 0) {
          p.x /= p.w;
          p.y /= p.w;
          p.z /= p.w;
      }

      // This one is multiplying by width/2 and Ã¢â‚¬â€œheight/2,
      // and offsetting by canvas location
      var point = viewer.impl.viewportToClient(p.x, p.y);

      // snap to the center of the pixel
      point.x = Math.floor(point.x) + 0.5;
      point.y = Math.floor(point.y) + 0.5;

      return point;
  }

  ///////////////////////////////////////////////////////////////////////////
  // screen to world coordinates conversion
  //
  ///////////////////////////////////////////////////////////////////////////
  _self.screenToWorld = function (event) {

      var screenPoint = {
          x: event.clientX,
          y: event.clientY
      };

      var viewport =
          viewer.navigation.getScreenViewport();

      var n = {
          x: (screenPoint.x - viewport.left) / viewport.width,
          y: (screenPoint.y - viewport.top) / viewport.height
      };

      return viewer.navigation.getWorldPoint(n.x, n.y);
  }

  function addComment(dbId, fragId) {
    var divId = guid();

    $(viewer.container).append(
      '<div id="' + divId + '"></div>');

    $('#' + divId).css({
        'position': 'absolute',
        'font-family': 'arial',
        'color': '#ED1111',
        'font-size': '20px',
        'background': 'url("https://product.stickyworld.com/themes/bootstrap/img/NoteIconsSprite.png?v=1.16.0") no-repeat 0px 0px',
        'width': '24px',
        'height': '24px',
        'margin-left': '-12px',
        'margin-top': '-12px',
        'pointer-events': 'none'
    });

    var commentSticker = {
      dbId: dbId,
      fragId: fragId,
      divId: divId,
      position: _self.getMeshPosition(fragId)
    };

    return commentSticker;
  }

  function guid() {
    var d = new Date().getTime();

    var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
        /[xy]/g,
        function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });

    return guid;
  }

  /////////////////////////////////////////////////////////////////
  // unload callback: invoked when viewer.unloadExtension is called
  //
  /////////////////////////////////////////////////////////////////

  _self.unload = function () {

    console.log('Viewing.Extension.Workshop unloaded');

    return true;

  };

};

/////////////////////////////////////////////////////////////////
// sets up inheritance for extension and register
//
/////////////////////////////////////////////////////////////////

Viewing.Extension.CommentStickers.prototype =
  Object.create(Autodesk.Viewing.Extension.prototype);

Viewing.Extension.CommentStickers.prototype.constructor =
  Viewing.Extension.CommentStickers;

Autodesk.Viewing.theExtensionManager.registerExtension(
  'Viewing.Extension.CommentStickers',
  Viewing.Extension.CommentStickers);
