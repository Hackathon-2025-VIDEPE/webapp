export const fireEvent = (eventName, data) => {
    document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
}