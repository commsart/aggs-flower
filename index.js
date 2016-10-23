module.exports = function (kibana) {
  return new kibana.Plugin({
    name: 'aggs-flower',
    require: ['kibana', 'elasticsearch'],
    uiExports: {
      visTypes: [
        'plugins/aggs-flower/aggs-flower'
      ]
    }
  });
};