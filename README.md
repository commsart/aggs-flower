
<html lang="en">
  <head>
    <meta charset='utf-8'>
    <title>aggs-flower-kibana-plugin/README.md at master · commsart/aggs-flower</title>
  </head>

  <body >

	<p>Kibana visualisation plugin using d3 forced simulation</p>

	![Alt Text](https://github.com/commsart/aggs-flower/raw/master/pics/plug1.jpg)
	![Alt Text](https://github.com/commsart/aggs-flower/raw/master/pics/plug2.jpg)
	![Alt Text](https://github.com/commsart/aggs-flower/raw/master/pics/plug3.jpg)

	<p>The plugin use the d3 latest library (v4) and thus will require installing it to Kibana. 
	I have performed normal d3 installation in a separate folder and just moved it into d3v4 folder 
	(kibana-windows\node_modules\d3v4) and it worked fine. Will try to better understand node and require one day...</p>

	<p>Current version is using svg to render the graphics but I already have canvas version available. 
	Canvas version is a bit more mouse challenged and needs few more lines of code.</p>

	<p>While the plug has been released under GNU license, it has been inspired by the work that I do for 
	Newgen Systems http://www.newgensystems.com/ </p>

	<p>Please refer to TODO.txt for information what does not work and why and further opportunities.</p>

	<p>In theory the plugin should work with any aggregations although it has been limited to 2 layers only.
	My test request is below, please note that you might need to manually enter {"collect_mode": "breadth_first"} in the JSON Input 
	(advanced section) to reduce the returned set if you are using significant terms. The query looks for 8 significant terms for top 
	25 "tags"; in my case I used stackoverflow data.</p>

	<p>Sample data in the code contains example response.</p>

	<pre>
	{
	  "size": 0,
	  "query": {
		"query_string": {
		  "query": "*",
		  "analyze_wildcard": true
		}
	  },
	  "aggs": {
		"2": {
		  "terms": {
			"field": "tags",
			"size": 25,
			"order": {
			  "_count": "desc"
			},
			"collect_mode": "breadth_first"
		  },
		  "aggs": {
			"3": {
			  "significant_terms": {
				"field": "tags",
				"size": 8
			  }
			}
		  }
		}
	  }
	}
	</pre>

  </body>
</html>
