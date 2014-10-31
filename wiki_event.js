// Helpers
var monthNames = [ "January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December" ];
function constructWikiTitle(d) {
	return monthNames[d.getMonth()] + '_' + d.getDate();
}
function addDays(date, days) {
	var result = new Date(date);
	result.setDate(date.getDate() + days);
	return result;
}

var fetchEvents = function(date, variance, callback) {
	// Construct Wikipedia article titles
	var titles = [];
	titles.push(constructWikiTitle(date));
	for ( var i = 1; i < variance+1; i++ ) {
		// 1 day variance means one day ahead, one day before
		titles.push(constructWikiTitle(addDays(date, i)));
		titles.push(constructWikiTitle(addDays(date, i*-1)));
	}

	// Build the Wikipedia query
	titles = titles.join('|');
	var wikiEndpoint = 'http://en.wikipedia.org/w/api.php';
	var url = wikiEndpoint + '?format=json&action=query&prop=revisions' + 
		'&rvprop=content&rvparse&rvsection=1&callback=?&titles=' + titles;

	// Retrieve and parse the data
	$.getJSON( url, function(data) {
		var result = [];
		var pages = data.query.pages;
		// The keys in the returned JSON are page IDs
		for (var pageId in pages) {
			if (pages.hasOwnProperty(pageId)) {
				var page = pages[pageId];
				var content = page.revisions[0]['*'];
				var element = $('<div>').html(content);
				var lines = element.children('ul').first().children('li');
				lines.each( function(index){
					var splitLine = $(this).text().split('–');
					var eventYear = splitLine[0].trim();
					if (date.getFullYear() == eventYear) { // need to convert to string in comparison
						var titleSplit = page.title.split(' ');
						var eventDate = new Date(eventYear, monthNames.indexOf(titleSplit[0]), titleSplit[1]);
						var eventDescription = splitLine.slice(1).join('–').trim();
						result.push({date:eventDate, description:eventDescription});
					}
				});
			}
		}
		result.sort(function(a,b){
			function dateDistance(element){
				return Math.abs(element.date - date);
			}
			if ( dateDistance(a) < dateDistance(b) ) return -1;
			if ( dateDistance(a) > dateDistance(b) ) return 1;
			return 0; // a must be equal to b
		});
		callback(result);
	});

};
