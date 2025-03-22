
export function eegChartBinding(topoDisplay){
	
	document.addEventListener('getData', (event) => {
		
		//console.log(event.detail.data)
		const time_length = event.detail.data[0].length;
		const eegMatrix = event.detail.data;
		const sampRate = event.detail.sampRate;
		let instant_t = time_length/2;
		instant_t = instant_t/sampRate;
		const time = Array.from({ length: time_length }, (_, i) => i/sampRate);
		const channelNames = event.detail.channels;
		let graphDiv = document.getElementById('eegPannel')
		const layout = {
			title: {
				text: 'EEG'
			},
			xaxis: {
			  title: {
				text: 'Time [s]'
			  },
			  automargin: true,
			  tickfont: { size: 14}
		  },
		  yaxis: {
			  title: {
				text: 'Amplitude'
			  },
			  automargin: true,
			  tickfont: { size: 14}
		  },
		  hovermode: 'closest',
		  showlegend: false,
		  shapes: [{
			type: 'line',
			x0: instant_t,
			y0: 0,
			x1: instant_t,
			yref: 'paper',
			y1: 1,
			line: {
			  color: 'red',
			  width: 4,
			  dash: 'dot'
			}
		  }]
		};
		let data = eegMatrix.map((channelData, _index) => ({
			x: time,
			y: channelData,
			type: 'scatter',
			line: { color: 'black' }
		}));
		
		Plotly.newPlot(graphDiv, data, layout);
		graphDiv.on('plotly_click', function(click){
			console.log('coucou');
			let currTimeIdx = click.points[0].pointIndex;
			layout.shapes[0].x0 = time[currTimeIdx];
			layout.shapes[0].x1 = time[currTimeIdx];
			Plotly.redraw(graphDiv);
			let currentTopo = eegMatrix.map(chanData => chanData[currTimeIdx]);
			topoDisplay.timeUpdate(currentTopo);
		})
	});
}