// let widthMainGraph = document.getElementsByTagName('main')[0].offsetWidth;
$('.content').hide();
$('#by_country').show();

const widthMainGraph = document.getElementById('summary_stats').offsetWidth;
const heightMainGraph = Math.max(400, screen.height*0.5);
const root = document.documentElement,
      rootStyle = getComputedStyle(root);

// Colors
const colors_countries = ["#1abb9b","#3497da","#9a59b5","#f0c30f","#e57e22","#e64c3c","#7f8b8c","#CC6666", "#9999CC", "#66CC99"];
const colors = ['#2ecb71','#f29b12','#e64c3c']; // red, green orange for dead, confirmed and recovered cases
let colorVariables = ['--background-color','--color-text','--text-muted']; // for dark mode
let colorsValues = {};
colorVariables.forEach(function(it){colorsValues[it+'-light'] = rootStyle.getPropertyValue(it+'-light');
                                    colorsValues[it+'-dark'] = rootStyle.getPropertyValue(it+'-dark');});     


// Initiate variables
let data = [],
    data_by_country = [],
    pivot_columns = ['Province/State','Country/Region','Lat','Long'],
    cases_categories = ['Recovered','Confirmed','Deaths'],
    countries = [],
    list_dates = [],
    startDate,
    endDate,
    population_data = [];
let logScale = false,
    logScale2 = false,
    country, data_country,
    darkMode = true,
    percPopulation = false,
    percPopulation2 = false;

// DARK MODE
$('#darkmodeSwitch').click(function() {
    var $this = $(this);
    if ($this.hasClass('darkmode')) {
        // switch to light mode
        colorVariables.forEach(function(it) {root.style.setProperty(it,colorsValues[it + '-light']);});
        $this.removeClass('darkmode badge-secondary');
        $this.addClass('badge-secondary');
        $this.text('OFF');
        darkMode = false;
    } else {
        colorVariables.forEach(function(it) {root.style.setProperty(it,colorsValues[it+'-dark']);});
        $this.addClass('darkmode badge-primary');
        $this.removeClass('badge-secondary');
        $this.text('ON');
        darkMode = true;
    }
});


// ====================================================================== //
// FUNCTIONS
// ---------
function zip() {
    // This function mimics zip function in Python
    var args = [].slice.call(arguments);
    var shortest = args.length==0 ? [] : args.reduce(function(a,b){
        return a.length<b.length ? a : b;
    });
    return shortest.map(function(_,i){
        return args.map(function(array){return array[i];});
    });
}
function parseData(wide_data, pivot_columns, category) {
    let long_data = [],
        columns = Object.keys(wide_data[0]),
        wide_columns = columns.filter(x => !pivot_columns.includes(x));
    for (const element of wide_data) {
        for (const col of wide_columns) {
            let long_element = {};
            long_element['field_id'] = col;
            long_element['field_value'] = +element[col];
            for (const col of pivot_columns) {
                long_element[col] = element[col];
            }
            long_element['date'] = d3.timeParse("%m/%d/%y")(long_element['field_id']);
            long_element['category'] = category;
            long_element['key'] = category + long_element['Country/Region'] + long_element['field_id'];
            long_element['key_world'] = category + long_element['field_id'];
            long_data.push(long_element);
        }
    }
    list_dates = d3.set(data.map(d => d['date'])).values();
    startDate = list_dates[0];
    endDate = list_dates.slice(-1)[0];
    return long_data.sort(function(a,b) {return a.date - b.date;});
}
function addRates(data) {
    let keys = d3.set(data.map(d => d['Country/Region']+d['field_id'])).values();
    let new_elements = [];
    console.log(keys.length);
    for (const key of keys) {
        let _ = data.filter(d => d['Country/Region']+d['field_id'] === key);
        let confirmed = _.filter(d => d['key'] === 'Confirmed' + key)[0],
            deaths = _.filter(d => d['key'] === 'Deaths' + key)[0],
            recovered = _.filter(d => d['key'] === 'Recovered' + key)[0],
            death_rate = confirmed === 0 ? 0 : deaths['field_value'] / confirmed['field_value'],
            recovered_rate = confirmed === 0 ? 0 : recovered['field_value'] / confirmed['field_value'];

        // Reuse the element to add them to data
        let death_rate_el = $.extend(true, {}, deaths);
        death_rate_el['category'] = 'Deaths rate';
        death_rate_el['field_value'] = death_rate;
        death_rate_el['key'] = 'Deaths rate ' + key;
        new_elements.push(death_rate_el);

        let recov_rate_el = $.extend(true, {}, deaths);
        recov_rate_el['category'] = 'Recovered rate';
        recov_rate_el['field_value'] = recovered_rate;
        death_rate_el['key'] = 'Recovered rate ' + key;
        new_elements.push(recov_rate_el);
    }
    return data.concat(new_elements);
}


function groupBy(array, key, colSum = [], colCount = [], colFirst = []){
    // This function mimics a groupby with sum as the agg function.
    // It uses D3.js
    // @ Arguments:
    // - array: array to group by
    // - key: key to group by
    // - colSum: array of columns to agg by sum
    // - colCount: array of columns to agg by count
    // - colFirst: array of columns to keep first
    return d3.nest()
        .key(function(d) { return d[key];})
        .rollup(function(d) {
            var out = {};
            colSum.forEach(function(k) {
                out[k] = d3.sum(d, v => v[k]);
            });
            colCount.forEach(function(k) {
                out[k] = d.filter(v => v[k] != null).length;
            });
            colFirst.forEach(function(k) {
                out[k] = d[0][k];
            });
            return out;
        })
        .entries(array)
        .map(function (group) {
            var out = {};
            out[key] = group.key;
            [...colSum,...colCount,...colFirst].forEach(function(k) {
                out[k] = group.value[k];
            });
            return out;
        });
}
function get_list_countries(data) {
    let countries_ = [];
    for (const category of cases_categories) {
        let _ = d3.set(data.filter(f => f.category === category).map(f => f['Country/Region'])).values();
        countries_ = countries_.concat(_);
    }
    countries = d3.set(countries_).values().sort();

    // Add countries to selector
    let chooseCountryHTML = '';
    for (const [index, country] of countries.entries()) {
        let selected = country === 'World' ? 'selected' : '';
        chooseCountryHTML += `<option ${selected}>${country}</option>`;
    }
    $('#chooseCountry').html(chooseCountryHTML);
    $('#chooseCountry').show();
}
function load_summary_data() {
    for (const category of cases_categories) {
        let data_category = data_country.filter(f => f['category'] === category),
            last_date = data_category.slice(-1)[0]['date'],
            last_value = data_category.slice(-1)[0][(percPopulation ? 'field_value_pop' : 'field_value')];

        // Add this data to 
        $(`#nb_${category.toLowerCase()}`).html(d3.format((percPopulation ? '%' : ','))(last_value));
        $('#lastDataPoint').html(d3.timeFormat("%d-%b-%y")(last_date));
        sparkline(`#sparkline_${category.toLowerCase()}`, data_category, 'field_id', (percPopulation ? 'field_value_pop' : 'field_value'), logScale);
    }
}
function get_dates(data) {
    list_dates = d3.set(data.map(d => d['date'])).values();
}
function sparkline(elemId, data, xVar, yVar, logScale = false) {
    // Plot a Sparkline (see Edward Tufte)

    // elemId
    var width = 120;
    var height = 25;
    var x = d3.scaleLinear().range([0, width - 2]);
    let y;
    if (logScale) {
        y = d3.scaleSymlog().range([height - 4, 0]);
    } else {
        y = d3.scaleLinear().range([height - 4, 0]);
    }
    var parseDate = d3.timeParse("%m/%d/%y");
    data.forEach(function(d) {
        d.x = parseDate(d[xVar]);
        d.y = +d[yVar];
    });
    var line = d3.line()
        .curve(d3.curveBasis)
        .x(function(d) { return x(d.x); })
        .y(function(d) { return y(d.y); });
    x.domain(d3.extent(data, function(d) { return d.x; }));
    y.domain(d3.extent(data, function(d) { return d.y; }));

    // remove existing
    d3.select(elemId).selectAll('span').remove();
    var svg = d3.select(elemId)
        .append('span')
        .attr('class','sparklines-plot')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(0, 2)');
    svg.append('path')
        .datum(data)
        .attr('class', 'sparkline')
        .attr('d', line);
    svg.append('circle')
        .attr('class', 'sparkcircle')
        .attr('cx', x(data[data.length-1].x))
        .attr('cy', y(data[data.length-1].y))
        .attr('r', 1.5);
    d3.select(elemId)
        .append('span')
        .attr('class','sparklines-number')
        .text(d3.format((percPopulation ? '%' : '.3s'))(data[data.length-1].y));
}
function createGraph(id, w = widthMainGraph, h = heightMainGraph) {
    var margin = {top: 10, right: 30, bottom: 30, left: 60};
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;
    var svg = d3.select(id)
        .append("svg")
        .attr('id',id.substring(1,) + '_svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr('id',id.substring(1,) + '_g')
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // Add overlay for focus & tooltip
    // (useful to pointer events, see css)
    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height);

}
function updateGraph(id, data, xVar, yVar, logScale = logScale, w = widthMainGraph, h = heightMainGraph, categories = cases_categories) {
    var margin = {top: 10, right: 30, bottom: 30, left: 60};
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    // Select the id
    var svg = d3.select(id + '_g');

    // Data Filtered
    data = data.filter(d => d['date'] >= new Date(startDate) &&
                       d['date'] <= new Date(endDate));
    
    var color = d3.scaleOrdinal()
        .domain(categories)
        .range(colors);
    
    // Delete the axis
    svg.selectAll('g.x.axis').remove();
    svg.selectAll('g.y.axis').remove();
    svg.selectAll('g.yGrid').remove();
    
    // X-axis
    let x = d3.scaleTime()
        .domain(d3.extent(data, d => d[xVar]))
        .range([0, width]);

    svg.append("g")
        .attr('class','x axis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom()
              .scale(x)
              .tickFormat(d3.timeFormat("%d/%m/%y"))
             );

    // Y-axis
    let y;
    y = d3[logScale ? "scaleSymlog" : "scaleLinear"]()
        .domain(d3.extent(data, d => d[yVar]))
        .nice()
        .range([height, 0]);

    let yGrid = svg => svg
        .call(d3.axisRight(y)
              .tickSize(width)
              .tickFormat(d3.format((percPopulation ? '%' : '.3s'))))
        .call(g => g.selectAll('.domain').remove())
        .call(g => g.selectAll(".tick:not(:first-of-type) line")
              .attr("stroke-opacity", 0.5)
              .attr("stroke-dasharray", "2,2"))
        .call(g => g.selectAll(".tick text")
              .remove());
    
    svg.append("g")
        .attr('class','yGrid')
        .call(yGrid);

    svg.append("g")
        .attr('class','y axis')
        .call(d3.axisLeft(y)
              .tickFormat(d3.format((percPopulation ? '%' : '.3s'))));
        
    // Add the content
    svg.selectAll('path.lines').remove();
    categories.forEach(function(category,index) {
        var data__ = data.filter(d => d.category === category);
        svg.append('path')
            .datum(data__)
            .attr('class','lines')
            .attr('fill','none')
            .attr('stroke', d => color(category))
            .attr("stroke-width", 3)
            .attr('d',d3.line()
                  .x(d => x(d[xVar]))
                  .y(d => y(d[yVar]))
                 );
    });

    // Add Tooltip (vertical line + tooltip)
    function addTooltip(g, data, mx, my) {
        if (!data) return g.style("display", "none");
        
        g.style("display", null);

        const xLine = g.selectAll("line")
              .data([null])
              .join("line")
              .attr("class", "tooltip_line")
              .attr("x1", mx).attr("x2", mx) 
              .attr("y1", 0).attr("y2", height);

        const dots = g.selectAll("circle")
              .data(data.slice(1))
              .join("circle")
              .style("fill", d => color(d.category))
              .attr("r", 5)
              .attr("cx", (d, i) => x(d[xVar]))
              .attr("cy", (d, i) => y(d[yVar]));

        const path = g.selectAll("rect")
              .data([null])
              .join("rect")
              .attr("class","rect_tooltip");

        const text = g.selectAll("text")
              .data([null])
              .join("text")
              .call(text => text
                    .selectAll('tspan')
                    .data(data)
                    .join("tspan")
                    .attr("x", 0)
                    .attr("y", (d, i) => `${i * 1.1}em`)
                    .attr("class","tooltip_text")
                    .style("font-weight","bold")
                    .style("fill",(d, i) => i === 0 ? (darkMode ? '#dadada' : '#181818') : color(d.category))
                    .text((d,i) => i === 0 ? d3.timeFormat("%d-%b-%y")(d) : `${d['category']}: ${d3.format((percPopulation ? '%' : ','))(d[yVar])}`));
        const {xx, yy, width: w, height: h} = text.node().getBBox();

        // Make sure the tooltip is always in the graph area (and visible)
        let text_x = w + mx + 10 > width ? mx - w - 10 : mx + 10,
            text_y = h + my - 20 > height ? my - h : my;
        text.attr("transform", `translate(${text_x},${text_y})`);

        path.attr("x", text_x-5)
            .attr("y", text_y - 20)
            .attr("rx", 5)
            .attr("width", w + 10)
            .attr("height", h + 10);
        
        return true;
    };
    function getMouseData(mx) {
        const bisect = d3.bisector(d => d[xVar]).left;
        let mouseDate = x.invert(mx),
            i = bisect(data, mouseDate),
            a = data[i-1],
            b = data[i],
            fid = mouseDate - a[xVar] > mouseDate - b[xVar] ? b['field_id'] : a['field_id'],
            date = mouseDate - a[xVar] > mouseDate - b[xVar] ? b[xVar] : a[xVar],
            values = data.filter(d => d['field_id'] === fid).sort((a,b) => b[yVar] - a[yVar]);
        return [date].concat(values);
    }
    svg.selectAll("g.tooltip_container").remove();
    const tooltip = svg.append("g").attr("class","tooltip_container");
    svg.on("touchmove mousemove", function() {
        let mouseData = getMouseData(d3.mouse(this)[0]),
            mouse_y = d3.mouse(this)[1];
        tooltip
            .call(addTooltip, mouseData, x(mouseData[0]), mouse_y+30);            
    });
    svg.on("touchend mouseleave", () => tooltip.call(addTooltip, null));

    
    // Add legend
    addLegend(id+'_svg',categories,3*margin.right,margin.top);
}
function addLegend(id, keys, px, py, colors_ = colors) {
    var color = d3.scaleOrdinal()
        .domain(keys)
        .range(colors_);

    const svg = d3.select(id);

    // remove legend if exist
    svg.selectAll('.legend').remove();
    const legend = svg.append('g')
          .attr('class','legend');

    const  path = legend.selectAll("rect")
          .data([null])
          .join("rect")
          .attr("class","rect_legend");
    
    const mydots = legend.selectAll(".dots-legend")
          .data(keys);
    mydots.exit().remove();
    mydots.enter()
        .append("circle")
        .merge(mydots)
        .attr("cx", px + 10)
        .attr("cy", (d,i) =>  py + i*25) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("r", 3)
        .attr('class','dots-legend')
        .style("fill",d => color(d));

    // Add one dot in the legend for each name.
    var mylabels = legend.selectAll(".labels-legend")
        .data(keys);
    mylabels.exit().remove();
    mylabels.enter()
        .append("text")
        .merge(mylabels)
        .attr("x", px + 30)
        .attr("y", (d,i) => py + i*25) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", d => color(d))
        .text(t => t)
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .attr('class','labels-legend');

    const {x, y, width: w, height: h} = legend.node().getBBox();
    path.attr('x',px-5)
        .attr('y',py-5)
        .attr('width', (w > 0 ? w + 10 : d3.max(keys.map(d => d.length))*10 + 10)) // if graph is not displayed the width and height will be zero (*)
        .attr('height',(h > 0 ?  h + 10 : keys.length * 25 + 10));
    // (*) we try to estimate the width and height based on max
    //     nb of characthers of the legend text and nb of keys
}

function computeWorldData() {
    let data_ = groupBy(data_by_country,'key_world',['field_value','Population'],[],['field_id','Country/Region','date','category','Lat','Long','Province/State']);
    data_.forEach(function(d){
        d['Country/Region'] = 'World';
        d['Province/State'] = '';
        d['key'] = d.category + d['Country/Region'] + d['field_id'];
        d['field_value_pop'] = d['field_value'] / d['Population'];
    });
    return data_by_country.concat(data_);
}
function updateGraphComparison(data, logScale = false, yVar = 'field_value', id = "#compare_graph", w = widthMainGraph, h = heightMainGraph, xVar = 'date') {
    var margin = {top: 10, right: 30, bottom: 30, left: 60};
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    // Select the id
    var svg = d3.select(id + '_g');

    // Filter data
    data = data.filter(d => d['date'] >= new Date(startDate) &&
                       d['date'] <= new Date(endDate));
    
    // Delete the axis
    svg.selectAll('g.x.axis').remove();
    svg.selectAll('g.y.axis').remove();
    svg.selectAll('g.yGrid').remove();

    // Get the list of dates
    let dates = d3.set(data.map(d => d[xVar])).values();

    // Get y data with the offsets
    let y_data = [],
        keys = [];

    // Offset
    function offset_data(data, offset_value) {
        data.forEach(function(it,ind) {
            let value = ind + offset_value < data.length ? data[ind + offset_value][yVar] : NaN;
            it[yVar] = value; // update value
            it.offset = offset_value; // add offset to the element
        });
        return data;
    }
    function getKey(e) {
        return `${e['Country/Region']} - ${e['category']}` + (e['offset'] > 0 ? ` (offset: ${e['offset']} day${e['offset'] > 1 ? 's' : ''})` : "");
    }
    elements.forEach(function(element,index) {
        let _ = data.filter(d => (d['category'] === element['category'] &&
                                  d['Country/Region'] === element['Country/Region']));
        _ = offset_data($.extend(true, [], _), element['offset']);
        y_data = y_data.concat(_);
        keys.push(getKey(element));
    });
    
    // X-axis
    var x = d3.scaleTime()
        .domain(d3.extent(y_data, d => d[xVar]))
        .range([0, width]);

    svg.append("g")
        .attr('class','x axis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom()
              .scale(x)
              .tickFormat(d3.timeFormat("%d/%m/%y"))
             );

    // Y-axis
    let y;    
    y = d3[logScale ? "scaleSymlog" : "scaleLinear"]()
        .domain(d3.extent(y_data, d => d[yVar]))
        .nice()
        .range([height, 0]);

    let yGrid = svg => svg
        .call(d3.axisRight(y)
              .tickSize(width)
              .tickFormat(d3.format((percPopulation ? '%' : '.3s'))))
        .call(g => g.selectAll('.domain').remove())
        .call(g => g.selectAll(".tick:not(:first-of-type) line")
              .attr("stroke-opacity", 0.5)
              .attr("stroke-dasharray", "2,2"))
        .call(g => g.selectAll(".tick text")
              .remove());
    
    svg.append("g")
        .attr('class','yGrid')
        .call(yGrid);

    svg.append("g")
        .attr('class','y axis')
        .call(d3.axisLeft(y)
              .tickFormat(d3.format((percPopulation ? '%' : '.3s'))));
    
    // Colors
    let color = d3.scaleOrdinal()
        .domain(keys)
        .range(colors_countries);

    // Add lines
    svg.selectAll('path.lines').remove();
    elements.forEach(function(element,index) {
        let _ = y_data.filter(d => (d['category'] === element['category'] &&
                                    d['Country/Region'] === element['Country/Region']));
        svg.append('path')
            .datum(_)
            .attr('class','lines')
            .attr('fill','none')
            .attr('stroke', color(getKey(element)))
            .attr("stroke-width", 3)
            .attr('d',d3.line()
                  .x(d => x(d[xVar]))
                  .y(d => y(d[yVar]))
                 );
    });
    
    // Add Tooltip (vertical line + tooltip)
    function addTooltip(g, data, mx, my) {
        if (!data) {
            g.selectAll("line").remove();
            g.selectAll("circle").remove();
            g.selectAll("text").remove();
            return g.style("display", "none");
        }
        
        g.style("display", null);


        const xLine = g.selectAll("line")
              .data([null])
              .join("line")
              .attr("class","tooltip_line")
              .attr("x1", mx).attr("x2", mx) 
              .attr("y1", 0).attr("y2", height);

        const dots = g.selectAll("circle")
              .data(data.slice(1))
              .join("circle")
              .style("fill", (d, i) => color(getKey(d)))
              .attr("r", 5)
              .attr("cx", (d, i) => x(d[xVar]))
              .attr("cy", (d, i) => y(d[yVar]));

        const path = g.selectAll("rect")
              .data([null])
              .join("rect")
              .attr("class","rect_tooltip");
        
        const text = g.selectAll("text")
              .data([null])
              .join("text")
              .call(text => text
                    .selectAll('tspan')
                    .data(data)
                    .join("tspan")
                    .attr("x", 0)
                    .attr("y", (d, i) => `${i * 1.1}em`)
                    .style("font-weight","bold")
                    .style("fill",(d, i) => i === 0 ? (darkMode ? '#dadada' : '#181818') : color(getKey(d)))
                    .text((d,i) => i === 0 ? d3.timeFormat("%d-%b-%y")(d) : `${getKey(d)}: ${d3.format((percPopulation2 ? '%' : ','))(d[yVar])}`));
        
        const {xx, yy, width: w, height: h} = text.node().getBBox();
        let text_x = w + mx + 10 > width ? mx - w - 10 : mx + 10,
            text_y = h + my - 20 > height ? my - h : my;
        text.attr("transform", `translate(${text_x},${text_y})`);
        path.attr("x", text_x-5)
            .attr("y", text_y-20)
            .attr("rx", 5)
            .attr("width", w + 10)
            .attr("height", h + 10);
        return true;
    };
    function getMouseData(mx) {
        const bisect = d3.bisector(d => d[xVar]).left;
        let mouseDate = x.invert(mx),
            i = bisect(y_data, mouseDate),
            a = y_data[i-1],
            b = y_data[i],
            fid = mouseDate - a[xVar] > mouseDate - b[xVar] ? b['field_id'] : a['field_id'],
            date = mouseDate - a[xVar] > mouseDate - b[xVar] ? b[xVar] : a[xVar],
            values = y_data.filter(d => d['field_id'] === fid).sort((a,b) => b[yVar] - a[yVar]);
        return [date].concat(values);
    }
    svg.selectAll("g.tooltip_container").remove();
    const tooltip = svg.append("g").attr("class","tooltip_container");
    svg.on("touchmove mousemove", function() {
        let mouseData = getMouseData(d3.mouse(this)[0]),
            mouse_y = d3.mouse(this)[1];
        tooltip
            .call(addTooltip, mouseData, x(mouseData[0]), mouse_y+30);            
    });
    svg.on("touchend mouseleave", () => tooltip.call(addTooltip, null));

    // Add legend
    addLegend(id+'_svg',keys,3*margin.right,margin.top,colors_countries);
}

function build_elements_compare() {
    let html = '';
    for (const [index, element] of elements.entries()) {
        element.id = (parseInt(Math.random()*1e16)).toString();
        html += `<div class="col-lg-4 col-md-6 col-12 mt-2 mb-2"> <div class="card element" style="border-color:${colors_countries[index]}"><div class="card-title country_element mb-1"><select onchange="update_element(this,'Country/Region')" class="select-country-element" element_id="${element.id}">`;
        for (const country of countries) {
            let selected = country === element['Country/Region'] ? 'selected' : '';
            html += '<option ' + selected + '>' + country + '</option>';
        }
        html += '</select><svg class="ml-4 svg-icon delete-element" onclick=delete_element('+ element.id +') viewBox="0 0 20 20" data-toggle="tooltip" data-placement="top" title="delete plot"><path d="M10.185,1.417c-4.741,0-8.583,3.842-8.583,8.583c0,4.74,3.842,8.582,8.583,8.582S18.768,14.74,18.768,10C18.768,5.259,14.926,1.417,10.185,1.417 M10.185,17.68c-4.235,0-7.679-3.445-7.679-7.68c0-4.235,3.444-7.679,7.679-7.679S17.864,5.765,17.864,10C17.864,14.234,14.42,17.68,10.185,17.68 M10.824,10l2.842-2.844c0.178-0.176,0.178-0.46,0-0.637c-0.177-0.178-0.461-0.178-0.637,0l-2.844,2.841L7.341,6.52c-0.176-0.178-0.46-0.178-0.637,0c-0.178,0.176-0.178,0.461,0,0.637L9.546,10l-2.841,2.844c-0.178,0.176-0.178,0.461,0,0.637c0.178,0.178,0.459,0.178,0.637,0l2.844-2.841l2.844,2.841c0.178,0.178,0.459,0.178,0.637,0c0.178-0.176,0.178-0.461,0-0.637L10.824,10z"></path></svg></div>';
        html += `<div class="category_element mb-1 mt-1"><select onchange="update_element(this,'category')" class="select-category-element" element_id="${element.id}">`;
        for (const category of cases_categories) {
            let selected = category === element['category'] ? 'selected' : '';
            html += '<option ' + selected + '>' + category + '</option>';
        }
        html +=  '</select></div><div class="offset_element"><span>Offset:</span><span id="offset_'+ element.id+'" class="offset pr-1 pl-1">' + element['offset'] + '</span><span>days</span> <svg class="svg-icon" element_id="' + element.id + '" viewBox="0 0 20 20" onclick=update_offset(this,1)> <path d="M14.613,10c0,0.23-0.188,0.419-0.419,0.419H10.42v3.774c0,0.23-0.189,0.42-0.42,0.42s-0.419-0.189-0.419-0.42v-3.774H5.806c-0.23,0-0.419-0.189-0.419-0.419s0.189-0.419,0.419-0.419h3.775V5.806c0-0.23,0.189-0.419,0.419-0.419s0.42,0.189,0.42,0.419v3.775h3.774C14.425,9.581,14.613,9.77,14.613,10 M17.969,10c0,4.401-3.567,7.969-7.969,7.969c-4.402,0-7.969-3.567-7.969-7.969c0-4.402,3.567-7.969,7.969-7.969C14.401,2.031,17.969,5.598,17.969,10 M17.13,10c0-3.932-3.198-7.13-7.13-7.13S2.87,6.068,2.87,10c0,3.933,3.198,7.13,7.13,7.13S17.13,13.933,17.13,10"></path></svg><svg class="svg-icon" element_id="' + element.id + '" viewBox="0 0 20 20" onclick=update_offset(this,-1)><path d="M14.776,10c0,0.239-0.195,0.434-0.435,0.434H5.658c-0.239,0-0.434-0.195-0.434-0.434s0.195-0.434,0.434-0.434h8.684C14.581,9.566,14.776,9.762,14.776,10 M18.25,10c0,4.558-3.693,8.25-8.25,8.25c-4.557,0-8.25-3.691-8.25-8.25c0-4.557,3.693-8.25,8.25-8.25C14.557,1.75,18.25,5.443,18.25,10 M17.382,10c0-4.071-3.312-7.381-7.382-7.381C5.929,2.619,2.619,5.93,2.619,10c0,4.07,3.311,7.382,7.381,7.382C14.07,17.383,17.382,14.07,17.382,10"></path></svg></div></div></div>';
    }
    $('#compare_elements_container').html(html);
}
function update_offset(el, value) {
    let element_id = $(el).attr('element_id');
    elements.forEach(function(it, ind) {
        if (it.id === element_id) {
            it.offset = Math.max(0, it.offset + parseInt(value));
            $(`#offset_${element_id}`).html(it.offset);
        }
    });
    updateGraphComparison(data_by_country, logScale2, (percPopulation2 ? 'field_value_pop' : 'field_value'));
}
function update_element(el, property) {
    let element_id = $(el).attr('element_id');
    elements.forEach(function(it, ind) {
        if (it.id === element_id) {
            it[property] = el.value;
        }
    });
    updateGraphComparison(data_by_country, logScale2, (percPopulation2 ? 'field_value_pop' : 'field_value'));
}
function add_element() {
    let last_el = elements.length > 0 ? $.extend(true, {}, elements[elements.length-1]) : {
        "Country/Region": "France",
        "category": "Confirmed",
        "offset": 0
    }; // copy last element
    last_el['Country/Region'] = elements.length > 0 ? countries[Math.min(countries.indexOf(last_el['Country/Region'])+1,countries.length-1)] : 'France';
    elements = elements.concat(last_el);
    build_elements_compare();
    updateGraphComparison(data_by_country, logScale2, (percPopulation2 ? 'field_value_pop' : 'field_value'));
}
function delete_element(id) {
    elements = elements.filter(d => d.id != id);
    build_elements_compare();
    updateGraphComparison(data_by_country, logScale2, (percPopulation2 ? 'field_value_pop' : 'field_value'));
}

function addDatestoSelect() {
    let html_start_dates = '',
        html_end_dates = '';
    for (const d of list_dates) {
        html_start_dates += '<option ' + (d === startDate ? 'selected' : '') + '>' + d3.timeFormat("%d-%b-%y")(new Date(d)) + '</option>';
        html_end_dates += '<option ' + (d === endDate ? 'selected' : '') + '>' + d3.timeFormat("%d-%b-%y")(new Date(d)) + '</option>';
    }
    $('#startDate').html(html_start_dates);
    $('#endDate').html(html_end_dates);
    $('#startDate2').html(html_start_dates);
    $('#endDate2').html(html_end_dates);

}
function addPopulationData() {
    data_by_country.forEach(function(e) {
        e['Population'] = population_data
            .filter(d => d['Country/Region'] === e['Country/Region'])
            .map(d => +d['Population'])[0];
        e['field_value_pop'] = e['field_value'] / e['Population'];
    });
}
// ====================================================================== //
createGraph('#country_graph');
createGraph('#compare_graph');

let elements = [
    {
        "Country/Region": "France",
        "category": "Confirmed",
        "offset": 0
    },
    {
        "Country/Region": "Italy",
        "category": "Confirmed",
        "offset": 0
    },
    {
        "Country/Region": "Spain",
        "category": "Confirmed",
        "offset": 0
    }
];

// Load Data
let nb_process_ended = 0;
for (const element of cases_categories) {
    let data_link =  `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-${element}.csv`;
    d3.csv(data_link)
        .then(function(d) {
            console.log(`Loaded data for ${element}. Length: ${d.length}`);
            data = data.concat(parseData(d, pivot_columns, element));
        })
        .catch(function(error) {
            console.log(error);
        })
        .finally(_ => nb_process_ended += 1);
}
d3.csv('https://raw.githubusercontent.com/louisdecharson/covid-19/master/population_data.csv')
    .then(d => population_data = d)
    .catch(e => console.log(e))
    .finally(_ => nb_process_ended += 1);
// Process Data
let timer = setInterval(() => {
    if (nb_process_ended === 4) {
        clearInterval(timer);

        // Add Dates to select
        addDatestoSelect();
        
        // Group By Data
        data_by_country = groupBy(data,'key',['field_value'],[],
                                  ['field_id','Country/Region','date','category','Lat','Long','key_world']);

        // Add Population Data
        addPopulationData();

        // Compute data for the world
        data_by_country = computeWorldData();
        get_list_countries(data_by_country);

        // Add rates
        // data_by_country = addRates(data_by_country);
        
        country = 'World';
        data_country = data_by_country.filter(d => d['Country/Region'] === country);
        load_summary_data(data_country);
        updateGraph('#country_graph', data_country, 'date','field_value', logScale);

        // Compare
        build_elements_compare();
        updateGraphComparison(data_by_country, logScale2);
    }
}, 100);


// ======

$('.sidebar_show').click(function(){
    let $this = $(this);
    let target = $this.attr('target');
    $('.sidebar_show.active').each(function() {
        $(this).removeClass('active');
    });
    $this.addClass('active');
    $('.content').hide();
    $(target).show();
});

$('#chooseCountry').change(function(){
    country = $('#chooseCountry option:selected').text(),
    data_country = data_by_country.filter(d => d['Country/Region'] === country);
    load_summary_data(data_country);
    updateGraph('#country_graph', data_country, 'date', (percPopulation ? 'field_value_pop' : 'field_value'),  logScale);
});
$('#logScaleSwitch').change(function(){
    logScale = logScale ? false : true;
    updateGraph('#country_graph', data_country, 'date', (percPopulation ? 'field_value_pop' : 'field_value'), logScale);
    load_summary_data(data_country);
});

//
$('#logScaleSwitch2').change(function(){
    logScale2 = logScale2 ? false : true;
    updateGraphComparison(data_by_country, logScale2, (percPopulation2 ? 'field_value_pop' : 'field_value'));
});
$('#percPopulation2').change(function() {
    percPopulation2 = percPopulation2 ? false : true;
    updateGraphComparison(data_by_country, logScale2, (percPopulation2 ? 'field_value_pop' : 'field_value'));
});

$('#percPopulation').change(function() {
    percPopulation = percPopulation ? false : true;
    load_summary_data(data_country);
    updateGraph('#country_graph', data_country, 'date', (percPopulation ? 'field_value_pop' : 'field_value'),  logScale);
});

// Dates
$('#startDate').change(function() {
    startDate = new Date($('#startDate option:selected').text());
    updateGraph('#country_graph', data_country, 'date',(percPopulation ? 'field_value_pop' : 'field_value'), logScale);

});
$('#endDate').change(function() {
    endDate = new Date($('#endDate option:selected').text());
    updateGraph('#country_graph', data_country, 'date',(percPopulation ? 'field_value_pop' : 'field_value'), logScale);
});
$('#startDate2').change(function() {
    startDate = new Date($('#startDate2 option:selected').text());
    updateGraphComparison(data_by_country, logScale2, (percPopulation2 ? 'field_value_pop' : 'field_value'));

});
$('#endDate2').change(function() {
    endDate = new Date($('#endDate2 option:selected').text());
    updateGraphComparison(data_by_country, logScale2, (percPopulation2 ? 'field_value_pop' : 'field_value'));
});

$('#view_popup').click(function(){
    $("#popup").show();
});
$('#crossquit').click(function(){
        $("#popup").hide();
});
