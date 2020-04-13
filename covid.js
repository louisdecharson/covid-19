const el = document.getElementById('main');
let el_style = el.currentStyle || window.getComputedStyle(el),
    el_width = el.offsetWidth,
    el_margin = parseFloat(el_style.marginLeft) + parseFloat(el_style.marginRight),
    el_padding = parseFloat(el_style.paddingLeft) + parseFloat(el_style.paddingRight);
const widthMainGraph = el_width - el_padding;
const heightMainGraph = Math.max(400, screen.height*0.4);
const root = document.documentElement,
      rootStyle = getComputedStyle(root);

// SparkLine size
const sparklineWidth = Math.min(document.getElementById('summary_stats').offsetWidth / 3 - 30, 150);
const sparklineHeight = 25;
// Colors
const colors_countries = ["#1abb9b","#3497da","#9a59b5","#f0c30f","#e57e22","#e64c3c","#7f8b8c","#CC6666", "#9999CC", "#66CC99"];
// const colors = ['#f29b12','#e64c3c','#2ecb71']; // red for deaths, orange for cases
const colors = ['#FFC107','#ff073a','#2ecb71']; // red for deaths, orange for cases
let colorVariables = ['--background-color','--color-text','--text-muted']; // for dark mode
let colorsValues = {};
colorVariables.forEach(function(it){colorsValues[it+'-light'] = rootStyle.getPropertyValue(it+'-light');
                                    colorsValues[it+'-dark'] = rootStyle.getPropertyValue(it+'-dark');});     


// Initiate variables
let data = [],
    data_by_country = [],
    pivot_columns = ['Province/State','Country/Region','Lat','Long'],
    // cases_categories = ['Confirmed','Deaths'],
    cases_categories = ['Confirmed','Deaths','Recovered'],
    rates_categories = ['Deaths rate'],
    new_cases_categories = ['New Confirmed cases','New Deaths cases'],
    testing_yaxis = ['Cumulative total','Cumulative total per thousand','Daily change in cumulative total','Daily change in cumulative total per thousand'],
    testing_countries = [],
    countries = [],
    list_dates = [],
    population_data = [],
    testing_data = [],
    data_country,
    data_graph = {};

// Continental Aggregates
const EU_countries = ['Austria', 'Belgium','Bulgaria', 'Croatia', 'Cyprus',
                      'Czechia', 'Denmark', 'Estonia','Finland', 'France',
                      'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia',
                      'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland',
                      'Portugal', 'Romania','Slovakia', 'Slovenia', 'Spain', 'Sweden'],
      Asia_countries = ["Afghanistan","Azerbaijan","Bangladesh","Bhutan","Brunei",
                        "Cambodia","Cameroon","China","East Timor","India","Indonesia",
                        "Japan","Kazakhstan","Korea, South","Kuwait","Kyrgyzstan",
                        "Malaysia","Maldives","Mongolia","Nepal","Oman","Pakistan",
                        "Philippines","Singapore","Sri Lanka","Taiwan*","Thailand",
                        "Uzbekistan","Vietnam"],
      Africa_countries = ["Algeria","Angola","Benin","Burkina Faso","Cabo Verde",
                          "Cape Verde","Central African Republic","Chad",
                          "Congo (Brazzaville)","Congo (Kinshasa)","Cote d'Ivoire",
                          "Djibouti","Egypt","Equatorial Guinea","Eritrea","Gabon",
                          "Gambia, The","Ghana","Guinea","Kenya","Liberia","Madagascar",
                          "Mauritania","Mauritius","Morocco","Namibia","Niger","Nigeria",
                          "Rwanda","Senegal","Seychelles","Somalia","South Africa",
                          "Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe"],
      Carribean_countries = ["Antigua and Barbuda","Bahamas, The","Barbados",
                             "Cuba","Dominican Republic","Haiti","Saint Lucia",
                             "Saint Vincent and the Grenadines","Trinidad and Tobago"],
      Central_America_countries = ["Costa Rica","Ecuador","El Salvador",
                                   "Guatemala","Honduras","Jamaica","Nicaragua",
                                   "Panama","Belize"],
      Europe_countries = ["Albania","Andorra","Armenia","Austria","Belarus",
                          "Belgium","Bosnia and Herzegovina","Bulgaria","Croatia",
                          "Cyprus","Czechia","Denmark","Estonia","Eswatini","Ethiopia",
                          "Finland","France","Georgia","Germany","Greece","Holy See",
                          "Hungary","Iceland","Ireland","Italy","Kosovo","Latvia",
                          "Liechtenstein","Lithuania","Luxembourg","Malta","Martinique",
                          "Moldova","Monaco","Montenegro","Netherlands","North Macedonia",
                          "Norway","Poland","Portugal","Romania","Russia","San Marino",
                          "Serbia","Slovakia","Slovenia","Spain","Sudan","Sweden","Switzerland",
                          "Ukraine","United Kingdom"],
      Middle_East_countries = ["Bahrain","Iran","Iraq","Israel","Jordan","Lebanon",
                               "Qatar","Saudi Arabia","Turkey","United Arab Emirates",
                               "Yemen","Syria"],
      North_America_countries = ["Canada", "Mexico", "US"],
      Oceania_countries = ['Australia','Fiji','New Zealand','Papua New Guinea'],
      South_America_countries = ["Argentina","Bolivia","Brazil","Chile","Colombia",
                                 "Guyana","Paraguay","Peru","Suriname","Uruguay","Venezuela"];

      
      
      


// Default values
let startDate,
    endDate;

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
let navigation = {
    "page": "by_country",
    "darkMode": true,
    "country": "World",
    "elements": elements,
    "logScale": false,
    "logScale2": false,
    "lines": true,
    "lines2": true,
    "percPopulation": false,
    "percPopulation2": false,
    "startDate":"",
    "endDate":"",
    "maCompare": 1,
    "ft_countries": ["Korea, South","China","France","Italy","Spain","Japan","US","United Kingdom"],
    "logScale3": true,
    "hideLegend": false,
    "ft_category": "Deaths",
    "ft_threshold": 100,
    "ft_thresholdCategory": "Deaths",
    "ft_ma": 1,
    "testing_yVar": "Cumulative total",
    "testing_countries": []
};

// DARK MODE
function toggleDarkMode(darkMode) {
    let darkModeSwitch = $('#darkmodeSwitch');
    if (darkMode) {
        colorVariables.forEach(function(it) {root.style.setProperty(it,colorsValues[it+'-dark']);});
        darkModeSwitch.addClass('darkmode badge-primary');
        darkModeSwitch.removeClass('badge-secondary');
        darkModeSwitch.text('ON');
        updateNavigation({"darkMode":true});
    } else {
        colorVariables.forEach(function(it) {root.style.setProperty(it,colorsValues[it + '-light']);});
        darkModeSwitch.removeClass('darkmode badge-secondary');
        darkModeSwitch.addClass('badge-secondary');
        darkModeSwitch.text('OFF');
        updateNavigation({"darkMode":false});
    }
}

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
function ma_json(array, yVar, period=1) {
    // Compute the moving average on yVar with period 'period' where array
    // is a JSON array
    let ma = [];
    for (let i = array.length; i >= 0 + period; i--) {
        let e = $.extend(true, {}, array[i - 1]);
        e[yVar] = array.slice(i-period,i).reduce((t,n) => t + n[yVar],0)/period;
        ma.push(e);
    }
    return ma.reverse();
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
    list_dates = d3.set(data.map(d => d['date'])).values().map(d => d3.timeFormat("%d-%b-%y")(new Date(d)));
    startDate = navigation.startDate.length > 0 ? navigation.startDate : list_dates[0];
    endDate = navigation.endDate.length > 0 ? navigation.endDate : list_dates.slice(-1)[0];
    return long_data.sort(function(a,b) {return a.date - b.date;});
}

function parseTestingData(data) {
    let confirmed_cases = d3.nest().key(d => d.key).map(data_by_country
                                                        .filter(d => d['category'] === 'Confirmed'));
    for (const el of data) {
        el['Country/Region'] = el['Entity'].split(' - ')[0];
        el['units'] = el['Entity'].split(' - ')[1];
        el['key'] = el['Entity'];
        el['date'] = d3.timeParse("%Y-%m-%d")(el['Date']);
        let cases = confirmed_cases.get(`Confirmed${el['Country/Region']}${d3.timeFormat('%-m/%-d/%y')(el.date)}`);
        if (cases !== undefined) {
            el['Cumulative cases per test'] = el['Cumulative total'] > 0 ? cases[0]['field_value'] / el['Cumulative total'] : null;
        } else {
            el['Cumulative cases per test'] = null;
        }
    }
    testing_countries = d3.set(data.map(d => d.key)).values();
    navigation.testing_countries = testing_countries.slice(1, 4);
    testing_yaxis.push('Cumulative cases per test');
    return data;
}


function addRates(data) {
    let rates_categories = cases_categories.filter(d => d !== 'Confirmed');

    let rates = d3.nest()
        .key(d => d['Country/Region']+d['field_id'])
        .rollup(function(d) {
            let _ = [],
                confirmed = d.filter(e => e['category'] === 'Confirmed')[0]['field_value'];
            for (const category of rates_categories) {
                let out = $.extend(true, {}, d[0]),
                    nb = d.filter(e => e['category'] === category )[0]['field_value'],
                    rate = confirmed === 0 ? 0 : nb / confirmed;
                out['category'] = `${category} rate`;
                out['field_value'] = rate;
                out['key'] = out['category'] + out['Country/Region'] + out['field_id'];
                out['field_value_pop'] = NaN;
                _.push(out);
            }
            return _;
        })
        .entries(data)
        .map(g => g.value).flat();

    let new_and_growth_cases = d3.nest()
        .key( d => d['Country/Region'] + d.category)
        .rollup(function(a) {
            let new_case = $.extend(true, [], a),
                growth_rate = $.extend(true, [], a);
            for (const [i, e] of a.entries()) {
                if (i > 0) {
                    new_case[i]['field_value'] = a[i]['field_value']-a[i-1]['field_value'];
                    new_case[i]['previous_date'] = a[i-1]['field_id'];
                    growth_rate[i]['field_value'] = a[i-1]['field_value'] > 0 ? a[i]['field_value']/a[i-1]['field_value']-1 : null;
                } else {
                    new_case[i]['field_value'] = null;
                    growth_rate[i]['field_value'] = null;
                }
                new_case[i]['category'] = `New ${e['category']} cases`;
                new_case[i]['key'] = e['category'] + e['Country/Region'] + e['field_id'];
                new_case[i]['field_value_pop'] = e['field_value'] / e['Population'];
                growth_rate[i]['category'] = `${e['category']} growth rate`;
                growth_rate[i]['key'] = e['category'] + e['Country/Region'] + e['field_id'];
                growth_rate[i]['field_value_pop'] = e['field_value'] / e['Population'];
            }
            return [...new_case, ...growth_rate];
        })
        .entries(data_by_country)
        .map(g => g.value).flat();
    
    
    return [...data, ...rates, ...new_and_growth_cases];
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
function computeAggregate(name_aggregate, fltr = false,
                          data = data_by_country,
                          colSum = ['field_value','Population'],
                          colFirst = ['field_id','date', 'category']) {
    return d3.nest()
        .key(d => d.category + d.field_id)
        .rollup(function(d) {
            let out = {};
            colSum.forEach(function(k) {
                out[k] = d3.sum(d, v => v[k]);
            });
            colFirst.forEach(function(k) {
                out[k] = d[0][k];
            });
            return out;
        })
        .entries((fltr ? data.filter(fltr) : data))
        .map(function(g) {
            let out = {};
            [...colSum, ...colFirst].forEach(function(k) {
                out[k] = g.value[k];
            });
            out['Country/Region'] = name_aggregate;
            out['key'] = out.category + out['Country/Region'] + out['field_id'];
            out['field_value_pop'] = out['field_value'] / out['Population'];
            return out;
        });
}


function get_list_countries(data) {
    countries = d3.set(data.map(f => f['Country/Region'])).values().sort();

    // Add countries to selector
    let chooseCountryHTML = '',
        ft_countries_html = '<option selected>Add country</option>';
    for (const [index, country] of countries.entries()) {
        let selected = country === navigation.country ? 'selected' : '';
        chooseCountryHTML += `<option ${selected}>${country}</option>`;
        ft_countries_html += navigation.ft_countries.indexOf(country) == -1 ? `<option>${country}</option>` : '';
    }
    $('#chooseCountry').html(chooseCountryHTML);
    $('#chooseCountry').show();
    $('#ft_add_country').html(ft_countries_html);
}
function build_ft_countries_select() {
    let ft_countries_html = '<option selected>Add country</option>';
    for (const [index, country] of countries.entries()) {
        ft_countries_html += navigation.ft_countries.indexOf(country) == -1 ? `<option>${country}</option>` : '';
    }
    $('#ft_add_country').html(ft_countries_html);
}
function build_ft_categories_select() {
    let ft_categories_html = '',
        ft_categories_threshold_html = '',
        categories = d3.set(data_by_country.map(d => d['category'])).values().filter(d => !d.includes('rate'));
    for (const category of categories) {
        let ft_category_select = navigation.ft_category === category ? 'selected' : '',
            ft_category_threshold_select = navigation.ft_thresholdCategory === category ? 'selected' : '';
        ft_categories_html += `<option ${ft_category_select}>${category}</option>`;
        ft_categories_threshold_html += `<option ${ft_category_threshold_select}>${category}</option>`;
    }
    $('#ftCategory').html(ft_categories_html);
    $('#ftThresholdCategory').html(ft_categories_threshold_html);
};
function build_testing_countries_select() {
    let testing_countries_html = '<option selected>Add country</option>';
    for (const [index, country] of testing_countries.entries()) {
        testing_countries_html+= navigation.testing_countries.indexOf(country) == -1 ? `<option>${country}</option>` : '';
    }
    $('#testing_add_country').html(testing_countries_html);
}
function build_testing_yaxis() {
    let testing_yaxis_html = '';
    for (const yaxis of testing_yaxis) {
        testing_yaxis_html += navigation.testing_yVar == yaxis ? `<option selected>${yaxis}</option>` : `<option>${yaxis}</option>`;
    }
    $('#testingYAxis').html(testing_yaxis_html);
}

function load_summary_data() {
    let last_date = data.map(d => d['date']).slice(-1)[0];
    for (const category of cases_categories) {
        let data_category = data_country.filter(f => f['category'] === category),
            last_value = d3.format((navigation.percPopulation ? '%' : ','))(data_category.slice(-1)[0][(navigation.percPopulation ? 'field_value_pop' : 'field_value')]);
        $(`#nb_${category.toLowerCase()}`).html(last_value);

        // Add this data to DOM
        if (category === 'Deaths' || category === 'Recovered') {
            let last_value_rate = ` (${d3.format('.2%')(data_country.filter(f => f['category'] === category + ' rate').slice(-1)[0]['field_value'])}) `;
            $(`#nb_${category.toLowerCase()}_rate`).html(last_value_rate);
        } 
        // sparkline(`#sparkline_${category.toLowerCase()}`, data_category, 'field_id', (navigation.percPopulation ? 'field_value_pop' : 'field_value'), navigation.logScale);
    }
    $('#lastDataPoint').html(d3.timeFormat("%d-%b-%y")(last_date));

}
function get_dates(data) {
    list_dates = d3.set(data.map(d => d['date'])).values();
}

// PLOTS
// =====

// Utilities
// ---------
function extendOneDay(extent) {
    // in case of bars, we extend by one day the x-axis
    function addOneDay(date) {
        let nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay;
    }
    return [extent[0], addOneDay(extent[1])];
}
function get_optimal_precision(n) {
        return `.${Math.abs(Math.floor(Math.log10(n)))+1}%`;
}
function sparkline(elemId, data, xVar, yVar, logScale = false) {
    // Plot a Sparkline (see Edward Tufte)

    // elemId
    var width = sparklineWidth;
    var height = sparklineHeight;
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
        .text(d3.format((navigation.percPopulation ? '%' : '.3s'))(data[data.length-1].y));
}
function getMarginGraph(w) {
    return {
        top: 10,
        right: w < 400 ? 20 : 30, // smaller margin for mobile
        bottom: 30,
        left: w < 400 ? 40 : 60 // smaller margin for mobile
    };
}
function createGraph(id, w = widthMainGraph, h = heightMainGraph) {
    // var margin = {top: 10, right: w < 400 ? 20 : 30, bottom: 30, left: w < 400 ? 20 : 60};
    let margin = getMarginGraph(w);
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
function updateGraph(id, data, xVar, yVar,
                     logScale = navigation.logScale, lines = true, categories = cases_categories,
                     percentage = false,
                     w = widthMainGraph, h = heightMainGraph)
{
    // var margin = {top: 10, right: 30, bottom: 30, left: 60};
    let margin = getMarginGraph(w);
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    // Select the id
    var svg = d3.select(id + '_g');

    // Data Filtered
    data = data.filter(d => d['date'] >= d3.timeParse('%d-%b-%y')(startDate) &&
                       d['date'] <= d3.timeParse('%d-%b-%y')(endDate) &&
                       categories.indexOf(d['category']) > -1);
    
    var color = d3.scaleOrdinal()
        .domain(categories)
        .range(colors);
    
    // Delete the axis
    svg.selectAll('g.x.axis').remove();
    svg.selectAll('g.y.axis').remove();
    svg.selectAll('g.yGrid').remove();
    
    // X-axis
    function extendOneDay(extent) {
        // in case of bars, we extend by one day the x-axis
        function addOneDay(date) {
                let nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);
                return nextDay;
            }
        return [extent[0], addOneDay(extent[1])];
    }
    let xExtent = (lines ? d3.extent(data, d => d[xVar]) : extendOneDay(d3.extent(data, d => d[xVar])));
    let x = d3.scaleTime()
        .domain(xExtent)
        .range([0, width]);

    let nb_ticks = parseInt((w - 100) / 100); // a tick takes 40 px;
    svg.append("g")
        .attr('class','x axis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
              .ticks(nb_ticks)
              .tickFormat(d3.timeFormat("%d/%m/%y"))
             );

    // Second X-axis (bars)
    let x2 = d3.scaleBand()
        .domain(categories)
        .rangeRound([0, width/d3.set(data.map(d => d[xVar])).values().length]);

    // Y-axis
    let minY = logScale ? percentage ? d3.min(data.filter(d => d[yVar] > 0), d => d[yVar]) : 1 : 0,
        maxY = d3.max(data, d=>d[yVar]);
    let y = d3[logScale ? "scaleLog" : "scaleLinear"]()
        .domain([minY,maxY])
        .nice()
        .range([height, 0]);

    function get_optimal_precision(n) {
        return `.${Math.abs(Math.floor(Math.log10((n > 0 ? n : 1))))+1}%`;
    }
    let precision_percentage = get_optimal_precision(maxY),
        formatTick = d => logScale ? (Number.isInteger(Math.log10(d)) ? d3.format((percentage ? precision_percentage : '.3s'))(d) : "" ) : d3.format((percentage ? precision_percentage : '.3s'))(d);
    let yGrid = svg => svg
        .call(d3.axisRight(y)
              .tickSize(width)
              .tickFormat(formatTick))
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
              .tickFormat(formatTick));
        
    // Add the content
    svg.selectAll('path.lines').remove();
    categories.forEach(function(category,index) {
        if (lines) {
            svg.selectAll(`rect.${category.replace(/ /g,'_')}`).remove();
            svg.append('path')
                .datum(data.filter(d => d.category === category))
                .attr('class','lines')
                .attr('fill','none')
                .attr('stroke',  d => color(category))
                .attr("stroke-width", 3)
                .attr('d', d3.line()
                      .y(d => y(d[yVar]))
                      .defined(d => logScale ? (d[yVar] <= 0 ? false : true ) : true)
                      .x(d => x(d[xVar])));
            
        } else {
            svg.selectAll(`rect.${category.replace(/ /g,'_')}`)
                .data(data.filter(d => d.category === category))
                .join('rect')
                .attr('class', category.replace(/ /g,'_'))
                .attr('fill',  d => color(category))
                .attr('x', d => x(d[xVar]) + x2(category))
                .attr('width', x2.bandwidth())
                .attr('y',  (d => y(d[yVar])))
                .attr('height', d => (height - y(d[yVar])))
                .on("mouseover", function(d) {
	            d3.select(this).attr("fill", function() {
                        return d3.rgb(d3.select(this).style("fill")).darker(0.5);
                    });
                })
                .on("mouseout", function(d) {
	            d3.select(this).attr("fill", function() {
                        return d3.rgb(d3.select(this).style("fill")).brighter(0.5);
                    });
                });
        }
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
        
        if (lines) {
            const dots = g.selectAll("circle")
                  .data(data.slice(1).filter(d => logScale ? d[yVar] > 0 : true))
                  .join("circle")
                  .style("fill", d => color(d.category))
                  .attr("r", 5)
                  .attr("cx", (d, i) => x(d[xVar]))
                  .attr("cy", (d, i) => y(d[yVar]));
        }

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
                    .style("fill",(d, i) => i === 0 ? (navigation.darkMode ? '#dadada' : '#181818') : color(d.category))
                    .text((d,i) => i === 0 ? d3.timeFormat("%d-%b-%y")(d) : `${d['category']}: ${d3.format((percentage ? precision_percentage : ','))(d[yVar])}`));
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
            b = i > data.length - 1 ? data.slice(-1)[0] : data[i],
            f_id = (lines ? (mouseDate - a[xVar] > b[xVar] - mouseDate ? b['field_id'] : a['field_id']) : (mouseDate < b[xVar] ? a['field_id'] : b['field_id'] )),
            date = (lines ? (mouseDate - a[xVar] > b[xVar] - mouseDate ? b[xVar] : a[xVar]) : (mouseDate < b[xVar] ? a[xVar] : b[xVar])),
            values = data.filter(d => d['field_id'] === f_id && categories.indexOf(d.category) > -1)
            .sort((a,b) => b[yVar] - a[yVar]);
        return [date].concat(values);
    }
    svg.selectAll("g.tooltip_container").remove();
    const tooltip = svg.append("g").attr("class","tooltip_container");
    svg.on("touchmove mousemove", function() {
        let mouse_x = d3.mouse(this)[0],
            mouse_y = d3.mouse(this)[1];
        if (mouse_x > 0) {
            let mouseData = getMouseData(mouse_x);
            tooltip
                .call(addTooltip, mouseData, lines ? x(mouseData[0]) : mouse_x, mouse_y+30);
        }
    });
    svg.on("touchend mouseleave", () => tooltip.call(addTooltip, null));

    
    // Add legend
    addLegend(id+'_svg',categories,3*margin.right,margin.top);

    // Save data
    data_graph[id.slice(1)] = data;
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

    let x, y, w, h;
    try {
        let _ = legend.node().getBBox();
        x = _.x,
        y = _.y,
        w = _.width,
        h = _.height;
    } catch(err) {
        x = 85,
        y = 5,
        w = 0,
        h = 0;
    }
    path.attr('x',px-5)
        .attr('y',py-5)
        .attr('width', (w > 0 ? w + 10 : d3.max(keys.map(d => d.length))*10 + 10)) // if graph is not displayed the width and height will be zero (*)
        .attr('height',(h > 0 ?  h + 10 : keys.length * 25 + 10));
    // (*) we try to estimate the width and height based on max
    //     nb of characthers of the legend text and nb of keys
}

function computeWorldData() {
    // let data_ = groupBy(data_by_country,'key_world',['field_value','Population'],[],['field_id','date','category']);
    // data_.forEach(function(d){
    //     d['Country/Region'] = 'World';
    //     d['key'] = d.category + d['Country/Region'] + d['field_id'];
    //     d['field_value_pop'] = d['field_value'] / d['Population'];
    // });
    // return data_by_country.concat(data_);
    return [...data_by_country, ...computeAggregate('World'),
            ...computeAggregate('European Union', (d => EU_countries.indexOf(d['Country/Region']) > -1)),
            ...computeAggregate('Europe', (d => Europe_countries.indexOf(d['Country/Region']) > -1)),
            ...computeAggregate('Asia', (d => Asia_countries.indexOf(d['Country/Region']) > -1)),
            ...computeAggregate('North America', (d => North_America_countries.indexOf(d['Country/Region']) > -1)),
            ...computeAggregate('Oceania', (d => Oceania_countries.indexOf(d['Country/Region']) > -1)),
            ...computeAggregate('Middle East', (d => Middle_East_countries.indexOf(d['Country/Region']) > -1)),
            ...computeAggregate('Africa', (d => Africa_countries.indexOf(d['Country/Region']) > -1)),
            ...computeAggregate('Central America', (d => Central_America_countries.indexOf(d['Country/Region']) > -1)),
            ...computeAggregate('Carribean', (d => Carribean_countries.indexOf(d['Country/Region']) > -1)),
            ...computeAggregate('South America', (d => South_America_countries.indexOf(d['Country/Region']) > -1))
           ];
}

function updateGraphComparison(data, logScale = false, yVar = 'field_value',
                               lines = true, maPeriod = 1, id = "#compare_graph", 
                               w = widthMainGraph, h = heightMainGraph, xVar = 'date') {
    // Update graph 'compare' with new data
    // ------------------------------------
    // data : raw data to use
    // logScale : boolean (true to use a logScale)
    // yVar: y axis variable
    // lines : boolean (true : use line, false: use bars)
    // maPeriod : number of days for computing moving average
    // id : id of the graph container
    // w : width of the graph DOM
    // h : height of the graph DOM
    // xVar : x axis variable
    
    
    let margin = getMarginGraph(w);
    // var margin = {top: 10, right: 30, bottom: 30, left: 60};
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    // Select the id
    var svg = d3.select(id + '_g');
    
    // Delete the axis
    svg.selectAll('g.x.axis').remove();
    svg.selectAll('g.y.axis').remove();
    svg.selectAll('g.yGrid').remove();

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
    // BUILD Y DATA
    navigation.elements.forEach(function(element,index) {
        let _ = data.filter(d => (d['category'] === element['category'] &&
                                  d['Country/Region'] === element['Country/Region'] &&
                                  d['date'] >= d3.timeParse('%d-%b-%y')(startDate) &&
                                  d['date'] <= d3.timeParse('%d-%b-%y')(endDate)));
        // _ = offset_data($.extend(true, [], _), element['offset']);
        _ = ma_json(offset_data($.extend(true, [], _), element['offset']),yVar, maPeriod);
        y_data = y_data.concat(_);
        keys.push(getKey(element));
    });

    // Get the list of dates
    let dates = d3.set(y_data.map(d => d[xVar])).values();
    
    // X-axis
    let x = d3.scaleTime()
        .domain((lines ? d3.extent(y_data, d => d[xVar]) : extendOneDay(d3.extent(y_data, d => d[xVar]))))
        .range([0, width]);

    let nb_ticks = parseInt((w - 100) / 100);
    svg.append("g")
        .attr('class','x axis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
              .ticks(nb_ticks)
              .tickFormat(d3.timeFormat("%d/%m/%y"))
             );

    // Second X-axis (bars)
    let x2 = d3.scaleBand()
        .domain(keys)
        .rangeRound([0, width/d3.set(y_data.map(d => d[xVar])).values().length]);

    // Y-axis
    let percentage = navigation.percPopulation2 || y_data[0].category.includes('rate');
    let minY = logScale ? percentage ? d3.min(y_data.filter(d => d[yVar] > 0), d => d[yVar]) : 1 : 0,
        maxY = d3.max(y_data, d=>d[yVar]);

    let y = d3[logScale ? "scaleLog" : "scaleLinear"]()
        .domain([minY,maxY])
        .nice()
        .range([height, 0]);

    let precision_percentage = get_optimal_precision(maxY),
        formatTick = d => logScale ? (Number.isInteger(Math.log10(d)) ? d3.format((percentage ? precision_percentage : '.3s'))(d) : "" ) : d3.format((percentage ? precision_percentage : '.3s'))(d);
    
    let yGrid = svg => svg
        .call(d3.axisRight(y)
              .tickSize(width)
              .tickFormat(formatTick))
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
              .tickFormat(formatTick));
    
    // Colors
    let color = d3.scaleOrdinal()
        .domain(keys)
        .range(colors_countries);

    // Add lines
    svg.selectAll('path.lines').remove();
    svg.selectAll('rect.bars').remove();
    navigation.elements.forEach(function(element,index) {
        let _ = y_data.filter(d => (d['category'] === element['category'] &&
                                    d['Country/Region'] === element['Country/Region']));
        if (lines) {
            svg.selectAll(`rect.bars.id_${element.id}`).remove();
            svg.append('path')
                .datum(_)
                .attr('class','lines')
                .attr('fill','none')
                .attr('stroke', color(getKey(element)))
                .attr("stroke-width", 3)
                .attr('d',d3.line()
                      .y(d => y(d[yVar]))
                      .defined(d => logScale ? (d[yVar] <= 0 ? false : true ) : true)
                      .x(d => x(d[xVar])));
        } else {
            svg.selectAll(`rect.bars.id_${element.id}`)
                .data(_)
                .join('rect')
                .attr('class', 'bars id_' + element.id)
                .attr('fill',  d => color(getKey(element)))
                .attr('x', d => x(d[xVar]) + x2(getKey(element)))
                .attr('width', x2.bandwidth())
                .attr('y',  (d => y(d[yVar])))
                .attr('height', d => (height - y(d[yVar])))
                .on("mouseover", function(d) {
	            d3.select(this).attr("fill", function() {
                        return d3.rgb(d3.select(this).style("fill")).darker(0.5);
                    });
                })
                .on("mouseout", function(d) {
	            d3.select(this).attr("fill", function() {
                        return d3.rgb(d3.select(this).style("fill")).brighter(0.5);
                    });
                });
        }
    });

    // TOOLTIP
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

        
        if (lines) {
            const dots = g.selectAll("circle")
                  .data(data.slice(1).filter(d => logScale ? d[yVar] > 0 : true))
                  .join("circle")
                  .style("fill", (d, i) => color(getKey(d)))
                  .attr("r", 5)
                  .attr("cx", (d, i) => x(d[xVar]))
                  .attr("cy", (d, i) => y(d[yVar]));
        }

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
                    .style("fill",(d, i) => i === 0 ? (navigation.darkMode ? '#dadada' : '#181818') : color(getKey(d)))
                    .text((d,i) => i === 0 ? d3.timeFormat("%d-%b-%y")(d) : `${getKey(d)}: ${d3.format((navigation.percPopulation2 ? '%' : d.category.includes('rate') ? '.3%' : ','))(d[yVar])}`));
        
        const {xx, yy, width: w, height: h} = text.node().getBBox();

        // Make sure the tooltip is always in the graph area (and visible)
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
            i = bisect(data, mouseDate),
            a = data[i-1],
            b = i > data.length - 1 ? data.slice(-1)[0] : data[i],
            f_id = (lines ? (mouseDate - a[xVar] > b[xVar] - mouseDate ? b['field_id'] : a['field_id']) : (mouseDate < b[xVar] ? a['field_id'] : b['field_id'] )),
            date = (lines ? (mouseDate - a[xVar] > b[xVar] - mouseDate ? b[xVar] : a[xVar]) : (mouseDate < b[xVar] ? a[xVar] : b[xVar])),
            values = y_data.filter(d => d['field_id'] === f_id).sort((a,b) => b[yVar] - a[yVar]);
        return [date].concat(values);
    }
    svg.selectAll("g.tooltip_container").remove();
    const tooltip = svg.append("g").attr("class","tooltip_container");
    svg.on("touchmove mousemove", function() {
        let mouse_x = d3.mouse(this)[0],
            mouse_y = d3.mouse(this)[1];
        if (mouse_x > 0) {
            let mouseData = getMouseData(mouse_x);
            tooltip
                .call(addTooltip, mouseData, x(mouseData[0]), mouse_y+30);
        }
    });
    svg.on("touchend mouseleave", () => tooltip.call(addTooltip, null));

    // Add legend
    addLegend(id+'_svg',keys,3*margin.right,margin.top,colors_countries);
    // Save data
    data_graph[id.slice(1)] = y_data;
}

function build_elements_compare() {
    let html = '',
        categories = d3.set(data_by_country.map(d => d['category'])).values();
    for (const [index, element] of navigation.elements.entries()) {
        element.id = (parseInt(Math.random()*1e16)).toString();
        html += `<div class="col-xl-4 col-md-6 col-12 mt-2 mb-2"> <div class="card element" style="border-color:${colors_countries[index]}"><svg style="position:absolute;top:0.2rem;right:0.1rem;" class="svg-icon delete-element" onclick=delete_element('${element.id}') viewBox="0 0 20 20" data-toggle="tooltip" data-placement="top" title="delete plot"><path d="M10.185,1.417c-4.741,0-8.583,3.842-8.583,8.583c0,4.74,3.842,8.582,8.583,8.582S18.768,14.74,18.768,10C18.768,5.259,14.926,1.417,10.185,1.417 M10.185,17.68c-4.235,0-7.679-3.445-7.679-7.68c0-4.235,3.444-7.679,7.679-7.679S17.864,5.765,17.864,10C17.864,14.234,14.42,17.68,10.185,17.68 M10.824,10l2.842-2.844c0.178-0.176,0.178-0.46,0-0.637c-0.177-0.178-0.461-0.178-0.637,0l-2.844,2.841L7.341,6.52c-0.176-0.178-0.46-0.178-0.637,0c-0.178,0.176-0.178,0.461,0,0.637L9.546,10l-2.841,2.844c-0.178,0.176-0.178,0.461,0,0.637c0.178,0.178,0.459,0.178,0.637,0l2.844-2.841l2.844,2.841c0.178,0.178,0.459,0.178,0.637,0c0.178-0.176,0.178-0.461,0-0.637L10.824,10z"></path></svg><div class="card-title country_element mb-1"><select onchange="update_element(this,'Country/Region')" class="select-country-element" element_id="${element.id}">`;
        for (const country of countries) {
            let selected = country === element['Country/Region'] ? 'selected' : '';
            html += '<option ' + selected + '>' + country + '</option>';
        }
        html += '</select></div>';
        html += `<div class="category_element mb-1 mt-1"><select onchange="update_element(this,'category')" class="select-category-element" element_id="${element.id}">`;
        for (const category of categories) {
            let selected = category === element['category'] ? 'selected' : '';
            html += '<option ' + selected + '>' + category + '</option>';
        }
        html +=  '</select></div><div class="offset_element"><span>Offset:</span><span id="offset_'+ element.id+'" class="offset pr-1 pl-1">' + element['offset'] + '</span><span>days</span> <svg class="svg-icon" element_id="' + element.id + '" viewBox="0 0 20 20" onclick=update_offset(this,1)> <path d="M14.613,10c0,0.23-0.188,0.419-0.419,0.419H10.42v3.774c0,0.23-0.189,0.42-0.42,0.42s-0.419-0.189-0.419-0.42v-3.774H5.806c-0.23,0-0.419-0.189-0.419-0.419s0.189-0.419,0.419-0.419h3.775V5.806c0-0.23,0.189-0.419,0.419-0.419s0.42,0.189,0.42,0.419v3.775h3.774C14.425,9.581,14.613,9.77,14.613,10 M17.969,10c0,4.401-3.567,7.969-7.969,7.969c-4.402,0-7.969-3.567-7.969-7.969c0-4.402,3.567-7.969,7.969-7.969C14.401,2.031,17.969,5.598,17.969,10 M17.13,10c0-3.932-3.198-7.13-7.13-7.13S2.87,6.068,2.87,10c0,3.933,3.198,7.13,7.13,7.13S17.13,13.933,17.13,10"></path></svg><svg class="svg-icon" element_id="' + element.id + '" viewBox="0 0 20 20" onclick=update_offset(this,-1)><path d="M14.776,10c0,0.239-0.195,0.434-0.435,0.434H5.658c-0.239,0-0.434-0.195-0.434-0.434s0.195-0.434,0.434-0.434h8.684C14.581,9.566,14.776,9.762,14.776,10 M18.25,10c0,4.558-3.693,8.25-8.25,8.25c-4.557,0-8.25-3.691-8.25-8.25c0-4.557,3.693-8.25,8.25-8.25C14.557,1.75,18.25,5.443,18.25,10 M17.382,10c0-4.071-3.312-7.381-7.382-7.381C5.929,2.619,2.619,5.93,2.619,10c0,4.07,3.311,7.382,7.381,7.382C14.07,17.383,17.382,14.07,17.382,10"></path></svg></div></div></div>';
    }
    $('#compare_elements_container').html(html);
}

function build_ft_countries() {
    let html = '';
    for (const [i, country] of navigation.ft_countries.entries()) {
        html += `
        <div class="p-2 ml-1 mr-1 mt-1 mb-1 badge" style="display:inline-block; background-color:${colors_countries[i]};"><span>${country}</span>
        <svg class="svg-icon delete-element mb-1" onclick=remove_ft_country(${i}) viewBox="0 0 20 20" data-toggle="tooltip" data-placement="top" title="delete plot"><path d="M10.185,1.417c-4.741,0-8.583,3.842-8.583,8.583c0,4.74,3.842,8.582,8.583,8.582S18.768,14.74,18.768,10C18.768,5.259,14.926,1.417,10.185,1.417 M10.185,17.68c-4.235,0-7.679-3.445-7.679-7.68c0-4.235,3.444-7.679,7.679-7.679S17.864,5.765,17.864,10C17.864,14.234,14.42,17.68,10.185,17.68 M10.824,10l2.842-2.844c0.178-0.176,0.178-0.46,0-0.637c-0.177-0.178-0.461-0.178-0.637,0l-2.844,2.841L7.341,6.52c-0.176-0.178-0.46-0.178-0.637,0c-0.178,0.176-0.178,0.461,0,0.637L9.546,10l-2.841,2.844c-0.178,0.176-0.178,0.461,0,0.637c0.178,0.178,0.459,0.178,0.637,0l2.844-2.841l2.844,2.841c0.178,0.178,0.459,0.178,0.637,0c0.178-0.176,0.178-0.461,0-0.637L10.824,10z"></path></svg></div>`;
    }
    $('#ft_countries_container').html(html);
    update_ft_threshold();
}
function build_testing_countries() {
    let html = '';
    for (const [i, country] of navigation.testing_countries.entries()) {
        html += `
        <div class="p-2 ml-1 mr-1 mt-1 mb-1 badge" style="display:inline-block; background-color:${colors_countries[i]};"><span>${country}</span>
        <svg class="svg-icon delete-element mb-1" onclick=remove_testing_country(${i}) viewBox="0 0 20 20" data-toggle="tooltip" data-placement="top" title="delete plot"><path d="M10.185,1.417c-4.741,0-8.583,3.842-8.583,8.583c0,4.74,3.842,8.582,8.583,8.582S18.768,14.74,18.768,10C18.768,5.259,14.926,1.417,10.185,1.417 M10.185,17.68c-4.235,0-7.679-3.445-7.679-7.68c0-4.235,3.444-7.679,7.679-7.679S17.864,5.765,17.864,10C17.864,14.234,14.42,17.68,10.185,17.68 M10.824,10l2.842-2.844c0.178-0.176,0.178-0.46,0-0.637c-0.177-0.178-0.461-0.178-0.637,0l-2.844,2.841L7.341,6.52c-0.176-0.178-0.46-0.178-0.637,0c-0.178,0.176-0.178,0.461,0,0.637L9.546,10l-2.841,2.844c-0.178,0.176-0.178,0.461,0,0.637c0.178,0.178,0.459,0.178,0.637,0l2.844-2.841l2.844,2.841c0.178,0.178,0.459,0.178,0.637,0c0.178-0.176,0.178-0.461,0-0.637L10.824,10z"></path></svg></div>`;
    }
    $('#testing_countries_container').html(html);
}

function update_ft_threshold() {
    let max_value = Math.min(d3.max(data_by_country.filter(d => (navigation.ft_countries.indexOf(d['Country/Region']) > -1) &&
                                                  (d['category'] === 'Deaths'))
                                  .map(d => d['field_value'])),1000);
    $('#thresholdRange').attr('max', max_value.toString());
}
function remove_ft_country(index) {
    navigation.ft_countries.splice(index,1);
    updateNavigation({"ft_countries": navigation.ft_countries});
    build_ft_countries();
    build_ft_countries_select();
    ft_interactive_graph(data_by_country, navigation.ft_countries, navigation.logScale3, navigation.hideLegend,
                         navigation.ft_threshold, navigation.ft_category, navigation.ft_thresholdCategory, navigation.ft_ma);
}
function remove_testing_country(index) {
    navigation.testing_countries.splice(index,1);
    updateNavigation({"testing_countries": navigation.testing_countries});
    build_testing_countries();
    build_testing_countries_select();
    testing_graph(testing_data, navigation.testing_countries, navigation.hideLegend, navigation.testing_yVar);
}
function update_offset(el, value) {
    let element_id = $(el).attr('element_id');
    navigation.elements.forEach(function(it, ind) {
        if (it.id === element_id) {
            it.offset = Math.max(0, it.offset + parseInt(value));
            $(`#offset_${element_id}`).html(it.offset);
        }
    });
    updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'), navigation.lines2, navigation.maCompare);
}
function update_element(el, property) {
    let element_id = $(el).attr('element_id');
    navigation.elements.forEach(function(it, ind) {
        if (it.id === element_id) {
            it[property] = el.value;
        }
    });
    updateNavigation({});
    updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'), navigation.lines2, navigation.maCompare);
}
function add_element() {
    let last_el = navigation.elements.length > 0 ? $.extend(true, {}, navigation.elements[navigation.elements.length-1]) : {
        "Country/Region": "France",
        "category": "Confirmed",
        "offset": 0
    }; // copy last element
    last_el['Country/Region'] = navigation.elements.length > 0 ? countries[Math.min(countries.indexOf(last_el['Country/Region'])+1,countries.length-1)] : 'France';
    navigation.elements = navigation.elements.concat(last_el);
    build_elements_compare();
    updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'), navigation.lines2, navigation.maCompare);
}
function delete_element(id) {
    navigation.elements = navigation.elements.filter(d => d.id != id);
    build_elements_compare();
    updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'), navigation.lines2, navigation.maCompare);
}

function addDatestoSelect() {
    let html_start_dates = '',
        html_end_dates = '';
    for (const d of list_dates) {
        html_start_dates += '<option ' + (d === startDate ? 'selected' : '') + '>' + d + '</option>';
        html_end_dates += '<option ' + (d === endDate ? 'selected' : '') + '>' + d + '</option>';
    }
    $('#startDate').html(html_start_dates);
    $('#endDate').html(html_end_dates);
    $('#startDate2').html(html_start_dates);
    $('#endDate2').html(html_end_dates);
    $('#startDate3').html(html_start_dates);
    $('#endDate3').html(html_end_dates);

}
function addPopulationData() {
    let popData = d3.nest().key(d => d['Country/Region']).map(population_data);
    data_by_country = d3.nest()
        .key(d => d['Country/Region'])
        .rollup(function(a) {
            let popDataEl = popData.get(a[0]['Country/Region']);
            if (popDataEl) {
                for (const e of a) {
                    e['Population'] = +popDataEl[0].Population;
                    e['field_value_pop'] = e['field_value'] / e['Population'];
                }
            } else {
                console.log(a[0]['Country/Region']);
            }
            return a;
        })
        .entries(data_by_country)
        .map(d => d.value).flat();
}

// Navigation
function loadPage(button, target) {
    $('.sidebar_show.active').each(function() {
        $(this).removeClass('active');
    });
    button.addClass('active');
    $('.content').hide();
    $(target).show();
    updateNavigation({"page":target.slice(1)});
}
function updateNavigation(j) {
    Object.keys(j).forEach(function(e,i) {
        if (Object.keys(navigation).indexOf(e) > -1) {
            navigation[e] = j[e];
        }
    });
    document.location.hash = JSON.stringify(navigation);
}

// Download data
function download_data(id) {
    let el = document.createElement("a");
    el.id = "download";
    el.download = `louisdecharson_data_covid19_${id}_${Date.now()}.csv`;
    el.href = URL.createObjectURL(new Blob([to_csv(data_graph[id])]));
    el.click();
}
function to_csv(j) {
    let csv = '';
    if (j.length > 0) {
        let keys = Object.keys(j[0]);
        csv += keys.join(',') + "\n";
        csv += j.map(function(d) {
            let a = [];
            for (const k of keys) {
                a.push('"' + d[k] + '"');
            }
            return a.join(',');
        }).join('\n');
    }
    return csv.toString();
}

// Simple analytics
function action(event) {
    try {
        sa_event(event);
    }
    catch(error) {
        console.log(`Error in action. Action: ${event} | Error: ${error}`);
    }
}

// FT Graph
function ft_interactive_graph(data, keys, logScale, hideLegend, threshold,
                              category = 'Deaths',
                              thresholdCategory = 'Deaths', maPeriod = 1, id = "#ft_graph", 
                              yVar = 'field_value', w = widthMainGraph, h = heightMainGraph) {
    // keys = list of countries
    
    let margin = getMarginGraph(w);
    margin.bottom = 50;
    // var margin = {top: 10, right: 30, bottom: 50, left: 60};
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    // Select the id
    var svg = d3.select(id + '_g');
    
    // Delete the axis
    svg.selectAll('g.x.axis').remove();
    svg.selectAll('g.y.axis').remove();
    svg.selectAll('g.yGrid').remove();

    // Prepare data
    let ft_data = d3.nest()
        .key(d => d['Country/Region'])
        .rollup(function(a) {
            let na = $.extend(true, [], a).filter(d => d['category'] === category),
                date_threshold = d3.min(a.filter(d => d['category'] === thresholdCategory &&
                                                 d[yVar] >= threshold)
                                        .map(d => d['date']));
            for (let i = na.length; i >= 0 + maPeriod; i--) {
                let e = na[i-1];
                e['x'] = Math.round((e['date'] - date_threshold)/(24*3600*1000));
                e['y'] = maPeriod === 1 ? e[yVar] : na.slice(i-maPeriod,i).reduce((t,n) => t + n[yVar],0)/maPeriod;
            }
            return na.reverse().slice(maPeriod-1).filter(d => d['x'] >= 0);
        })
        .entries(data.filter(d => (keys.indexOf(d['Country/Region']) > -1)))
        .map( g => g.value).flat();
    
    // X-axis
    let x = d3.scaleLinear()
        .domain([d3.min(ft_data.map(d => d.x)),d3.max(ft_data.map(d => d.x))+10])
        .range([0, width]);
    let nb_ticks = parseInt((w - 100) / 100);
    svg.append("g")
        .attr('class','x axis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
              .ticks(nb_ticks)
             );

    // Y-axis
    let minY = d3.min(ft_data.filter(d => d.y > 0), d => d.y),
        maxY = d3.max(ft_data, d => d.y);
    let y = d3[logScale ? "scaleLog" : "scaleLinear"]()
        .domain([minY,maxY])
        .nice()
        .range([height, 0]);

    let formatTick = d => logScale ? (Number.isInteger(Math.log10(d)) ? d3.format('.3s')(d) : "" ) : d3.format('.3s')(d);
    let nbTicks = logScale ? Math.round(Math.log10(d3.max(ft_data.map(d => d.y)))-Math.log10(d3.min(ft_data.map(d => d.y)))) + 1 : parseInt(h / 40);
    let yGrid = svg => svg
        .call(d3.axisRight(y)
              .ticks(nbTicks)
              .tickSize(width)
              .tickFormat(formatTick))
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
              .tickFormat(formatTick));

    svg.selectAll('text.axis_title').remove();
    svg.append("text")
        .attr('class','axis_title')
        .attr("transform",
              "translate(" + (width/2) + " ," + 
              (height + margin.top + 25) + ")")
        .style("text-anchor", "middle")
        .text("Number of days since " + threshold.toString() + ` ${thresholdCategory} first recorded ->`);
    
    // Colors
    let color = d3.scaleOrdinal()
        .domain(keys)
        .range(colors_countries);

    // Add lines
    svg.selectAll('path.lines').remove();
    keys.forEach(function(e,i) {
        let _ = ft_data.filter(d => d['Country/Region'] === e);
        svg.append('path')
            .datum(_)
            .attr('class','lines')
            .attr('fill','none')
            .attr('stroke', color(e))
            .attr("stroke-width", 3)
            .attr('d',d3.line()
                  .y(d => y(d.y))
                  .defined(d => logScale ? (d.y <= 0 ? false : true ) : true)
                  .x(d => x(d.x)));
    });

    // TOOLTIP
    // Add Tooltip (vertical line + tooltip)
    function addTooltip(g, data, mx, my) {
        if (!data) return g.style("display", "none");
        
        g.style("display", null);
        
        const dots = g.selectAll("circle")
              .data(data.slice(1).filter(d => logScale ? d.y > 0 : true))
              .join("circle")
              .style("fill", d => color(d['Country/Region']))
              .attr("r", 5)
              .attr("cx", (d, i) => x(d.x))
              .attr("cy", (d, i) => y(d.y));

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
                    .style("fill",(d, i) => i === 0 ? (navigation.darkMode ? '#dadada' : '#181818') : color(d['Country/Region']))
                    .text((d,i) => i === 0 ? `D+${d}` : `${d['Country/Region']} - ${d['category']}: ${d3.format(',')(d.y)}`));
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
        const bisect = d3.bisector(d => d.x).left;
        let mouseDate = x.invert(mx),
            date = Math.round(mouseDate),
            values = ft_data.filter(d => d.x === date)
            .sort((a,b) => b.y - a.y);
        return [date].concat(values);
    }
    svg.selectAll("g.tooltip_container").remove();
    const tooltip = svg.append("g").attr("class","tooltip_container");
    svg.on("touchmove mousemove", function() {
        let mouse_x = d3.mouse(this)[0],
            mouse_y = d3.mouse(this)[1];
        if (mouse_x > 0) {
            let mouseData = getMouseData(mouse_x);
            tooltip
                .call(addTooltip, mouseData, x(mouseData[0]), mouse_y+30);
        }
    });
    svg.on("touchend mouseleave", () => tooltip.call(addTooltip, null));

    // Add legend
    if (!hideLegend) {
        addLegend(id+'_svg',keys,3*margin.right,margin.top,colors_countries);
    } else {
        d3.select(id + '_svg').select('g.legend').remove();
    }
    // Save data
    data_graph[id.slice(1)] = ft_data;
}



// Testing data
function testing_graph(data, keys, hideLegend = false, yVar = 'Cumulative total',
                       xVar = 'date',
                       id = "#testing_graph",
                       w = widthMainGraph, h = heightMainGraph) {    
    let margin = getMarginGraph(w);
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    // Select the id
    var svg = d3.select(id + '_g');

    // Data Filtered
    data = data.filter(d => d['date'] >= d3.timeParse('%d-%b-%y')(startDate) &&
                       d['date'] <= d3.timeParse('%d-%b-%y')(endDate) &&
                       keys.indexOf(d['key']) > -1);
    data.forEach(e => {e.y = +e[yVar];});

    
    // Delete the axis
    svg.selectAll('g.x.axis').remove();
    svg.selectAll('g.y.axis').remove();
    svg.selectAll('g.yGrid').remove();

    // X-axis
    let x = d3.scaleTime()
        .domain(d3.extent(data, d => d[xVar]))
        .range([0, width]);
    
    let nb_ticks = parseInt((w - 100) / 100);
    svg.append("g")
        .attr('class','x axis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
              .ticks(nb_ticks)
              .tickFormat(d3.timeFormat("%d/%m/%y")));

    // Y-axis
    let y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .nice()
        .range([height, 0]);
    let formatTick = d => d3.format((yVar == 'Cumulative cases per test' ? '.2%' : '.3s'))(d);
    let yGrid = svg => svg
        .call(d3.axisRight(y)
              .tickSize(width)
              .tickFormat(formatTick))
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
              .tickFormat(formatTick));    
    // Colors
    let color = d3.scaleOrdinal()
        .domain(keys)
        .range(colors_countries);

    // Add lines
    svg.selectAll('path.lines').remove();
    keys.forEach(function(e,i) {
        let _ = data.filter(d => d.key === e);
        svg.append('path')
            .datum(_)
            .attr('class','lines')
            .attr('fill','none')
            .attr('stroke', color(e))
            .attr("stroke-width", 3)
            .attr('d',d3.line()
                  .y(d => y(d.y))
                  .defined(d => d.y ? true : false)
                  .x(d => x(d[xVar])));
    });

    // Add dots
    const dots = svg.selectAll("circle")
          .data(data)
          .join("circle")
          .style("fill", d => color(d.key))
          .attr("r", 4)
          .attr("cx", (d, i) => x(d[xVar]))
          .attr("cy", (d, i) => y(d[yVar]));

    // TOOLTIP
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
              .attr("class", "tooltip_line")
              .attr("x1", mx).attr("x2", mx) 
              .attr("y1", 0).attr("y2", height);
        
        const dots = g.selectAll("circle")
              .data(data.slice(1))
              .join("circle")
              .style("fill", d => color(d.key))
              .attr("r", 5)
              .attr("cx", (d, i) => x(d[xVar]))
              .attr("cy", (d, i) => y(d.y));

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
                    .style("fill",(d, i) => i === 0 ? (navigation.darkMode ? '#dadada' : '#181818') : color(d.key))
                    .text((d,i) => i === 0 ? d3.timeFormat("%d-%b-%y")(new Date(d)) : `${d['Country/Region']} - ${yVar} (${d.units}): ${formatTick(d.y)}`));
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
    let dates = d3.set(data.map(d => d['date'])).values().sort((a,b) => new Date(a) - new Date(b));
    function getMouseData(mx) {
        let mouseDate = x.invert(mx),
            i = d3.bisector(d => new Date(d)).left(dates, mouseDate),
            a = new Date(dates[i-1]),
            b = i > dates.length - 1 ? new Date(dates.slice(-1)[0]) : new Date(dates[i]);
        let date = mouseDate - a > b - mouseDate ? b : a,
            values = data.filter(d => d['date'] == date.toString());
        return [date].concat(values);
    }
    svg.selectAll("g.tooltip_container").remove();
    const tooltip = svg.append("g").attr("class","tooltip_container");
    svg.on("touchmove mousemove", function() {
        let mouse_x = d3.mouse(this)[0],
            mouse_y = d3.mouse(this)[1];
        if (mouse_x > 0) {
            let mouseData = getMouseData(mouse_x);
            tooltip
                .call(addTooltip, mouseData, x(new Date(mouseData[0])), mouse_y+30);
        }
    });
    svg.on("touchend mouseleave", () => tooltip.call(addTooltip, null));

    // Add legend
    if (!hideLegend) {
        addLegend(id+'_svg',keys,3*margin.right,margin.top,colors_countries);
    } else {
        d3.select(id + '_svg').select('g.legend').remove();
    }
    // Save data
    data_graph[id.slice(1)] = data;
}




// ====================================================================== //

// Create graphs
createGraph('#country_graph');
createGraph('#country_graph_rates');
createGraph('#country_graph_new_cases');
createGraph('#compare_graph');
createGraph('#ft_graph');
createGraph('#testing_graph');

// Load Data (async)
let nb_process_ended = 0;
for (const element of cases_categories) {
    let data_link =  `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_${element.toLowerCase()}_global.csv`;
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

d3.csv('https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/testing/covid-testing-all-observations.csv')
    .then(d => testing_data = d)
    .catch(e => console.log(e))
    .finally(_ => nb_process_ended += 1);


// Process Data
let timer = setInterval(() => {
    if (nb_process_ended === cases_categories.length + 2) {
        clearInterval(timer);

        // Add Dates to select
        console.time("addDatestoSelect");
        addDatestoSelect();
        console.timeEnd("addDatestoSelect");
        
        // Group By Data
        console.time("groupBy");
        data_by_country = groupBy(data,'key',['field_value'],[],
                                  ['field_id','Country/Region','date','category','key_world']);
        console.timeEnd("groupBy");

        // Add Population Data
        console.time("addPopulationData");
        addPopulationData();
        console.timeEnd("addPopulationData");

        // Compute data for the world
        console.time("computeWorldData");
        data_by_country = computeWorldData();
        console.timeEnd("computeWorldData");

        console.time("get_list_countries");
        get_list_countries(data_by_country);
        console.timeEnd("get_list_countries");

        // Add rates
        console.time("addRates");
        data_by_country = addRates(data_by_country);
        console.timeEnd("addRates");

        // Parse testing data
        console.time("parseTestingData");
        testing_data = parseTestingData(testing_data);
        console.timeEnd("parseTestingData");

        // Graph
        console.time("Graph1");
        data_country = data_by_country.filter(d => d['Country/Region'] === navigation.country);
        load_summary_data(data_country);
        updateGraph('#country_graph', data_country, 'date',(navigation.percPopulation ? 'field_value_pop' : 'field_value'), navigation.logScale, navigation.lines, cases_categories, navigation.percPopulation);
        updateGraph('#country_graph_rates', data_country, 'date','field_value', false, true, rates_categories, true);
        updateGraph('#country_graph_new_cases', data_country, 'date','field_value', false, false, new_cases_categories);
        $('.country_name').each(function() {$(this).html(navigation.country);});
        console.timeEnd("Graph1");
        
        // Compare
        console.time("build_elements_compare");
        build_elements_compare();
        console.timeEnd("build_elements_compare");
        console.time("Graph2");
        updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'),
                              navigation.lines2, navigation.maCompare);
        console.timeEnd("Graph2");

        // FT Graph
        console.time("GraphFT");
        build_ft_countries();
        build_ft_categories_select();
        ft_interactive_graph(data_by_country, navigation.ft_countries, navigation.logScale3, navigation.hideLegend,
                             navigation.ft_threshold, navigation.ft_category, navigation.ft_thresholdCategory, navigation.ft_ma);
        console.timeEnd("GraphFT");

        // Testing Graph
        console.time("GraphTesting");
        build_testing_countries();
        build_testing_countries_select();
        build_testing_yaxis();
        testing_graph(testing_data, navigation.testing_countries, navigation.hideLegend, navigation.testing_yVar);
        console.timeEnd("GraphTesting");
    }
}, 100);


// Load page, buttons according to navigation
if (document.location.hash.length > 0) {
    updateNavigation(JSON.parse(decodeURIComponent(document.location.hash.substring(1))));
}
loadPage($(`#button_${navigation.page}`),'#' + navigation.page);
toggleDarkMode(navigation.darkMode);
$('#logScaleSwitch').prop('checked', navigation.logScale);
$('#barSwitch').prop('checked', !navigation.lines);
$('#percPopulation').prop('checked', navigation.percPopulation);
//Compare
$('#logScaleSwitch2').prop('checked', navigation.logScale2);
$('#barSwitch2').prop('checked', !navigation.lines2);
$('#percPopulation2').prop('checked', navigation.percPopulation2);
$('#movingAverageCompareRange').prop('value', navigation.maCompare);
$('#movingAverageCompareValue').html(navigation.maCompare);
// FT
$('#logScaleSwitch3').prop('checked', navigation.logScale3);
$('#hideLegend').prop('checked', navigation.hideLegend);
$('#thresholdRange').prop('value', navigation.ft_threshold);
// for ranges, we need to update both the range (position of the cursor) and the span value
$('#thresholdValue').html(navigation.ft_threshold); 
$('#movingAverageFTRange').prop('value', navigation.ft_ma);
$('#movingAverageFTValue').html(navigation.ft_ma); 

// ACTIONS
// =======

// Nav actions
$('.sidebar_show').click(function(){
    loadPage($(this), $(this).attr('target'));
    action([navigation.page,'change_page',navigation.page].join('_').replace(/ /g,'_'));
});


// By Country graphs - actions
$('#chooseCountry').change(function(){
    updateNavigation({"country":$('#chooseCountry option:selected').text()});
    data_country = data_by_country.filter(d => d['Country/Region'] === navigation.country);
    load_summary_data(data_country);

    $('.country_name').each(function() {$(this).html(navigation.country);});
    updateGraph('#country_graph', data_country, 'date',(navigation.percPopulation ? 'field_value_pop' : 'field_value'), navigation.logScale, navigation.lines, cases_categories, navigation.percPopulation);
    updateGraph('#country_graph_rates', data_country, 'date','field_value', false, true, rates_categories, true);
    updateGraph('#country_graph_new_cases', data_country, 'date','field_value', false, false, new_cases_categories);
    action([navigation.page,'chooseCountry',navigation.country].join('_').replace(/ /g,'_'));
});
$('#logScaleSwitch').change(function(){
    updateNavigation({"logScale": navigation.logScale ? false : true});
    load_summary_data(data_country);
    updateGraph('#country_graph', data_country, 'date', (navigation.percPopulation ? 'field_value_pop' : 'field_value'), navigation.logScale, navigation.lines, cases_categories, navigation.percPopulation);
    updateGraph('#country_graph_rates', data_country, 'date','field_value', false, true, rates_categories, true);
    updateGraph('#country_graph_new_cases', data_country, 'date','field_value', false, false, new_cases_categories);
    action([navigation.page,'log_scale',navigation.logScale].join('_').replace(/ /g,'_'));
});
$('#barSwitch').change(function(){
    updateNavigation({"lines": navigation.lines ? false : true});
    updateGraph('#country_graph', data_country, 'date', (navigation.percPopulation ? 'field_value_pop' : 'field_value'), navigation.logScale, navigation.lines, cases_categories, navigation.percPopulation);
    updateGraph('#country_graph_rates', data_country, 'date','field_value', false, true, rates_categories, true);
    updateGraph('#country_graph_new_cases', data_country, 'date','field_value', false, false, new_cases_categories);
    action([navigation.page,'barSwitch',navigation.lines].join('_').replace(/ /g,'_'));
});

$('#percPopulation').change(function() {
    updateNavigation({"percPopulation": navigation.percPopulation ? false : true});
    load_summary_data(data_country);
    updateGraph('#country_graph', data_country, 'date', (navigation.percPopulation ? 'field_value_pop' : 'field_value'),  navigation.logScale, navigation.lines, cases_categories, navigation.percPopulation);
    updateGraph('#country_graph_rates', data_country, 'date','field_value', false, true, rates_categories, true);
    updateGraph('#country_graph_new_cases', data_country, 'date','field_value', false, false, new_cases_categories);
    action([navigation.page,'percPopulation',navigation.percPopulation].join('_').replace(/ /g,'_'));
});
$('#startDate').change(function() {
    startDate = $('#startDate option:selected').text();
    updateNavigation({"startDate": startDate});
    updateGraph('#country_graph', data_country, 'date',(navigation.percPopulation ? 'field_value_pop' : 'field_value'), navigation.logScale, navigation.lines, cases_categories, navigation.percPopulation);
    updateGraph('#country_graph_rates', data_country, 'date','field_value', false, true, rates_categories, true);
    updateGraph('#country_graph_new_cases', data_country, 'date','field_value', false, false, new_cases_categories);
    action([navigation.page,'startDate',navigation.startDate].join('_').replace(/ /g,'_'));

});
$('#endDate').change(function() {
    endDate = $('#endDate option:selected').text();
    updateNavigation({'endDate': endDate});
    updateGraph('#country_graph', data_country, 'date',(navigation.percPopulation ? 'field_value_pop' : 'field_value'), navigation.logScale, navigation.lines, cases_categories, navigation.percPopulation);
    updateGraph('#country_graph_rates', data_country, 'date','field_value', false, true, rates_categories, true);
    updateGraph('#country_graph_new_cases', data_country, 'date','field_value', false, false, new_cases_categories);
    action([navigation.page,'endDate',navigation.startDate].join('_').replace(/ /g,'_'));
});

// Graph Comparison -  actions
$('#logScaleSwitch2').change(function(){
    updateNavigation({"logScale2": navigation.logScale2 ? false : true});
    updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'), navigation.lines2, navigation.maCompare);
    action([navigation.page,'logScaleSwitch2',navigation.logScale2].join('_').replace(/ /g,'_'));
});
$('#percPopulation2').change(function() {
    updateNavigation({"percPopulation2": navigation.percPopulation2 ? false : true});
    updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'), navigation.lines2, navigation.maCompare);
    action([navigation.page,'percPopulation2',navigation.percPopulation2].join('_').replace(/ /g,'_'));
});
$('#barSwitch2').change(function(){
    updateNavigation({"lines2": navigation.lines2 ? false : true});
    updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'), navigation.lines2, navigation.maCompare);
    action([navigation.page,'barSwitch2',navigation.lines2].join('_').replace(/ /g,'_'));
});
$('#startDate2').change(function() {
    startDate = $('#startDate2 option:selected').text();
    updateNavigation({"startDate": startDate});
    updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'), navigation.lines2, navigation.maCompare);
    action([navigation.page,'startDate2',navigation.startDate].join('_').replace(/ /g,'_'));
});
$('#endDate2').change(function() {
    endDate = $('#endDate2 option:selected').text();
    updateNavigation({"endDate": endDate});
    updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'), navigation.lines2, navigation.maCompare);
    action([navigation.page,'endDate2',navigation.endDate].join('_').replace(/ /g,'_'));
});
$("#movingAverageCompareRange").on('change mousemouve', function() {
    let ma = $(this).val();
    $('#movingAverageCompareValue').html(ma);
    updateNavigation({"maCompare": ma});
    updateGraphComparison(data_by_country, navigation.logScale2, (navigation.percPopulation2 ? 'field_value_pop' : 'field_value'), navigation.lines2, navigation.maCompare);
});

// FT Graph
$('#logScaleSwitch3').change(function(){
    updateNavigation({"logScale3": navigation.logScale3 ? false : true});
    ft_interactive_graph(data_by_country, navigation.ft_countries, navigation.logScale3, navigation.hideLegend,
                             navigation.ft_threshold, navigation.ft_category, navigation.ft_thresholdCategory, navigation.ft_ma);
    action([navigation.page,'logScaleSwitch3',navigation.logScale3].join('_').replace(/ /g,'_'));
});
$('#hideLegend').change(function(){
    updateNavigation({"hideLegend": navigation.hideLegend ? false : true});
    ft_interactive_graph(data_by_country, navigation.ft_countries, navigation.logScale3, navigation.hideLegend,
                         navigation.ft_threshold, navigation.ft_category, navigation.ft_thresholdCategory, navigation.ft_ma);
    action([navigation.page,'hideLegend',navigation.hideLegend].join('_').replace(/ /g,'_'));
});
$('#ft_add_country').change(function(){
    let c = $('#ft_add_country option:selected').text();
    if (countries.indexOf(c) > -1) {
        updateNavigation({"ft_countries":navigation.ft_countries.concat([c])});
        build_ft_countries();
        build_ft_countries_select();
        ft_interactive_graph(data_by_country, navigation.ft_countries, navigation.logScale3, navigation.hideLegend,
                             navigation.ft_threshold, navigation.ft_category, navigation.ft_thresholdCategory, navigation.ft_ma);}
});
$('#ftCategory').change(function(){
    updateNavigation({"ft_category":$('#ftCategory option:selected').text()});
    ft_interactive_graph(data_by_country, navigation.ft_countries, navigation.logScale3, navigation.hideLegend,
                         navigation.ft_threshold, navigation.ft_category, navigation.ft_thresholdCategory, navigation.ft_ma);

});
$("#thresholdRange").on('change mousemouve', function() {
    let threshold = $(this).val();
    $('#thresholdValue').html(threshold);
    updateNavigation({"ft_threshold": threshold});
    ft_interactive_graph(data_by_country, navigation.ft_countries, navigation.logScale3, navigation.hideLegend,
                         navigation.ft_threshold, navigation.ft_category, navigation.ft_thresholdCategory, navigation.ft_ma);
});
$('#ftThresholdCategory').change(function(){
    updateNavigation({"ft_thresholdCategory":$('#ftThresholdCategory option:selected').text()});
    ft_interactive_graph(data_by_country, navigation.ft_countries, navigation.logScale3, navigation.hideLegend,
                         navigation.ft_threshold, navigation.ft_category, navigation.ft_thresholdCategory, navigation.ft_ma);

});
$("#movingAverageFTRange").on('change mousemouve', function() {
    let ma = $(this).val();
    $('#movingAverageFTValue').html(ma);
    updateNavigation({"ft_ma": ma});
    ft_interactive_graph(data_by_country, navigation.ft_countries, navigation.logScale3, navigation.hideLegend,
                         navigation.ft_threshold, navigation.ft_category, navigation.ft_thresholdCategory, navigation.ft_ma);
});

// Testing Graph
$('#testing_add_country').change(function(){
    let c = $('#testing_add_country option:selected').text();
    if (testing_countries.indexOf(c) > -1) {
        updateNavigation({"testing_countries":navigation.testing_countries.concat([c])});
        build_testing_countries();
        build_testing_countries_select();
        testing_graph(testing_data, navigation.testing_countries, navigation.hideLegend, navigation.testing_yVar);
    }
});
$('#testingYAxis').change(function(){
    updateNavigation({"testing_yVar":$('#testingYAxis option:selected').text()});
    testing_graph(testing_data, navigation.testing_countries, navigation.hideLegend, navigation.testing_yVar);
});
$('#startDate3').change(function() {
    startDate = $('#startDate3 option:selected').text();
    updateNavigation({"startDate": startDate});
    testing_graph(testing_data, navigation.testing_countries, navigation.hideLegend, navigation.testing_yVar);
    action([navigation.page,'startDate3',navigation.startDate].join('_').replace(/ /g,'_'));
});
$('#endDate3').change(function() {
    endDate = $('#endDate3 option:selected').text();
    updateNavigation({"endDate": endDate});
    testing_graph(testing_data, navigation.testing_countries, navigation.hideLegend, navigation.testing_yVar);
    action([navigation.page,'endDate3',navigation.endDate].join('_').replace(/ /g,'_'));
});

// Dark Mode
$('#darkmodeSwitch').on('click',function() {
    toggleDarkMode(!navigation.darkMode);
    action([navigation.page,'darkMode',navigation.darkMode].join('_').replace(/ /g,'_'));
});
