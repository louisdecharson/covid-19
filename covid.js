// let widthMainGraph = document.getElementsByTagName('main')[0].offsetWidth;
$('.content').hide();
$('#by_country').show();

let widthMainGraph = document.getElementById('summary_stats').offsetWidth;
let heightMainGraph = Math.max(400, screen.height*0.5);
let links = {
    'recovered': "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv",
    'confirmed': "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv",
    'death': "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv"
};
const colors_countries = ["#1abb9b","#3497da","#9a59b5","#34495e","#f0c30f","#e57e22","#e64c3c","#7f8b8c","#CC6666", "#9999CC", "#66CC99"];
const colors = ['#2ecb71','#f29b12','#e64c3c'];
let data = [],
    pivot_columns = ['Province/State','Country/Region','Lat','Long'],
    cases_categories = ['Recovered','Confirmed','Deaths'],
    countries = [];
let logScale = false,
    logScale2 = false,
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
function addLegend(id, keys, px, py, colors_ = colors) {
    var color = d3.scaleOrdinal()
        .domain(keys)
        .range(colors_);
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
function updateGraphComparison(data, logScale = false, id = "#compare_graph", w = widthMainGraph, h = heightMainGraph, xVar = 'date', yVar = 'field_value') {
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
    let yscale = [],
        keys = [];
    elements.forEach(function(element,index) {
        let _ = data.filter(d => (d['category'] === element['category'] &&
                                  d['Country/Region'] === element['Country/Region']));
        yscale = yscale.concat(d3.extent(_, d => d[yVar]));
        keys.push(element['Country/Region'] + " - " + element['category']);
    });
    if (logScale) {
        y = d3.scaleSymlog()
            .domain(d3.extent(yscale))
            .nice()
            .range([height, 0]);
    } else {
        y = d3.scaleLinear()
            .domain(d3.extent(yscale))
            .nice()
            .range([height, 0]);
    }
    svg.append("g")
        .attr('class','y axis')
        .call(d3.axisLeft(y).tickFormat(d3.format('.3s')));

    // Offset
    let offset = function(date, offset_value) {
        let d = new Date(date);
        d.setDate(d.getDate() + offset_value);
        return d;
    };
    function offset_data(data, offset_value) {
        data.forEach(function(it,ind) {
            let value = ind + offset_value < data.length ? data[ind + offset_value][yVar] : NaN;
            it[yVar] = value;
        });
        return data;
    }

    // Colors
    let color = d3.scaleOrdinal()
        .domain(keys)
        .range(colors_countries);
    
    svg.selectAll('path.lines').remove();
    elements.forEach(function(element,index) {
        let data_ = data.filter(d => (d['category'] === element['category'] &&
                                      d['Country/Region'] === element['Country/Region']));
        let data__ = $.extend(true, [], data_);
        offset_data(data__, element['offset']);
        svg.append('path')
            .datum(data__)
            .attr('class','lines')
            .attr('fill','none')
            .attr('stroke', color(element['Country/Region'] + " - " + element['category']))
            .attr("stroke-width", 2)
            .attr('d',d3.line()
                  .x(d => x(d[xVar]))
                  .y(d => y(d[yVar]))
                 );
    });
    addLegend(id+'_svg',keys,3*margin.right,margin.top,colors_countries);
}
function build_elements_compare() {
    let html = '';
    for (const [index, element] of elements.entries()) {
        element.id = (parseInt(Math.random()*1e16)).toString();
        // html += '<div class="col-md-3 col-6"> <div class="card element"><div class="card-title country_element">' + element['Country/Region'] + '</div>';
        html += `<div class="col-md-3 col-6"> <div class="card element" style="border-color:${colors_countries[index]}"><div class="card-title country_element mb-1"><select onchange="update_element(this,'Country/Region')" class="select-country-element" element_id="${element.id}">`;
        for (const country of countries) {
            let selected = country === element['Country/Region'] ? 'selected' : '';
            html += '<option ' + selected + '>' + country + '</option>';
        }
        html += '</select></div>';
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
    updateGraphComparison(data, logScale2);
}
function update_element(el, property) {
    let element_id = $(el).attr('element_id');
    elements.forEach(function(it, ind) {
        if (it.id === element_id) {
            it[property] = el.value;
        }
    });
    updateGraphComparison(data, logScale2);
}
// ====================================================================== //
createGraph('#country_graph');
createGraph('#compare_graph');

let elements = [
    {
        "Country/Region": "France",
        "category": "Confirmed",
        "offset": 3
    },
    {
        "Country/Region": "Italy",
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
// Process Data
let timer = setInterval(() => {
    if (nb_process_ended === 3) {
        clearInterval(timer);
        computeWorldData();
        get_list_countries(data);
        country = 'World';
        data_country = data.filter(d => d['Country/Region'] === country);
        load_summary_data(data_country);
        updateGraph('#country_graph', data_country, 'date','field_value', logScale);

        // Compare
        build_elements_compare();
        updateGraphComparison(data, logScale2);
    }
}, 100);


// ======

$('.sidebar_show').click(function(){
    var target = $(this).attr('target');
    $('.content').hide();
    $(target).show();
});

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


$('#logScaleSwitch2').change(function(){
    logScale2 = logScale2 ? false : true;
    updateGraphComparison(data, logScale2);
});
$('.select-category-element').on('change',function(){
    
});
