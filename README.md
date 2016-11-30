# Kibana forced simulation aggregation visualisation plugin

Kibana visualisation plugin using d3 forced simulation. Major purpose of this plugin was to provide tools for other plugin developments. 
This plugin therefore has some interesting features like context menu, filters, dynamic d3 behaviour, 3D effects, node repositioning, etc. while the query handling is pretty basic.
Functionality:
- double clicking moves a node to the background or up
- right click brings menu up - can collapse a node or display node information
- dragging node positions it it static location, you can release the node by another drag
- plugin options allow for display modifications (note - still working on behaviour, currently need to press play button next to options and query refresh button for changes to fire up)

![alt tag](https://github.com/commsart/aggs-flower/raw/master/pics/plug1.jpg)
![alt tag](https://github.com/commsart/aggs-flower/raw/master/pics/plug2.jpg)
![alt tag](https://github.com/commsart/aggs-flower/raw/master/pics/plug3.jpg)
![alt tag](https://github.com/commsart/aggs-flower/raw/master/pics/plug4.jpg)
![alt tag](https://youtu.be/st74y0_bdfc/0.jpg)](https://youtu.be/st74y0_bdfc "aggs-flower")

The plugin use the d3 latest library (v4) and thus will require installing it to Kibana. I have performed normal d3 installation in a separate folder and just moved it into d3v4 folder 
(kibana-windows\node_modules\d3v4) and it worked fine. Will try to better understand node and require one day...

The plugin will run in Kibana version 5 and previous. To make run in versions prior 5.0, in public\aggs-flower.js you need to change:
line 11: ...template_vis_type/template_vis_type'));  to   ...template_vis_type/TemplateVisType'));
line 12: ...require('ui/vis/schemas'));   to    ...require('ui/Vis/Schemas'));

Current version is using svg to render the graphics but I already have canvas version available. 
Canvas version is a bit more mouse challenged and needs few more lines of code.

While the plug has been released under GNU license, it has been inspired by the work that I do for Newgen Systems http://www.newgensystems.com/ </p>

Please refer to TODO.txt for information what does not work and why and further opportunities.

In theory the plugin should work with any aggregations although it has been limited to 2 layers only.
My test request is below, please note that you might need to manually enter {"collect_mode": "breadth_first"} in the JSON Input 
(advanced section) to reduce the returned set if you are using significant terms. The query looks for 8 significant terms for top 
25 "tags" in my case I used stackoverflow data.

Sample data in the code contains example response.

```
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
```
