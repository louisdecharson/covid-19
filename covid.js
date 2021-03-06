/**
 * @copyright: Louis de Charsonville
 * 
 */
$('#loading_screen').show();
const main = document.getElementById('main'),
      mainStyle = main.currentStyle || window.getComputedStyle(main),
      mainWidth = main.offsetWidth,
      mainSideMargin = parseFloat(mainStyle.marginLeft) + parseFloat(mainStyle.marginRight),
      mainSidePadding = parseFloat(mainStyle.paddingLeft) + parseFloat(mainStyle.paddingRight),
      graphWidth = mainWidth - mainSidePadding,
      graphHeight = Math.max(400, screen.height * 0.4);

const root = document.documentElement,
      rootStyle = window.getComputedStyle(root);

const stylesheet = window.document.styleSheets[2];

// Dark Mode
const cssVariables = ['--background-color','--color-text','--text-muted']; // for dark mode
let cssMapping = {};
for (const v of cssVariables) {
    cssMapping[ v + '-light'] = rootStyle.getPropertyValue(v + '-light');
    cssMapping[ v + '-dark'] = rootStyle.getPropertyValue(v + '-dark');
}

// Colors
const colors_countries = ["#1abb9b","#3497da","#9a59b5","#f0c30f","#e57e22","#e64c3c","#7f8b8c","#CC6666", "#9999CC", "#66CC99"];
const colors = ['#FFC107','#ff073a','#2ecb71'];

// Data
let _data = {
    "cases": [],
    "cases_raw": [],
    "cases_selected": [],
    "testing": [],
    "population": [],
    "mobility": [],
    "hospitalization": [],
};



// Initiate variables
let pivot_columns = ['Province/State','Country/Region','Lat','Long'],
    // cases_categories = ['Confirmed','Deaths'],
    cases_categories = ['Confirmed','Deaths','Recovered'],
    rates_categories = ['Deaths rate'],
    new_cases_categories = ['New Confirmed cases','New Deaths cases'],
    testing_yaxis = ['Cumulative total','Cumulative total per thousand','Daily change in cumulative total','Daily change in cumulative total per thousand'],
    testing_countries = [],
    countries = [],
    list_dates = [],
    mobilityDates = [],
    mobilityRegions = [],
    mobilityTypes = [];


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

// Mapping between testing and JHU data
const testing_equivalence_country = {
    "Czech Republic": "Czechia",
    "United States":"US",
    "South Korea": "Korea, South"
};
const map_testing_country = function(country) {
    if (Object.keys(testing_equivalence_country).indexOf(country) > -1) {
        return testing_equivalence_country[country];
    } else {
        return country;
    }
};

// ========================================================================== //

// NAVIGATION
// ----------

// Default navigation
let navigation = {
    "page": "by_country",
    "darkMode": window.matchMedia("(prefers-color-scheme: dark)").matches,
    "country": "World",
    "elements": [
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
    ],
    "logScale": false,
    "logScale2": false,
    "lines": true,
    "lines2": true,
    "percPopulation": false,
    "percPopulation2": false,
    "startDate": null,
    "endDate": null,
    "maCompare": 1,
    "ft_countries": ["Korea, South","China","France","Italy","Spain","Japan","US","United Kingdom"],
    "logScale3": true,
    "hideLegend": false,
    "ft_category": "Deaths",
    "ft_threshold": 100,
    "ft_thresholdCategory": "Deaths",
    "ft_ma": 1,
    "testing_yVar": "Cumulative total",
    "testing_countries": false,
    "mobility_elements":[
        {
            "region": "Paris",
            "transportation_type": "walking"
        },
        {
            "region": "Paris",
            "transportation_type": "driving"
        },
        {
            "region": "Paris",
            "transportation_type": "transit"
        }],
    "lines4": true,
    "hideLegendMobility": false,
    "hideNav": true,
    "hospitalizationVariables": ["Hospitalizations for suspicion of COVID-19"],
    "hideLegendHospitalization": false,
    "lines5": true,
    "maHospitalization": 1,
    "custom_settings": [
        ["Font size axis tick text",".tick text","font-size","12px"],
        ["Font size axis label", ".axisLabel text", "font-size", "16px"]
    ]
};
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
    localStorage.setItem("navigation",JSON.stringify(navigation));
    document.location.hash = navigation.hideNav ? "" : JSON.stringify(navigation);    
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

// Navigation - load
if (document.location.hash.length > 0) {
    updateNavigation(JSON.parse(decodeURIComponent(document.location.hash.substring(1))));
} else {
    if (localStorage.getItem('navigation')) {
        updateNavigation(JSON.parse(localStorage.getItem('navigation')));
    }
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

// Mobility
$('#barSwitch4').prop('checked', !navigation.lines4);
$('#hideLegendMobility').prop('checked', navigation.hideLegendMobility);

// Hospitalization
$('#barSwitch5').prop('checked', !navigation.lines5);
$('#hideLegendHospitalization').prop('checked', navigation.hideLegendHospitalization);
$('#movingAverageHospitalizationRange').prop('value', navigation.maHospitalization);
$('#movingAverageHospitalizationValue').html(navigation.maHospitalization);


// ========================================================================== //

// DARK MODE
// ---------

function toggleDarkMode(darkMode) {
    let darkModeSwitch = $('#darkmodeSwitch');
    if (darkMode) {
        cssVariables.forEach(function(it) {root.style.setProperty(it,cssMapping[it+'-dark']);});
        darkModeSwitch.addClass('darkmode badge-primary');
        darkModeSwitch.removeClass('badge-secondary');
        darkModeSwitch.text('ON');
        updateNavigation({"darkMode":true});
    } else {
        cssVariables.forEach(function(it) {root.style.setProperty(it,cssMapping[it + '-light']);});
        darkModeSwitch.removeClass('darkmode badge-secondary');
        darkModeSwitch.addClass('badge-secondary');
        darkModeSwitch.text('OFF');
        updateNavigation({"darkMode":false});
    }
}

// ========================================================================== //

// (DATA) FUNCTIONS 
// -----------------

// In this section, all the functions used to download and process data.
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
function ma_json(array, yVars, period=1) {
    // Compute the moving average on yVars with period 'period' where array
    // is a JSON array
    let ma = [];
    for (let i = array.length; i >= 0 + period; i--) {
        let e = $.extend(true, {}, array[i - 1]);
        for (const yVar of yVars) {
            e[yVar] = array.slice(i-period,i).reduce((t,n) => t + n[yVar],0)/period;
        }
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
    list_dates = d3.set(long_data.map(d => d['date'])).values().map(d => d3.timeFormat("%d-%b-%y")(new Date(d)));
    navigation.startDate = navigation.startDate || list_dates[0];
    navigation.endDate = list_dates.slice(-1)[0];
    return long_data.sort(function(a,b) {return a.date - b.date;});
}
function parseMobilityData(wide_data, pivot_columns) {
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
            long_element['date'] = new Date (d3.timeParse("%Y-%m-%d")(long_element['field_id']));
            long_element['key'] = `${long_element['region']} - ${long_element['transportation_type']}`;
            long_data.push(long_element);
        }
    }
    mobilityDates = Grapher.unique(long_data.map(d => d['field_id']));
    mobilityRegions = Grapher.unique(long_data.map(d => d['region']));
    mobilityTypes = Grapher.unique(long_data.map(d => d['transportation_type']));
    return long_data;
}

function parseTestingData(data) {
    let confirmed_cases = d3.nest().key(d => d.key).map(_data.cases
                                                        .filter(d => d['category'] === 'Confirmed'));
    for (const el of data) {
        el['Country/Region'] = map_testing_country(el['Entity'].split(' - ')[0]);
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
    navigation.testing_countries = navigation.testing_countries || testing_countries.slice(1, 4);
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
                new_case[i]['field_value_pop'] = new_case[i]['field_value'] / e['Population'];
                growth_rate[i]['category'] = `${e['category']} growth rate`;
                growth_rate[i]['key'] = e['category'] + e['Country/Region'] + e['field_id'];
                growth_rate[i]['field_value_pop'] = growth_rate[i]['field_value'] / e['Population'];
            }
            return [...new_case, ...growth_rate];
        })
        .entries(_data.cases)
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
                          data = _data.cases,
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
function load_summary_data() {
    let last_date = _data.cases_raw.map(d => d['date']).slice(-1)[0];
    for (const category of cases_categories) {
        let data_category = _data.cases_selected.filter(f => f['category'] === category),
            last_value = d3.format((navigation.percPopulation ? '%' : ','))(data_category.slice(-1)[0][(navigation.percPopulation ? 'field_value_pop' : 'field_value')]);
        $(`#nb_${category.toLowerCase()}`).html(last_value);

        // Add this data to DOM
        if (category === 'Deaths' || category === 'Recovered') {
            let last_value_rate = ` (${d3.format('.2%')(_data.cases_selected.filter(f => f['category'] === category + ' rate').slice(-1)[0]['field_value'])}) `;
            $(`#nb_${category.toLowerCase()}_rate`).html(last_value_rate);
        } 
        // sparkline(`#sparkline_${category.toLowerCase()}`, data_category, 'field_id', (navigation.percPopulation ? 'field_value_pop' : 'field_value'), navigation.logScale);
    }
    $('#lastDataPoint').html(d3.timeFormat("%d-%b-%y")(last_date));

}
function addPopulationData() {
    let popData = d3.nest().key(d => d['Country/Region']).map(_data.population);
    _data.cases = d3.nest()
        .key(d => d['Country/Region'])
        .rollup(function(a) {
            let popDataEl = popData.get(a[0]['Country/Region']);
            if (popDataEl) {
                for (const e of a) {
                    e['Population'] = +popDataEl[0].Population;
                    e['field_value_pop'] = e['field_value'] / e['Population'];
                }
            }
            return a;
        })
        .entries(_data.cases)
        .map(d => d.value).flat();
}
function computeWorldData() {
    return [..._data.cases, ...computeAggregate('World'),
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
function get_dates(data) {
    list_dates = d3.set(data.map(d => d['date'])).values();
}
function filterByDate(data, categoryName=false, categoryList=false, dateVariable = "date") {
    let a =  d3.timeParse('%d-%b-%y')(navigation.startDate),
        b = d3.timeParse('%d-%b-%y')(navigation.endDate);
    if (categoryName) {
        return data.filter(d => d[dateVariable] >= a &&
                    d[dateVariable] <= b &&
                    categoryList.indexOf(d[categoryName]) > -1);
    } else {
        return data.filter(d => d[dateVariable] >= a &&
                           d[dateVariable] <= b);
    }
}
/**
 * Prepare data for compare graph: 
 * 1. Filter data for the right date and countries
 * 2. Offset data
 * 3. Compute moving average
 * 4. Retrieve keys
 */
function getCompareData(inputData) {
    let data = [];
    function offset_data(data, offset_value) {
        // Compute offset and update key
        data.forEach(function(it,ind) {
            let value = ind + offset_value < data.length ? data[ind + offset_value]['field_value'] : NaN,
                value_pop = ind + offset_value < data.length ? data[ind + offset_value]['field_value_pop'] : NaN;
            it['field_value'] = value; // update value
            it['field_value_pop'] = value_pop;
            it.offset = offset_value; // add offset to the element
            it.keyCompare = getKey(it);
        });
        return data;
    }
    function getKey(e) {
        return `${e['Country/Region']} - ${e['category']}` + (e['offset'] > 0 ? ` (offset: ${e['offset']} day${e['offset'] > 1 ? 's' : ''})` : "");
    }
    navigation.elements.forEach(function(element,index) {
        let _ = inputData.filter(d => (d['category'] === element['category'] &&
                                       d['Country/Region'] === element['Country/Region'] &&
                                       d['date'] >= d3.timeParse('%d-%b-%y')(navigation.startDate) &&
                                       d['date'] <= d3.timeParse('%d-%b-%y')(navigation.endDate)));
        _ = ma_json(offset_data($.extend(true, [], _), element['offset']),['field_value', 'field_value_pop'], navigation.maCompare);
        data = data.concat(_);
    });
    return data;
}
function ftData(data, yVar='field_value') {
    return d3.nest()
        .key(d => d['Country/Region'])
        .rollup(function(a) {
            let na = $.extend(true, [], a).filter(d => d['category'] === navigation.ft_category),
                date_threshold = d3.min(a.filter(d => d['category'] === navigation.ft_thresholdCategory &&
                                                 d[yVar] >= navigation.ft_threshold)
                                        .map(d => d['date']));
            for (let i = na.length; i >= 0 + navigation.ft_ma; i--) {
                let e = na[i-1];
                e['x'] = Math.round((e['date'] - date_threshold)/(24*3600*1000));
                e['y'] = navigation.ft_ma === 1 ? e[yVar] : na.slice(i-navigation.ft_ma,i).reduce((t,n) => t + n[yVar],0)/navigation.ft_ma;
            }
            return na.reverse().slice(navigation.ft_ma-1).filter(d => d['x'] >= 0);
        })
        .entries(data.filter(d => (navigation.ft_countries.indexOf(d['Country/Region']) > -1)))
        .map( g => g.value).flat();
}
// ========================================================================== //

// FUNCTIONS INTERACTING WITH DOM
// ==============================

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
        categories = d3.set(_data.cases.map(d => d['category'])).values().filter(d => !d.includes('rate'));
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
function build_elements_compare() {
    let html = '',
        categories = d3.set(_data.cases.map(d => d['category'])).values();
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
function build_elements_mobility() {
    let html = '';
    for (const [index, element] of navigation.mobility_elements.entries()) {
        let selectRegion = '',
            selectType = '';
        for (const region of mobilityRegions) {
            let selected = region === element['region'] ? 'selected' : '';
            selectRegion += '<option ' + selected + '>' + region + '</option>';
        }
        for (const type of mobilityTypes) {
            let selected = type === element['transportation_type'] ? 'selected' : '';
            selectType += '<option ' + selected + '>' + type + '</option>';
        }
        element.id = (parseInt(Math.random()*1e16)).toString();
        html += `
<div class="col-xl-4 col-md-6 col-12 mt-2 mb-2">
    <div class="card element" style="border-color:${colors_countries[index]}">
        <svg style="position:absolute;top:0.2rem;right:0.1rem;" class="svg-icon delete-element" onclick=delete_mobility_element('${element.id}') viewBox="0 0 20 20" data-toggle="tooltip" data-placement="top" title="delete plot">
            <path d="M10.185,1.417c-4.741,0-8.583,3.842-8.583,8.583c0,4.74,3.842,8.582,8.583,8.582S18.768,14.74,18.768,10C18.768,5.259,14.926,1.417,10.185,1.417 M10.185,17.68c-4.235,0-7.679-3.445-7.679-7.68c0-4.235,3.444-7.679,7.679-7.679S17.864,5.765,17.864,10C17.864,14.234,14.42,17.68,10.185,17.68 M10.824,10l2.842-2.844c0.178-0.176,0.178-0.46,0-0.637c-0.177-0.178-0.461-0.178-0.637,0l-2.844,2.841L7.341,6.52c-0.176-0.178-0.46-0.178-0.637,0c-0.178,0.176-0.178,0.461,0,0.637L9.546,10l-2.841,2.844c-0.178,0.176-0.178,0.461,0,0.637c0.178,0.178,0.459,0.178,0.637,0l2.844-2.841l2.844,2.841c0.178,0.178,0.459,0.178,0.637,0c0.178-0.176,0.178-0.461,0-0.637L10.824,10z"></path>
        </svg>
        <div class="card-title country_element mb-1">
            <select onchange="update_mobility_element(this,'region')" class="select-country-element" element_id="${element.id}">
                ${selectRegion}
            </select>
        </div>
        <div class="category_element mb-1 mt-1">
            <select onchange="update_mobility_element(this,'transportation_type')" class="select-category-element" element_id="${element.id}">
                ${selectType}
            </select>
        </div>
    </div>
</div>`;
    }
    $('#mobility_elements_container').html(html);   
};

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
    let max_value = Math.min(d3.max(_data.cases.filter(d => (navigation.ft_countries.indexOf(d['Country/Region']) > -1) &&
                                                           (d['category'] === 'Deaths'))
                                    .map(d => d['field_value'])),1000);
    $('#thresholdRange').attr('max', max_value.toString());
}
function remove_ft_country(index) {
    navigation.ft_countries.splice(index,1);
    updateNavigation({"ft_countries": navigation.ft_countries});
    build_ft_countries();
    build_ft_countries_select();
    plots['ft_graph'].draw({"data": ftData(_data.cases),
                  "categories":navigation.ft_countries});
}
function remove_testing_country(index) {
    navigation.testing_countries.splice(index,1);
    updateNavigation({"testing_countries": navigation.testing_countries});
    build_testing_countries();
    build_testing_countries_select();
    plots['testing_graph'].draw({"data": filterByDate(_data.testing, 'Entity', navigation.testing_countries),
                       "categories": navigation.testing_countries});
}
function update_offset(el, value) {
    let element_id = $(el).attr('element_id');
    navigation.elements.forEach(function(it, ind) {
        if (it.id === element_id) {
            it.offset = Math.max(0, it.offset + parseInt(value));
            $(`#offset_${element_id}`).html(it.offset);
        }
    });
    compareGraph.draw({"data": getCompareData(_data.cases),
                       "categories": get_list_elements()});
}
function update_element(el, property) {
    let element_id = $(el).attr('element_id');
    navigation.elements.forEach(function(it, ind) {
        if (it.id === element_id) {
            it[property] = el.value;
        }
    });
    updateNavigation({"elements": navigation.elements});
    plots['compare_graph'].draw({"data":getCompareData(_data.cases),
                       "categories": get_list_elements()});
}
function update_mobility_element(el, property) {
    let element_id = $(el).attr('element_id');
    navigation.mobility_elements.forEach(function(it, ind) {
        if (it.id === element_id) {
            it[property] = el.value;
        }
    });
    updateNavigation({"mobility_elements": navigation.mobility_elements});
    plots['mobility_graph'].draw({"data": filterByDate(_data.mobility,'key',
                                             navigation.mobility_elements.map(d => `${d['region']} - ${d['transportation_type']}`)),
                        "categories": navigation.mobility_elements.map(d => `${d['region']} - ${d['transportation_type']}`)});

}
function get_list_elements() {
    function getKey(e) {
        return `${e['Country/Region']} - ${e['category']}` + (e['offset'] > 0 ? ` (offset: ${e['offset']} day${e['offset'] > 1 ? 's' : ''})` : "");
    }
    return navigation.elements.map(d => getKey(d));
}
function add_element() {
    let last_el = navigation.elements.length > 0 ? $.extend(true, {}, navigation.elements[navigation.elements.length-1]) : {
        "Country/Region": "France",
        "category": "Confirmed",
        "offset": 0
    }; // copy last element
    last_el['Country/Region'] = navigation.elements.length > 0 ? countries[Math.min(countries.indexOf(last_el['Country/Region'])+1,countries.length-1)] : 'France';
    updateNavigation({"elements": navigation.elements.concat(last_el)});
    build_elements_compare();
    plots['compare_graph'].draw({"data":getCompareData(_data.cases),
                       "categories": get_list_elements()});
}
function delete_element(id) {
    navigation.elements = navigation.elements.filter(d => d.id != id);
    updateNavigation({"elements": navigation.elements});
    build_elements_compare();
    plots['compare_graph'].draw({"data":getCompareData(_data.cases),
                       "categories": get_list_elements()});
}

function add_mobility_element() {
    let last_el = navigation.mobility_elements.length > 0 ? $.extend(true, {}, navigation.mobility_elements.slice(-1)[0]) : {
        "region": "Paris",
        "transportation_type": "walking"
    }; // copy last element
    updateNavigation({"mobility_elements": navigation.mobility_elements.concat(last_el)});
    last_el['region'] = navigation.mobility_elements.length > 0 ? mobilityRegions[Math.min(mobilityRegions.indexOf(last_el['region'])+1,mobilityRegions.length-1)] : 'Paris';

    build_elements_mobility();
    plots['mobility_graph'].draw({"data": filterByDate(_data.mobility,'key',
                                             navigation.mobility_elements.map(d => `${d['region']} - ${d['transportation_type']}`)),
                        "categories": navigation.mobility_elements.map(d => `${d['region']} - ${d['transportation_type']}`)});
}
function delete_mobility_element(id) {
    updateNavigation({"mobility_elements": navigation.mobility_elements.filter(d => d.id != id)});
    build_elements_mobility();
    plots['mobility_graph'].draw({"data": filterByDate(_data.mobility,'key',
                                             navigation.mobility_elements.map(d => `${d['region']} - ${d['transportation_type']}`)),
                        "categories": navigation.mobility_elements.map(d => `${d['region']} - ${d['transportation_type']}`)});    
}


function addDatestoSelect() {
    let html_start_dates = '',
        html_end_dates = '';
    for (const d of list_dates) {
        html_start_dates += '<option ' + (d === navigation.startDate ? 'selected' : '') + '>' + d + '</option>';
        html_end_dates += '<option ' + (d === navigation.endDate ? 'selected' : '') + '>' + d + '</option>';
    }
    $('.select-dates[start]').each((i,e) => $(e).html(html_start_dates));
    $('.select-dates[end]').each((i,e) => $(e).html(html_end_dates));
}
function updateDatesPlot(target) {
    switch (target) {
    case 'country_graph':
        plots['country_graph'].draw({"data": filterByDate(_data.cases_selected, 'category', cases_categories)});
        plots['country_graph_rates'].draw({"data": filterByDate(_data.cases_selected, 'category', rates_categories)});
        plots['country_graph_new_cases'].draw({"data": filterByDate(_data.cases_selected, 'category', new_cases_categories)});
        break;
    case 'compare_graph':
        plots['compare_graph'].draw({"data":getCompareData(_data.cases)});
        break;
    case 'testing_graph':
        plots['testing_graph'].draw({"data": filterByDate(_data.testing, 'Entity', navigation.testing_countries)});
        break;
    case 'mobility_graph':
        plots['mobility_graph'].draw(
            {"data": filterByDate(_data.mobility,'key',
                                  navigation.mobility_elements.map(d => `${d['region']} - ${d['transportation_type']}`))
            });
        break;
    case 'hospitalization_graph':
        plots['hospitalization_graph'].draw(
            {"data": ma_json(filterByDate(_data.hospitalization,
                                          'Category',
                                          navigation.hospitalizationVariables),
                             ["value"],
                             navigation.maHospitalization
                            )
            }
        );
    }
}
function download_data(id) {
    switch (id) {
    case 'country_graph':
        countryGraph.downloadData();
        break;
    case 'country_graph_rates':
        plots['country_graph_rates'].downloadData();
        break;
    case 'country_graph_new_cases':
        plots['country_graph_new_cases'].downloadData();
        break;
    case 'compare_graph':
        plots['compare_graph'].downloadData();
        break;
    case 'ft_graph':
        plots['ft_graph'].downloadData();
        break;
    case 'testing_graph':
        plots['testing_graph'].downloadData();
        break;
    }
}
function buildSelectHospitalizationVariables() {
    let hospitalizationVariables = Grapher.unique(_data.hospitalization.map(d => d['Category']));
    let html = "";
    for (const v of hospitalizationVariables) {
        let selected = navigation.hospitalizationVariables.indexOf(v) > -1 ? 'selected' : '';
        html += `<option ${selected}>${v}</option>`;
    }
    $('#hospitalization_variables').html(html);
}
function buildCustomSettings() {
    // Settings
    let htmlSettings = '';
    navigation.custom_settings.forEach(function(it,ind) {
        htmlSettings += `
<div class="form-group form-inline">
    <label for="${it[0].replace(' ','_')}">${it[0]}</label>
    <input id="${it[0].replace(' ','_')}" type="text" class="setting form-control form-control-sm mx-sm-3" target="${it[1]}" css="${it[2]}" value="${it[3]}">
</div>
`;
        // activate rule
        $(it[1]).css(it[2], it[3]);
        // insert rule to DOM
        stylesheet.insertRule(`${it[1]} { ${it[2]}: ${it[3]}; }`, stylesheet.cssRules.length);
    });
    $('#form_settings').html(htmlSettings);
}
// ========================================================================== //

// CHARTS
// ======
class CovidGraph extends Grapher {
    constructor(id, options= {}) {
        let default_options = {
            "x": {
                "name": "date",
                "tickFormat": d3.timeFormat("%d/%m/%y"),
                "scale": "scaleTime",
                "nice": false                
            },
            "y": {
                "name": 'field_value',
                "scale": "scaleLinear",
            },                                        
            "category": {
                "name": "category"
            },
            "type": "line",
            "style": {
                "tooltipColor": () => (navigation.darkMode ? '#dadada' : '#181818')
            },
        };
        Grapher.updateDict(default_options, options, true);
        super(id,
              default_options,
              graphWidth,
              graphHeight);
    }
}
// ========================================================================== //
let plots = {};
plots['country_graph'] = new CovidGraph('country_graph',
                                        {
                                            "y": {
                                                "name": navigation.percPopulation ? 'field_value_pop' : 'field_value',
                                                "scale": navigation.logScale ? "scaleLog" : "scaleLinear",
                                                "tickFormat": Grapher.formatTick(navigation.logScale, navigation.percPopulation)
                                            },
                                            "categories": cases_categories,
                                            "type": navigation.lines ? "line" : "bar",
                                            "advanced": {
                                                "additionalColumnsInData": ['Country/Region','field_value_pop','field_value']
                                            },
                                            "style": {
                                                "colors": colors,
                                                "tooltipColor": () => (navigation.darkMode ? '#dadada' : '#181818')
                                            }
                                        });
plots['country_graph_rates'] = new CovidGraph('country_graph_rates',
                                              {
                                                  "y": {
                                                      "tickFormat": Grapher.formatTick(false, true)
                                                  },
                                                  "category": {
                                                      "name": "category"
                                                  },
                                                  "style": {
                                                      "colors": colors,
                                                      "tooltipColor": () => (navigation.darkMode ? '#dadada' : '#181818')
                                                  },
                                                  "categories": rates_categories,
                                                  "advanced": {
                                                      "additionalColumnsInData": ['Country/Region']
                                                  }});
plots['country_graph_new_cases'] = new CovidGraph('country_graph_new_cases',
                                          {
                                              "y": {
                                                  "tickFormat": Grapher.formatTick(false, false)
                                              },
                                              "style": {
                                                  "colors": colors,
                                                  "tooltipColor": () => (navigation.darkMode ? '#dadada' : '#181818')
                                              },
                                              "type": "bar",
                                              "categories": new_cases_categories,
                                              "advanced": {
                                                  "additionalColumnsInData": ['Country/Region']
                                              }
                                          });
// compareGraph
plots['compare_graph'] = new CovidGraph('compare_graph',
                               {
                                   "y": {
                                       "name": navigation.percPopulation2 ? 'field_value_pop' : 'field_value',
                                       "scale": navigation.logScale2 ? "scaleLog" : "scaleLinear",
                                       "tickFormat": Grapher.formatTick(navigation.logScale2, navigation.percPopulation2)
                                   },
                                   "category": {
                                       "name": "keyCompare"
                                   },
                                   "categories": get_list_elements(),
                                   "type": navigation.lines2 ? "line" : "bar",
                                   "advanced": {
                                       "additionalColumnsInData": ['field_value','field_value_pop']
                                   }
                               });
plots['ft_graph'] = new Grapher('ft_graph',
                          {
                              "x": {
                                  "label": "Number of days since " + navigation.ft_threshold.toString() + ` ${navigation.ft_thresholdCategory} first recorded ->`
                              },
                              "y": {
                                  "scale": navigation.logScale3 ? "scaleLog" : "scaleLinear",
                                  "tickFormat": Grapher.formatTick(navigation.logScale3, false)
                              },
                              "category": {
                                  "name": "Country/Region"
                              },
                              "legend": {
                                  "show": !navigation.hideLegend
                              },
                              "style": {
                                  "tooltipColor": () => (navigation.darkMode ? '#dadada' : '#181818'),
                                  "tooltipFormat": (d,i) => i == 0 ? `D+${d}` : `${d['Country/Region']} - ${d['category']}: ${d3.format(',')(d.y)}`,
                              },
                              "advanced": {
                                  "additionalColumnsInData": ['category']
                              }
                          },
                          graphWidth,
                          graphHeight);

plots['testing_graph'] = new CovidGraph('testing_graph',
                                  {
                                      "y": {
                                          "name": navigation.testing_yVar,
                                          "parse": d => parseFloat(d),
                                          "tickFormat": d3.format(navigation.testing_yVar == 'cumulative cases per test' ? '.2%' : '.3s')
                                      },
                                      "category": {
                                          "name": "Entity"
                                      },
                                  });
plots['mobility_graph'] = new CovidGraph('mobility_graph',
                                   {
                                       "category": {
                                           "name": "key"
                                       },
                                       "type": navigation.lines4 ? "line" : "bar",
                                       "legend": {
                                           "show": !navigation.hideLegendMobility
                                       },
                                   });
plots['hospitalization_graph'] = new CovidGraph('hospitalization_graph',
                                 {
                                     "x": {
                                         "name": "date",
                                         "tickFormat": d3.timeFormat("%d/%m/%y"),
                                     },
                                     "y": {
                                         "name": 'value',
                                         "parse": d => parseFloat(d)
                                     },                                        
                                     "category": {"name": "Category"},
                                     "type": navigation.lines5 ? "line" : "bar",
                                     "legend": {
                                         "show": !navigation.hideLegendHospitalization
                                     }
                                 });
// ========================================================================== //

// LOAD DATA
// =========
// Process Data
console.time("Loading");
const progressBar = document.getElementById("myBar");
let widthProgressBar = 10;
function updateProgressBar(w) {
    widthProgressBar = widthProgressBar + w;
    progressBar.style.width = widthProgressBar + "%";
}
let nb_process_ended = 0;
console.time("DownloadData");
for (const element of cases_categories) {
    let data_link =  `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_${element.toLowerCase()}_global.csv`;
    d3.csv(data_link)
        .then(function(d) {
            console.log(`Loaded data for ${element}. Length: ${d.length}`);
            _data.cases_raw = _data.cases_raw.concat(parseData(d, pivot_columns, element));
            updateProgressBar(10);
        })
        .catch(function(error) {
            console.log(error);
        })
        .finally(_ => nb_process_ended += 1);
}
d3.csv('https://raw.githubusercontent.com/louisdecharson/covid-19/master/population_data.csv')
    .then(d => _data.population = d)
    .catch(e => console.log(e))
    .finally(_ => {nb_process_ended += 1; updateProgressBar(10);});

d3.csv('https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/testing/covid-testing-all-observations.csv')
    .then(d => _data.testing = d)
    .catch(e => console.log(e))
    .finally(_ => {nb_process_ended += 1; updateProgressBar(10);});

d3.csv('https://raw.githubusercontent.com/ActiveConclusion/COVID19_mobility/master/apple_reports/applemobilitytrends.csv')
    .then(d => _data.mobility = parseMobilityData(d, ['geo_type','region','transportation_type','alternative_name']))
    .catch(e => console.log(e))
    .finally(_ => {nb_process_ended += 1; updateProgressBar(10);});

d3.csv('https://raw.githubusercontent.com/louisdecharson/covid-19/master/sursaud_corona.csv')
    .then(d => _data.hospitalization = d.map(
        function(e) {e['date'] = d3.timeParse('%Y-%m-%d')(e['Day']); e['value'] = parseFloat(e['value']); return e;}))
    .catch(e => console.log(e))
    .finally(_ => nb_process_ended += 1);


let timer = setInterval(() => {
    if (nb_process_ended === cases_categories.length + 4) {
        console.timeEnd("DownloadData");
        clearInterval(timer);

        // Add Dates to select
        console.time("addDatestoSelect");
        addDatestoSelect();
        console.timeEnd("addDatestoSelect");
        
        // Group By Data
        console.time("groupBy");
        _data.cases = groupBy(_data.cases_raw,
                             'key',
                             ['field_value'],
                             [],
                             ['field_id','Country/Region','date','category','key_world']);
        console.timeEnd("groupBy");
        updateProgressBar(5);
        
        // Add Population Data
        console.time("addPopulationData");
        addPopulationData();
        console.timeEnd("addPopulationData");

        // Compute data for the world
        console.time("computeWorldData");
        _data.cases = computeWorldData();
        console.timeEnd("computeWorldData");
        updateProgressBar(5);

        console.time("get_list_countries");
        get_list_countries(_data.cases);
        console.timeEnd("get_list_countries");

        // Add rates
        console.time("addRates");
        _data.cases = addRates(_data.cases);
        console.timeEnd("addRates");
        updateProgressBar(5);


        // Parse testing data
        console.time("parseTestingData");
        _data.testing = parseTestingData(_data.testing);
        console.timeEnd("parseTestingData");
        updateProgressBar(5);

        // Graph
        console.time("Graph1");
        _data.cases_selected = _data.cases.filter(d => d['Country/Region'] === navigation.country);
        load_summary_data(_data.cases_selected);
        plots['country_graph'].draw({"data": filterByDate(_data.cases_selected, 'category', cases_categories)});
        plots['country_graph_rates'].draw({"data": filterByDate(_data.cases_selected, 'category', rates_categories)});
        plots['country_graph_new_cases'].draw({"data": filterByDate(_data.cases_selected, 'category', new_cases_categories)});
        $('.country_name').each(function() {$(this).html(navigation.country);});
        console.timeEnd("Graph1");
        
        // Compare
        console.time("build_elements_compare");
        build_elements_compare();
        console.timeEnd("build_elements_compare");
        console.time("Graph2");
        plots['compare_graph'].draw({"data":getCompareData(_data.cases)});
        console.timeEnd("Graph2");
        updateProgressBar(5);


        // FT Graph
        console.time("GraphFT");
        build_ft_countries();
        build_ft_categories_select();
        plots['ft_graph'].draw({"data": ftData(_data.cases),
                     "categories":navigation.ft_countries});
        console.timeEnd("GraphFT");
        updateProgressBar(5);



        // Testing Graph
        console.time("GraphTesting");
        build_testing_countries();
        build_testing_countries_select();
        build_testing_yaxis();
        plots['testing_graph'].draw({"data": filterByDate(_data.testing,'Entity',navigation.testing_countries),
                          "categories":navigation.testing_countries});
        console.timeEnd("GraphTesting");



        // Mobility Graph
        console.time("build_elements_mobility");
        build_elements_mobility();
        console.timeEnd("build_elements_mobility");
        console.time("GraphMobility");
        plots['mobility_graph'].draw({"data": filterByDate(_data.mobility,'key',
                                                 navigation.mobility_elements.map(d => `${d['region']} - ${d['transportation_type']}`)),
                            "categories": navigation.mobility_elements.map(d => `${d['region']} - ${d['transportation_type']}`)});
        console.timeEnd("GraphMobility");

        console.timeEnd("Loading");
        $('#loading_screen').hide();

        // SOS Med data
        buildSelectHospitalizationVariables();
        plots['hospitalization_graph'].draw(
            {"data": ma_json(filterByDate(_data.hospitalization,
                                          'Category',
                                          navigation.hospitalizationVariables),
                             ["value"],
                             navigation.maHospitalization
                            )
            });

        // Custom settings
        buildCustomSettings();
    }
}, 100);



// ========================================================================== //



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
    _data.cases_selected = _data.cases.filter(d => d['Country/Region'] === navigation.country);
    load_summary_data(_data.cases_selected);

    $('.country_name').each(function() {$(this).html(navigation.country);});
    plots['country_graph'].draw({"data": filterByDate(_data.cases_selected, 'category', cases_categories)});
    plots['country_graph_rates'].draw({"data": filterByDate(_data.cases_selected, 'category', rates_categories)});
    plots['country_graph_new_cases'].draw({"data": filterByDate(_data.cases_selected, 'category', new_cases_categories)});
    action([navigation.page,'chooseCountry',navigation.country].join('_').replace(/ /g,'_'));
});
$('#logScaleSwitch').change(function(){
    updateNavigation({"logScale": navigation.logScale ? false : true});
    plots['country_graph'].draw({
        "y": {
            "scale": navigation.logScale ? "scaleLog" : "scaleLinear",
            "tickFormat": Grapher.formatTick(navigation.logScale, navigation.percPopulation)
        },
        "categories": cases_categories
    });
    action([navigation.page,'log_scale',navigation.logScale].join('_').replace(/ /g,'_'));
});
$('#barSwitch').change(function(){
    updateNavigation({"lines": navigation.lines ? false : true});
    plots['country_graph'].draw({"type": navigation.lines ? "line" : "bar"});
    action([navigation.page,'barSwitch',navigation.lines].join('_').replace(/ /g,'_'));
});

$('#percPopulation').change(function() {
    updateNavigation({"percPopulation": navigation.percPopulation ? false : true});
    load_summary_data(_data.cases_selected);
    plots['country_graph'].draw({
        "y": {
            "name": navigation.percPopulation ? 'field_value_pop' : 'field_value',
            "tickFormat": Grapher.formatTick(navigation.logScale, navigation.percPopulation)
        }
    });
    action([navigation.page,'percPopulation',navigation.percPopulation].join('_').replace(/ /g,'_'));
});
$('.select-dates[start]').change(function() {
    let target = $(this).attr('target'),
        startDate = $(this).children("option:selected").val();
    updateNavigation({"startDate": startDate});
    action([navigation.page,'startDate',navigation.startDate].join('_').replace(/ /g,'_'));
    updateDatesPlot(target);
});
$('.select-dates[end]').change(function() {
    let target = $(this).attr('target'),
        endDate = $(this).children("option:selected").val();
    updateNavigation({"endDate": endDate});
    action([navigation.page,'endDate',navigation.endDate].join('_').replace(/ /g,'_'));
    updateDatesPlot(target);
});

// Graph Comparison -  actions
$('#logScaleSwitch2').change(function(){
    updateNavigation({"logScale2": navigation.logScale2 ? false : true});
    plots['compare_graph'].draw({
        "y": {
            "scale": navigation.logScale2 ? "scaleLog" : "scaleLinear",
            "tickFormat": Grapher.formatTick(navigation.logScale2, navigation.percPopulation2)
        }});
    action([navigation.page,'logScaleSwitch2',navigation.logScale2].join('_').replace(/ /g,'_'));
});
$('#percPopulation2').change(function() {
    updateNavigation({"percPopulation2": navigation.percPopulation2 ? false : true});
    plots['compare_graph'].draw({
        "y": {
            "name": navigation.percPopulation2 ? 'field_value_pop' : 'field_value',
            "tickFormat": Grapher.formatTick(navigation.logScale2, navigation.percPopulation2)
        }
    });
    action([navigation.page,'percPopulation2',navigation.percPopulation2].join('_').replace(/ /g,'_'));
});
$('#barSwitch2').change(function(){
    updateNavigation({"lines2": navigation.lines2 ? false : true});
    plots['compare_graph'].draw({"type": navigation.lines2 ? "line" : "bar"});
    action([navigation.page,'barSwitch2',navigation.lines2].join('_').replace(/ /g,'_'));
});
$('#startDate2').change(function() {
    updateNavigation({"startDate": $('#startDate2 option:selected').text()});
    plots['compare_graph'].draw({"data":getCompareData(_data.cases)});
    action([navigation.page,'startDate2',navigation.startDate].join('_').replace(/ /g,'_'));
});
$('#endDate2').change(function() {
    updateNavigation({"endDate": $('#endDate2 option:selected').text()});
    plots['compare_graph'].draw({"data":getCompareData(_data.cases)});
    action([navigation.page,'endDate2',navigation.endDate].join('_').replace(/ /g,'_'));
});
$("#movingAverageCompareRange").on('change mousemouve', function() {
    let ma = $(this).val();
    $('#movingAverageCompareValue').html(ma);
    updateNavigation({"maCompare": ma});
    plots['compare_graph'].draw({"data":getCompareData(_data.cases)});
});

// FT Graph
$('#logScaleSwitch3').change(function(){
    updateNavigation({"logScale3": navigation.logScale3 ? false : true});
    plots['ft_graph'].draw({
        "y": {
            "scale": navigation.logScale3 ? "scaleLog" : "scaleLinear",
            "tickFormat": Grapher.formatTick(navigation.logScale3, false)
        }});
    action([navigation.page,'logScaleSwitch3',navigation.logScale3].join('_').replace(/ /g,'_'));
});
$('#hideLegend').change(function(){
    updateNavigation({"hideLegend": navigation.hideLegend ? false : true});
    plots['ft_graph'].draw({"legend": {
        "show": !navigation.hideLegend
    }});
    action([navigation.page,'hideLegend',navigation.hideLegend].join('_').replace(/ /g,'_'));
});
$('#ft_add_country').change(function(){
    let c = $('#ft_add_country option:selected').text();
    if (countries.indexOf(c) > -1) {
        updateNavigation({"ft_countries":navigation.ft_countries.concat([c])});
        build_ft_countries();
        build_ft_countries_select();
        plots['ft_graph'].draw({"data": ftData(_data.cases),
                     "categories":navigation.ft_countries});
    }});
$('#ftCategory').change(function(){
    updateNavigation({"ft_category":$('#ftCategory option:selected').text()});
    plots['ft_graph'].draw({"data": ftData(_data.cases)});
});
$("#thresholdRange").on('change mousemouve', function() {
    let threshold = $(this).val();
    $('#thresholdValue').html(threshold);
    updateNavigation({"ft_threshold": threshold});
    plots['ft_graph'].draw({
        "data": ftData(_data.cases),
        "x": {
            "label": "Number of days since " + navigation.ft_threshold.toString() + ` ${navigation.ft_thresholdCategory} first recorded ->`
        }});
});
$('#ftThresholdCategory').change(function(){
    updateNavigation({"ft_thresholdCategory":$('#ftThresholdCategory option:selected').text()});
    plots['ft_graph'].draw({
        "data": ftData(_data.cases),
        "x": {
            "label": "Number of days since " + navigation.ft_threshold.toString() + ` ${navigation.ft_thresholdCategory} first recorded ->`
        }});

});
$("#movingAverageFTRange").on('change mousemouve', function() {
    let ma = $(this).val();
    $('#movingAverageFTValue').html(ma);
    updateNavigation({"ft_ma": ma});
    plots['ft_graph'].draw({
        "data": ftData(_data.cases)
    });
});

// Testing Graph
$('#testing_add_country').change(function(){
    let c = $('#testing_add_country option:selected').text();
    if (testing_countries.indexOf(c) > -1) {
        updateNavigation({"testing_countries":navigation.testing_countries.concat([c])});
        build_testing_countries();
        build_testing_countries_select();
        plots['testing_graph'].draw({"data": filterByDate(_data.testing, 'Entity', navigation.testing_countries),
                          "categories":navigation.testing_countries});
    }
});
$('#testingYAxis').change(function(){
    updateNavigation({"testing_yVar":$('#testingYAxis option:selected').text()});
    plots['testing_graph'].draw({
        "data": filterByDate(_data.testing, 'Entity', navigation.testing_countries),
        "y": {
            "name": navigation.testing_yVar,
            "parse": d => parseFloat(d),
            "tickFormat": d3.format(navigation.testing_yVar == 'Cumulative cases per test' ? '.2%' : '.3s')
        }
    });;
});



// Mobility
$('#barSwitch4').change(function(){
    updateNavigation({"lines4": navigation.lines4 ? false : true});
    plots['mobility_graph'].draw({"type": navigation.lines4 ? "line" : "bar"});
    action([navigation.page,'barSwitch4',navigation.lines4].join('_').replace(/ /g,'_'));
});
$('#hideLegendMobility').change(function(){
    updateNavigation({"hideLegendMobility": navigation.hideLegendMobility ? false : true});
    plots['mobility_graph'].draw({"legend": {
        "show": !navigation.hideLegendMobility
    }});
    action([navigation.page,'hideLegendMobility',navigation.hideLegendMobility].join('_').replace(/ /g,'_'));
});

// Hospitalization
$('#barSwitch5').change(function(){
    updateNavigation({"lines5": navigation.lines5 ? false : true});
    plots['hospitalization_graph'].draw({"type": navigation.lines5 ? "line" : "bar"});
    action([navigation.page,'barSwitch5',navigation.lines5].join('_').replace(/ /g,'_'));
});
$('#hospitalization_variables').change(function(){
    updateNavigation({
        "hospitalizationVariables":$('#hospitalization_variables option:selected')
            .map((i,e) => e.text)
            .toArray()
    });
    plots['hospitalization_graph'].draw(
        {"data": ma_json(filterByDate(_data.hospitalization,
                                      'Category',
                                      navigation.hospitalizationVariables),
                         ["value"],
                         navigation.maHospitalization
                        )
        });
});
$('#hideLegendHospitalization').change(function(){
    updateNavigation({"hideLegendHospitalization": navigation.hideLegendHospitalization ? false : true});
    plots['hospitalization_graph'].draw({"legend": {
        "show": !navigation.hideLegendHospitalization
    }});
    action([navigation.page,'hideLegendHospitalization',navigation.hideLegendHospitalization].join('_').replace(/ /g,'_'));
});
$("#movingAverageHospitalizationRange").on('change mousemouve', function() {
    let ma = $(this).val();
    $('#movingAverageHospitalizationValue').html(ma);
    updateNavigation({"maHospitalization": ma});
    plots['hospitalization_graph'].draw(
        {"data": ma_json(filterByDate(_data.hospitalization,
                                      'Category',
                                      navigation.hospitalizationVariables),
                         ["value"],
                         navigation.maHospitalization
                        )
        });
});
// ========================================================================== //


// Mobile menu
function menu(id) {
    let el = document.getElementById(id);
    if (window.getComputedStyle(el).display === "none") {
        el.style.display = "block";
    } else {
        el.style.display = "none";
    }
}

// Dark Mode
$('#darkmodeSwitch').on('click',function() {
    toggleDarkMode(!navigation.darkMode);
    action([navigation.page,'darkMode',navigation.darkMode].join('_').replace(/ /g,'_'));
});
$('#navSwitch').on('click',function() {
    updateNavigation({"hideNav": !navigation.hideNav});
    $('#navSwitch').addClass(navigation.hideNav ? "badge-secondary" : "badge-primary")
        .text(navigation.hideNav ? "OFF" : "ON")
        .removeClass(navigation.hideNav ? "badge-primary" : "badge-secondary");
    action([navigation.page,'hideNav',navigation.hideNav].join('_').replace(/ /g,'_'));
});
$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});

// Settings
$('#save_settings').click(function() {
    let $inputs = $('#form_settings :input');
    let custom_settings = [];
    // Remove existing rules
    for (const index of Object.keys(stylesheet.rules)) {
        stylesheet.deleteRule(0);
    }
    $inputs.each(function() {
        let name = $(this).attr('id').replace('_',' '),
            selector = $(this).attr('target'),
            attribute = $(this).attr('css'),
            value = $(this).val();
        $(selector).css(attribute, value);
        stylesheet.insertRule(`${selector} { ${attribute}: ${value}; }`, stylesheet.cssRules.length);
        custom_settings.push([name, selector, attribute, value]);
    });
    updateNavigation({"custom_settings": custom_settings});
});
