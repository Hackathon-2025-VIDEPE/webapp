import { fireEvent } from "./utils.js";

let eventMap = new Map();

export default function reimit(eventName) {
    if (eventMap.has(eventName)) {
        fireEvent(eventMap.get(eventName));
    }
}

document.addEventListener('getData', (event) => {
    eventMap.set('getData', event);
});

document.addEventListener('reemit', (event) => {
    if (eventMap.has(event.detail)) {
        fireEvent(eventMap.get(event.detail));
    }
});