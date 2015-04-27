/*
 *
 * ======================================================
 * We follow the vis template of init - wrangle - update
 * ======================================================
 *
 * */

/**
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _eventHandler -- the Eventhandling Object to emit data to (see Task 4)
 * @constructor
 */
BarVis = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];

    // defines constants
    this.margin = {top: 20, right: 20, bottom: 30, left: 0},
    this.width = 600 - this.margin.left - this.margin.right,
    this.height = 600 - this.margin.top - this.margin.bottom;
    this.initVis();
}

/*
/**
 * Method that sets up the SVG and the variables
 */
BarVis.prototype.initVis = function(){

    // constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axis and scales
    this.x = d3.scale.linear()
      .range([0, this.width]);

    this.y = d3.scale.ordinal()
      .rangeRoundBands([0, this.height], .1);

    //this.color = d3.scale.category20();

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .ticks(8)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");

    // Add axes visual elements
    this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")");

    // filter, aggregate, modify data
    this.wrangleData(function(d){ return (d.state == "CO" && d.year == 2005);});

    // call the update method
    this.updateVis();
}


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
BarVis.prototype.wrangleData= function(_filterFunction){

    // displayData should hold the data whiche is visualized
    this.displayData = this.filterAndAggregate(_filterFunction);
    //// you might be able to pass some options,
    //// if you don't pass options -- set the default options
    //// the default is: var options = {filter: function(){return true;} }
    //var options = _options || {filter: function(){return true;}};
}



/**
 * the drawing function - should use the D3 selection, enter, exit
 */
BarVis.prototype.updateVis = function(){

    // Dear JS hipster,
    // you might be able to pass some options as parameter _option
    // But it's not needed to solve the task.
    // var options = _options || {};

    var that = this;

    // updates scales
    this.x.domain(d3.extent(this.displayData, function(d) { return d.values.snow_fall; }));
    this.y.domain(this.displayData.map(function(d) { return d.key; }));
    //this.color.domain(this.displayData.map(function(d) { return d.type }));

    // updates axis
    this.svg.select(".x.axis")
        .call(this.xAxis);

    // updates graph

    // Data join
    var bar = this.svg.selectAll(".bar")
      .data(this.displayData, function(d) { return d.key; });

    // Append new bar groups, if required
    var bar_enter = bar.enter().append("g");

    // Append a rect and a text only for the Enter set (new g)
    bar_enter.append("rect");
    bar_enter.append("text");


    // Add attributes (position) to all bars
    bar
      .attr("class", "bar")
      .transition()
      .attr("transform", function(d, i) { return "translate(0," + that.y(d.key) + ")"; })

    // Remove the extra bars
    bar.exit()
      .remove();

    // Update all inner rects and texts (both update and enter sets)

    bar.selectAll("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", this.y.rangeBand())
      .style("fill","purple")
      .transition()
      .attr("width", function(d, i) {
          return that.x(d.values.snow_fall);
      });

    bar.selectAll("text")
      .transition()
      .attr("x", function(d) { return that.x(d.values.snow_fall) + (that.doesLabelFit(d) ? -3 : 5); })
      .attr("y", function(d,i) { return that.y.rangeBand() / 2; })
      .text(function(d) { return d.key; })
      .attr("class", "type-label")
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return that.doesLabelFit(d) ? "end" : "start"; })
      .attr("fill", function(d) { return that.doesLabelFit(d) ? "white" : "black"; });

}


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
BarVis.prototype.onSelectionChange = function (fips,year){

    // TODO: call wrangle function
    fips = fips.toString().slice(0,-3);
    this.wrangleData(function(d){ data_fips = d.fips.toString().slice(0,-3);
      return (fips == data_fips && year == d.year);});
    this.updateVis();
}


/**
 * Helper function that figures if there is sufficient space
 * to fit a label inside its bar in a bar chart
 */
BarVis.prototype.doesLabelFit = function(datum, label) {
  var pixel_per_character = 6;  // obviously a (rough) approximation

  return datum.key.length * pixel_per_character < this.x(datum.values.snow_fall);
}

/**
 * The aggregate function that creates the counts for each age for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
BarVis.prototype.filterAndAggregate = function(_filter){


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
  var res = d3.nest()
    .key(function(d) { return d.county; })
    .rollup(function(leaves) { return {"snow_fall": d3.sum(leaves, function(d) { 
      return that.ExtractSnflDailyVals(d)})}})
    .entries(data);
  return res;
  
}

BarVis.prototype.ExtractSnflDailyVals = function (row) {
    var monthlySnfl = [];
    for (var i=1; i<=31; i++){
        var dailySnfl = +row["day" + i.toString()];
        monthlySnfl.push( (dailySnfl >= 0) ? dailySnfl : 0 );
    }
    var total = monthlySnfl.reduce(function(previousValue, currentValue, index, array) {
      return previousValue + currentValue;
    }, 0);;
    return total;
}

