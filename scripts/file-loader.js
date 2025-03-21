let importedData = {};
const fileReader = new FileReader();
const textDecoder = new TextDecoder();

export function initEvents(){
    btnVHDRFile.addEventListener('click', loadVHDRFile);
    btnEEGFile.addEventListener('click', loadEEGFile);
    btnSEFFile.addEventListener('click', loadSEFFile)
}

export async function getData() {
    return importedData;
}

const canLoadNewFile = () => {
    if (importedData.data) {
        return confirm('You already have data loaded.\nImporting new data will replace them.\n')
    }
    return true;
}

function loadVHDRFile() {
    if (canLoadNewFile()) {
        const inputVHDR = document.createElement('input');
        inputVHDR.type = 'file';
        inputVHDR.accept = '.vhdr';
        inputVHDR.setAttribute('id', 'inputVHDR');

        inputVHDR.addEventListener('change', (onChangeEvent) => {
            const file = onChangeEvent.target.files[0];
            if (file) {
                readVHDRFile(file);
            }
        });

        inputVHDR.click();
    }
}

function loadEEGFile() {
    if (importedData.eegFileName && importedData.eegFileName !== '' && importedData.eegFileName.includes('.eeg')) {
        const inputEEG = document.createElement('input');
        inputEEG.type = 'file';
        inputEEG.accept = '.eeg';
        inputEEG.setAttribute('id', 'inputEEG');

        inputEEG.addEventListener('change', (onChangeEvent) => {
            const file = onChangeEvent.target.files[0];
            if (file) {
                readEEGFile(file);
            }
        });

        inputEEG.click();
    } else {
        alert('Please load vhdr file first');
    }
    
}

function loadSEFFile() {
    if (canLoadNewFile()) {
        const inputSEF = document.createElement('input');
        inputSEF.type = 'file';
        inputSEF.accept = '.sef';
        inputSEF.setAttribute('id', 'inputSEF');

        inputSEF.addEventListener('change', (onChangeEvent) => {
            const file = onChangeEvent.target.files[0];
            if (file) {
                readSEFFile(file);
            }
        });

        inputSEF.click();
    }
    
}

function readVHDRFile(file) {
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = function(event) {
        const fileData = textDecoder.decode(event.target.result);
        importedData.eegFileName = /DataFile=([^\r\n]*)/.exec(fileData)[1];
        importedData.nChannels = Number(/NumberOfChannels=(\d+)/.exec(fileData)[1]);
        importedData.samplRate = 1e6 / Number(/SamplingInterval=(\d+)/.exec(fileData)[1]);
        importedData.orientation = /DataOrientation=(MULTIPLEXED|VECTORIZED)/.exec(fileData)[1];
        let match;
        const regex = /(Ch\d+)=(\w+),,/gm;
        importedData.channels = []
        while ((match = regex.exec(fileData)) !== null) {
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            importedData.channels = [...importedData.channels, { id: match[1], name: match[2]}];
        }
    }
}

function readEEGFile(file) {
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = function(event) {
        const arrayBuffer = event.target.result;
        const float32Array = new Float32Array(arrayBuffer); // Convert binary data to Float32Array
        const total_samples = float32Array.length;
        const t = total_samples / importedData.nChannels; // Infer timepoints
        let eegMatrix = new Array(importedData.nChannels).fill().map(() => new Array(t));
        for (let sampleIdx = 0; sampleIdx < t; sampleIdx++) {
            for (let channelIdx = 0; channelIdx < importedData.nChannels; channelIdx++) {
                eegMatrix[channelIdx][sampleIdx] = float32Array[sampleIdx * importedData.nChannels + channelIdx];
            }
        }
        console.log(eegMatrix)
    }
}

function readSEFFile(file) {
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = function(event) {
        let arrayBuffer = event.target.result;

        let res = {};
        let beg = 0;

        // version = 4 chars
        res.version = textDecoder.decode(new Uint8Array(arrayBuffer.slice(0,4)));
        
        beg += 4;

        // ch, ch_aux, ntime, sr - 4 int32
        let tmp2 = new Int32Array(arrayBuffer.slice(beg,beg+12));
        res.nChannels = tmp2[0];
        res.nAuxChannels = tmp2[1];
        res.ntimeFrames = tmp2[2];

        beg += 12;

        // sr - 4 int32
        res.sampRate = new Float32Array(arrayBuffer.slice(beg,beg+4))[0];

        beg += 4;

        // date YY,MM,dd,hh,mm,ss,ms - 7 int16
        let tmp3 = new Int16Array(arrayBuffer.slice(beg,14));
        console.log(arrayBuffer.slice(beg,14))
        res.year = tmp3[0];
        res.month = tmp3[1];
        res.day = tmp3[2];
        res.hour = tmp3[3];
        res.minute = tmp3[4];
        res.sec = tmp3[5];
        res.msec = tmp3[6];
        
        beg += 14;

        res.channelsName = [];
        for (var i = 0; i < res.nChannels; i++) {
            res.channelsName[i] = new Int8Array(arrayBuffer.slice(beg,beg+8));
            beg += 8;
        }

        res.data = new Float32Array(arrayBuffer.slice(beg));
        if (res.nChannels && res.sampRate && res.channelsName && res.data) {
            importedData.eegFileName = null; 
            importedData.nChannels = res.nChannels;
            importedData.sampRate = res.sampRate;
            importedData.orientation = 'MULTIPLEXED';
            importedData.channels = res.channelsName;
            importedData.data = res.data;
        }
    };
}
