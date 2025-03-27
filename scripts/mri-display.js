import * as NIIVUE from './lib/niivue.0.46.0.js';



export class MRIDisplay{
    constructor(idCanvas){
        const nv1 = new NIIVUE.Niivue({
            dragAndDropEnabled: false,
			isOrientCube: true,
            //onLocationChange: handleIntensityChange
        });
        nv1.attachTo(idCanvas);
        nv1.setSliceType(nv1.sliceTypeMultiplanar);
        this.niivue = nv1;
        this.fileManager = new MRIFileManager(this.niivue, this);
        this.mriLayersOverlay = new MRILayersOverlay(this.niivue);
    }

    async loadFileIntoBuffer(f, bufferName) {

        //
        // DATA
        //
        const nv1 = this.niivue;
        console.log('Attempting to load file', f[0].name);
        // Get the selected option text from the dropdown
        let selectElement = document.getElementById('selectAddFile');
        let selectedOptionText = selectElement.options[selectElement.selectedIndex].text;
        // Load the new file into a Niivue-compatible buffer
        let loadedVolume = await nv1.loadFromFile(f[0]);
		
		this.setupAfterLoading(selectedOptionText);
    }
	
	async loadFileFromURL(URL, selectedOptionText='') {

        //
        // DATA
        //
        const nv1 = this.niivue;
        console.log('Attempting to load file from ', URL);
		const volumeList = [
		{
			url: URL,
			colormap: "gray",
			opacity: 1
		}];
		await nv1.addVolumesFromUrl(volumeList)
        this.setupAfterLoading(selectedOptionText);
    }
	
	setupAfterLoading(selectedOptionText){
		const nv1 = this.niivue;
		// Ensure volumes list exists
        if (!nv1.volumes) {
            nv1.volumes = [];
        }
        // **Limit to 10 volumes**
        if (nv1.volumes.length >= 10) {
            alert("You can only load up to 10 volumes.");
            return;
        }
        
        // get values and reordered them once, during the upload not when thresholding
        let currValues = this.orderCurrValues(nv1.volumes.length - 1);
        if (nv1.volumes.length === 1) {
            nv1.valuesList = [];
        }
        nv1.valuesList.push(currValues);

        //
        // UI
        //

        // **Update Niivue to render all volumes**
        //await nv1.updateGLVolume();
        //console.log("Current volumes:", nv1.volumes);
        // Create an opacity slider for this volume
        this.mriLayersOverlay.createOpacitySlider(nv1.volumes.length - 1, selectedOptionText); // Pass the index of the newly added volume
        this.mriLayersOverlay.createColorMapControl(nv1.volumes.length - 1, selectedOptionText); // Pass the index of the newly added volume
        this.mriLayersOverlay.createVisibilityControl(nv1.volumes.length - 1, selectedOptionText); // Pass the index of the newly added volume
        
        if (selectedOptionText === "PET" || selectedOptionText === "SPECT") {
            this.mriLayersOverlay.createthresholdslider(nv1.volumes.length - 1, selectedOptionText,false);
        }
        else {
            this.mriLayersOverlay.createthresholdslider(nv1.volumes.length - 1, selectedOptionText,true);
        }
	}
	
    orderCurrValues(volumeNumber){
        let currImage = this.niivue.volumes[volumeNumber].valueOf();
        let volSize = currImage.dimsRAS[1]*currImage.dimsRAS[2]*currImage.dimsRAS[3];
        let nDecimation = (volSize > 1e6) ?  Math.floor(volSize/1e6) : 1;
        let currValues = currImage.img.slice(0,volSize);
        // downsample the data for faster implementation of sorting and select only non NaN and non zero elements
        currValues = currValues.filter((value, id) => (id % nDecimation === 0) && (!Number.isNaN(value))  && (value !== 0));
        currValues = currValues.sort((a, b) => b-a);
        return currValues;
    }
}



class MRILayersOverlay{
    constructor(niivue){
        this.nv1 = niivue;
    }

    createthresholdslider(volumeIndex, selectedOptionText='',vis) {
        // Create the slider container
        let sliderContainer = document.createElement("div");
        // Create the label for the slider
        let label = document.createElement("label");
        label.hidden = vis;
        label.innerHTML = 'Threshold';
        // Create the slider element
        let slider = document.createElement("input");
        slider.type = "range";
        slider.min = 0;
        slider.max = 100;
        slider.step = 1;
        slider.hidden = vis;
        slider.value = 0; // Set the default opacity to 70%
        slider.classList.add("opacity-slider"); // Add class for styling
        // Create the input element for the opacity value display
        let threshValue = document.createElement("span");
        threshValue.innerHTML = "0%";
        threshValue.hidden = vis;
        // Append the elements to the slider container
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(threshValue);
        // Add event listener to update opacity value
        slider.oninput = (e) => {
            let thresh = e.target.value;
            threshValue.innerHTML = `${thresh}%`; // Update the displayed opacity value
            MRILayersOverlay.adjustThreshold(this.nv1, volumeIndex, thresh); // Adjust opacity of the specific volume
        };
        slider.dispatchEvent(new Event('input'))
        // Add the slider container to the dedicated dropdown menu
        let dropDwnCnt = document.getElementById(selectedOptionText + '_dropDownContent');
        dropDwnCnt.appendChild(sliderContainer);
    }

    // Function to adjust opacity using setOpacity method
    static adjustThreshold(nv1, volumeIndex, thresh) {
        let  currValues = nv1.valuesList[volumeIndex];
        thresh = Math.floor((100-thresh)/100*currValues.length);
        let cal_min = currValues[thresh-1];
        nv1.volumes[volumeIndex].cal_min = cal_min; 
        nv1.updateGLVolume(); // Update the visualization
    }

    // Function to create an opacity slider dynamically
    createOpacitySlider(volumeIndex, selectedOptionText='') {
        // Create the slider container
        let sliderContainer = document.createElement("div");
        // Create the label for the slider
        let label = document.createElement("label");
        label.innerHTML = 'Opacity ';
        // Create the slider element
        let slider = document.createElement("input");
        slider.type = "range";
        slider.min = 0;
        slider.max = 100;
        slider.value = 70; // Set the default opacity to 70%
        slider.classList.add("opacity-slider"); // Add class for styling
        // Create the input element for the opacity value display
        let opacityValue = document.createElement("span");
        opacityValue.innerHTML = "70%";
        // Append the elements to the slider container
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(opacityValue);
        // Add event listener to update opacity value
        slider.oninput = (e) => {
            let opacity = slider.value;
            opacityValue.innerHTML = `${opacity}%`; // Update the displayed opacity value
            MRILayersOverlay.adjustOpacity(this.nv1, volumeIndex, opacity); // Adjust opacity of the specific volume
        };
        // Add the slider container to the opacityControls div
        // opacityControls.appendChild(sliderContainer);
        // Add the slider container to the dropdown menu
        let dropDwnCnt = document.getElementById(selectedOptionText + '_dropDownContent');
        dropDwnCnt.appendChild(sliderContainer);
    }

    // Function to adjust opacity using setOpacity method
    static adjustOpacity(nv1, volumeIndex, opacityValue) {
        // Use the setOpacity function to adjust opacity of the specific volume
        nv1.setOpacity(volumeIndex, opacityValue / 100); // Convert to value between 0 and 1
        nv1.updateGLVolume(); // Update the visualization
    }

    // Function to create the colormap control dropdown dynamically
    createColorMapControl(volumeIndex, selectedOptionText='') {
        // Create the label to open the colormap dropdown
        let colorMapLabel = document.createElement("label");
        colorMapLabel.innerHTML = 'ColorMap '
        // Create the dropdown for colormap selection
        let colorMapDropdown = document.createElement("select");
        // List of predefined colormaps
        const colormaps = this.nv1.colormaps();
        // Add options for each colormap to the dropdown
        colormaps.forEach((colormap) => {
            let option = document.createElement("option");
            option.value = colormap;
            option.text = colormap;
            colorMapDropdown.appendChild(option);
        });
        // When an option is selected, update the colormap of the volume
        colorMapDropdown.onchange = (e) => {
            let selectedColormap = e.target.value;
            this.nv1.volumes[volumeIndex].colormap = selectedColormap; // Update the volume's colormap
            this.nv1.updateGLVolume(); // Refresh the volume render
        };
        if (selectedOptionText === 'MRI') {
            colorMapDropdown.value = 'gray';
        } else if (selectedOptionText === 'PET') {
            colorMapDropdown.value = 'jet';
        } else if (selectedOptionText === 'SPECT') {
            colorMapDropdown.value = 'hot';
        }
        colorMapDropdown.dispatchEvent(new Event('change')) // put out of the ifs so that it changes to gray for the MRI as well
        // Append the button and the dropdown to the dedicated dropdown menu
        let controlContainer = document.createElement("div");
        controlContainer.appendChild(colorMapLabel);
        controlContainer.appendChild(colorMapDropdown);
        //opacityControls.appendChild(controlContainer);
        let dropDwnCnt = document.getElementById(selectedOptionText + '_dropDownContent');
        dropDwnCnt.appendChild(controlContainer);
    }

    // Function to create the visibility control checkbox dynamically
    createVisibilityControl(volumeIndex, selectedOptionText='') {
        // Create a container for the visibility control
        let controlContainer = document.createElement("div");
        // Create the checkbox for visibility control
        let visibilityCheckbox = document.createElement("input");
        visibilityCheckbox.type = "checkbox";
        visibilityCheckbox.checked = true; // Default visibility is true
        // Create the label for the checkbox
        let visibilityLabel = document.createElement("label");
        visibilityLabel.innerHTML = 'Visibility';
        // When the checkbox is toggled, update the visibility of the volume
        let dropDwnCnt = document.getElementById(selectedOptionText + '_dropDownContent');
        visibilityCheckbox.onchange = (e) => {
            let visibility = visibilityCheckbox.checked;
            if (this.nv1.volumes[volumeIndex]) {
                if (visibilityCheckbox.checked === false) {
                    MRILayersOverlay.adjustOpacity(this.nv1, volumeIndex, 0); // Set opacity to 0 if volume is not visible
                    dropDwnCnt.childNodes[1].childNodes[1].disabled = true;
                    dropDwnCnt.childNodes[2].childNodes[0].disabled = true;
                } else {
                    dropDwnCnt.childNodes[1].childNodes[1].disabled = false;
                    dropDwnCnt.childNodes[2].childNodes[0].disabled = false;
                    MRILayersOverlay.adjustOpacity(this.nv1, volumeIndex, dropDwnCnt.childNodes[1].childNodes[1].value); // Set opacity to 70% if volume is visible
                }
                this.nv1.updateGLVolume(); // Refresh the volume rendering
            } else {
                console.warn(`Volume ${volumeIndex} not found`);
            }
        };
        // Append elements to the container
        controlContainer.appendChild(visibilityCheckbox);
        controlContainer.appendChild(visibilityLabel);
        // Add the control container to the dedicated dropdown menu
        if (dropDwnCnt) {
            dropDwnCnt.appendChild(controlContainer);
        } else {
            console.warn("dropDwnCnt div not found in the document.");
        }
    }
}



class MRIFileManager{
    constructor(niivue, mriDisplay){
        this.nv1 = niivue;
        this.mriDisplay = mriDisplay;

        const drop = document.getElementById('sliceType');
        const addfile = document.getElementById('selectAddFile');

        drop.onchange = (e) => {
            const st = parseInt(e.target.value);
            this.nv1.setSliceType(st);
        };

        addfile.onchange = (e) => {
            const input = document.createElement('input');
            input.style.display = 'none';
            input.type = 'file';
            input.accept = ".nii,.nii.gz";
            input.onchange = (event) => {
                const immethod = document.getElementById('selectAddFile').value;
                this.mriDisplay.loadFileIntoBuffer(event.target.files, immethod);
            };

            document.body.appendChild(input);
            input.click();
        };
    }
}
