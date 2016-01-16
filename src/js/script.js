//Variable globale:
var URL_API;
var feature;
var draw;

//Configuration de la MAP
//Couche MapQuest
var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({
    layer: 'sat'
  })
});

var source = new ol.source.Vector({
  wrapX: false
});

var vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#ffcc33'
      })
    })
  })
});

//couche OSM
var osm = new ol.layer.Tile({
  source: new ol.source.OSM({
    attributions: [
      new ol.Attribution({
        html: 'Tiles &copy; <a href="http://www.opencyclemap.org/">' +
          'OpenCycleMap</a>'
      }),
      ol.source.OSM.ATTRIBUTION
    ],
    url: 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  })
});

//création de la map
var map = new ol.Map({
  layers: [osm, vector],
  target: 'map',
  view: new ol.View({
    center: [257420.802007, 6224481.304326],
    zoom: 10,
    wkid: 3857
  })
});

loadLayerBouchon();




//Configuration de l'outil de saisie
var pointTool = document.getElementById('pointTool');
var polygonTool = document.getElementById('polygonTool');


/**
 * Ajout d'un outil de dessin à la map
 */
function addInteraction(interactionType) {
  if (interactionType !== 'None') {
    var geometryFunction, maxPoints;
    var value = interactionType;

    draw = new ol.interaction.Draw({
      source: source,
      type: /** @type {ol.geom.GeometryType} */ (value)
    });

    //Event déclenché en fin de dessin
    draw.on('drawend', function(e) {
      //Initialisation de la variable globale feature
      feature = e.feature;

      //affichage du panel d'attributs
      addPanelRenseignement();
    });
    map.addInteraction(draw);
  }
}

/**
 * Affichage du formulaire d'attributs
 */
function addPanelRenseignement() {
  $('#panelProperties').removeClass('hidden');
  $('#saveBtn').on('click', this, function() {
    saveFeature();
  });
}

/**
 * Sauvegarde de la feature
 */
function saveFeature() {
  //Ajout des attributs à la feature
  var category = $('#categoryTxt').val();
  var msgShort = $('#msgShortTxt').val();
  var msgLong = $('#msgLongTxt').val();
  var url = $('#urlTxt').val();

  feature.set('category', category);
  feature.set('message', msgShort);
  feature.set('long_message', msgLong);
  feature.set('url', url);

  //Transformation de la feature en geoJSON
  var featureAsGeoJSON = getFeatureAsGeoJSON(feature);
  console.log(featureAsGeoJSON);
}

/**
 * Transformation d'une feature en feature
 * au format geoJSON
 */
function getFeatureAsGeoJSON(feature) {
  var geoJSON = new ol.format.GeoJSON();
  return geoJSON.writeFeature(feature, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  });
}

/**
 * Appel AJAX POST de la feature
 */
function postFeature(callback, scope, params) {
  console.log('savefeature');
  $.ajax({
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    url: urlAPI,
    data: params,
    timeout: 10000,
    success: function(data) {
      callback.call(scope, data);
    },
    statusCode: {
      403: function() {
        alert('Opération interdite');
      },
      404: function() {
        alert('Ressource introuvable');
      },
      500: function(data) {
        alert('erreur serveur interne');
      }
    },
    error: function(err) {
      console.log(err);
    }
  });
};

/**
 * Callback du POST
 */
function postFeatureCallback(data) {
  console.log(data);
  $('#panelProperties').addClass('hidden');
};

/**
 * Activation de l'outil ponctuel
 * @param {Event} e Change event.
 */
pointTool.onclick = function(e) {
  map.removeInteraction(draw);
  addInteraction('Point');
};

/**
 * Activation de l'outil polygon
 * @param {Event} e Change event.
 */
polygonTool.onclick = function(e) {
  map.removeInteraction(draw);
  addInteraction('Polygon');
};





//chargement des couches externes
function loadLayerBouchon() {
  var data = '[{"id":2,"message":"Projet 42 en cours, DO NOT DISTURB !!!","geom":[2.2027587890625004,48.91031590355533],"long_message":"Ceci est une alerte de ecole 42.","url":"http:\/\/www.paris.fr\/necmergitur","category":"Hackathon"}]';
  data = JSON.parse(data);
  loadLayerCallBack(data);
}

function loadLayer() {
  //TODO ajouter URL API
  var url = "";
  getJSON(this.loadLayerCallBack, this, url);
}

function getJSON(callback, scope, url, params) {

  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: url,
    data: params,
    timeout: 10000,
    success: function(data) {
      callback.call(scope, data);
    },
    statusCode: {
      403: function() {
        alert('Opération interdite');
      },
      404: function() {
        alert('Ressource introuvable');
      },
      500: function() {
        alert('Erreur interne');
      }
    },
    error: function(err) {
      console.log(err);
    }
  });
};

function loadLayerCallBack(data) {
  var vectorSource = this.getVectorSource(data);

  var layer = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'red'
      }),
      stroke: new ol.style.Stroke({
        color: 'red',
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({
          color: 'red'
        })
      })
    })
  });

  map.addLayer(layer);
};

/**
 * Method : loadLayer
 * Renvoi la source de la layer
 */
function getVectorSource(data) {
  var features = [];

  for (var idx in data) {
    var feature = new ol.Feature({
    geometry: new ol.geom.Point(data[idx].geom).transform('EPSG:4326', 'EPSG:3857'),
    name: data[idx].id
  });
    features.push(feature);
  }

  var vectorSource = new ol.source.Vector({
    features: features
  });

  return vectorSource;
};