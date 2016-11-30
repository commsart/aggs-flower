define(function (require) {

    // one Factory is created and used, even on second module load attempt
    return function visFactory() {
        
        // singleton visualisations of each type can be created (mini dashboards could be created)
        // if only one type can be instatiated, allow for only one vis handle to be stored and assigned
        var visFlower;
        var visOther;
        var d3 = require("d3v4");
        
        this.createVis = function(type, init) {
            
            if (type === "flower") {
                // singleton flower visualisation is created
                //if (visFlower === undefined) visFlower = new flower(init);
                visFlower = new flower(init);
                return visFlower;
            }
            else if (type === "other") {
                // singleton flower visualisation is created
                //if (visOther === undefined) visOther = new other(init);
                visOther = new other(init);
                return visOther;
            } else
                return undefined;
            
        };
        
        /*
         * main flower visualisation; contains rendiring part and all event functions
         */
        var flower = function (init) {
            
            // flower variables
            var vtype = "flower";
            var svgRoot = init;
            var newJson = {};
            var div, root, svg;
            var w = 300;
            var h = 300;
            var nodes, links, total, simulation, nodeSvg, linkSvg;
            var locParams;
            
            // functions
            this.updateDataAndParams = function(data, vis) {
                if (data && vis) {
                    newJson = data;
                    if (vis.params.vparams.auto)    {
                        locParams = vis.type.params.defaults.vparams; // reset to defaults if on auto
                    }   else
                        locParams = vis.params.vparams;
                };
            };
            
            this.render = function () {
                                
                // calculate the svg size
                w = parseInt(Math.sqrt(newJson.total) * locParams.fsize, 10);
                if (w < 300) w = 300;
                h = w;
                // form the staging data
                newJson.fixed = true;  // allows to reposition centre
                newJson.x = w/2; // position centre, x
                newJson.y = h/2; // position centre, y
                var sizeScale = newJson.sizeScale;
                //var logarithmic = newJson.log;  // not used; can be used to scale large nodes down
                // convert staging format to d3 nodes and links
                root = d3.hierarchy(newJson);
                nodes = flatten(root);
                links = root.links();
                // total number of nodes
                total = nodes.length || 1;
                // start drawing
                if (svg === undefined)  {
                    svg = d3.select(svgRoot).select("#svg1");
                    // cleanup up previous elements
                    svg.selectAll("rect").remove();
                    svg
                        .attr("width", w)
                        .attr("height", h)
                        .attr("style","display: block; margin: auto");
                        //.call(d3.zoom().scaleExtent([1 / 2, 8]).on("zoom", zoomed)) // activate zooming, currently does not work (even propagation!)
                          //  .attr("transform", "translate(0,0)");
                // draw a border
                    svg.append("svg:rect")
                        .style("stroke", "#003")
                        .style("fill", "#eef")
                        .style("fill-opacity", "0.0")
                        .attr("width", w)
                        .attr("height", h)
                        .on("click", rectClick);   // close node context meny, if any
                }   else {
                    svg.selectAll("text").remove();
                    svg
                        .attr("width", w)
                        .attr("height", h);
                    svg.select("rect")
                        .attr("width", w)
                        .attr("height", h)
                        .on("click", rectClick);   // close node context meny, if any
                }
                
                // display sample data text
                if (locParams.sample) {
                    svg.append("svg:text")
                        .attr("x", 10)
                        .attr("y", 10)
                        .attr("dy", "5px")
                        .text("Displaying sample data. Manage in Options.");
                }
                // define simulation forces and parameters
                simulation = d3.forceSimulation()
                    .velocityDecay(0.9) // huge effect on liveness of the animation. 0.9 slows that down really quick
                    .force("link", d3.forceLink().id(function(d) { return d.id; }))
                    .force(function() {return locParams.charge ? "charge" : "gravity";},
                            d3.forceManyBody().strength(locParams.fstrength))
                    .force("center", d3.forceCenter(w / 2, h / 2))
                    .on("tick", ticked);
                // assign nodes to simulation
                simulation.nodes(nodes);
                // assign links to simulation
                simulation.force("link").links(links);
                // start drawing
                svg.selectAll(".link").remove();
                linkSvg = svg.selectAll(".link").data(links);
                // Exit any old links.
                linkSvg.exit().remove();
                // Enter any new links
                linkSvg = linkSvg.enter().append("line")
                  .attr("class", "link")
                  .style("stroke", "#aab");
                // Update the nodes
                svg.selectAll(".node").remove();
                svg.selectAll(".nodesphere").remove();
                nodeSvg = svg.selectAll(".node").data(nodes);//, function(d) { return d.id; })
                //nodeSvg.exit().remove();
                // Enter any new nodes
                nodeSvg = nodeSvg.enter().append("g")       
                    .call(d3.drag()
                        .on("start", dragstarted)   // raise the node, restart simulation 
                        .on("drag", dragged)        // 
                        .on("end", dragended))      // 
                    .on("mouseover", mouseover) // show text
                    .on("mouseout", mouseout)   // hide text
                    .on("dblclick", dblclick)   // lower node
                    .on("contextmenu", contextmenu);    // right click menu

                // draw nodes
                nodeSvg.append("circle")
                    .attr("class", "node")
                    .classed("collapsed", function(d) { return d.data.collapsed ? true : false; }) // adds collapsed class, do not set collapsed in data!
                    .classed("filtered-shadow", function(d) { return d.data.size * sizeScale > 6 ? true : false;}) // classing and attr(class) sequence is important. shadow only above 6 size
                    .attr("r", function(d) { return d.data.collapsed ? 3 : Math.max(locParams.minNodeSize, d.data.size * sizeScale);})
                    .style("fill", function color(d) { return d.data.color = "hsl(" + (360/newJson.total)*d.data.id + ", " + locParams.hsld;}); // color is computed and evenly distributed between all nodes by id
                nodeSvg.append("circle")    // the sphere effect is added by a white smaller circle that is first offset here and then blurred in a filter
                    .attr("class", "nodesphere")
                    .classed("filtered-blur", true) // will be blured in filter by browser
                    .attr("r", function(d) { return d.data.collapsed ? 0 : d.data.size * sizeScale * 0.45;})   // reduce diameter
                    .attr("cx", function(d) { return -d.data.size * sizeScale * 0.3;})  // offset centre
                    .attr("cy", function(d) { return -d.data.size * sizeScale * 0.3;})  // offset centre
                    .style("fill", "#fff"); // white color     
                nodeSvg.append("circle")    // the sphere effect circle is added as white smaller circle
                    .attr("class", "nodesphere")
                    .attr("r", function(d) { return d.data.collapsed ? 0 : (d.data.size * sizeScale  > 15 ? d.data.size * sizeScale * d.data.size * sizeScale * 0.005 : 0);})   // reduce diameter
                    .attr("cx", function(d) { return -d.data.size * sizeScale * 0.4;})  // offset centre
                    .attr("cy", function(d) { return -d.data.size * sizeScale * 0.3;})  // offset centre
                    .style("fill", "#fff"); // white color
                // restart simulation
                simulation.alphaTarget(locParams.alphaTarget/100).restart();
                // add hidden text to each node
                nodeSvg.append("text")
                        .attr("dx", 12)
                        .attr("dy", 0)
                        .style("display", "none")
                        .text(function(d) { return d.data.name;});
                
            };// end of render()
              
            // converts staging format to the d3 nodes format
            flatten = function (root) {
              var nodes = [], i = 0;

              function recurse(node) {
                if (node.children) {
                  node.size = node.children.reduce(function(p, v) {
                    return p + recurse(v);
                  }, 0);
                }
                if (!node.id) node.id = ++i;
                nodes.push(node);
                return node.size;
              }

              root.size = recurse(root);
              return nodes;
            };

            // call every several ms to calculate new nodes position
            ticked = function(d) {
                nodeSvg // move nodes to new position and correct so they do not go beyond border
                    .attr("transform", function(d) { return "translate(" + Math.max(10, Math.min(w-10, d.x)) + ", " + Math.max(10, Math.min(h-10, d.y)) + ")"; });

                linkSvg // same with links
                    .attr("x1", function(d) { return Math.max(10, Math.min(w-10, d.source.x)); })
                    .attr("y1", function(d) { return Math.max(10, Math.min(h-10, d.source.y)); })
                    .attr("x2", function(d) { return Math.max(10, Math.min(w-10, d.target.x)); })
                    .attr("y2", function(d) { return Math.max(10, Math.min(h-10, d.target.y)); });
            };

            dragstarted = function (d) {
                if (!d3.event.active) simulation.alphaTarget(locParams.alphaTarget/100).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                d3.select(this).raise().classed("active", true);
            };

            dragged = function (d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            };

            dragended = function (d) {
                if (!d3.event.active) simulation.alphaTarget(locParams.alphaTarget/100);
                //d.fx = null;
                //d.fy = null;
                if (d.fixed === undefined) d.fixed = true;  // fix the node
                else {  // release the node
                    d.fixed = !d.fixed;
                    if (!d.fixed)    {
                        d.fx = null;
                        d.fy = null;
                        d.x = d3.event.x;
                        d.y = d3.event.y;
                    }
        }
            };

            // lowers the clicked node so we can see other nodes
            dblclick = function(d) {
                // suppose to close the tree leafs but it does not yet work
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                // lower the node and the rectangle (brings the node on top of the rect)
                d3.select(this).lower().classed("active", true);
                svg.selectAll("rect").lower(); // need to lower rect otherwise it is on top of the lowered node

            };
            
            // displays node text
            mouseover = function (d) {
                if (locParams.alltext)  {
                    svg.selectAll("text").style("display", "block");
                }   else {
                    d3.select(this).selectAll("text").style("display", "block");
                }
            };

            // hide node text
            mouseout = function (d) {
                d3.selectAll("text").style("display", "none");
                //d3.select(this).selectAll("text").style("display", "none");
            };
            
            rectClick = function(d)    {
                d3.selectAll(".context-menu").remove(); // close menu and other boxes
                d3.selectAll(".node-info").remove(); // close menu and other boxes
            };

            contextmenu = function(d) {
                var mOptions = ["Collapse Node", "Expand Node", "Node Information", "Hide Node - tbd"];

                // grab the g element for later
                var g = d3.select(this);
                var node = g.select(".node"); // selects first node
                var nodesphere = g.selectAll(".nodesphere");
                nodes.length;

                // create the div element that will hold the context menu
                d3.selectAll(".context-menu").data([1])
                    .enter()
                    .append("div")
                    .attr("class", "context-menu");
                d3.selectAll(".node-info").data([1])
                    .enter()
                    .append("div")
                    .attr("class", "node-info");
                d3.select(".node-info").style("display", "none"); // close node info on the next click
                // this gets executed when a contextmenu event occurs
                d3.selectAll(".context-menu")
                    .html("")
                    .append("ul")
                    .selectAll("li")
                        .data(mOptions).enter()
                        .append("li")
                    .on("click" , function(dd) {
                        var index = g._groups[0][0].__data__.index;
                        // process returned line item text
                        if (dd === mOptions[0])  {    // collapse                                
                            d3.select(".context-menu").style("display", "none"); // close menu                            
                            nodes[index].data.collapsed = true;
                            node.classed("collapsed", true);
                            nodesphere.classed("collapsed", true);
                        } else if (dd === mOptions[1])  {    // Fix/Release
                            d3.select(".context-menu").style("display", "none"); // close menu
                            nodes[index].data.collapsed = false;
                            node.classed("collapsed", false);
                            nodesphere.classed("collapsed", false);                    
                        } else if (dd === mOptions[2])  {    // info
                            d3.select(".context-menu").style("display", "none"); // close menu
                            var matrix = [
                                [ "name", nodes[index].data.name,  "color", nodes[index].data.color],
                                [ "size", nodes[index].data.size, "collapsed", nodes[index].data.collapsed]
                              ];

                            var tr = d3.selectAll(".node-info").data([1])
                                .html("")
                                .append("table")
                                .selectAll("tr")
                                .data(matrix)
                                .enter().append("tr");

                            var td = tr.selectAll("td")
                                .data(function(d) { return d; })
                                .enter().append("td")
                                .text(function(d) { return d; });

                            d3.select(".node-info")
                                .style("left", (d3.event.pageX - 2) + "px")
                                .style("top", (d3.event.pageY - 2) + "px")
                                .style("display", "block");                
                        } else if (dd === mOptions[3])  {    // Hide                                
                            d3.select(".context-menu").style("display", "none"); // close menu
                        }
                        return dd; 
                    })
                .text(function(dd) { return dd; }); // return selected line item text

                // show the context menu
                d3.select(".context-menu")
                  .style("left", (d3.event.pageX - 2) + "px")
                  .style("top", (d3.event.pageY - 2) + "px")
                  .style("display", "block");
                d3.event.preventDefault(); // disable default right click
            };

            finished = function (d) {
                // not used
            };

            cleanup = function () {
              simulation.stop(); // not used
            };

            zoomed = function () {
                svg.attr("transform", d3.event.transform); // currently does not work, i think event does not propagate that far
            };
            
            return this;
        };
        
        // currently does not work
        var other = function (init) {
            
            var vtype = "other";
            var svgRoot = init;
            
            this.render = function() {
                //
            };
            
            this.getType = function()   {
                return vtype;
            };
            
            return this;
        };
    };
});