var quartilePlot = {
  'initialize': function() {
    // Don't do anything if the query is invalid
      var query = DA.query.getQuery();
      if (Object.keys(query.fields).length === 0) {
        d3.select('#__da-app-content')
        .html('<h1>Just add data!</h1><p>Add data in your widget settings to start making magic happen.</p>');
        javascriptAbort();  // Garbage meaningless function to get the widget to stop processing
      }
      else if (Object.keys(query.fields.dimension).length != 1 ||
               Object.keys(query.fields.metric).length != 1) {
        d3.select('#__da-app-content')
        .html('<h1>Invalid data selection.</h1><p>Select only one dimension and one measurement.</p>');
        javascriptAbort();  // Garbage meaningless function to get the widget to stop processing
      }
    
    // Store the query result
      var queryResult = DA.query.getQueryResult();
    
    // Check there are enough rows in the response
      if (queryResult.rows.length < 10) {
        d3.select('#__da-app-content')
        .html('<h1>Not enough data.</h1><p>The data for this widget should have at least 10 rows.</p>');
        javascriptAbort();  // Garbage meaningless function to get the widget to stop processing
      }
    
    // Create the document structure
      var svg = d3.select('#__da-app-content').append('svg')
        .attr('width', '100%')
        .attr('height', '6em');
      
      var tooltip = d3.select('#__da-app-content').append('div')
        .attr('id', 'tooltip')
        .style('display', 'none');
    
    // Define useful functions and variables
      function getQuantile(data, quantile) {
         data.sort((a, b) => a[1].value - b[1].value);
         return data[Math.floor((data.length - 1) * quantile)];
      }
    
      var yBase = 4.5;
      var yMid = 3.875;
      var min = d3.min(queryResult.rows.map(x => x[1].value));
      var max = d3.max(queryResult.rows.map(x => x[1].value));
    
      var pointsOfInterest = [
        getQuantile(queryResult.rows, 0),
        getQuantile(queryResult.rows, 0.25),
        getQuantile(queryResult.rows, 0.5),
        getQuantile(queryResult.rows, 0.75),
        getQuantile(queryResult.rows, 1),
      ];
    
    // Draw the points
      var pointsG = svg.append('g')
        .attr('transform', 'scale(0.95 1)')
        .attr('transform-origin', '50% 50%');
    
      var points = pointsG.selectAll('line')
      .data(queryResult.rows)
      .join('line')
        .attr('class', d => {
          if (pointsOfInterest.indexOf(d) !== -1) {
            return 'boxLine';
          }
          else {
            return 'contextLine';
          }
        })
        .attr('x1', d => (d[1].value - min) / (max - min) * 100 + '%')
        .attr('y1', d => {
          var thisX = (d[1].value - min) / (max - min);
          if (thisX < (getQuantile(queryResult.rows, 0.25)[1].value - min) / (max - min) ||
              thisX > (getQuantile(queryResult.rows, 0.75)[1].value - min) / (max - min)) {
            return yBase + 'em';
          }
          else {
            return yMid + 'em';
          }
        })
        .attr('x2', d => (d[1].value - min) / (max - min) * 100 + '%')
        .attr('y2', d => {
          var thisX = (d[1].value - min) / (max - min);
          if (thisX < (getQuantile(queryResult.rows, 0.25)[1].value - min) / (max - min) ||
              thisX > (getQuantile(queryResult.rows, 0.75)[1].value - min) / (max - min)) {
            return yBase + 1 + 'em';
          }
          else {
            return yMid + 2.5 + 'em';
          }
        })
        .on('mouseenter', function(d) {
          var box = this.getBoundingClientRect();
          var widgetBox = d3.select('#__da-app-content').node().getBoundingClientRect();
          
          tooltip
          .style('display', 'initial')
          .selectAll('div')
          .data([
            [queryResult.fields[0].name + ': ', d[0].formattedValue],
            [queryResult.fields[1].name + ': ', d[1].formattedValue]
          ])
          .join('div')
            .selectAll('span')
            .data(d => d)
            .join('span')
              .attr('class', (d, i) => { if (i === 0) { return 'tooltipLabel'; } else { return 'tooltipValue'; } })
              .text(d => d);
          
          var tooltipBox = tooltip.node().getBoundingClientRect();
          
          tooltip
          .style('left', () => {
            if (box.left + tooltipBox.width / 2 > widgetBox.width / 2) {
              return box.left - tooltipBox.width - 12.5 + 'px';
            }
            else {
              return box.left + 12.5 + 'px';
            }
          })
          .style('top', box.top + 'px');
        })
        .on('mouseleave', function() {
          tooltip.style('display', 'none');
        });
    
    // Draw the labels
      var labelText = ['Min', 'Quar', 'Med', 'Quar', 'Max'];
      points.filter(d => pointsOfInterest.indexOf(d) !== -1).each(function(d) {
        var box = this.getBoundingClientRect();
        var widgetBox = d3.select('#__da-app-content').node().getBoundingClientRect();
        
        d3.select('#__da-app-content').append('div')
          .attr('class', 'plotText plotValue')
          .style('left', box.left / widgetBox.width * 100 + '%')
          .style('top', box.top + box.height + 'px')
          .text(d[1].formattedValue);
        
        d3.select('#__da-app-content').append('div')
          .attr('class', 'plotText plotLabel')
          .style('left', box.left / widgetBox.width * 100 + '%')
          .style('top', box.top + 'px')
          .text(labelText[pointsOfInterest.indexOf(d)]);
      });
  }
};