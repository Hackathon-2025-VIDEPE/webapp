import { Niivue } from "./lib/niivue.0.46.0.js";

export class TopoDisplay {
	
	constructor(idCanvas) {

		const opts = {
				show3Dcrosshair: false,
				dragAndDropEnabled: false,
				isColorbar: true,
				showLegend: false,
				backColor: [0.9, 0.9, 1, 1],
				meshXRay: 0,
				isOrientCube: false,
		};
		//this.EEG_LAYOUT_DIR = "./EEG_layout_templates";
		this.nvTopo = new Niivue(opts);
		this.nvTopo.attachTo(idCanvas);
	}
  
	async loadEEGTopo(data) {
		let EEG_LAYOUT_DIR = document.location.origin;
		if (document.location.origin.includes('github.io')){// if run on git it webapp is missing from origin for some reason (to be improved)
			EEG_LAYOUT_DIR = EEG_LAYOUT_DIR +  "/webapp/EEG_layout_templates";
		} else {// if run locally
			EEG_LAYOUT_DIR = EEG_LAYOUT_DIR +  "/EEG_layout_templates";
		}
		const channelList = data.detail.channels;
		const eegMatrix = data.detail.data;
		const rangeMin = Math.min(...eegMatrix.map((chanData,i) => Math.min(...chanData)));
		const rangeMax = Math.max(...eegMatrix.map((chanData,i) => Math.max(...chanData)));
		const absRange = Math.max(Math.abs(rangeMin), rangeMax);
		let response = await fetch(EEG_LAYOUT_DIR + "/" + 'meshes_config.json', {});
		let meshesJsonConfig = await response.json();
		const nFiles = meshesJsonConfig.files.length;
		for (let idFile = 0; idFile < nFiles; idFile++){
			// read JSON of mesh files
			response = await fetch(EEG_LAYOUT_DIR + "/" + meshesJsonConfig.files[idFile], {});
			let currentMeshConfig = await response.json();
			let channelLabels = currentMeshConfig.labels;
			let sameChannels = channelList.length === channelLabels.length && channelList.every((value, index) => value === channelLabels[index]);
			// compare EEG channels from EEG data with EEG channels in JSON
			if ( sameChannels ) { // if EEG channels are the same in data and JSON 
				//console.log(channelLabels);
				//console.log(currentMeshConfig.file);
				const urlGifti = EEG_LAYOUT_DIR + '/' + currentMeshConfig.file;
				let meshLayersList = this.createMeshInfo(urlGifti);
				await this.nvTopo.loadMeshes([
					{
					  url: urlGifti,
					  layers: meshLayersList,
					}
				]);
				
				//let currTopo = Array.from({length: channelList.length}, () => Math.random() * 10);
				
				let currTopo = data.detail.data.map(chanData => chanData[125]);
				this.nvTopo.meshes[0].layers[0].values.set(currTopo,0);
				this.nvTopo.setMeshLayerProperty(this.nvTopo.meshes[0].id, 0, "frame4D", 0);
				this.nvTopo.setMeshShader(this.nvTopo.meshes[0].id, "Diffuse");
				this.nvTopo.setMeshLayerProperty(this.nvTopo.meshes[0].id, 0, "cal_max", absRange);
				this.nvTopo.setMeshLayerProperty(this.nvTopo.meshes[0].id, 0, "cal_min", -absRange);
				this.nvTopo.setRenderAzimuthElevation(0, 90);
				break
			}
		}
	}

	createMeshInfo(url){
		const meshInfo = [{
			  url: url,
			  colormap: "hot",
			  colormapNegative: "electric_blue",
			  cal_min: 0,
			  cal_max: 1,
			  useNegativeCmap: true,
			  opacity: 1,
		}];
		return meshInfo
	}
	
	timeUpdate(eegDataT){
		this.nvTopo.meshes[0].layers[0].values.set(eegDataT,0);
		this.nvTopo.setMeshLayerProperty(this.nvTopo.meshes[0].id, 0, "frame4D", 0);
	}
  
};