let regionsStatsCan_En = []; // English regions array
let themesStatsCan_En = []; // English themes array
let indicators_en = []; // stores StatsCan data payload
let searchquery;
let search = $("#searchForm");

// Lines 6 - 15 give functionality to the search history modal on loading
let sHistory = []
let storedHistory = JSON.parse(localStorage.getItem('searchHistory'))

if (storedHistory !== null) {
    sHistory = storedHistory
}

showSearchHistory()

// Saves queries to local storage
function saveQuery (query){
    sHistory.unshift(query)
    sHistory.splice(5)
    localStorage.setItem("searchHistory", JSON.stringify(sHistory))
}

//functionality for showing seach history
function showSearchHistory () {
    let sHistoryList = document.getElementById("sHistoryList")

    sHistoryList.innerHTML = sHistory
    .map(i => `<li>${i}</li>`)
    .join('');
};

// functionality for the advanced search modal
$('#aSearchButton').on('click', function(event){
    event.preventDefault();

    let query = {
        query: $('#queryInput').val(),
        gArea: $('#gArea').val(),
        theme: $('#theme').val()
    };

    // a submit in Advanced Search form passes on the dropdown contents to the dropdowns in the side navbar and re-displays the indicators
    $('#sidebar-select-region').val($('#gArea').val());
    $('#sidebar-select-theme').val($('#theme').val());
    $('.sidebar-content').html('');
    displayStatsCanHeadlines(indicators_en,'.sidebar-content');


    let aQuery = query.query + "+" + query.gArea + "+" + query.theme

    getNews(aQuery)
    saveQuery(aQuery)
    showSearchHistory()
});

// function for getting News from search query. Limit of 21 calls/hour
function getNews(query) {

    let options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': 'b8835ac7f4msh09512c251bb8c50p1f9a63jsnfcf8c28c6887',
            'X-RapidAPI-Host': 'free-news.p.rapidapi.com'
        }
    };

    fetch('https://free-news.p.rapidapi.com/v1/search?q=' + query + '&lang=en', options)
        .then(response => response.json())
        .then(function(data){

            displayNews(data);
        })
        
}

// function for building the news headline obtained from getNews
function displayNews(APInews) {
    let newsList = document.getElementById("articles-list");

    while (newsList.childElementCount > 0) {
        let remove = newsList.children[0];
        newsList.removeChild(remove);
    }
    for (i=0;i<APInews.articles.length;i++) {
        // Outer shell
        let newsOuterContainer = document.createElement("div");
        newsOuterContainer.classList.add("card", "col", "s12");
        // Inner Shell
        let newsBody = document.createElement("div");
        newsBody.classList.add("card-content");
        //Headline
        let headline = document.createElement("a");
        headline.setAttribute("target","_blank");
        headline.classList.add("headline-link", "black-text"); // Styling for headline links
        headline.setAttribute("href",APInews.articles[i].link);
        let headlineText = document.createElement("h5");
        headlineText.classList.add("black-text")
        headlineText.textContent=(APInews.articles[i].title);
        headline.append(headlineText);
        newsBody.append(headline);
        //Source
        let source = document.createElement("h6");
        source.textContent = (APInews.articles[i].clean_url);
        newsBody.append(source);
        //Text
        let textPreview = document.createElement("p");
        textPreview.textContent = (APInews.articles[i].summary);
        newsBody.append(textPreview);
        //Readmore
        let readMore = document.createElement("a");
        readMore.setAttribute("target","_blank");
        readMore.textContent = ("Read more here!");
        readMore.setAttribute("href",APInews.articles[i].link);
        newsBody.append(readMore)
        // Add element to news headlines
        newsOuterContainer.append(newsBody);
        newsList.append(newsOuterContainer);
    }
}

// Provides functionality to search bar
function thingy(e) {
    e.preventDefault();
    searchquery = $("#search").val();
    getNews(searchquery);
    saveQuery(searchquery);
    showSearchHistory();
}

search.on("submit", thingy)

let theme = {
        theme_id: 0,
        label: ""
};


// function takes in the themes string from payload and extracts and returns comma delimitted  theme labels
function extractStatsCanThemes(str) {
    let themeStr = str;
    themeStr = themeStr.split('**');
    themeStr[0]=themeStr[0].replace('*','');
    themeStr[themeStr.length-1]=themeStr[themeStr.length-1].replace('*','');
    str="";
    for (let i=0;i<themeStr.length;i++) {
        for (let j=0;j<themesStatsCan_En.length;j++) {
            if (themeStr[i]===themesStatsCan_En[j].theme_id) {
                if (i===themeStr.length-2) {
                    str=str+themesStatsCan_En[j].label;
                } else {
                    str=str+themesStatsCan_En[j].label + ', ';
                }
            }
        }
    }
    return str;
}

// Fetches the Stats Canada - The Daily news feeds by economic indicator. this data can be passed to display function using original payload object or it can be saved locally for further processing
function fetchStatsCanHeadlines() {

        fetch('https://statcan-economic-indicators-statcan-apicast-production.api.canada.ca/v1/ind-econ.json',{
            headers: {
            'user-key': '93edde87b4ffe28899e335bf9e8336ab'
            }
        })
              .then((response) => response.json())
              .then((data) => {
                

                for (let i=0;i<data.results.geo.length;i++) {
                    regionsStatsCan_En.push(data.results.geo[i].label.en); // extract the geographic locations array
                }
                themesStatsCan_En=data.results.themes_en; // extract the themes array 

                parseStatsCanIndicators(data); //parses the JSON file to extract payload to indicators_en array
                displayStatsCanHeadlines(indicators_en,'.sidebar-content'); //refresh the displayed indicators


              })
              .catch(console.error)
}

// extract the fetched JSON data into an object and populate to an array
function parseStatsCanIndicators(data) {
    let indicators = data.results.indicators;

    indicators.forEach(element => {

        let indicator = {
            category: "",
            title: "",
            region:"",
            date:"",
            period:"",
            amount:"",
            rate:"",
            arrow:"",
            dailyUrl:"",
            sourceID:"",
            themes: []
    }; 
    
        indicator.category=element.daily_title.en;
        indicator.title=element.title.en;
        indicator.region=regionsStatsCan_En[element.geo_code];
        indicator.date=element.refper.en;
        indicator.amount=element.value.en;
        indicator.dailyUrl='https://www.statcan.gc.ca/'+element.daily_url.en;
        indicator.sourceID=element.source;
        indicator.themes=extractStatsCanThemes(element.themes);
        if (element.growth_rate!=null) {
            indicator.period=element.growth_rate.details.en;
            indicator.rate=element.growth_rate.growth.en;
            if (element.growth_rate.arrow_direction==1) 
            {
                indicator.arrow='⬆';
            } else {
                indicator.arrow='⬇';
            }
            
        }
        indicators_en.push(indicator);
    });

}

// displays the StatsCan information based on input region/theme criteria to be obtained form user search UI at top of page
function displayStatsCanHeadlines(dataArr,displayElement) {


    let indicators = dataArr;
    let selectRegion = $('#sidebar-select-region').val();
    let selectTheme = $('#sidebar-select-theme').val();


    $(displayElement).innerHTML ='';  

    indicators.forEach(elem => {

        // get the dropdown values from the side navbar and only display data if it meets the filtering criteria

        if (elem.region===selectRegion && elem.themes.includes(selectTheme)) {
            let $colDiv = $('<div>').addClass("col s12 m1").attr('style',"padding: 0 10px 0 10px;");

            let $cardDiv = $('<div>').addClass("card horizontal");
            $($colDiv).append($cardDiv);

            let $cardstackedDiv = $('<div>').addClass("card-stacked");
            $cardDiv.append($cardstackedDiv);

            let $cardcontentDiv = $('<div>').addClass("card-content").attr('style',"padding: 10px; text-align: center;");
            $cardstackedDiv.append($cardcontentDiv);
            
            $cardTitle = $('<a>');
            $cardTitle.text(elem.region+' - '+elem.title);
            $cardTitle.attr('href',elem.dailyUrl);
            $cardTitle.attr('target',"_blank");
            $cardcontentDiv.append($cardTitle);

            $cardDate = $('<p>');
            $cardDate.text(elem.date);
            $cardcontentDiv.append($cardDate);

            $cardAmount = $('<p>');
            $cardAmount.text(elem.amount);
            $cardcontentDiv.append($cardAmount);

            $cardRate = $('<p>');
            $cardRate.text(elem.rate+' '+elem.arrow);
            $cardcontentDiv.append($cardRate);

            $cardPeriod = $('<p>');
            $cardPeriod.text(elem.period);
            $cardcontentDiv.append($cardPeriod);

            $cardSource = $('<a>');
            $cardSource.text('Data source:'+elem.sourceID);
            $cardSource.attr('href','https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid='+elem.sourceID+'01');
            $cardSource.attr('target',"_blank");
            $cardcontentDiv.append($cardSource);

            $(displayElement).append($colDiv);
        }
    });

}

// function tied to the even listener for Region dropdown change in the sidebar
function updateRegion(e) {
    e.preventDefault();
    $('.sidebar-content').html('');
    displayStatsCanHeadlines(indicators_en,'.sidebar-content');
}

// function tied to the even listener for Theme dropdown change in the sidebar
function updateTheme(e) {
    e.preventDefault();
    $('.sidebar-content').html('');
    displayStatsCanHeadlines(indicators_en,'.sidebar-content');
}

// Following are materialize js initializations
$(document).ready(function(){
    $('select').formSelect();
  });

$(document).ready(function() {
    $('input#input_text, textarea#textarea2').characterCounter();
});

$(document).ready(function(){
$('.modal').modal();
});

// Materialize CSS sidenav bar initialization
$(document).ready(function(){
    $('.sidenav').sidenav();
  });



// sidenav dropdown list change listeners for Region and Theme which re-display the indicators post change event
$('#sidebar-select-theme').on("click", () => {
    // if default value is changed
    $('#sidebar-select-theme').on("change", () => {
      // if value switched by client
      $('.sidebar-content').html('');  
      displayStatsCanHeadlines(indicators_en,'.sidebar-content');

      });
    });

 $('#sidebar-select-region').on("click", () => {
        // if default value is changed
        $('#sidebar-select-region').on("change", () => {
          // if value switched by client
          $('.sidebar-content').html('');  
          displayStatsCanHeadlines(indicators_en,'.sidebar-content');
          
          });
        });

// function initializes the StatsCan and newsearch api on page load        
function init() {
    $('#sidebar-select-region').val('Canada');
    $('#sidebar-select-theme').val('Employment and unemployment');
    fetchStatsCanHeadlines();
    getNews('business news')

}

init();
