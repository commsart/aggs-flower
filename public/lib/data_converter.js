define(function (require) {

    // returns an Object of DCFactory type that has a constructor and functions
    // object has private variables initialised in teh constructor that must be called to do so
    return function DataConvertionFactory() {
        
        function DataConvertionHelper() {            
            var someVar1;
        };
        
        DataConvertionHelper.prototype.init = function(init) {
            this.someVar1 = init;
        };

        DataConvertionHelper.prototype.get = function() {
            return this.someVar1;
        };

        DataConvertionHelper.prototype.convertAggsToJson = function(json, newJson) {
            
            var children = json.aggregations[2].buckets;            
            var max_node = 40;
            var id = 0;
                        
            newJson.name = "center";
            newJson.size = 3;
            newJson.id = id++;
            newJson.sizeScale = 1;
            newJson.total = 1;
            newJson.maxSize = newJson.size;
                        
            var obk = Object.keys(children);    

            obk.forEach( function(key) {
                var child = {"name":"default","children":[],"size":1};
                if(children[key].hasOwnProperty('key')){
                    child.name = children[key].key;
                    if(children[key].hasOwnProperty('doc_count')){
                        child.size = 3; // setting the first agg to 3 otherwise it would always be the largest
                        //child.size = children[key].doc_count;
                        if (newJson.maxSize < child.size) newJson.maxSize = child.size;
                    }   else {
                        child.size = 1;
                    }
                    var sigb = Object.keys(children[key][3].buckets);

                    sigb.forEach( function(skey) {
                        var child2 = {"name":"default","size":1};
                        child2.name = children[key][3].buckets[skey].key;
                        child2.size = children[key][3].buckets[skey].doc_count;                
                        if (newJson.maxSize < child2.size) newJson.maxSize = child2.size;
                        child2.id = id++;
                        child.children.push(child2);
                        newJson.total++;
                    });
                    child.id = id++;
                    newJson.children.push(child);
                    newJson.total++;
                }
            });
            
            newJson.sizeScale = Math.min(max_node / newJson.maxSize, 1); // never magnify, only shrink...
            
        };                
        
        DataConvertionHelper.prototype.getChildren = function(json) {
            var children = [];
            if (json.language) return children;
            for (var key in json) {
              var child = { name: key };
              if (json[key].size) {
                // value node
                child.size = json[key].size;
                child.language = json[key].language;
              } else {
                // children node
                var childChildren = getChildren(json[key]);
                if (childChildren) child.children = childChildren;
              }
              children.push(child);
              delete json[key];
            }
            return children;
        };

        return new DataConvertionHelper();
    };
});