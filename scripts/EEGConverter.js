// end of init environement for topo plot nv2
// init the plot of the EEG traces
export function convertTopo2EEG(){
    let nSamples = topoValues.length/nElec;
    // create time vector
    let timeVec = Array.from({length: nSamples}, (_, i) => (i + 1)/Fs);
    // init data by pre-allocating ys as vector of zeros
    var data = [];
    // important because data are multiplex
    for (let i = 0; i < nElec; i++) {
        let dummyLine = {x:timeVec, y:Array(nSamples).fill(0), mode: "lines", line: {color: 'rgb(0,0,0)'}}; 
        data.push(dummyLine);
    }
    for (let sampId = 0; sampId < nSamples; sampId++) {
        let currTopo = topoValues.slice(sampId*nElec, (sampId+1)*nElec)
        for (let elId = 0; elId < nElec; elId++) {
            data[elId].y[sampId] = currTopo[elId]
        }
    }
    return data
}