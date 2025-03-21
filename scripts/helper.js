function toggleGroup(id) {
    let buttons = document.getElementsByClassName("viewBtn");
    let char0 = id.charAt(0);
    let char03 = id.slice(0,3);
    
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].id.charAt(0) !== char0) continue;
        if ((char03 === "!Ed" || char03 === "!Nd") && (buttons[i].id.slice(0,3) !== char03)) continue;
        buttons[i].classList.remove("dropdown-item-checked");
        if (buttons[i].id === id)
        buttons[i].classList.add("dropdown-item-checked");
    }
} // toggleGroup()

export { toggleGroup };