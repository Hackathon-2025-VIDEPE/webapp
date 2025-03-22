import { toggleGroup } from "./helper.js";

export class MRIDisplay{
    constructor(idCanvas, niivue){
        this.niivue = niivue;

        // handle nv1: MRI + ESI
        const opts = {
            show3Dcrosshair: true,
            isColorbar: true,
            //isResizeCanvas: false,
            backColor: [0, 0, 0, 1],
            dragAndDropEnabled: false,
            isNearestInterpolation: true,
            //sliceType: niivue.SLICE_TYPE.RENDER,
            multiplanarLayout: niivue.MULTIPLANAR_TYPE.GRID,
            multiplanarShowRender: niivue.SHOW_RENDER.ALWAYS,
            isOrientCube: true,
            showLegend: false,
            meshXRay: .3,
        }

        this.currMethod = "eLORETA";
        this.volSize = 0;
        this.currValues = [];

        this.nv1 = new niivue.Niivue(opts);
	    this.nv1.attachTo(idCanvas);
    }

    async loadData(volumeList1){
        await this.nv1.loadVolumes(volumeList1);
        this.setupNiivue();
        let imageESI = this.getImgeESI();
        this.volSize = imageESI.dimsRAS[1]*imageESI.dimsRAS[2]*imageESI.dimsRAS[3]; // element [0] is not the first dimension size, it is 4, as in 4D volume ?!?
        this.currValues = this.orderCurrValues(0);
    }

    async loadESI(url) {
		const curr_crmap = this.nv1.volumes[1].colormap;
		this.nv1.volumes.pop(); //remove current 4D volume
		await this.nv1.addVolumeFromUrl(url);
		this.nv1.volumes[1].colormap = curr_crmap;
	}

    setupNiivue(){
        this.nv1.volumes[0].colorbarVisible = false;
        this.currentMax = this.nv1.volumes[1].global_max;
        this.nv1.volumes[1].cal_max = this.nv1.volumes[1].global_max;
        this.nv1.updateGLVolume();
        this.nv1.setRenderAzimuthElevation(90, 0);
        this.nv1.addLabel(this.currMethod, 
            { textScale: 1.0, textAlignment: this.niivue.LabelTextAlignment.RIGHT, textColor: [1.0, 1.0, 1.0, 1.0], backgroundColor: [0.2, 0.2, 0.2, 0.2] }, 
            undefined, this.niivue.LabelAnchorPoint.TOPRIGHT);
    }

    getImgeESI(){
        return this.nv1.volumes[1].valueOf();
    }

    orderCurrValues(currTimeIdx){
        let currValues = this.getImgeESI().img.slice(this.volSize*currTimeIdx, this.volSize*(currTimeIdx+1));
		currValues = currValues.filter((value) => { return !Number.isNaN(value) });
		//maxInd =  currValues.indexOf(Math.max(...currValues));
		// sorting is needed to define the % thresholding but is inefficient for finding the max, possible optimisation here
		currValues.sort((a, b) => b - a);
        return currValues;
    }

    getCurrentMax(){
        return this.nv1.volumes[1].global_max;
    }

    getCurrentValues(){
        return [...this.currValues];
    }

    applyPercThreshold(currentPerc){
		// if checked display the P% sources by adjusting the currentMin
		this.nv1.volumes[1].cal_min = Math.min(this.getCurrentValues().slice(0, currentPerc));
		this.nv1.updateGLVolume();
	}
}


/*
 *  ESI(, EEG)
 */
export class MRIDynamic{
    constructor(){

    }
    
}

/*
 *
 *  MRI, PET, SISCOM
 */
export class MRIStatic{
    constructor(mriDisplay){
        this.mriDisplay = mriDisplay;
        this.currentPerc = 1.0;

        this.minSlider = document.getElementById("MinSlider");
	    this.maxSlider = document.getElementById("MaxSlider");
        this.perc20Btn = document.getElementById('prec20Btn');
        this.perc10Btn = document.getElementById('prec10Btn');
        this.perc5Btn = document.getElementById('prec5Btn');
        this.perc1Btn = document.getElementById('prec1Btn');
        this.percThrBtn = document.getElementById('percThrCheck');
        // TODO : use addeventlistner
        this.perc20Btn.onclick = () => {
            this.currentPerc = 0.20;
            this.mriDisplay.applyPercThreshold(this.currentPerc);
        }
        this.perc10Btn.onclick = () => {
            this.currentPerc = 0.10;
            this.mriDisplay.applyPercThreshold(this.currentPerc);
        }
        this.perc5Btn.onclick = () => {
            this.currentPerc = 0.05;
            this.mriDisplay.applyPercThreshold(this.currentPerc);
        }
        this.perc1Btn.onclick = () => {
            this.currentPerc = 0.01;
            this.mriDisplay.applyPercThreshold(this.currentPerc);
        }

        this.percThrCheck.onclick = () => {
            // when checked disable min/max sliders  and enable percentage thresholding radio buttons
            // other wise do the opposite
            this.minSlider.disabled = !this.minSlider.disabled;
            this.maxSlider.disabled = !this.maxSlider.disabled;
            this.perc20Btn.disabled = !this.perc20Btn.disabled;
            this.perc10Btn.disabled = !this.perc10Btn.disabled;
            this.perc5Btn.disabled = !this.perc5Btn.disabled;
            this.perc1Btn.disabled = !this.perc1Btn.disabled;
            if (this.percThrCheck.checked){
                this.mriDisplay.applyPercThreshold(this.currentPerc)
            }else {
                this.minSlider.oninput();
                this.maxSlider.oninput();
            }
        }
    }
}