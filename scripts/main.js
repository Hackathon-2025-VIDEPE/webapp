import { toggleGroup } from "./helper.js";
import { convertTopo2EEG } from "./EEGConverter.js";
import { MRIDisplay, MRIStatic } from "./brainDisplay.js";

export default async function main (niivue) {
    
	var lmbdSlider = document.getElementById("lmbdSlider");
	var minSlider = document.getElementById("MinSlider");
	var maxSlider = document.getElementById("MaxSlider");
	var timeSlider = document.getElementById("timeSlider");
	const lmbdCount = 5;
	const lmbdValues = [0.00001, 0.001, 0.01, 0.05, 0.1];
	const timePoints = [0.2, 0.452, 0.48, 0.508, 0.7];
	var currTimeIdx = timeSlider.valueAsNumber;
	var currLambdaIdx = lmbdSlider.valueAsNumber;
	var currMethod = "eLORETA";
   
    // IRM
	var volumeList1 = [
		{
			url: "./data/sub-16_ses-preop_desc-brain_T1w.nii.gz",
			colormap: "gray",
			opacity: 1
		},
		{
			url: "./data/IED_source/sub-16_meth-" + currMethod.toLowerCase() + ".nii",
			colormap: "hot",
			opacity: .6,
			visible: true,
			frame4D: 0,
			cal_min: 0,
			cal_max: 1000,
		},
	];

    const mriDisplay = new MRIDisplay("gl1", niivue);
	const nv1 = mriDisplay.nv1;
	mriDisplay.loadData(volumeList1);

	const mriStatic = new MRIStatic(mriDisplay);

	async function onButtonClick(event) {
		if (event.target.id.charAt(0) === "|") {
			//sliceType
			if (event.target.id === "|Axial") nv1.setSliceType(nv1.sliceTypeAxial);
			if (event.target.id === "|Coronal")
				nv1.setSliceType(nv1.sliceTypeCoronal);
			if (event.target.id === "|Sagittal")
				nv1.setSliceType(nv1.sliceTypeSagittal);
			if (event.target.id === "|Render") nv1.setSliceType(nv1.sliceTypeRender);
			if (event.target.id === "|MultiPlanar") {
				nv1.opts.multiplanarShowRender = niivue.SHOW_RENDER.NEVER;
				nv1.setSliceType(nv1.sliceTypeMultiplanar);
			}
			if (event.target.id === "|MultiPlanarRender") {
				nv1.opts.multiplanarShowRender = niivue.SHOW_RENDER.ALWAYS;
				nv1.setSliceType(nv1.sliceTypeMultiplanar);
			}
			toggleGroup(event.target.id);
		} //sliceType
		else if (event.target.id === "Colorbar") {
		  nv1.opts.isColorbar = !nv1.opts.isColorbar;
		  event.srcElement.classList.toggle("dropdown-item-checked");
		  nv1.drawScene();
		}
		else if (event.target.id === "Radiological") {
		  nv1.opts.isRadiologicalConvention = !nv1.opts.isRadiologicalConvention;
		  event.srcElement.classList.toggle("dropdown-item-checked");
		  nv1.drawScene();
		}
		else if (event.target.id === "ClipPlane") {
		  if (nv1.scene.clipPlaneDepthAziElev[0] > 1)
			nv1.setClipPlane([0.3, 270, 0]);
		  else nv1.setClipPlane([2, 270, 0]);
		  nv1.drawScene();
		}
		else if (event.target.id.charAt(0) === "!") {
		  // set color scheme
		  nv1.volumes[1].colormap = event.target.id.substr(1);
		  //lmbdSlider.oninput();
		  toggleGroup(event.target.id);
		}
		else if (event.target.id.charAt(0) === "_") {
			currMethod = event.target.id.substr(1);
			if (currMethod == "DipoleFit"){
				nv1.setOpacity(1, 0);
				//disablingSliders(true); 
				for (let dipID=0; dipID<lmbdCount; dipID++){
					nv1.setMeshProperty(nv1.meshes[dipID].id, "visible", dipID === currTimeIdx) ;
				}
				let dPos = nv1.mm2frac([nv1.meshes[currTimeIdx].nodes[0].x, nv1.meshes[currTimeIdx].nodes[0].y, nv1.meshes[currTimeIdx].nodes[0].z]); // current position of the source, mm convert to frac
				nv1.scene.crosshairPos = dPos;
				nv1.createOnLocationChange()
				nv1.drawScene()
			} else {
				for (let dipID=0; dipID<lmbdCount; dipID++){ // make sure all dipoles are not visible
					nv1.setMeshProperty(nv1.meshes[dipID].id, "visible", false) ;
				}
				//if (percThrCheck.disabled) disablingSliders(false); // if percThrCheck.disable it means dipole fit was displayed otherwise do not bother(false);
				//const cal_min = nv1.volumes[1].cal_min;
				const fname = "./data/IED_source/sub-16_meth-" + currMethod.toLowerCase() + ".nii";
				volumeList1[1].url = fname;
				await mriDisplay.loadESI(volumeList1[1]);
				nv1.setOpacity(1, .6);
				nv1.document.labels[0].text = currMethod;
				//lmbdSlider.oninput()
			}
			toggleGroup(event.target.id);
		} else if (event.target.id.charAt(0) === "-") {
			if (event.target.id.substr(1) == "Authors"){
				alert("For this page, Dr Isotta Rigoni processed the data with Fieldtrip.\nThe webpage was written by Dr Nicolas Roehri, using Niivue and Plotly.");
			}
		}
	}
	
	timeSlider.oninput = async function () {
		currTimeIdx = this.valueAsNumber;
		let currSamp = Math.round(timePoints[currTimeIdx]*Fs);
		// nv2.setMeshLayerProperty(nv2.meshes[0].id, 0, "frame4D", currSamp);
		let currTopo = topoValues.slice(currSamp*nElec, (currSamp+1)*nElec)
		// nv2.setMeshLayerProperty(nv2.meshes[0].id, 0, "cal_max", Math.max(...currTopo.map(Math.abs)));
		layout.shapes[0].x0 = timePoints[currTimeIdx];
		layout.shapes[0].x1 = timePoints[currTimeIdx];
		Plotly.redraw('iedTrace');
		document.getElementById("timeString").innerHTML = timePoints[currTimeIdx] + 's';
		if (currMethod === "DipoleFit"){ // no need to change frame4D when "DipoleFit"
			for (let dipID=0; dipID<lmbdCount; dipID++){
				nv1.setMeshProperty(nv1.meshes[dipID].id, "visible", dipID === currTimeIdx) ;
			}
			let dPos = nv1.mm2frac([nv1.meshes[currTimeIdx].nodes[0].x, nv1.meshes[currTimeIdx].nodes[0].y, nv1.meshes[currTimeIdx].nodes[0].z]); // current position of the source, mm convert to frac
			nv1.scene.crosshairPos = dPos;
			nv1.createOnLocationChange()
			nv1.drawScene()
			return
		}
		//lmbdSlider.oninput();
	}

    minSlider.oninput = function () {
		nv1.volumes[1].cal_min = Math.min(0.001*this.value*mriDisplay.getCurrentMax(), .9999*nv1.volumes[1].cal_max);
		nv1.updateGLVolume();
	}; 
	maxSlider.oninput = function () {
		nv1.volumes[1].cal_max= Math.max(0.001*this.value*mriDisplay.getCurrentMax(), 1.00001*nv1.volumes[1].cal_min);
		nv1.updateGLVolume();
	}; 
	
   /* 
    // TODO : keep for later
	reset.onclick = function () {
		nv1.setDefaults(opts, true)
		nv1.volumes[0].colorbarVisible = false,
		nv1.volumes[1].colorbarVisible = true,
		currLambdaIdx = 0;
		minSlider.value = String(0);
		maxSlider.value = String(1000);
		minSlider.oninput();
		maxSlider.oninput();
		nv1.setRenderAzimuthElevation(-90-45, 0);
	}*/

	// preload the dipoles of the dipole fit
	/*
	const R = 15;
	let response = await fetch("./data/IED_source/sub-16_meth-dipole_fit.json", {});
	let dipoleFits = await response.json();
	let nDipoles = dipoleFits.x.length;
	for (let dipID=0; dipID<nDipoles; dipID++){
		let normMom = Math.sqrt(Math.pow(dipoleFits.nx[dipID], 2) + Math.pow(dipoleFits.ny[dipID], 2) + Math.pow(dipoleFits.nz[dipID], 2));
		var dipole = {
			name: "Dip" + dipID,
			nodeColormap: "Violet",
			nodeColormapNegative: "",
			nodeMinColor: 0,
			nodeMaxColor: 1,
			nodeScale: 1.5,
			edgeColormap: "Violet",
			edgeColormapNegative: "",
			edgeMin: 0,
			edgeMax: 2.5,
			edgeScale: 1.5,
			legendLineThickness: 0,
			nodes: [
			  {
				name: "source",
				x: dipoleFits.x[dipID],
				y: dipoleFits.y[dipID],
				z: dipoleFits.z[dipID],
				colorValue: 1,
				sizeValue: 5
			  },
			  {
				name: "target",
				x: dipoleFits.x[dipID]+R/normMom*dipoleFits.nx[dipID],
				y: dipoleFits.y[dipID]+R/normMom*dipoleFits.ny[dipID],
				z: dipoleFits.z[dipID]+R/normMom*dipoleFits.nz[dipID],
				colorValue: 1,
				sizeValue: 2.5
			  }
			],
			edges: [{
			  first: 0,
			  second: 1,
			  colorValue: 2.5
			}]
		};
		
		await nv1.addMesh(nv1.loadConnectomeAsMesh(dipole))
		nv1.setMeshProperty(nv1.meshes[dipID].id, "visible", false) ;
		nv1.meshes[dipID].colorbarVisible = false;
	}// load dipoles
	*/
	//document.getElementById("lmbdString").innerHTML = lmbdValues[currLambdaIdx];
	/*nv1.addLabel(currMethod, 
		{ textScale: 1.0, textAlignment: niivue.LabelTextAlignment.RIGHT, textColor: [1.0, 1.0, 1.0, 1.0], backgroundColor: [0.2, 0.2, 0.2, 0.2] }, 
		undefined, niivue.LabelAnchorPoint.TOPRIGHT);
	var globalMax = nv1.volumes[1].global_max;
	var currentMax = nv1.volumes[1].global_max;
	var imgESI = nv1.volumes[1].valueOf();
	*/
	/*
    var volSize = imgESI.dimsRAS[1]*imgESI.dimsRAS[2]*imgESI.dimsRAS[3]; // element [0] is not the first dimension size, it is 4, as in 4D volume ?!?
    */
	//var maxInd = 0;
	/*var currentPerc = Math.round(0.20*volSize);*/
	/*
	nv1.volumes[1].cal_max = currentMax;
	nv1.updateGLVolume()
	nv1.setRenderAzimuthElevation(90, 0);
	*/
	var buttons = document.getElementsByClassName("viewBtn");
	for (let i = 0; i < buttons.length; i++){
		buttons[i].addEventListener("click", onButtonClick, false);
	}
	//var currValues = imgESI.img.slice(volSize*(currLambdaIdx+lmbdCount*(currTimeIdx)),volSize*(currLambdaIdx+lmbdCount*(currTimeIdx)+1));
	/*function orderCurrValues(){
		currValues = imgESI.img.slice(volSize*(currLambdaIdx+lmbdCount*(currTimeIdx)),volSize*(currLambdaIdx+lmbdCount*(currTimeIdx)+1));
		currValues = currValues.filter(function (value) { return !Number.isNaN(value)});
		maxInd =  currValues.indexOf(Math.max(...currValues));
		// sorting is needed to define the % thresholding but is inefficient for finding the max, possible optimisation here
		currValues.sort((a, b) => b - a)
	}*/
	//lmbdSlider.oninput();
	// end handle nv1: MRI + ESI
	// init environement for topo plot nv2
	var nv2 = new niivue.Niivue({
    show3Dcrosshair: false,
	dragAndDropEnabled: false,
	isColorbar: true,
	showLegend: false,
    backColor: [0.9, 0.9, 1, 1],
	meshXRay: 0,
	isOrientCube: false,
  });
	nv2.attachTo("gl_topo");
	var meshLayersList = [
    {
      url: "./data/IED_source/sub-16_ses-preop_elecMesh2D.gii",
	  colormap: "hot",
	  colormapNegative: "electric_blue",
	  cal_min: 0,
      cal_max: 1,
      useNegativeCmap: true,
      opacity: 1,
    }
  ];
	await nv2.loadMeshes([
		{
		  url: "./data/IED_source/sub-16_ses-preop_elecMesh2D.gii",
		  layers: meshLayersList,
		}
	]);
	var eegLayout = {name: "eegLayout",
		nodeColormap: "warm",
		nodeColormapNegative: "",
		nodeMinColor: 0,
		nodeMaxColor: 1,
		nodeScale: 1, //scale factor for node, e.g. if 2 and a node has size 3, a 6mm ball is drawn
		edgeColormap: "",
		edgeColormapNegative: "",
		edgeMin: 0,
		edgeMax: 2.5,
		edgeScale: 1,
		legendLineThickness: 0,
		nodes: [],
		edges: []
		};
	nv2.setMeshShader(nv2.meshes[0].id, "Diffuse");
	var nElec = 204;
	var Fs = 250; // known sampling frequency
	var topoValues = nv2.meshes[0].layers[0].values
	let currSamp = Math.round(timePoints[currTimeIdx]*Fs);
	let currTopo = topoValues.slice(currSamp*nElec, (currSamp+1)*nElec)
	nv2.setMeshLayerProperty(nv2.meshes[0].id, 0, "frame4D", currSamp);
	nv2.setMeshLayerProperty(nv2.meshes[0].id, 0, "cal_max", Math.max(...currTopo.map(Math.abs)));
	//nv2.meshes[1].colorbarVisible = false;
	//nv2.meshes[0].layers[1].colorbarVisible = false;
	nv2.setRenderAzimuthElevation(0, 90);
	// convert mesh coordinates to connectome to display the EEG electrodes
	for (let idNode = 0; idNode<nElec; idNode++){
		let nodeCoord = nv2.meshes[0].pts.slice(idNode*3,(idNode+1)*3);
		let newNode = {
			name: "E"+ idNode,
			x: nodeCoord[0],
			y: nodeCoord[1],
			z: 0,
			colorValue: 1,
			sizeValue: 1
		}
		eegLayout.nodes.push(newNode)
	} // populate eegLayout
	nv2.addMesh(nv2.loadConnectomeAsMesh(eegLayout))
	
	var eegData = convertTopo2EEG();
	var layout = {
	  title: {
		text: 'IED'
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
	  hovermode: false,
	  showlegend: false,
	  shapes: [{
		type: 'line',
		x0: timePoints[currTimeIdx],
		y0: 0,
		x1: timePoints[currTimeIdx],
		yref: 'paper',
		y1: 1,
		line: {
		  color: 'red',
		  width: 5,
		  dash: 'dot'
		}
	  }]
	};
	var config = {responsive: true};
	Plotly.newPlot('iedTrace', eegData, layout, config);	
}