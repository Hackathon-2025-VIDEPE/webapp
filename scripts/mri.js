import * as niivue from "./niivue.0.46.0.js";

export default class MRIRenderer {

    constructor() {
        this.drop = document.getElementById('sliceType');
        this.immethod = "";
        this.addfile = document.getElementById('Add file');
        this.nv1 = new niivue.Niivue({
            dragAndDropEnabled: true,
            onLocationChange: this.handleIntensityChange
        });

        this.drop.onchange = () => {
            let st = parseInt(document.getElementById('sliceType').value);
            this.nv1.setSliceType(st);
        };

        this.addfile.onchange = () =>  {
            let input = document.createElement('input');
            input.style.display = 'none';
            input.type = 'file';
            input.accept = ".nii,.nii.gz";
            this.immethod = document.getElementById('Add file').value;
            document.body.appendChild(input);
            input.onchange = async (event) => await this.loadFileIntoBuffer(event.target.files, this.immethod);
            input.click();
        };
    }

    handleIntensityChange(data) {
        document.getElementById('intensity').innerHTML = '&nbsp;&nbsp;' + data.string;
        console.log(data);
    }
    
    async loadFileIntoBuffer(f, bufferName) {
        console.log('Attempting to load file', f[0].name);
        // Get the selected option text from the dropdown
        let selectElement = document.getElementById('Add file');
        let selectedOptionText = selectElement.options[selectElement.selectedIndex].text;
        // Load the new file into a Niivue-compatible buffer
        let loadedVolume = await this.nv1.loadFromFile(f[0]);
        // Ensure volumes list exists
        if (!this.nv1.volumes) {
            this.nv1.volumes = [];
        }
        // **Limit to 10 volumes**
        if (this.nv1.volumes.length >= 10) {
            alert("You can only load up to 10 volumes.");
            return;
        }
        // **Update Niivue to render all volumes**
        //await this.nv1.updateGLVolume();
        console.log("Current volumes:", this.nv1.volumes);
        // Create an opacity slider for this volume
        createOpacitySlider(this.nv1.volumes.length - 1, selectedOptionText); // Pass the index of the newly added volume
        createColorMapControl(this.nv1.volumes.length - 1, selectedOptionText); // Pass the index of the newly added volume
        createVisibilityControl(this.nv1.volumes.length - 1, selectedOptionText); // Pass the index of the newly added volume
        if (selectedOptionText === "PET" || selectedOptionText === "Spect") {
            createthresholdslider(this.nv1.volumes.length - 1, selectedOptionText,false);
        }
        else {
            createthresholdslider(this.nv1.volumes.length - 1, selectedOptionText,true);
        }
    }

    // Function to create an opacity slider dynamically
    createOpacitySlider(volumeIndex, selectedOptionText='') {
        // Create the slider container
        let sliderContainer = document.createElement("div");
        // Create the label for the slider
        let label = document.createElement("label");
        label.innerHTML = selectedOptionText + '_opacity';
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
        slider.oninput = function () {
            let opacity = slider.value;
            opacityValue.innerHTML = `${opacity}%`; // Update the displayed opacity value
            adjustOpacity(volumeIndex, opacity); // Adjust opacity of the specific volume
        };
        // Add the slider container to the opacityControls div
        opacityControls.appendChild(sliderContainer);
    }

    // Function to adjust opacity using setOpacity method
    adjustOpacity(volumeIndex, opacityValue) {
        // Use the setOpacity function to adjust opacity of the specific volume
        this.nv1.setOpacity(volumeIndex, opacityValue / 100); // Convert to value between 0 and 1
        this.nv1.updateGLVolume(); // Update the visualization
    }

    // Function to create the colormap control dropdown dynamically
    createColorMapControl(volumeIndex, selectedOptionText='') {
        // Create the button to open the colormap dropdown
        let colorMapButton = document.createElement("button");
        colorMapButton.innerHTML = selectedOptionText +  'ColorMap ';
        // Create the dropdown for colormap selection
        let colorMapDropdown = document.createElement("select");
        // List of predefined colormaps
        const colormaps = ['gray', 'hot', 'jet', 'cool', 'spring', 'summer', 'autumn', 'winter', 'parula'];
        // Add options for each colormap to the dropdown
        colormaps.forEach((colormap) => {
            let option = document.createElement("option");
            option.value = colormap;
            option.text = colormap;
            colorMapDropdown.appendChild(option);
        });
        // When an option is selected, update the colormap of the volume
        colorMapDropdown.onchange = function () {
            let selectedColormap = colorMapDropdown.value;
            this.nv1.volumes[volumeIndex].colormap = selectedColormap; // Update the volume's colormap
            this.nv1.updateGLVolume(); // Refresh the volume render
        };
        // Append the button and the dropdown to the opacityControls div
        let controlContainer = document.createElement("div");
        //controlContainer.appendChild(colorMapButton);
        controlContainer.appendChild(colorMapDropdown);
        opacityControls.appendChild(controlContainer);
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
        visibilityLabel.innerHTML = selectedOptionText +` Visibility`;
        // When the checkbox is toggled, update the visibility of the volume
        visibilityCheckbox.onchange = function () {
        let visibility = visibilityCheckbox.checked;
        if (this.nv1.volumes[volumeIndex]) {
            if (visibilityCheckbox.checked === false) {
                adjustOpacity(volumeIndex, 0); // Set opacity to 0 if volume is not visible
                opacityControls.childNodes[4*volumeIndex].childNodes[1].disabled = true;
                opacityControls.childNodes[4*volumeIndex+1].childNodes[0].disabled = true;
            } else {
                opacityControls.childNodes[4*volumeIndex].childNodes[1].disabled = false;
                opacityControls.childNodes[4*volumeIndex+1].childNodes[0].disabled = false;
                adjustOpacity(volumeIndex, opacityControls.childNodes[4*volumeIndex].childNodes[1].value); // Set opacity to 70% if volume is visible
            }
            this.nv1.updateGLVolume(); // Refresh the volume rendering
        } else {
            console.warn(`Volume ${volumeIndex} not found`);
        }
        };
        // Append elements to the container
        controlContainer.appendChild(visibilityCheckbox);
        controlContainer.appendChild(visibilityLabel);
        // Add the control container to the opacityControls div
        if (opacityControls) {
            opacityControls.appendChild(controlContainer);
        } else {
            console.warn("opacityControls div not found in the document.");
        }
    }
    createthresholdslider(volumeIndex, selectedOptionText='',vis) {
        // Create the slider container
        let sliderContainer = document.createElement("div");
        // Create the label for the slider
        let label = document.createElement("label");
        label.hidden = vis;
        label.innerHTML = selectedOptionText + '_threshold';
        // Create the slider element
        let slider = document.createElement("input");
        slider.type = "range";
        slider.min = this.nv1.volumes[volumeIndex].cal_min;
        slider.max = 1.01*this.nv1.volumes[volumeIndex].cal_max;
        slider.step = 0.01*(this.nv1.volumes[volumeIndex].cal_max-this.nv1.volumes[volumeIndex].cal_min);
        slider.hidden = vis;
        slider.value = this.nv1.volumes[volumeIndex].cal_min; // Set the default opacity to 70%
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
        slider.oninput = function () {
            let thresh = slider.value;
            threshValue.innerHTML = `${thresh}%`; // Update the displayed opacity value
            adjustThreshold(volumeIndex, thresh); // Adjust opacity of the specific volume
        };
        // Add the slider container to the opacityControls div
        opacityControls.appendChild(sliderContainer);
    }
    // Function to adjust opacity using setOpacity method
    adjustThreshold(volumeIndex, thresh) {
        this.nv1.volumes[volumeIndex].cal_min = thresh; 
        this.nv1.updateGLVolume(); // Update the visualization
    }
}