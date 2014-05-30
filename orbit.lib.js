/* orbit
 * A tiny library that can parse TLE, and display the orbit on the map
 * Author: Rossen Georgiev @ https://github.com/rossengeorgiev
 * Requires: GMaps API 3
 */

var orbit = {
    version: 1.0
}

/* Object with the default options for Satelite object
 * @prop {orbit.TLE}            tle           - An obj instance of a parsed TLE
 * @prop {string}               title         - Alternative title to use for the marker, instead of the one from TLE
 * @prop {boolean}              visible       - Visible or not
 * @prop {google.maps.Map}      map           - An obj instance of google maps
 * @prop {google.maps.Marker}   marker        - An obj instance of Marker to use instead of the default
 */
orbit.SateliteOptions = {
    tle: "",
    title: null,
    visible: true,
    map: null,
    marker: null,
}

/* Initializes a Satelite object
 * @param {object} an obj with options, see orbit.SatelliteOptions
 */
orbit.Satelite = function(options) {
    this.tle = null;
    this.position = null;
    this.path = null
    this.visible = true;

    // handle options
    options = (typeof options == 'object') ? options : {};

    var opt;
    for(opt in orbit.SateliteOptions) {
        // if an option is set, use it, otherwise use the default
        this[opt] = (opt in options) ? options[opt] : orbit.SateliteOptions[opt];
    }

    if(this.tle != null && !(this.tle instanceof orbit.TLE)) this.tle = null;

    // init map elements
    this.marker = (this.marker) ? marker : new google.maps.Marker({'map':this.map});
    this.polyline = new google.maps.Polyline({'map':this.map});
}

orbit.TLE = function(text) {
    this.text = text;
    this.parse(this.text);
}

orbit.TLE.prototype.parse = function(text) {
    var lines = text.split("\n");

    if(lines.length != 3) throw SyntaxError("Invalid TLE syntax");

    // parse first line
    this.name = lines[0].substring(0,24).trim();

    // parse second line
    if(lines[1][0] != "1") throw SyntaxError("Invalid TLE syntax");

    // TODO: verify line using the checksum in field 14

    this.satelite_number = parseInt(lines[1].substring(2,7));
    this.classification = lines[1].substring(7,8);
    this.intd_year = lines[1].substring(9,11);
    this.intd_ln = parseInt(lines[1].substring(11,14));
    this.intd_place = lines[1].substring(14,17).trim();
    this.intd = lines[1].substring(9,17).trim();
    this.epoch_year = lines[1].substring(18,20);
    this.epoch_day = parseFloat(lines[1].substring(20,32));
    this.ftd = parseFloat(lines[1].substring(33,43));

    var tmp = lines[1].substring(44,52).split('-');
    if(tmp.length == 3) this.std = -1 * parseFloat("."+tmp[1].trim()) * Math.pow(10,-parseInt(tmp[2]));
    else this.std = parseFloat("."+tmp[0].trim()) * Math.pow(10,-parseInt(tmp[1]));

    var tmp = lines[1].substring(53,61).split('-');
    if(tmp.length == 3) this.bstar = -1 * parseFloat("."+tmp[1].trim()) * Math.pow(10,-parseInt(tmp[2]));
    else this.bstar = parseFloat("."+tmp[0].trim()) * Math.pow(10,-parseInt(tmp[1]));

    this.ehemeris_type = parseInt(lines[1].substring(62,63));
    this.element_number = parseInt(lines[1].substring(64,68));

    // parse third line
    if(lines[2][0] != "2") throw SyntaxError("Invalid TLE syntax");

    // TODO: verify line using the checksum in field 14

    this.inclination = parseFloat(lines[2].substring(8,16));
    this.right_ascension = parseFloat(lines[2].substring(17,25));
    this.eccentricity = parseFloat("."+lines[2].substring(26,33).trim());
    this.argument_of_perigee = parseFloat(lines[2].substring(34,42));
    this.mean_anomaly = parseFloat(lines[2].substring(43,51));
    this.mean_motion = parseFloat(lines[2].substring(52,63));
    this.epoch_rev_number = parseInt(lines[2].substring(63,68));

}

orbit.TLE.prototype.toString = function() {
    return this.text;
}

/* Parse a string with one or more TLEs
 * @param       {string}
 * @returns     {array.<orbit.TLE>}
 */
orbit.parseTLE = function(tle_text) {
    if(!tle_text || typeof tle_text != "string" || tle_text == "") return [];

    var lines = tle_text.split("\n");

    // trim emepty lines
    for(var i = 0; i < lines.length; i++) if(lines[i] == "") lines.splice(i,1);

    // see if we got somethin reasonable
    if(lines.length < 3) return [];
    if(lines.length % 3 != 0) throw SyntaxError("The number of lines should be multiple of 3");

    // try and make the array
    var three;
    var array = [];
    while(lines.length) array.push(new orbit.TLE(lines.splice(0,3).join("\n")));

    return array;
}
