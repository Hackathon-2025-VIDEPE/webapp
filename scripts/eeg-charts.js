document.addEventListener('getData', (event) => {
    let instant_t = 125;
    console.log(event.detail.data)
    const time_length = event.detail.data[0].length;
    const eegMatrix = event.detail.data;
    const time = Array.from({ length: time_length }, (_, i) => i);
    const channelNames = event.detail.channels;
    const graphDiv = document.getElementById('eegPannel')
    const layout = {
        title: {
            text: 'EEG'
        },
        xaxis: {
            title: {
            text: 'Time [s]'
            },
            showgrid: false,
            zeroline: false,
        },
        yaxis: {
            title: {
            text: 'Channels'
            },
            tickvals: channelNames.map((_, i) => i * 10), // Map channel indices to positions
            ticktext: channelNames, // Display channel names on the y-axis
            showline: false,
        },
    };
    layout.showlegend = false;
    let data = eegMatrix.map((channelData, _index) => ({
        x: time,
        y: channelData,
        type: 'scatter',
        line: { color: 'black' }
    }));
    const red_line = [{
        x: instant_t,
        y: [0, 100],
        type: 'scatter',
        line: { color: 'red' }
    }];

    data.push({
        x: [instant_t, instant_t],
        y: [0, 100],
        type: 'scatter',
        line: { color: 'red'} 
    });
    Plotly.newPlot(graphDiv, data, layout);
});