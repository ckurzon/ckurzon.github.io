MapVis = function(_parentElement, _usData, _fipsData, _snflData, _eventHandler){
    this.parentElement = _parentElement;
    this.usData = _usData;
    this.fipsData = _fipsData;
    this.snflData = _snflData;

    this.eventHandler = _eventHandler;
    this.displayData = [];

    // defines constants
    this.margin = {top: 20, right: 20, bottom: 30, left: 0},
    this.width = 960 - this.margin.left - this.margin.right,
    this.height = 600 - this.margin.top - this.margin.bottom;
    this.initVis();
}

/*
/**
 * Method that sets up the SVG and the variables
 */
MapVis.prototype.initVis = function(){

    var that = this;

    this.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, 0])
        .html(function(d) {
            var ans = "County: <span>" + d.id + "</span>" +  "<br/>" +
                "Snowfall: <span>" + parseFloat(that.snflMapping.get(d.id)).toFixed(2) + "</span>";
            return ans
        });

    this.snflMax = 1.5;
    this.snflMin = 0;
    this.snflInvalid = -9999.000;
    this.quantizeRange = 5;

    this.snflMapping = d3.map();
    this.fipsMappingByCounty = d3.map();
    this.fipsMappingByID = d3.map();

    // constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.quantize = d3.scale.quantize()
      .domain([that.snflMin, that.snflMax])
      .range(d3.range(that.quantizeRange).map(function(i) { return "q" + i + "-9"; }));

    this.projection = d3.geo.albersUsa()
        .scale(1280)
        .translate([that.width / 2, that.height / 2]);

    this.path = d3.geo.path()
        .projection(that.projection);

    this.svg.call( that.tip );

    //this.wrangleData(null);

    //FIPS
    for (var i=0; i<that.fipsData["table"]["rows"].length; i++){
        that.fipsMappingByCounty.set( that.fipsData["table"]["rows"][i][1].toUpperCase(), parseInt(that.fipsData["table"]["rows"][i][0], 10));
//            fipsMappingByID.set( parseInt(fips["table"]["rows"][i][0], 10), fips["table"]["rows"][i][1].toUpperCase() );
    }
    console.log("Done fips map");

    var undefinedCount = 0;
    for (var i=0; i<that.snflData.length; i++){
        var stateCountyID = that.snflData[i].state + ", " + that.snflData[i].county;
        var monthlySnfl = ExtractSnflDailyVals(that.snflData[i]);
        var aggregatedSnfl = CalculateAggregateSnfl(monthlySnfl);

        var countyFipsID = that.fipsMappingByCounty.get(stateCountyID);
        if (countyFipsID == undefined){
            //console.log( stateCountyID );
            undefinedCount = undefinedCount + 1;
        }
        else{
            var v = parseInt(that.fipsMappingByCounty.get(stateCountyID), 10);
            that.snflMapping.set( v, aggregatedSnfl);
        }


    }
    console.log( undefinedCount );
    console.log("Done snfl map");



    // call the update method
    this.updateVis();
}


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
MapVis.prototype.wrangleData= function(_filterFunction){

    // displayData should hold the data whiche is visualized
    //// you might be able to pass some options,
    //// if you don't pass options -- set the default options
    //// the default is: var options = {filter: function(){return true;} }
    //var options = _options || {filter: function(){return true;}};
    this.displayData = this.filterAndAggregate(_filterFunction);
}



/**
 * the drawing function - should use the D3 selection, enter, exit
 */
MapVis.prototype.updateVis = function(){

    // Dear JS hipster,
    // you might be able to pass some options as parameter _option
    // But it's not needed to solve the task.
    // var options = _options || {};

    var that = this;

    this.svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(that.usData, that.usData.objects.counties).features)
        .enter().append("path")
        .attr("class", function(d) {
            var val = that.snflMapping.get(d.id);
            if (val == undefined) console.log( "error" );
            if (val != undefined){
                return that.quantize(val);
            }
        })
        .attr("d", that.path)
        .on('mouseover', that.tip.show)
        .on('mouseout', that.tip.hide);


    this.svg.append("path")
        .datum(topojson.mesh(that.usData, that.usData.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", that.path);

    console.log("Map ready");
    console.log("max_snfl threshold = ", that.snflMax);

}


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
MapVis.prototype.onSelectionChange = function (selectionStart, selectionEnd){

    // TODO: call wrangle function

    this.updateVis();
}


/**
 * Helper function that figures if there is sufficient space
 * to fit a label inside its bar in a bar chart
 */


/**
 * The aggregate function that creates the counts for each age for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
MapVis.prototype.filterAndAggregate = function(_filter){


    // Set filter to a function that accepts all items
    // ONLY if the parameter _filter is NOT null use this parameter
    var filter = function(){return true;}
    if (_filter != null){
        filter = _filter;
    }
    //Dear JS hipster, a more hip variant of this construct would be:
    // var filter = _filter || function(){return true;}

    var that = this;

    var data = this.data.filter(filter);

    return data;
}

//Helpers
//////////////////////////////////////////////////////////////
function ExtractSnflDailyVals(d){
    var monthlySnfl = [];
    for (var i=1; i<=31; i++){
        var dailySnfl = +d["day" + i.toString()];
        //if (dailySnfl > 0) console.log( dailySnfl );
        monthlySnfl.push( (dailySnfl >= 0) ? dailySnfl : 0 );
    }
    return monthlySnfl;
}

function CalculateAggregateSnfl( days ){
    return d3.sum( days );
};


