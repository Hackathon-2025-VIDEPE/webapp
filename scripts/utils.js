export const fireEvent = (eventName, data) => {
    if (!eventName?.length) {
        throw new Error('Event should have name !')
    }
    document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
}