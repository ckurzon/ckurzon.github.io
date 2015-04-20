MapVis = function(_parentElement, _mapData, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.us = _mapData;
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
    // constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.rateById = d3.map();

    this.quantize = d3.scale.quantize()
      .domain([0, .15])
      .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

    this.projection = d3.geo.albersUsa()
        .scale(1280)
        .translate([that.width / 2, that.height / 2]);

    this.path = d3.geo.path()
        .projection(that.projection);

    this.wrangleData(null);
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


    this.data.map(function (d) {that.rateById.set(d.id, (+d.snow_fall)/10.0)});
    
    /*this.svg.append("g")
        .attr("class", "counties")*/
      
    var path = this.svg.selectAll("path")
        .data(topojson.feature(that.us, that.us.objects.counties).features)
      
    var path_enter = path.enter().append("path")
        .attr("class", function(d) { return that.quantize(that.rateById.get(d.id)); })
        .attr("d", that.path);

    this.svg.append("path")
        .datum(topojson.mesh(that.us, that.us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", that.path);

    path_enter.on("click", function(d) {
       console.log(d.State);
    })
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


