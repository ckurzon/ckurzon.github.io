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
    this.fips = [23003, 23021,2185];

    // defines constants
    this.margin = {top: 100, right: 20, bottom: 30, left: 20},
    this.width = 300 - this.margin.left - this.margin.right,
    this.height = 300 - this.margin.top - this.margin.bottom;
    this.initVis();
}

/*
/**
 * Method that sets up the SVG and the variables
 */
BarVis.prototype.initVis = function(){

    var that = this;
    // constructs SVG layout
    this.svg = this.parentElement.select("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axis and scales
    this.y = d3.scale.linear()
      .range([this.height,0]);

    this.x = d3.scale.ordinal()
      .rangeRoundBands([0, this.width], .1);

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

    this.tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
      return "<strong>Snowfall</strong> <span style='color:red'>" + d.values.snow_fall + "</span>";
      })

    this.svg.call( that.tip );
    // filter, aggregate, modify data
    //this.wrangleData(function(d){ return (d.state == "CO" && d.year == 2005);});
    this.wrangleData(that.fips,2005);

    // call the update method
    this.updateVis();
}


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
BarVis.prototype.wrangleData= function(fips,year){

    // displayData should hold the data whiche is visualized
    this.displayData = this.filterAndAggregate(fips,year);
    //// you might be able to pass some options,
    //// if you don't pass options -- set the default options
    //// the default is: var options = {filter: function(){return true;} }
    //var options = _options || {filter: function(){return true;}};
}



/**
 * the drawing function - should use the D3 selection, enter, exit
 */
BarVis.prototype.updateVis = function(){


    var that = this;
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
    // updates axis

    this.x.domain(this.displayData.map(function(d,i) { return months[(parseInt(d.key))-1]; }));
    var range = d3.extent(this.displayData, function(d) { return d.values.snow_fall; });
    range[1] = (parseFloat(range[1]) + 10.0).toString();
    this.y.domain(range);
    // updates graph

    // Data join
    var bar = this.svg.selectAll(".bar")
      .data(this.displayData, function(d,i) { return months[(parseInt(d.key))-1]; })
      
    // Append new bar groups, if required
    var bar_enter = bar.enter().append("g")
                    .on('mouseover', that.tip.show)
                    .on('mouseout', that.tip.hide);


    // Append a rect and a text only for the Enter set (new g)
    bar_enter.append("rect")


    // Add attributes (position) to all bars
    bar
      .attr("class", "bar")
      .transition()
      .attr("transform", function(d, i) { return "translate(" + that.x(months[(parseInt(d.key))-1]) + ",0)"; })


    // Remove the extra bars
    bar.exit()
      .remove();

    // Update all inner rects and texts (both update and enter sets)

    bar.select("rect")
      .attr("x", 0)
      .attr("width", this.x.rangeBand())
      .style("fill", "fill")
      .transition()
      .attr("y", function(d){ return that.y(d.values.snow_fall);})
      .attr("height", function(d) {
          return that.height - that.y(d.values.snow_fall)
      })

    var yaxis = this.svg.select(".y.axis")
      .call(this.yAxis)


    var xaxis = this.svg.select(".x.axis")
      .call(this.xAxis)
      .selectAll("text")  
              .style("text-anchor", "end")
              .attr("dx", "-.50em")
              .attr("dy", ".15em")
              .attr("transform", function(d) {
                  return "rotate(-65)" 
                  });

    var text = this.svg.append("text")
        .attr("x", (this.width / 2))             
        .attr("y", -5)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .text(function(d) {"Monthly Snowfall"});

    bar_enter.on("click", function(d,i ) {
        /*bar.transition().remove();
        yaxis.transition().remove();
        xaxis.transition().remove();
        text.transition().remove();*/
       $(that.eventHandler).trigger("barClicked",d);
    })

/*
    bar.selectAll("text")
      .transition()
      .attr("x", function(d) { return that.y(d.values.snow_fall) + (that.doesLabelFit(d) ? -3 : 5); })
      .attr("y", function(d,i) { return that.y.rangeBand() / 2; })
      .text(function(d) { return d.key; })
      .attr("class", "type-label")
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return that.doesLabelFit(d) ? "end" : "start"; })
      .attr("fill", function(d) { return that.doesLabelFit(d) ? "white" : "black"; });*/

}


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
BarVis.prototype.onSelectionChange = function (fips,year){

    /*this.wrangleData(function(d){
      return (fips == d.fips && year == d.year);});*/
    this.fips = fips;
    this.wrangleData(fips,year);
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
BarVis.prototype.filterAndAggregate = function(fips,year){


    // Set filter to a function that accepts all items
    // ONLY if the parameter _filter
    //Dear JS hipster, a more hip variant of this construct would be:
    // var filter = _filter || function(){return true;}

  var that = this;

  var data = this.data.filter(function(d){return d.year == year});
  var res = [];
  for (i = 0; i<fips.length; i++) {
    data.map(function(d) { 
    if (d.fips == fips[i])
      res.push(d);
    })
  }
  
  var aggregated_data = d3.nest()
    .key(function(d) { return d.month; })
    .rollup(function(leaves) { return {"snow_fall": d3.sum(leaves, function(d) { 
      return d.monthly}), "fips": that.fips}})
    .entries(res);

  /*data.map(function(d) {
    d["month_num"] = d.month;
    d["month"] = n[d.month-1]})*/

  /*var res = d3.nest()
    .key(function(d) { return d.county; })
    .rollup(function(leaves) { return {"snow_fall": d3.sum(leaves, function(d) { 
      return d.monthly})}})
    .entries(data);*/
  return aggregated_data;
  
}
