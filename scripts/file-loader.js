import { fireEvent } from "./utils.js";

let importedData = {};
const fileReader = new FileReader();
const textDecoder = new TextDecoder('utf-8');

const canLoadNewFile = () => {
    if (importedData?.data?.length) {
        return confirm('You already have data loaded.\nImporting new data will replace them.\n')
    }
    return true;
}

export function initEvents(){
    btnVHDRFile.addEventListener('click', loadVHDRFile);
    btnEEGFile.addEventListener('click', loadEEGFile);
    btnSEFFile.addEventListener('click', loadSEFFile)
}

function loadVHDRFile() {
    if (canLoadNewFile()) {
        resetData();
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
            console.log(onChangeEvent.target.files)
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
        importedData.sampRate = 1e6 / Number(/SamplingInterval=(\d+)/.exec(fileData)[1]);
        importedData.orientation = /DataOrientation=(MULTIPLEXED|VECTORIZED)/.exec(fileData)[1];
        let match;
        const regex = /(Ch\d+)=(\w+),,/gm;
        importedData.channels = []
        while ((match = regex.exec(fileData)) !== null) {
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            importedData.channels = [...importedData.channels, match[2]];
        }
    }
}

function readEEGFile(file) {
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = function(event) {
        const arrayBuffer = event.target.result;
        // Convert binary data to Float32Array
        const float32Array = new Float32Array(arrayBuffer); 
        importedData.data = getEEGMatrix(float32Array, importedData.nChannels);
        console.log(importedData);
        fireEvent('getData', importedData);
    }
}

function getEEGMatrix(float32Array, nChannels) {
    const total_samples = float32Array.length;
        const t = total_samples / nChannels; // Infer timepoints
        let eegMatrix = new Array(nChannels).fill().map(() => new Array(t));
        for (let sampleIdx = 0; sampleIdx < t; sampleIdx++) {
            for (let channelIdx = 0; channelIdx < nChannels; channelIdx++) {
                eegMatrix[channelIdx][sampleIdx] = float32Array[sampleIdx * nChannels + channelIdx];
            }
        }
        return eegMatrix;
}

function readSEFFile(file) {
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = function(event) {
        resetData();
        importedData.orientation = 'MULTIPLEXED';
        const arrayBuffer = event.target.result;
        let bitIndex = 0;
       
        // version = 4 chars
        importedData.version = textDecoder.decode(new Uint8Array(arrayBuffer.slice(0,4)));
        
        bitIndex += 4;

        // ch, ch_aux, ntime, sr - 4 int32
        let tmp = new Int32Array(arrayBuffer.slice(bitIndex, bitIndex+12));
        importedData.nChannels = tmp[0];
        importedData.nAuxChannels = tmp[1];
        importedData.ntimeFrames = tmp[2];

        bitIndex += 12;

        // sr - 4 int32
        importedData.sampRate = new Float32Array(arrayBuffer.slice(bitIndex, bitIndex+4))[0];

        bitIndex += 4;

        // date YY,MM,dd,hh,mm,ss,ms - 7 int16
        tmp = new Int16Array(arrayBuffer.slice(bitIndex,14));
        importedData.date = {};
        importedData.date.year = tmp[0];
        importedData.date.month = tmp[1];
        importedData.date.day = tmp[2];
        importedData.date.hour = tmp[3];
        importedData.date.minute = tmp[4];
        importedData.date.sec = tmp[5];
        importedData.date.msec = tmp[6];
        
        bitIndex += 14;

        importedData.channels = [];
        for (var i = 0; i < importedData.nChannels; i++) {
            importedData.channels[i] = textDecoder.decode(new Int8Array(arrayBuffer.slice(bitIndex, bitIndex+8))).replaceAll('\u0000', '');
            bitIndex += 8;
        }

        importedData.data = getEEGMatrix(new Float32Array(arrayBuffer.slice(bitIndex)), importedData.nChannels);
        fireEvent('getData', importedData);
    };
}

function resetData() {
    importedData = {};
}