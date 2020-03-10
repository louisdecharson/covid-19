let widthMainGraph = document.getElementsByTagName('main')[0].offsetWidth;
let heightMainGraph = Math.max(400, screen.height*0.5);
let links = {
    'recovered': "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv",
    'confirmed': "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv",
    'death': "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv"
};
let colors_countries = ["#1abb9b","#3497da","#9a59b5","#34495e","#f0c30f","#e57e22","#e64c3c","#7f8b8c","#CC6666", "#9999CC", "#66CC99"];
let colors = ['#2ecb71','#f29b12','#e64c3c'];
let data = [],
    pivot_columns = ['Province/State','Country/Region','Lat','Long'],
    cases_categories = ['Recovered','Confirmed','Deaths'],
    countries = [];
let logScale = false,
    country, data_country;

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
    return long_data.sort(function(a,b) {return a.date - b.date;});
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
function get_list_countries(data,) {
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
function load_summary_data(data) {
    for (const category of cases_categories) {
        let cases_category = category.toLowerCase(),
            data_ = data.filter(f => f['category'] === category),
            last_date = data_[data_.length-1]['field_id'],
            last_value = groupBy(data_.filter(f => f['field_id'] === last_date),'Country/Region',['field_value'],[],['field_id'])[0]['field_value'];
        $(`#nb_${cases_category}`).html(d3.format(',')(last_value));
        $('#lastDataPoint').html(last_date);
        let data__ = groupBy(data_,'key',['field_value'],[],['field_id']);
        sparkline(`#sparkline_${cases_category}`, data__, 'field_id', 'field_value', logScale);
    }
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
        .text(d3.format('.3s')(data[data.length-1].y));
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
    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height);
    // Append circle
    svg.append("g")
        .attr("class", "focus")
        .append('circle')
        .attr('class', 'circle-focus')
        .attr("r", 5)
        .style('display','none');

}
function updateGraph(id, data, xVar, yVar, logScale = logScale, w = widthMainGraph, h = heightMainGraph, categories = cases_categories) {
    var margin = {top: 10, right: 30, bottom: 30, left: 60};
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    // Select the id
    var svg = d3.select(id + '_g');

    // Delete the axis
    svg.selectAll('g.x.axis').remove();
    svg.selectAll('g.y.axis').remove();

    // X-axis
    var x = d3.scaleTime()
        .domain(d3.extent(data, d => d[xVar]))
        .range([0, width]);

    svg.append("g")
        .attr('class','x axis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom()
              .scale(x)
              .tickFormat(d3.timeFormat("%m/%d/%y"))
             );

    // Y-axis
    let y;
    if (logScale) {
        y = d3.scaleSymlog()
            .domain(d3.extent(data, d => d[yVar]))
            .range([height, 0])
            .nice();
    } else {
         y = d3.scaleLinear()
            .domain(d3.extent(data, d => d[yVar]))
            .range([height, 0]);
    }
    svg.append("g")
        .attr('class','y axis')
        .call(d3.axisLeft(y).tickFormat(d3.format('.3s')));
    
    // Add the content
    svg.selectAll('path.lines').remove();
    categories.forEach(function(category,index) {
        var data__ = data.filter(d => d.category === category);
        svg.append('path')
            .datum(data__)
            .attr('class','lines')
            .attr('fill','none')
            .attr('stroke', colors[index])
            .attr("stroke-width", 2)
            .attr('d',d3.line()
                  .x(d => x(d[xVar]))
                  .y(d => y(d[yVar]))
                 );
    });
    // Add legend
    addLegend(id+'_svg',categories,3*margin.right,margin.top);
}
function addLegend(id,keys,px,py) {
    var color = d3.scaleOrdinal()
        .domain(keys)
        .range(colors);
    var svg = d3.select(id);
    var mydots = svg.selectAll(".dots-legend")
        .data(keys);

    mydots.exit().remove();
    mydots.enter()
        .append("circle")
        .merge(mydots)
        .attr("cx", px)
        .attr("cy", (d,i) =>  py + i*25) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("r", 3)
        .attr('class','dots-legend')
        .style("fill",d => color(d));

    // Add one dot in the legend for each name.
    var mylabels = svg.selectAll(".labels-legend")
        .data(keys);
    mylabels.exit().remove();
    mylabels.enter()
        .append("text")
        .merge(mylabels)
        .attr("x", px + 20)
        .attr("y", (d,i) => py + i*25) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", d => color(d))
        .text(t => t)
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .attr('class','labels-legend');
}
function computeWorldData() {
    let data_ = groupBy(data,'key_world',['field_value'],[],['field_id','Country/Region','date','category','Lat','Long','Province/State']);
    data_.forEach(function(d){
        d['Country/Region'] = 'World';
        d['Province/State'] = '';
        d['key'] = d.category + d['Country/Region'] + d['field_id'];
    });
    data = data.concat(data_);
}
// ====================================================================== //
createGraph('#country_graph');

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
let timer = setInterval(() => {
    if (nb_process_ended === 3) {
        clearInterval(timer);
        computeWorldData();
        get_list_countries(data);
        country = 'World';
        data_country = data.filter(d => d['Country/Region'] === country);
        // $('#countryChosen').text(country);
        load_summary_data(data_country);
        updateGraph('#country_graph', data_country, 'date','field_value', logScale);
    }
}, 100);


// ======

$('#chooseCountry').change(function(){
    country = $('#chooseCountry option:selected').text(),
    data_country = groupBy(data.filter(f => f['Country/Region'] === country),'key',['field_value'],[],['field_id','Country/Region','date','category','Lat','Long']);
    // $('#countryChosen').text(country);
    load_summary_data(data_country);
    updateGraph('#country_graph', data_country, 'date', 'field_value',  logScale);
});
$('#logScaleSwitch').change(function(){
    logScale = logScale ? false : true;
    updateGraph('#country_graph', data_country, 'date', 'field_value', logScale);
    load_summary_data(data_country);
});
