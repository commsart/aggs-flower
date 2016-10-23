define(function (require) {
    require('ui/agg_table');
    require('ui/agg_table/agg_table_group');

    require('plugins/aggs-flower/aggs-flower.less');
    require('plugins/aggs-flower/aggs-flower-controller');

    require('ui/registry/vis_types').register(AggsFlowerProvider);

  function AggsFlowerProvider(Private) {
    var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
    var Schemas = Private(require('ui/Vis/Schemas'));

    return new TemplateVisType({
        name: 'aggs-flower',
        title: 'Aggs Flower',
        icon: 'fa-car',
        description: 'empty template',
        template: require('plugins/aggs-flower/aggs-flower.html'),
        params: {
            editor: require('plugins/aggs-flower/aggs-flower-params.html'), // Use this HTML as an options editor for this vis
            //scriptable: 'false',
            //filterFieldTypes: '',
            defaults: { // Set default values for paramters (that can be configured in the editor)
                    vparams: { // while accessing these in pages skip the .default. part. It is only used to initialise the $scope.variable
                        sample: true,  
                        auto: false,
                        fsize: 35,
                        charge: true,
                        fstrength: -6,
                        minNodeSize: 3,
                        alphaTarget: 50
                    }
            }
        },
        hierarchicalData: function (vis) {
          return Boolean(vis.params.showPartialRows || vis.params.showMetricsAtAllLevels);
        },
        schemas: new Schemas([
            {
                group: 'metrics',
                name: 'tagsize',
                title: 'Tagsize',
                min: 1,
                max: 1,
                aggFilter: ['count','avg','sum','min','max','cardinality','std_dev']
            }, {
                group: 'buckets',
                name: 'tags',
                title: 'Tags',
                min: 1,
                max: 3,
                aggFilter: ['significant_terms','terms']
            }
        ]),
      requiresSearch: true
    });
  }

  // export the provider so that the visType can be required with Private()
  return AggsFlowerProvider;
});
