const PREFIX = "evan-duration-sorter_";
const SECTION_BUTTON_ID = PREFIX + "section-button_";
const ORDER_ATTRIBUTE = PREFIX + "order";
// TODO: Rename to queries
// TODO: Don't match list view
const QUERIES = Object.freeze({
    "SECTIONS_NODE": "#contents",
    "SECTIONS": "ytd-item-section-renderer",
    "VIDEOS": "#items",
    "ID": "#video-title",
    "HEADER": "#title",
    "BUTTON": "#top-level-buttons > ytd-button-renderer.style-scope.ytd-menu-renderer.style-opacity.size-default"
});
const OrderEnum = Object.freeze({
    "ORIGINAL": 0,
    "DESCENDING": 1,
    "ASCENDING": 2
});
// TODO: Rename
const ButtonName = Object.freeze(
    Object.fromEntries(
        Object.entries(
            OrderEnum
        ).map(
            ([k,v]) => [v, k]
        )
    )
);
const ButtonSVG = testButtonSVG();
const DEFAULT_ORDER = OrderEnum.ORIGINAL;
const BASE_BUTTON = document.querySelector(QUERIES.BUTTON).cloneNode(true);
const videoIdToUploadOrder = new Map();

// process section
//  make map of video ordering
//  add button to section
// on sort
//  determine sorting method
//  rearrange items

function main() {
    // process initial sections
    const sections = document.getElementsByTagName(QUERIES.SECTIONS);
    Array.from(sections).forEach(processSection);

    // process loaded sections
    const observer = new MutationObserver(handleMutations);
    const sectionsNode = document.querySelector(QUERIES.SECTIONS_NODE);
    observer.observe(sectionsNode, {childList: true});
}

// TODO: make SVG's shorter by adding whitespace on the right to balance
function testButtonSVG() {
    return {
        0: `<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet"  pointer-events="none"><path d="M14.279 2.28c1.314 0 2.569.262 3.716.737a9.72 9.72 0 0 1 3.158 2.11 9.77 9.77 0 0 1 2.11 3.155c.475 1.147.737 2.402.737 3.716s-.262 2.569-.737 3.716a9.72 9.72 0 0 1-2.11 3.158 9.77 9.77 0 0 1-3.155 2.11c-1.147.475-2.402.737-3.716.737s-2.569-.262-3.716-.737a9.72 9.72 0 0 1-3.158-2.11 9.75 9.75 0 0 1-2.11-3.158c-.475-1.147-.737-2.402-.737-3.716s.262-2.569.737-3.716a9.72 9.72 0 0 1 2.11-3.158 9.77 9.77 0 0 1 3.155-2.11 9.74 9.74 0 0 1 3.716-.734zm-.728 5.656a.85.85 0 0 1 .25-.601h0a.85.85 0 0 1 .604-.25.85.85 0 0 1 .854.854v4.546l3.426 2.035a.83.83 0 0 1 .361.503c.052.21.028.438-.086.635l-.006.009c-.006.012-.012.022-.022.031a.84.84 0 0 1-.5.358c-.21.052-.438.028-.635-.086l-3.8-2.248a.88.88 0 0 1-.324-.305c-.08-.13-.126-.281-.126-.441h0l.003-5.039zm6.396-1.607c-.74-.74-1.622-1.335-2.6-1.739-.944-.392-1.98-.604-3.069-.604a8.04 8.04 0 0 0-3.069.604c-.978.404-1.86.999-2.6 1.739s-1.335 1.622-1.739 2.6c-.392.944-.604 1.98-.604 3.069a8.04 8.04 0 0 0 .604 3.069c.404.978.999 1.86 1.739 2.6s1.622 1.335 2.6 1.739c.944.392 1.98.604 3.069.604a8.04 8.04 0 0 0 3.069-.604c.978-.404 1.86-.999 2.6-1.739 1.453-1.453 2.347-3.454 2.347-5.669a8.04 8.04 0 0 0-.604-3.069 8.06 8.06 0 0 0-1.743-2.6z"/></svg>`,
        1: `<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet"  pointer-events="none"><path d="M14.281 2.28c1.314 0 2.57.262 3.717.736 1.189.492 2.26 1.215 3.156 2.111h0a9.7 9.7 0 0 1 2.109 3.158c.475 1.146.736 2.402.736 3.715s-.262 2.57-.736 3.717c-.492 1.189-1.215 2.26-2.111 3.156h0a9.7 9.7 0 0 1-3.158 2.109c-1.146.475-2.402.736-3.715.736s-2.57-.262-3.717-.736c-1.189-.492-2.26-1.215-3.154-2.109l-.002-.002c-.896-.896-1.617-1.967-2.109-3.154a9.87 9.87 0 0 1-.391-1.137l.619.029a6.49 6.49 0 0 0 1.16-.104l.205.555c.404.977.998 1.855 1.736 2.594s1.619 1.332 2.594 1.736c.939.389 1.973.605 3.059.605s2.117-.215 3.059-.605c.977-.404 1.855-.998 2.594-1.736s1.332-1.619 1.736-2.594c.389-.939.605-1.973.605-3.059s-.215-2.117-.605-3.059c-.404-.977-.998-1.855-1.736-2.594s-1.619-1.332-2.594-1.736c-.939-.389-1.973-.605-3.059-.605s-2.117.215-3.059.605l-.25.109a6.49 6.49 0 0 0-1.15-1.357l.742-.346a9.65 9.65 0 0 1 3.719-.74h0zm-9.012.516a5.27 5.27 0 0 1 5.27 5.27 5.27 5.27 0 0 1-5.27 5.27A5.27 5.27 0 0 1 0 8.065a5.27 5.27 0 0 1 5.27-5.27h0zm0 8.291l2.828-3.496H6.342V5.731H4.197v1.859H2.441l2.828 3.496zm7.897-3.707c0-.238.098-.453.252-.609s.371-.252.609-.252.453.096.609.252.252.371.252.609v4.535l3.389 2.01c.203.121.34.314.395.527s.029.447-.092.65v.002c-.121.203-.314.34-.527.395s-.447.029-.65-.092H17.4l-3.791-2.25a.87.87 0 0 1-.316-.303.86.86 0 0 1-.127-.449V7.38z"/></svg>`,
        2: `<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" pointer-events="none"><path d="M5.27 2.796a5.27 5.27 0 0 1 5.27 5.27 5.27 5.27 0 0 1-5.27 5.27A5.27 5.27 0 0 1 0 8.065a5.27 5.27 0 0 1 5.27-5.27h0zm9.012-.516c1.314 0 2.57.262 3.717.736 1.189.492 2.26 1.215 3.156 2.111h0a9.7 9.7 0 0 1 2.109 3.158c.475 1.146.736 2.402.736 3.715s-.262 2.57-.736 3.717c-.492 1.189-1.215 2.26-2.111 3.156h0a9.7 9.7 0 0 1-3.158 2.109c-1.146.475-2.402.736-3.715.736s-2.57-.262-3.717-.736c-1.189-.492-2.26-1.215-3.154-2.109l-.002-.002c-.896-.896-1.617-1.967-2.109-3.154a9.87 9.87 0 0 1-.391-1.137l.619.029a6.49 6.49 0 0 0 1.16-.104l.205.555c.404.977.998 1.855 1.736 2.594s1.619 1.332 2.594 1.736c.939.389 1.973.605 3.059.605s2.117-.215 3.059-.605c.977-.404 1.855-.998 2.594-1.736s1.332-1.619 1.736-2.594c.389-.939.605-1.973.605-3.059s-.215-2.117-.605-3.059c-.404-.977-.998-1.855-1.736-2.594s-1.619-1.332-2.594-1.736c-.939-.389-1.973-.605-3.059-.605s-2.117.215-3.059.605l-.25.109a6.49 6.49 0 0 0-1.15-1.357l.742-.346a9.65 9.65 0 0 1 3.719-.74h0zm-1.115 5.1c0-.238.098-.453.252-.609s.371-.252.609-.252.453.096.609.252.252.371.252.609v4.535l3.389 2.01c.203.121.34.314.395.527s.029.447-.092.65v.002c-.121.203-.314.34-.527.395s-.447.029-.65-.092H17.4l-3.791-2.248a.87.87 0 0 1-.316-.303.86.86 0 0 1-.127-.449V7.38zM5.27 4.96l2.828 3.496H6.342v1.859H4.197V8.456H2.441L5.27 4.96z" fill-rule="evenodd"/></svg>`
    }
}

function createButtonSVGEnum() {
    let object = {};
    for (const [key, name] of Object.entries(ButtonName)) {
        console.log(`${key}: ${name}`);
        fetch(`images/${name.lower}.svg`)
            .then(response => response.text())
            .then(text => object[key] = text);
    }
    return Object.freeze(object);
}

function processSection(section) {
    const videos = getVideos(section);
    for (let i = 0; i < videos.length; i++) {
        // store video upload ordering
        let video = videos[i];
        let id = getVideoId(video);
        videoIdToUploadOrder.set(id, i);
    }
    createSectionButton(section);
}

function handleMutations(mutations, _) {
    Array.from(mutations)
        .filter(
            m => m.type === "childList" && m.addedNodes.length
        ).forEach(
            m => Array.from(m.addedNodes)
                .filter(
                    node => node.tagName.toLowerCase() === QUERIES.SECTIONS
                ).forEach(
                   processSection
                )
        );
}

function getVideos(section) {
    return section.querySelector(QUERIES.VIDEOS).children;
}

function getVideoId(video) {
    const title = video.querySelector(QUERIES.ID);
    const url = title.href;
    const id = url.split("=")[1];
    return id;
}

function createSectionButton(section) {
    const sectionHeader = section.querySelector(QUERIES.HEADER).parentNode;
    const buttonId = generateSectionButtonId(section);

    // only add if doesnt have it already
    if (sectionHeader.querySelector("#" + buttonId) == null) {

        let button = document.createElement("div");
        button.appendChild(BASE_BUTTON.cloneNode(false));
        button.setAttribute("id", buttonId);
        button.setAttribute(ORDER_ATTRIBUTE, DEFAULT_ORDER);

        addSectionButton(button, sectionHeader);

        button.addEventListener("click", sortButtonClicked);
    }
}

function addSectionButton(button, section) {
    section.appendChild(button);
    updateButtonOrder(button, DEFAULT_ORDER);
}

function updateButtonOrder(button, order) {
    tooltip = ButtonName[order][0].toUpperCase() + ButtonName[order].slice(1).toLowerCase();
    // TODO: put into queries
    ytButton = button.querySelector("ytd-button-renderer");
    // TODO: remove innerHTML/hardcode
    ytButton.innerHTML = `
        <a class="yt-simple-endpoint style-scope ytd-button-renderer" tabindex="-1">
            <yt-icon-button id="button" class="style-scope ytd-button-renderer style-opacity size-default">
                <yt-icon class="style-scope ytd-button-renderer">
                </yt-icon>
            </yt-icon-button>
            <tp-yt-paper-tooltip class="style-scope ytd-button-renderer" role="tooltip" tabindex="-1" style="inset: 118px auto auto 764.93px;">
                placeholder
            </tp-yt-paper-tooltip>
        </a>
    `;
    // wait?
    setTimeout(
            function() {
                button.querySelector("yt-icon").innerHTML = ButtonSVG[order];
                button.querySelector("#tooltip").innerText = tooltip;
            },
            50
    );
}

function generateSectionButtonId(section) {
    const sectionIndex = getChildNodeIndex(section);
    return SECTION_BUTTON_ID + sectionIndex;
}

function getChildNodeIndex(childNode) {
    const parentNode = childNode.parentNode;
    return Array.prototype.indexOf.call(parentNode.children, childNode);
}

function sortButtonClicked(event) {
    const button = event.currentTarget;

    const currentOrder = button.getAttribute(ORDER_ATTRIBUTE);
    const nextOrder = (currentOrder + 1) % Object.keys(OrderEnum).length;
    button.setAttribute(ORDER_ATTRIBUTE, nextOrder);

    updateButtonOrder(button, nextOrder);

    const section = button.closest("#contents > ytd-item-section-renderer");
    sortSection(section, nextOrder);
}

function sortSection(section, method = OrderEnum.DESCENDING) {
    const sectionVideosNode = section.querySelector("#items");
    const videoArray = Array.prototype.slice.call(sectionVideosNode.children);
    videoArray.sort(
        videoSortingFunction(method)
    ).forEach(
        // TODO: point free
        video => sectionVideosNode.appendChild(video)
    );
}

function videoSortingFunction(method) {
    // TODO: turn into object
    switch (method) {
        case OrderEnum.ORIGINAL:
            return comparisonSorter(getVideoUploadOrder);
        case OrderEnum.ASCENDING:
            return comparisonSorter(getVideoDurationInSeconds);
        case OrderEnum.DESCENDING:
            return comparisonSorter(getVideoDurationInSeconds, true)
        default:
            throw new Error(`Unknown sorting method: "${method}"`);
    }
}

function comparisonSorter(f, reverse = false) {
    // TODO: online
    return function(a, b) {
        if (reverse) {
            return - f(a) + f(b);
        } else {
            return f(a) - f(b);
        }
    }
}

function getVideoUploadOrder(video) {
    const id = getVideoId(video);
    const order = videoIdToUploadOrder.get(id);
    return order;
}

function getVideoDurationInSeconds(video) {
    const timeString = getVideoTimeString(video);
    return datetimeToSeconds(timeString);
}

function getVideoTimeString(video) {
    // return string is either in the format [[[h]h]h:][m]m:ss, or non existent for streams.
    const timeNode = video.querySelector("#overlays > ytd-thumbnail-overlay-time-status-renderer > span");
    return timeNode ? timeNode.innerText : "LIVE NOW";
}

function datetimeToSeconds(timeString) {
    // timeString is expected to be in the format [[[h]h]h:][m]m:ss
    const SECONDS_IN_A_MINUTE = 60;
    const MINUTES_IN_AN_HOUR = 60;
    const SECONDS_IN_AN_HOUR = MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE;

    // TODO: check for LIVE NOW and PREMIERE separately
    const timeList = timeString.split(":");
    let hours, minutes, seconds;
    switch (timeList.length) {
        case 3:
            hours = parseInt(timeList.shift());
            break;
        case 2:
            hours = 0;
            break;
        case 1:
            console.log(`Couldn't parse timeString: "${timeString}"`);
            return -1;
        default:
            throw new Error(`Unknown timeString format: "${timeString}"`);
    }
    minutes = parseInt(timeList.shift());
    seconds = parseInt(timeList.shift());

    const totalSeconds = (
        hours * SECONDS_IN_AN_HOUR
        + minutes * SECONDS_IN_A_MINUTE
        + seconds
    );
    return totalSeconds;
}

main();
