const PREFIX = "evan-duration-sorter_";
const SECTION_BUTTON_ID = PREFIX + "section-button_";
const ORDER_ATTRIBUTE = PREFIX + "order";
const QUERIES = Object.freeze({
    "SECTIONS_NODE": "#contents",
    "SECTIONS": "ytd-item-section-renderer",
    "VIDEOS": "#items",
    "ID": "#video-title",
    "HEADER": "#title"
});
const OrderEnum = Object.freeze({
    "ORIGINAL": 0,
    "DESCENDING": 1,
    "ASCENDING": 2
});
const ButtonText = Object.freeze({
    [OrderEnum.ORIGINAL]: "🕒",
    [OrderEnum.DESCENDING]: "⬇️",
    [OrderEnum.ASCENDING]: "⬆️"
});
const DEFAULT_ORDER = OrderEnum.ORIGINAL;
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

function processSection(section) {
    const videos = getVideos(section);
    for (let i = 0; i < videos.length; i++) {
        // store video upload ordering
        let video = videos[i];
        let id = getVideoId(video);
        videoIdToUploadOrder.set(id, i);
    }
    addSectionButton(section);
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

function addSectionButton(section) {
    const sectionHeader = section.querySelector(QUERIES.HEADER);
    const buttonId = generateSectionButtonId(section);

    // only add if doesnt have it already
    if (sectionHeader.querySelector("#" + buttonId) == null) {

        let button = document.createElement("button");
        button.setAttribute("id", buttonId);
        button.setAttribute(ORDER_ATTRIBUTE, DEFAULT_ORDER);
        button.innerText = ButtonText[DEFAULT_ORDER];

        sectionHeader.appendChild(button);

        button.addEventListener("click", sortButtonClicked);
    }
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
    const button = event.target;

    const currentOrder = button.getAttribute(ORDER_ATTRIBUTE);
    const nextOrder = (currentOrder + 1) % Object.keys(OrderEnum).length;
    button.setAttribute(ORDER_ATTRIBUTE, nextOrder);

    button.innerText = ButtonText[nextOrder];

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
