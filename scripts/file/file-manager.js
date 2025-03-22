document.addEventListener('loadVHDRFile', (event) => {
    updateFileStatus('VHDR', event.detail);
})

document.addEventListener('loadEEGFile', (event) => {
    updateFileStatus('EEG', event.detail);
})

document.addEventListener('loadSEFFile', (event) => {
    updateFileStatus('SEF', event.detail);
})

function updateFileStatus(type, status) {
    const element = document.getElementById(type+'Status');
    element.classList.add('uploaded')
    element.innerHTML = (status) ? ' (UPLOADED)': '';
}