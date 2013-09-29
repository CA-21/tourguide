var APP = require("core");
var HTTP = require("http");
var UTIL = require("utilities");

function Model() {
	var TID;
	var LANG;

	this.init = function(_id) {
		APP.log("debug", "TOURML.init(" + _id + ")");

		TID = _id;
		// for now, language is forced on french, waiting to have a good example of what is needed for instanciation
		LANG = "fr";

		var db = Ti.Database.open("ChariTi");

		db.execute("CREATE TABLE IF NOT EXISTS tourml_" + TID + "_stop (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, stop_id TEXT, view TEXT);");
		db.execute("CREATE TABLE IF NOT EXISTS tourml_" + TID + "_stop_property (id INTEGER PRIMARY KEY AUTOINCREMENT, stop_id TEXT, prop_name TEXT, prop_value TEXT);");
		db.execute("CREATE TABLE IF NOT EXISTS tourml_" + TID + "_stop_assetref (id INTEGER PRIMARY KEY AUTOINCREMENT, stop_id TEXT, asset_id TEXT, asset_usage TEXT);");

		db.execute("CREATE TABLE IF NOT EXISTS tourml_" + TID + "_asset (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id TEXT, type TEXT);");

		db.execute("CREATE TABLE IF NOT EXISTS tourml_" + TID + "_asset_source (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id TEXT, rights_copyright TEXT, rights_creditline TEXT, rights_expiration TEXT, rights_uri TEXT, uri TEXT, lang TEXT, format TEXT, lastModified TEXT, part TEXT );");
		db.execute("CREATE TABLE IF NOT EXISTS tourml_" + TID + "_asset_source_property (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_source_id TEXT, prop_name TEXT, prop_value TEXT);");

		db.execute("CREATE TABLE IF NOT EXISTS tourml_" + TID + "_asset_content (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id TEXT, data TEXT, rights_copyright TEXT, rights_creditline TEXT, rights_expiration TEXT, rights_uri TEXT, lang TEXT, format TEXT, lastModified TEXT, part TEXT );");
		db.execute("CREATE TABLE IF NOT EXISTS tourml_" + TID + "_asset_content_property (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_content_id TEXT, prop_name TEXT, prop_value TEXT);");

		db.execute("CREATE TABLE IF NOT EXISTS tourml_" + TID + "_connection (id INTEGER PRIMARY KEY AUTOINCREMENT, src_stop_id TEXT, dest_stop_id TEXT, priority INTEGER);");

		db.close();
	};

	this.fetch = function(_params) {
		APP.log("debug", "TOURML.fetch");
		APP.log("trace", JSON.stringify(_params));

		var isStale = UTIL.isStale(_params.url, _params.cache);

		if(isStale) {
			if(_params.cache !== 0 && isStale !== "new") {
				_params.callback();
			}
			//Test si début <> http:// dans ce cas chargement local
			if(_params.url.indexOf("http://") >= 0) {
				HTTP.request({
					timeout: 10000,
					type: "GET",
					format: "TEXT",
					url: _params.url,
					passthrough: _params.callback,
					success: this.handleData,
					failure: _params.error
				});
			} else {
				file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "tourml/" + _params.url + "/" + LANG + ".lproj/tour.xml");
				var blob = file.read();
				this.handleData(blob.text, _params.url, _params.callback);
			}
		} else {
			_params.callback();
		}
	};

	this.handleData = function(_data, _url, _callback) {

		APP.log("debug", "TOURML.handleData");
		APP.log("debug", "TOURML.handleData.stop");

		var db = Ti.Database.open("ChariTi");
		var data = db.execute("SELECT COUNT(id) as count_id FROM tourml_" + TID + "_stop;");
		var count = data.fieldByName("count_id");
		data.close();

		if(count == 0) {
			var xml = Ti.XML.parseString(UTIL.xmlNormalize(_data));
			var nodes = xml.documentElement.getElementsByTagName("tourml:Stop");

			if(nodes.length > 0) {
				var db = Ti.Database.open("ChariTi");

				db.execute("DELETE FROM tourml_" + TID + "_stop;");
				db.execute("DELETE FROM tourml_" + TID + "_stop_property;");
				db.execute("DELETE FROM tourml_" + TID + "_stop_assetref;");
				db.execute("BEGIN TRANSACTION;");

				// Main informations treatment inside the tourml:Stop
				for(var i = 0, x = nodes.length; i < x; i++) {
					var title = UTIL.cleanEscapeString(nodes.item(i).getElementsByTagName("tourml:Title").item(0).text);
					var descriptionNode = nodes.item(i).getElementsByTagName("tourml:Description");
					if(descriptionNode.length > 0) {
						description = UTIL.cleanEscapeString(descriptionNode.item(0).text);
					} else {
						description = UTIL.cleanEscapeString("");
					}

					var stop_id = UTIL.cleanEscapeString(nodes.item(i).getAttribute("tourml:id"));
					var view = UTIL.cleanEscapeString(nodes.item(i).getAttribute("tourml:view"));

					db.execute("INSERT INTO tourml_" + TID + "_stop (id, title, description, stop_id, view) VALUES (NULL, " + title + "," + description + ", " + stop_id + ", " + view + ");");

					// Treating tourml:Property inside tourml:Stop
					var stop_properties = nodes.item(i).getElementsByTagName("tourml:Property");

					if(stop_properties.length > 0) {
						for(var j = 0, y = stop_properties.length; j < y; j++) {
							var prop_name = UTIL.cleanEscapeString(stop_properties.item(j).getAttribute("tourml:name"));
							var prop_value = UTIL.cleanEscapeString(stop_properties.item(j).textContent);

							db.execute("INSERT INTO tourml_" + TID + "_stop_property (id, stop_id, prop_name, prop_value) VALUES (NULL, " + stop_id + "," + prop_name + ", " + prop_value + ");");
						}
					}

					// Treating tourml:AssetRef inside tourml:Stop
					var stop_assetrefs = nodes.item(i).getElementsByTagName("tourml:AssetRef");

					if(stop_assetrefs.length > 0) {
						for(var j = 0, y = stop_assetrefs.length; j < y; j++) {
							var asset_id = UTIL.cleanEscapeString(stop_assetrefs.item(j).getAttribute("tourml:id"));
							var asset_usage = UTIL.cleanEscapeString(stop_assetrefs.item(j).getAttribute("tourml:usage"));

							db.execute("INSERT INTO tourml_" + TID + "_stop_assetref (id, stop_id, asset_id, asset_usage) VALUES (NULL, " + stop_id + "," + asset_id + ", " + asset_usage + ");");
						}
					}
				}

				db.execute("INSERT OR REPLACE INTO updates (url, time) VALUES(" + UTIL.escapeString(_url) + ", " + new Date().getTime() + ");");
				db.execute("END TRANSACTION;");
				db.close();
			}

		}

		var asset_nodes = xml.documentElement.getElementsByTagName("tourml:Asset");

		if(asset_nodes.length > 0) {
			var db = Ti.Database.open("ChariTi");

			db.execute("DELETE FROM tourml_" + TID + "_asset;");
			db.execute("DELETE FROM tourml_" + TID + "_asset_source;");
			db.execute("DELETE FROM tourml_" + TID + "_asset_source_property;");
			db.execute("BEGIN TRANSACTION;");

			for(var i = 0, x = asset_nodes.length; i < x; i++) {
				var asset_id = UTIL.cleanEscapeString(asset_nodes.item(i).getAttribute("tourml:id"));
				var type = UTIL.cleanEscapeString(asset_nodes.item(i).getAttribute("tourml:type"));

				db.execute("INSERT INTO tourml_" + TID + "_asset (id, asset_id, type) VALUES (NULL, " + asset_id + "," + type + ");");

				// Treating tourml:Source inside tourml:Asset
				var asset_sources = asset_nodes.item(i).getElementsByTagName("tourml:Source");

				if(asset_sources.length > 0) {
					for(var j = 0, y = asset_sources.length; j < y; j++) {
						//id, asset_id, rights_copyright, rights_creditline, rights_expiration, rights_uri, uri, lang, format, lastModified, part
						var rights_copyright = UTIL.cleanEscapeString("");
						var rights_creditline = UTIL.cleanEscapeString("");
						var rights_expiration = UTIL.cleanEscapeString("");
						var rights_uri = UTIL.cleanEscapeString("");
						if(_url.indexOf("http://") >= 0) {
							var uri = UTIL.cleanEscapeString(asset_sources.item(j).getAttribute("tourml:uri"));
						} else {
							var uri = UTIL.cleanEscapeString("tourml/" + _url + "/" + LANG + ".lproj/" + asset_sources.item(j).getAttribute("tourml:uri"));
						}

						var lang = UTIL.cleanEscapeString(asset_sources.item(j).getAttribute("xml:lang"));
						var format = UTIL.cleanEscapeString(asset_sources.item(j).getAttribute("tourml:format"));
						var lastModified = UTIL.cleanEscapeString(asset_sources.item(j).getAttribute("tourml:lastModified"));
						var part = UTIL.cleanEscapeString(asset_sources.item(j).getAttribute("tourml:part"));

						db.execute("INSERT INTO tourml_" + TID + "_asset_source (id, asset_id, rights_copyright, rights_creditline, rights_expiration, rights_uri, uri, lang, format, lastModified, part) " + "VALUES (NULL," + asset_id + ", " + rights_copyright + "," + rights_creditline + "," + rights_expiration + ", " + rights_uri + ", " + uri + ", " + lang + ", " + format + ", " + lastModified + ", " + part + ");");

						var lastId = db.lastInsertRowId;

						// Traitement des tourml:Property au sein du tourml:Asset>tourml:Source
						var asset_source_properties = asset_sources.item(j).getElementsByTagName("tourml:Property");

						if(asset_source_properties.length > 0) {
							for(var k = 0, z = asset_source_properties.length; k < z; k++) {
								//id, asset_source_id, prop_name, prop_value
								var prop_name = UTIL.cleanEscapeString(asset_source_properties.item(k).getAttribute("tourml:name"));
								var prop_value = UTIL.cleanEscapeString(asset_source_properties.item(k).textContent);

								db.execute("INSERT INTO tourml_" + TID + "_asset_source_property (id, asset_source_id, prop_name, prop_value) VALUES (NULL, " + lastId + "," + prop_name + ", " + prop_value + ");");
							}
						}

					}
				}

				var asset_contents = asset_nodes.item(i).getElementsByTagName("tourml:Content");

				if(asset_contents.length > 0) {
					for(var j = 0, y = asset_contents.length; j < y; j++) {
						//id, asset_id, data, rights_copyright, rights_creditline, rights_expiration, rights_uri, lang, format, lastModified, part
						var data = UTIL.cleanEscapeString(asset_contents.item(j).getElementsByTagName("tourml:Data").item(0).text);
						var rights_copyright = UTIL.cleanEscapeString("");
						var rights_creditline = UTIL.cleanEscapeString("");
						var rights_expiration = UTIL.cleanEscapeString("");
						var rights_uri = UTIL.cleanEscapeString("");
						var lang = UTIL.cleanEscapeString(asset_contents.item(j).getAttribute("xml:lang"));
						var format = UTIL.cleanEscapeString(asset_contents.item(j).getAttribute("tourml:format"));
						var lastModified = UTIL.cleanEscapeString(asset_contents.item(j).getAttribute("tourml:lastModified"));
						var part = UTIL.cleanEscapeString(asset_contents.item(j).getAttribute("tourml:part"));

						db.execute("INSERT INTO tourml_" + TID + "_asset_content (id, asset_id, data, rights_copyright, rights_creditline, rights_expiration, rights_uri, lang, format, lastModified, part) " + "VALUES (NULL," + asset_id + ", " + data + ", " + rights_copyright + "," + rights_creditline + "," + rights_expiration + ", " + rights_uri + ", " + lang + ", " + format + ", " + lastModified + ", " + part + ");");

						// Traitement des tourml:Property au sein du tourml:Asset>tourml:Content
						var asset_content_properties = asset_contents.item(j).getElementsByTagName("tourml:Property");

						if(asset_content_properties.length > 0) {
							for(var k = 0, z = asset_content_properties.length; k < z; k++) {
								//id, asset_content_id, prop_name, prop_value
								var asset_content_id = UTIL.cleanEscapeString(j + 1);
								var prop_name = UTIL.cleanEscapeString(asset_content_properties.item(k).getAttribute("tourml:name"));
								var prop_value = UTIL.cleanEscapeString(asset_content_properties.item(k).textContent);

								db.execute("INSERT INTO tourml_" + TID + "_asset_content_property (id, asset_content_id, prop_name, prop_value) VALUES (NULL, " + asset_content_id + "," + prop_name + ", " + prop_value + ");");
							}
						}
					}
				}
			}

			db.execute("INSERT OR REPLACE INTO updates (url, time) VALUES(" + UTIL.escapeString(_url + "\." + "assets") + ", " + new Date().getTime() + ");");
			db.execute("END TRANSACTION;");
			db.close();

		}

		var connection_nodes = xml.documentElement.getElementsByTagName("tourml:Connection");

		if(connection_nodes.length > 0) {
			var db = Ti.Database.open("ChariTi");

			db.execute("DELETE FROM tourml_" + TID + "_connection;");
			db.execute("BEGIN TRANSACTION;");

			for(var i = 0, x = connection_nodes.length; i < x; i++) {
				//src_stop_id TEXT, dest_stop_id TEXT, priority INTEGER
				var src_stop_id = UTIL.cleanEscapeString(connection_nodes.item(i).getAttribute("tourml:srcId"));
				var dest_stop_id = UTIL.cleanEscapeString(connection_nodes.item(i).getAttribute("tourml:destId"));
				var priority = UTIL.cleanEscapeString(connection_nodes.item(i).getAttribute("tourml:priority"));

				db.execute("INSERT INTO tourml_" + TID + "_connection (id, src_stop_id, dest_stop_id, priority) VALUES (NULL, " + src_stop_id + "," + dest_stop_id + ", " + priority + ");");
			}

			db.execute("INSERT OR REPLACE INTO updates (url, time) VALUES(" + UTIL.escapeString(_url + "\." + "connections") + ", " + new Date().getTime() + ");");
			db.execute("END TRANSACTION;");
			db.close();

		}

		if(_callback) {
			_callback();
		}
	};

	this.getAllTourmls = function() {
		APP.log("debug", "TOURML.getAllTourmls");

		var db = Ti.Database.open("ChariTi");
		var data = db.execute("SELECT id, title, stop_id, view as tourmltype FROM tourml_" + TID + "_stop ORDER BY id ASC LIMIT 25;");
		var temp = [];

		while(data.isValidRow()) {
			temp.push({
				id: data.fieldByName("id"),
				title: data.fieldByName("title"),
				tourml_id: data.fieldByName("tourml_id"),
				tourmltype: data.fieldByName("tourmltype"),
			});

			data.next();
		}

		data.close();
		db.close();

		return temp;
	};

	/*
	 * Generic fetch function for all stops with their access code.
	 * 
	 * Note : only stops with code property set are fetched here
	 */

	this.getAllStopsWithCode = function() {
		APP.log("debug", "TOURML.getAllStopsWithCode");

		var db = Ti.Database.open("ChariTi");
		//select ts.id, ts.title, ts.stop_id, ts.description, ts.view, tsp.prop_value from tourml_" + TID + "_stop as ts left join tourml_" + TID + "_stop_property as tsp on ts.stop_id=tsp.stop_id where tsp.prop_name="code" order by tsp.prop_value asc
		var data = db.execute("select ts.id, ts.title, ts.stop_id, ts.description, ts.view as tourmltype, tsp.prop_value from tourml_" + TID + "_stop as ts left join tourml_" + TID + "_stop_property as tsp on ts.stop_id=tsp.stop_id where tsp.prop_name=\"code\" order by tsp.prop_value asc");
		var temp = [];

		while(data.isValidRow()) {
			temp.push({
				id: data.fieldByName("id"),
				title: data.fieldByName("title"),
				stop_id: data.fieldByName("stop_id"),
				description: data.fieldByName("description"),
				tourmltype: data.fieldByName("tourmltype"),
				code: data.fieldByName("prop_value")
			});

			data.next();
		}

		data.close();
		db.close();

		return temp;
	}

	/*
	 * Fetch function for stops with code & geodata
	 */

	this.getGeoStops = function() {
		APP.log("debug", "TOURML.getGeoStops");

		var db = Ti.Database.open("ChariTi");
		//select ts.id, ts.title, ts.stop_id, ts.description, ts.view, tsp.prop_value from tourml_" + TID + "_stop as ts left join tourml_" + TID + "_stop_property as tsp on ts.stop_id=tsp.stop_id where tsp.prop_name="code" order by tsp.prop_value asc
		var request = "select ts.id, ts.title, ts.view as tourmltype, tsp.prop_value as tourmlcode, tac.data as tourmlgeo from tourml_" + TID + "_stop as ts left join tourml_" + TID + "_stop_property as tsp on ts.stop_id=tsp.stop_id  left join tourml_" + TID + "_stop_assetref as tsa on ts.stop_id=tsa.stop_id left join tourml_" + TID + "_asset_content as tac on tsa.asset_id = tac.asset_id where tsp.prop_name=\"code\" and tsa.asset_usage=\"geo\" order by tsp.prop_value asc;"
		APP.log("debug", "TOURML.getGeoStops.request | " + request);
		var data = db.execute(request);
		var temp = [];

		while(data.isValidRow()) {
			temp.push({
				id: data.fieldByName("id"),
				title: data.fieldByName("title"),
				tourmltype: data.fieldByName("tourmltype"),
				code: data.fieldByName("tourmlcode"),
				geo: data.fieldByName("tourmlgeo")
			});

			data.next();
		}

		data.close();
		db.close();

		return temp;
	}

	/*
	 * Generic fetch function for tour stop
	 */

	this.getTourml = function(_id) {
		APP.log("debug", "TOURML.getTourml | " + _id);

		var db = Ti.Database.open("ChariTi");

		var subdata_request = "select ts2.id, ts2.title, ts2.stop_id, ts2.view as tourmltype from tourml_" + TID + "_connection left join tourml_" + TID + "_stop as ts1 on src_stop_id=ts1.stop_id left join tourml_" + TID + "_stop as ts2 on dest_stop_id=ts2.stop_id where ts1.id=" + UTIL.cleanEscapeString(_id) + " order by priority asc;";
		APP.log("debug", "TOURML.getTourml.subdata_request | " + subdata_request);

		var subdata = db.execute(subdata_request);
		var subdata_temp = [];

		var i = 0;
		while(subdata.isValidRow()) {
			subdata_temp[i] = {
				id: subdata.fieldByName("id"),
				title: subdata.fieldByName("title"),
				stop_id: "",
				description: "",
				tourmltype: subdata.fieldByName("tourmltype"),
				code: ""
			}

			subdata.next();
			i++;
		}

		subdata.close();

		var data_request = "select ts.id, ts.title, ts.stop_id, ts.description, ts.view as tourmltype, tsp.prop_value, tsa.asset_id, tas.uri " + "FROM tourml_" + TID + "_stop AS ts " + "LEFT JOIN tourml_" + TID + "_stop_property AS tsp ON ts.stop_id=tsp.stop_id " + "LEFT JOIN tourml_" + TID + "_stop_assetref tsa ON tsa.stop_id=ts.stop_id AND tsp.prop_name=\"code\" " + "LEFT JOIN tourml_" + TID + "_asset_source tas ON tsa.asset_id=tas.asset_id AND tsa.asset_usage=\"header_image\" " + "WHERE ts.id = " + UTIL.cleanEscapeString(_id) + " ORDER BY tas.uri DESC LIMIT 1;";
		APP.log("debug", "TOURML.getTourml.data_request | " + data_request);

		var data = db.execute(data_request);

		var temp;

		while(data.isValidRow()) {
			temp = {
				id: data.fieldByName("id"),
				title: data.fieldByName("title"),
				stop_id: data.fieldByName("stop_id"),
				description: data.fieldByName("description"),
				tourmltype: data.fieldByName("tourmltype"),
				code: data.fieldByName("prop_value"),
				image: null,
				subdata: subdata_temp
			};

			if(data.fieldByName("uri")) {
				temp.image = data.fieldByName("uri");
			}

			data.next();
		}

		APP.log("debug", "TOURML.getTourml.temp | " + temp);

		data.close();
		db.close();

		return temp;
	};

	/*
	 * Fetch content function for image stop
	 */

	this.getImageTourml = function(_id) {
		APP.log("debug", "TOURML.getTourml | " + _id);

		var db = Ti.Database.open("ChariTi");

		var subdata_request = "select ts2.id, ts2.title, ts2.stop_id, ts2.view as tourmltype from tourml_" + TID + "_connection left join tourml_" + TID + "_stop as ts1 on src_stop_id=ts1.stop_id left join tourml_" + TID + "_stop as ts2 on dest_stop_id=ts2.stop_id where ts1.id=" + UTIL.cleanEscapeString(_id) + " order by priority asc;";
		APP.log("debug", "TOURML.getTourml.subdata_request | " + subdata_request);

		var subdata = db.execute(subdata_request);
		var subdata_temp = [];

		var i = 0;
		while(subdata.isValidRow()) {
			subdata_temp[i] = {
				id: subdata.fieldByName("id"),
				title: subdata.fieldByName("title"),
				stop_id: "",
				description: "",
				tourmltype: subdata.fieldByName("tourmltype"),
				code: ""
			}

			subdata.next();
			i++;
		}

		subdata.close();

		var data_request = "select ts.id, ts.title, ts.stop_id, ts.description, ts.view as tourmltype, tsp.prop_value, tsa.asset_id, tas.uri " + "FROM tourml_" + TID + "_stop AS ts " + "LEFT JOIN tourml_" + TID + "_stop_property AS tsp ON ts.stop_id=tsp.stop_id " + "LEFT JOIN tourml_" + TID + "_stop_assetref tsa ON tsa.stop_id=ts.stop_id " + "LEFT JOIN tourml_" + TID + "_asset_source tas ON tsa.asset_id=tas.asset_id AND tas.part=\"image\" " + "WHERE ts.id = " + UTIL.cleanEscapeString(_id) + " LIMIT 1;";
		APP.log("debug", "TOURML.getTourml.data_request | " + data_request);

		var data = db.execute(data_request);

		var temp;

		while(data.isValidRow()) {
			temp = {
				id: data.fieldByName("id"),
				title: data.fieldByName("title"),
				stop_id: data.fieldByName("stop_id"),
				description: data.fieldByName("description"),
				tourmltype: data.fieldByName("tourmltype"),
				code: data.fieldByName("prop_value"),
				image: null,
				subdata: subdata_temp
			};

			if(data.fieldByName("uri")) {
				temp.image = data.fieldByName("uri");
			}

			data.next();
		}

		APP.log("debug", "TOURML.getTourml.temp | " + temp);

		data.close();
		db.close();

		return temp;
	};

	/*
	 * Fetch content function for audio stop
	 */

	this.getAudioTourml = function(_id) {
		APP.log("debug", "TOURML.getTourml | " + _id);

		var db = Ti.Database.open("ChariTi");

		var subdata_request = "select ts2.id, ts2.title, ts2.stop_id, ts2.view as tourmltype from tourml_" + TID + "_connection left join tourml_" + TID + "_stop as ts1 on src_stop_id=ts1.stop_id left join tourml_" + TID + "_stop as ts2 on dest_stop_id=ts2.stop_id where ts1.id=" + UTIL.cleanEscapeString(_id) + " order by priority asc;";

		APP.log("debug", "TOURML.getTourml.subdata_request | " + subdata_request);

		var subdata = db.execute(subdata_request);
		var subdata_temp = [];

		var i = 0;
		while(subdata.isValidRow()) {
			subdata_temp[i] = {
				id: subdata.fieldByName("id"),
				title: subdata.fieldByName("title"),
				stop_id: "",
				description: "",
				tourmltype: subdata.fieldByName("tourmltype"),
				code: ""
			}

			subdata.next();
			i++;
		}

		subdata.close();

		var data_request = "select ts.id, ts.title, ts.stop_id, ts.description, ts.view as tourmltype, tsp.prop_value, tsa.asset_id, tas.uri, tasp.prop_value as duration FROM tourml_" + TID + "_stop AS ts LEFT JOIN tourml_" + TID + "_stop_property AS tsp ON ts.stop_id=tsp.stop_id LEFT JOIN tourml_" + TID + "_stop_assetref tsa ON tsa.stop_id=ts.stop_id LEFT JOIN tourml_" + TID + "_asset_source tas ON tsa.asset_id=tas.asset_id AND tas.format=\"audio\/mpeg\" LEFT JOIN tourml_" + TID + "_asset_source_property AS tasp ON tasp.asset_source_id=tas.id WHERE ts.id = " + UTIL.cleanEscapeString(_id) + " LIMIT 1;";

		APP.log("debug", "TOURML.getTourml.data_request | " + data_request);

		var data = db.execute(data_request);

		var temp;

		while(data.isValidRow()) {
			temp = {
				id: data.fieldByName("id"),
				title: data.fieldByName("title"),
				stop_id: data.fieldByName("stop_id"),
				description: data.fieldByName("description"),
				tourmltype: data.fieldByName("tourmltype"),
				code: data.fieldByName("prop_value"),
				image: null,
				audio: null,
				duration: null,
				subdata: subdata_temp
			};

			if(data.fieldByName("uri")) {
				temp.audio = data.fieldByName("uri");
				temp.duration = data.fieldByName("duration");
			}

			data.next();
		}

		APP.log("debug", "TOURML.getTourml.temp | " + JSON.stringify(temp));

		data.close();
		db.close();

		return temp;
	};

	/*
	 * Fetch content function for video stop
	 */

	this.getVideoTourml = function(_id) {
		APP.log("debug", "TOURML.getVideoTourml | " + _id);

		var db = Ti.Database.open("ChariTi");

		var subdata_request = "select ts2.id, ts2.title, ts2.stop_id, ts2.view as tourmltype from tourml_" + TID + "_connection left join tourml_" + TID + "_stop as ts1 on src_stop_id=ts1.stop_id left join tourml_" + TID + "_stop as ts2 on dest_stop_id=ts2.stop_id where ts1.id=" + UTIL.cleanEscapeString(_id) + " order by priority asc;";

		APP.log("debug", "TOURML.getVideoTourml.subdata_request | " + subdata_request);

		var subdata = db.execute(subdata_request);
		var subdata_temp = [];

		var i = 0;
		while(subdata.isValidRow()) {
			subdata_temp[i] = {
				id: subdata.fieldByName("id"),
				title: subdata.fieldByName("title"),
				stop_id: "",
				description: "",
				tourmltype: subdata.fieldByName("tourmltype"),
				code: ""
			}

			subdata.next();
			i++;
		}

		subdata.close();

		var data_request = "select ts.id, ts.title, ts.stop_id, ts.description, ts.view as tourmltype, tsp.prop_value, tsa.asset_id, tas.uri, tasp.prop_value as duration FROM tourml_" + TID + "_stop AS ts LEFT JOIN tourml_" + TID + "_stop_property AS tsp ON ts.stop_id=tsp.stop_id LEFT JOIN tourml_" + TID + "_stop_assetref tsa ON tsa.stop_id=ts.stop_id AND tsa.asset_usage=\"video\" LEFT JOIN tourml_" + TID + "_asset_source tas ON tsa.asset_id=tas.asset_id AND tas.format=\"video\/mp4\" LEFT JOIN tourml_" + TID + "_asset_source_property AS tasp ON tasp.asset_source_id=tas.id AND tasp.prop_name LIKE \"duration\" WHERE ts.id = " + UTIL.cleanEscapeString(_id) + " LIMIT 1;";

		APP.log("debug", "TOURML.getVideoTourml.data_request | " + data_request);

		var data = db.execute(data_request);

		var temp;

		while(data.isValidRow()) {
			temp = {
				id: data.fieldByName("id"),
				title: data.fieldByName("title"),
				stop_id: data.fieldByName("stop_id"),
				description: data.fieldByName("description"),
				tourmltype: data.fieldByName("tourmltype"),
				code: data.fieldByName("prop_value"),
				image: null,
				audio: null,
				duration: null,
				subdata: subdata_temp
			};

			if(data.fieldByName("uri")) {
				temp.video = data.fieldByName("uri");
				temp.duration = data.fieldByName("duration");
			}

			data.next();
		}

		APP.log("debug", "TOURML.getVideoTourml.temp | " + JSON.stringify(temp));

		data.close();
		db.close();

		return temp;
	};

	/*
	 * Fetch id from stop code
	 */

	this.getIdFromCode = function(_code) {
		APP.log("debug", "TOURML.getIdFromCode | " + _code);

		var db = Ti.Database.open("ChariTi");

		var data_request = "select ts.id, tsp.prop_value " + "FROM tourml_" + TID + "_stop AS ts " + "LEFT JOIN tourml_" + TID + "_stop_property AS tsp ON ts.stop_id=tsp.stop_id " + "WHERE prop_value = " + UTIL.cleanEscapeString(_code) + " LIMIT 1;";
		APP.log("debug", "TOURML.getIdFromCode.data_request | " + data_request);

		var data = db.execute(data_request);

		var temp;

		while(data.isValidRow()) {
			temp = {
				id: data.fieldByName("id")
			};

			data.next();
		}

		APP.log("debug", "TOURML.getIdFromCode.temp | " + JSON.stringify(temp));

		data.close();
		db.close();
		if(temp) return temp.id;
		return false;
	};
};

module.exports = function() {
	return new Model();
};