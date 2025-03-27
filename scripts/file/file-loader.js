import { fireEvent } from "../utils.js";

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
    resetData();
    btnEEGsFile.addEventListener('click', loadEEGFiles);
}

function loadEEGFiles() {
    if (importedData.fileName?.includes('.vhdr')) {
        const inputOtherEEG = document.createElement('input');
        inputOtherEEG.type = 'file';
        inputOtherEEG.accept = '.sef,.eeg';

        inputOtherEEG.addEventListener('change', (onChangeEvent) => {
            const file = onChangeEvent.target.files[0];
            if (file) {
                if (file.name.includes('.sef')){
                    resetData()
                    readSEFfromFile(file);
                } else if (file.name.includes(('.eeg'))){
                    readEEGFile(file);
                } else {
                    throw new Error("EEG file format not supported")
                }
            }
        });
        inputOtherEEG.click();
    } else if (canLoadNewFile()) {
        resetData();
        const inputEEGs = document.createElement('input');
        inputEEGs.type = 'file';
        inputEEGs.accept = '.sef,.vhdr';

        inputEEGs.addEventListener('change', (onChangeEvent) => {
            const file = onChangeEvent.target.files[0];
            if (file) {
                if (file.name.includes('.sef')){
                    readSEFfromFile(file);
                } else if (file.name.includes(('.vhdr'))){
                    readVHDRfromFile(file);
                } else {
                    throw new Error("EEG file format not supported")
                }
                
            }
        });

        inputEEGs.click();
    }
}

function readSEFfromFile(file) {
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = function(event) {
        importedData.fileName = file.name;
		importedData.eegFileName = file.name;
		const arrayBuffer = event.target.result;
		readSEF(arrayBuffer)
    };
}

export async function readSEFfromURL(url){
	const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
	const arrayBuffer = await response.arrayBuffer();
	importedData.fileName = url;
	importedData.eegFileName = url;
	readSEF(arrayBuffer);
}

function readSEF(arrayBuffer){
	importedData.orientation = 'MULTIPLEXED';
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
	fireEvent('loadSEFFile', true);
	fireEvent('showContent', true);
	fireEvent('getData', importedData);
}

function readVHDRfromFile(file) {
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = function(event) {
        const fileData = textDecoder.decode(event.target.result);
		readVHDR(fileData, file.name);
		loadEEGfromFile();
        
    }
}

export async function readVHDRfromURL(url) {
	const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const fileContent = await response.text();
	readVHDR(fileContent, url);
	url = url.replace('.vhdr', '.eeg');
	loadEEGfromURL(url);
}

function readVHDR(fileData, filename) {
	importedData.fileName = filename;
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
	fireEvent('loadVHDRFile', true)
}

function loadEEGfromFile() {
    const inputEEG = document.createElement('input');
    inputEEG.type = 'file';
    inputEEG.accept = '.eeg';
    inputEEG.setAttribute('id', 'inputEEG');

    inputEEG.addEventListener('change', (onChangeEvent) => {
        const file = onChangeEvent.target.files[0];
        if (file) {
            fileReader.readAsArrayBuffer(file);
			fileReader.onload = function(event) {
				importedData.fileName = file.name;
				const arrayBuffer = event.target.result;
				readEEGFile(arrayBuffer);
			}
		}
	});

    inputEEG.click();
}

async function loadEEGfromURL(url){
	// Fetch the file from the URL
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`HTTP error! Status: ${response.status}`);
	}
	importedData.fileName = url;
	// Get the file as an ArrayBuffer
	const arrayBuffer = await response.arrayBuffer();
	readEEGFile(arrayBuffer);
}

function readEEGFile(arrayBuffer) {
	// Convert binary data to Float32Array
	const float32Array = new Float32Array(arrayBuffer); 
	importedData.data = getEEGMatrix(float32Array, importedData.nChannels);
	fireEvent('loadEEGFile', true);
	fireEvent('showContent', true);
	fireEvent('getData', importedData);
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

function resetData() {
    importedData = {};
    fireEvent('loadVHDRFile', false);
    fireEvent('loadEEGFile', false);
    fireEvent('loadSEFFile', false);
}